/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChronosData, Account } from './types';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { PatientView } from './components/PatientView';
import { DoctorView } from './components/DoctorView';
import { validateClinicalData } from './utils';
import { testConnection, syncPatientDataToCloud, syncAccountToCloud, syncLinkToCloud, deleteLinkFromCloud, fetchPatientDataFromCloud, fetchAccountFromCloud, fetchLinksForUser, auth, logOutFromFirebase } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AdminConsole } from './components/AdminConsole';

// Start with an empty local state so no seeded patient or clinician records are bundled with the app.
const INITIAL_SEED: ChronosData = {
  schemaVersion: '1.0.0',
  accounts: [],
  patientData: {},
  links: [],
  notifications: [],
  session: { currentUserId: null }
};

export default function App() {
  const [data, setData] = useState<ChronosData>(() => {
    const saved = localStorage.getItem('chronos_app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.accounts && parsed.patientData) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved chronos data, using seed.', e);
      }
    }
    return INITIAL_SEED;
  });

  const [loading, setLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(true);

  // Track shared doctor code if present in the URL query parameters
  const [prefilledDocCode, setPrefilledDocCode] = useState<string | null>(null);

  // Test Firestore connection on boot and listen to auth changes
  useEffect(() => {
    testConnection().then((ok) => {
      setCloudSyncStatus(ok ? 'synced' : 'offline');
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setData((prev) => ({ ...prev, session: { currentUserId: null } }));
        setLoading(false);
        return;
      }
      const token = await user.getIdTokenResult();
      const adminClaim = token.claims.admin === true;
      setIsAdmin(adminClaim);
      const [cloudAccount, cloudPatientData, cloudLinks] = await Promise.all([
        fetchAccountFromCloud(user.uid),
        fetchPatientDataFromCloud(user.uid),
        fetchLinksForUser(user.uid)
      ]);
      const relatedIds = Array.from(new Set(cloudLinks.map((link) => link.patientId === user.uid ? link.doctorId : link.patientId)));
      const relatedAccounts = await Promise.all(relatedIds.map((id) => fetchAccountFromCloud(id)));
      const linkedPatients = user.uid && cloudAccount?.role === 'doctor'
        ? await Promise.all(cloudLinks.filter((link) => link.doctorId === user.uid && link.status === 'authorized').map((link) => fetchPatientDataFromCloud(link.patientId).then((patientData) => [link.patientId, patientData] as const)))
        : [];
      setData((prev) => {
        const localAccount = prev.accounts.find((account) => account.id === user.uid);
        const account = cloudAccount || localAccount;
        if (!account || (account.role === 'doctor' && (account.crm?.status !== 'verified' || !account.crm.verified))) {
          return { ...prev, session: { currentUserId: null } };
        }
        const fetchedAccounts = [cloudAccount, ...relatedAccounts].filter((item): item is Account => Boolean(item));
        const accountsById = new Map(prev.accounts.map((item) => [item.id, item]));
        fetchedAccounts.forEach((item) => accountsById.set(item.id, item));
        const patientDataById = { ...prev.patientData };
        if (cloudPatientData) patientDataById[user.uid] = cloudPatientData;
        linkedPatients.forEach(([patientId, value]) => { if (value) patientDataById[patientId] = value; });
        const linkedIds = new Set(cloudLinks.map((link) => `${link.patientId}_${link.doctorId}`));
        const localLinks = prev.links.filter((link) =>
          link.patientId !== user.uid && link.doctorId !== user.uid && !linkedIds.has(`${link.patientId}_${link.doctorId}`)
        );
        return {
          ...prev,
          accounts: Array.from(accountsById.values()),
          patientData: patientDataById,
          links: [...localLinks, ...cloudLinks],
          session: { currentUserId: user.uid }
        };
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chronos_theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    validateClinicalData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setPrefilledDocCode(code.trim().toUpperCase());
    }
  }, []);

  // Update central state, write to localStorage and automatically backup to Firestore
  const handleUpdateData = (updater: (prev: ChronosData) => void) => {
    setData((prev) => {
      // Clone deeply to ensure real immutability of PatientData objects and their internal structures (dailyLogs, flareAlerts, etc)
      const cloned: ChronosData = {
        ...prev,
        accounts: prev.accounts.map((acc) => ({ ...acc })),
        patientData: typeof structuredClone === 'function'
          ? structuredClone(prev.patientData)
          : JSON.parse(JSON.stringify(prev.patientData)),
        links: prev.links.map((l) => ({ ...l })),
        notifications: prev.notifications.map((n) => ({ ...n })),
        session: { ...prev.session }
      };

      updater(cloned);

      if (auth.currentUser) {
        const previousLinks = new Map(prev.links.map((link) => [`${link.patientId}_${link.doctorId}`, link]));
        const nextLinks = new Map(cloned.links.map((link) => [`${link.patientId}_${link.doctorId}`, link]));
        const changed = [...nextLinks.entries()].filter(([id, link]) => JSON.stringify(previousLinks.get(id)) !== JSON.stringify(link)).map(([, link]) => link);
        const removed = [...previousLinks.entries()].filter(([id]) => !nextLinks.has(id)).map(([, link]) => link);
        changed.forEach((link) => { void syncLinkToCloud(link); });
        removed.forEach((link) => { void deleteLinkFromCloud(link.patientId, link.doctorId); });
      }

      // Write to storage
      localStorage.setItem('chronos_app_data', JSON.stringify(cloned));

      // Asynchronously backup to Firestore if user is active
      if (auth.currentUser) {
        const uId = auth.currentUser.uid;
        const currentAcc = cloned.accounts.find((a) => a.id === uId);
        const currentPData = cloned.patientData[uId];
        if (currentAcc) {
          setCloudSyncStatus('syncing');
          Promise.all([syncAccountToCloud(currentAcc), ...(currentPData ? [syncPatientDataToCloud(uId, currentPData)] : [])])
            .then((results) => setCloudSyncStatus(results.every(Boolean) ? 'synced' : 'offline'))
            .catch(() => setCloudSyncStatus('offline'));
        }
      }

      return cloned;
    });
  };

  const handleManualCloudSync = async (): Promise<boolean> => {
    const current = data.accounts.find((a) => a.id === data.session.currentUserId);
    if (!current) return false;
    setCloudSyncStatus('syncing');
    const pData = data.patientData[current.id];
    try {
      const okAcc = await syncAccountToCloud(current);
      let okPData = true;
      if (pData) {
        okPData = await syncPatientDataToCloud(current.id, pData);
      }
      const allOk = okAcc && okPData;
      setCloudSyncStatus(allOk ? 'synced' : 'offline');
      return allOk;
    } catch (e) {
      setCloudSyncStatus('error');
      return false;
    }
  };

  const handleLogout = async () => {
    await logOutFromFirebase();
    handleUpdateData((prev) => {
      prev.session.currentUserId = null;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-14 h-14 bg-teal-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-teal-500/20 mb-4 animate-pulse">
          ⏱
        </div>
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sincronizando dados clínicos...</p>
      </div>
    );
  }

  const currentUser = data.accounts.find((a) => a.id === data.session.currentUserId) || null;

  if (isAdmin && showAdminConsole) {
    return <AdminConsole onClose={() => setShowAdminConsole(false)} />;
  }

  // ROUTER CONTROLLER
  if (!currentUser) {
    return (
      <Auth
        data={data}
        onUpdateData={handleUpdateData}
        prefillDocCode={prefilledDocCode}
      />
    );
  }

  // If Patient logged in but hasn't completed diagnostic onboarding tutorial
  if (currentUser.role === 'patient' && !currentUser.onboardingDone) {
    const handleOnboardingComplete = (
      diagnoses: Record<string, boolean>,
      hormone: boolean,
      fullData?: any
    ) => {
      handleUpdateData((prev) => {
        const acc = prev.accounts.find((a) => a.id === currentUser.id);
        if (acc) {
          acc.onboardingDone = true;
          if (fullData?.name) acc.name = fullData.name;
          if (fullData?.gender) acc.gender = fullData.gender;
          if (fullData?.reminderOptIn !== undefined) acc.reminderOptIn = fullData.reminderOptIn;
        }

        // Initialize patient data container with full biometric and baseline values
        prev.patientData[currentUser.id] = {
          diagnoses,
          gender: fullData?.gender || acc?.gender || null,
          hormoneRelevant: hormone,
          birthDate: fullData?.birthDate || '',
          height: fullData?.height || '',
          weight: fullData?.weight || '',
          painBaseline: fullData?.painBaseline ?? 3,
          sleepBaselineHours: fullData?.sleepBaselineHours ?? 7,
          fatigueBaseline: fullData?.fatigueBaseline ?? 4,
          continuousMeds: fullData?.continuousMeds || [],
          cardiovascularRisk: fullData?.cardiovascularRisk ?? false,
          gastricSensitivity: fullData?.gastricSensitivity ?? false,
          baseline: null,
          flareAlerts: [],
          dailyLogs: []
        };

        // If there was a prefilled invitation code, establish a link right away!
        if (prefilledDocCode) {
          const doc = prev.accounts.find((a) => a.role === 'doctor' && a.doctorCode === prefilledDocCode);
          if (doc) {
            prev.links = prev.links.filter((l) => l.patientId !== currentUser.id);
            prev.links.push({
              patientId: currentUser.id,
              doctorId: doc.id,
              status: 'pending',
              initiatedBy: 'patient',
              createdAt: new Date().toISOString().split('T')[0]
            });
            prev.notifications.push({
              id: Math.random().toString(36).slice(2),
              status: 'unread',
              createdAt: new Date().toISOString(),
              toUserId: doc.id,
              fromUserId: currentUser.id,
              type: 'link_request',
              message: `${acc?.name || 'Novo Paciente'} iniciou compartilhamento via código ${prefilledDocCode}.`
            });
          }
        }
      });
    };

    return (
      <Onboarding
        account={currentUser}
        patientData={data.patientData[currentUser.id]}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Route to DoctorView for clinicians / health professionals
  if (currentUser.role === 'doctor') {
    return (
      <DoctorView
        data={data}
        account={currentUser}
        onLogout={handleLogout}
        onUpdateData={handleUpdateData}
      />
    );
  }

  // Render PatientView for patients
  return (
    <PatientView
      data={data}
      account={currentUser}
      onLogout={handleLogout}
      onUpdateData={handleUpdateData}
      cloudSyncStatus={cloudSyncStatus}
      onManualCloudSync={handleManualCloudSync}
    />
  );
}
