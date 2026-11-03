/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChronosData } from '../types';
import { createAccount } from '../utils';
import { User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { RitmaLogo } from './RitmaLogo';
import { fetchAccountFromCloud, fetchPatientDataFromCloud, logOutFromFirebase, signInWithGoogle } from '../firebase';

interface AuthProps {
  data: ChronosData;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  prefillDocCode?: string | null;
}

export const Auth: React.FC<AuthProps> = ({ onUpdateData }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorCouncil, setDoctorCouncil] = useState('CRM');
  const [doctorNumber, setDoctorNumber] = useState('');
  const [doctorUf, setDoctorUf] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      if (!user) return;
      if (!user.email || !user.emailVerified) {
        setErrorMsg('Use uma conta Google com endereço de e-mail verificado.');
        return;
      }
      const userEmail = (user.email || '').toLowerCase();
      const userName = user.displayName || user.email?.split('@')[0] || 'Paciente';
      const remoteAccount = await fetchAccountFromCloud(user.uid);
      const remotePatientData = userType === 'patient'
        ? await fetchPatientDataFromCloud(user.uid)
        : null;

      if (userType === 'doctor' && remoteAccount?.role === 'doctor' && (remoteAccount.crm?.status !== 'verified' || !remoteAccount.crm?.verified)) {
        setErrorMsg(remoteAccount.crm?.status === 'failed'
          ? `Cadastro recusado. Motivo: ${remoteAccount.crm.rejectionReason || 'consulte o suporte.'}`
          : 'Seu cadastro profissional está em análise. Você poderá entrar após a aprovação.');
        return;
      }
      if (userType === 'doctor' && !remoteAccount) {
        if (mode !== 'signup') {
          setErrorMsg('Não encontramos um cadastro profissional para esta conta Google. Se é seu primeiro acesso, solicite o cadastro.');
          return;
        }
        if (!name.trim() || !doctorSpecialty.trim() || !doctorNumber.trim() || !doctorUf.trim() || !lgpdAccepted) {
          setErrorMsg('Preencha seus dados profissionais e aceite o tratamento dos dados para enviar o cadastro.');
          return;
        }
        onUpdateData((prev) => {
          if (prev.accounts.some((account) => account.id === user.uid)) return;
          createAccount(prev, {
            role: 'doctor', id: user.uid, name: name.trim(), email: userEmail,
            specialty: doctorSpecialty.trim(), crm: doctorNumber.trim(), uf: doctorUf.trim().toUpperCase(), lgpd: lgpdAccepted
          });
          const submitted = prev.accounts.find((account) => account.id === user.uid);
          if (submitted?.crm) submitted.crm.council = doctorCouncil;
        });
        setErrorMsg('Solicitação enviada. Seu perfil ficará pendente até a conferência do conselho profissional.');
        return;
      }
      if (remoteAccount && remoteAccount.role !== userType) {
        setErrorMsg('Esta conta Google está cadastrada com outro tipo de perfil.');
        return;
      }
      if (!remoteAccount && userType === 'patient' && mode !== 'signup') {
        setErrorMsg('Nenhuma conta foi encontrada. Se este for seu primeiro acesso, selecione “Cadastre-se grátis”.');
        return;
      }
      if (!remoteAccount && userType === 'patient' && (!lgpdAccepted || !name.trim())) {
        setErrorMsg('Informe seu nome e aceite o tratamento de dados antes de criar a conta.');
        return;
      }
      onUpdateData((prev) => {
        const existing = remoteAccount || prev.accounts.find((a) => a.id === user.uid) || prev.accounts.find((a) =>
          a.email.toLowerCase() === userEmail && a.role === userType && /^[0-9a-f-]{36}$/i.test(a.id)
        );
        let acc = existing;
        if (acc && acc.id !== user.uid) {
          const oldId = acc.id;
          acc.id = user.uid;
          if (prev.patientData[oldId]) {
            prev.patientData[user.uid] = remotePatientData || prev.patientData[oldId];
            delete prev.patientData[oldId];
          }
          prev.links.forEach((link) => {
            if (link.patientId === oldId) link.patientId = user.uid;
            if (link.doctorId === oldId) link.doctorId = user.uid;
          });
          prev.notifications.forEach((notification) => {
            if (notification.fromUserId === oldId) notification.fromUserId = user.uid;
            if (notification.toUserId === oldId) notification.toUserId = user.uid;
          });
        }
        if (!acc) {
          acc = createAccount(prev, {
            role: userType,
            id: user.uid,
            name: name.trim() || userName,
            email: userEmail,
            lgpd: lgpdAccepted,
            discountApplied: false
          });
        }
        if (remoteAccount) {
          const localIndex = prev.accounts.findIndex((item) => item.id === user.uid);
          if (localIndex >= 0) prev.accounts[localIndex] = remoteAccount;
          else prev.accounts.push(remoteAccount);
          acc = remoteAccount;
        }
        if (remotePatientData) prev.patientData[user.uid] = remotePatientData;
        if (userType === 'patient' && !prev.patientData[user.uid]) {
          prev.patientData[user.uid] = { diagnoses: {}, gender: null, hormoneRelevant: false, baseline: null, flareAlerts: [], dailyLogs: [] };
        }
        prev.session.currentUserId = acc.id;
      });
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Não foi possível autenticar com o Google. Tente novamente.');
      }
    }
  };

  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand logo header */}
        <div className="flex flex-col items-center justify-center mb-6 select-none text-center">
          <RitmaLogo size="lg" showTagline={true} />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3 max-w-sm">
            Acompanhamento contínuo de dor crônica e análise inteligente de sintomas
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex gap-1 mb-5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setUserType('patient');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              userType === 'patient'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sou Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUserType('doctor');
              setErrorMsg('');
              setMode('login');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              userType === 'doctor'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>🩺</span>
            <span>Sou Profissional de Saúde</span>
          </button>
        </div>

        {/* Dynamic Card Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8 transition-all">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold p-3.5 rounded-xl mb-4 leading-normal">
              ⚠️ {errorMsg}
            </div>
          )}

          {userType === 'patient' && mode === 'signup' && (
            <div className="space-y-4 mb-4">
              <h3 className="font-poppins font-bold text-md text-slate-800 dark:text-slate-200">Criar seu Diário Clínico</h3>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nome completo</span>
                <input id="auth-name" className="form-input" autoComplete="name" placeholder="Ex.: Maria Silva" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label htmlFor="auth-lgpd" className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl cursor-pointer">
                <input id="auth-lgpd" type="checkbox" checked={lgpdAccepted} onChange={(e) => setLgpdAccepted(e.target.checked)} className="mt-1 accent-teal-500 h-4 w-4" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Concordo com o tratamento dos meus dados de saúde para o acompanhamento no RITMA. Posso revogar este consentimento nas configurações.</span>
              </label>
            </div>
          )}

          {userType === 'doctor' && mode === 'signup' && (
            <div className="space-y-3 mb-4">
              <h3 className="font-poppins font-bold text-md text-slate-800 dark:text-slate-200">Solicitar cadastro profissional</h3>
              <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">Nome completo</span><input className="form-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">Profissão / especialidade</span><input className="form-input" value={doctorSpecialty} onChange={(e) => setDoctorSpecialty(e.target.value)} placeholder="Ex.: Medicina — Reumatologia" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">Conselho</span><select className="form-input" value={doctorCouncil} onChange={(e) => setDoctorCouncil(e.target.value)}>{['CRM','CREFITO','CRP','CREF','CRN','COREN','CRF','CRESS','CRFa','Outro'].map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">UF</span><input className="form-input" maxLength={2} autoComplete="address-level1" value={doctorUf} onChange={(e) => setDoctorUf(e.target.value.toUpperCase())} placeholder="SP" /></label>
              </div>
              <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">Número de registro</span><input className="form-input" value={doctorNumber} onChange={(e) => setDoctorNumber(e.target.value)} /></label>
              <label htmlFor="auth-lgpd" className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl cursor-pointer">
                <input id="auth-lgpd" type="checkbox" checked={lgpdAccepted} onChange={(e) => setLgpdAccepted(e.target.checked)} className="mt-1 accent-teal-500 h-4 w-4" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Autorizo o tratamento dos dados deste cadastro para conferência do registro profissional.</span>
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="text-xs">{userType === 'doctor' ? 'Entrar com Google profissional' : 'Continuar com o Google'}</span>
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">A conta Google protege seu acesso e sincroniza seus dados entre dispositivos.</p>

        </div>

        {/* Footer toggles for Patient */}
        {userType === 'patient' && (
          <div className="text-center mt-6">
            {mode === 'login' ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Não tem um perfil?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </span>
            ) : (
              (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Já tem um registro?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    Fazer login
                  </button>
                </span>
              )
            )}
          </div>
        )}

        {userType === 'doctor' && <div className="text-center mt-6 text-xs text-slate-500">
          {mode === 'login' ? 'Primeiro acesso profissional? ' : 'Já tem cadastro aprovado? '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }} className="text-blue-700 dark:text-blue-300 font-bold hover:underline">{mode === 'login' ? 'Solicitar cadastro' : 'Entrar'}</button>
        </div>}
        {userType === 'doctor' && <div className="mt-3 text-center"><button type="button" onClick={() => void logOutFromFirebase()} className="text-xs font-semibold text-slate-500 underline">Sair da conta Google</button></div>}

      </div>
    </div>
  );
};
