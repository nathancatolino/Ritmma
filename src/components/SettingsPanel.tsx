/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Account, ChronosData, PatientData, DailyLog } from '../types';
import { DX } from '../data';
import { fmtDate, todayISO } from '../utils';
import {
  User,
  Heart,
  Pill,
  Sliders,
  Bell,
  Shield,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Database,
  Droplets,
  Calendar,
  Layers,
  Activity,
  Check,
  Stethoscope,
  Info,
  Clock,
  Moon,
  Zap,
  HelpCircle,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Lock,
  Plus,
  X
} from 'lucide-react';

interface SettingsPanelProps {
  data: ChronosData;
  account: Account;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  onManualCloudSync?: () => Promise<boolean>;
  onOpenOnboarding: () => void;
  onOpenEvidenceModal: () => void;
  onWipeData: () => void;
  showScientificMetrics: boolean;
  onToggleScientificMetrics: (val: boolean) => void;
}

type SettingsSubTab =
  | 'profile'
  | 'diagnoses'
  | 'baselines'
  | 'medications'
  | 'notifications'
  | 'privacy'
  | 'guide';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  data,
  account,
  onUpdateData,
  cloudSyncStatus = 'synced',
  onManualCloudSync,
  onOpenOnboarding,
  onOpenEvidenceModal,
  onWipeData,
  showScientificMetrics,
  onToggleScientificMetrics
}) => {
  const pd = data.patientData[account.id] || {
    diagnoses: {},
    gender: account.gender || null,
    hormoneRelevant: false,
    baseline: null,
    periodicMetrics: [],
    flareAlerts: [],
    dailyLogs: []
  };

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('profile');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // 1. Profile Form States
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [gender, setGender] = useState<string>(pd.gender || account.gender || '');
  const [birthDate, setBirthDate] = useState<string>(pd.birthDate || '');
  const [height, setHeight] = useState<number | ''>(pd.height ?? '');
  const [weight, setWeight] = useState<number | ''>(pd.weight ?? '');

  // 2. Diagnoses States
  const [diagnoses, setDiagnoses] = useState<Record<string, boolean>>({ ...(pd.diagnoses || {}) });
  const [hormoneRelevant, setHormoneRelevant] = useState<boolean>(pd.hormoneRelevant ?? false);
  const [cardiovascularRisk, setCardiovascularRisk] = useState<boolean>(pd.cardiovascularRisk ?? false);
  const [gastricSensitivity, setGastricSensitivity] = useState<boolean>(pd.gastricSensitivity ?? false);

  // 3. Baseline States
  const [painBaseline, setPainBaseline] = useState<number>(pd.painBaseline ?? 3);
  const [sleepBaselineHours, setSleepBaselineHours] = useState<number>(pd.sleepBaselineHours ?? 7);
  const [fatigueBaseline, setFatigueBaseline] = useState<number>(pd.fatigueBaseline ?? 4);

  // 4. Medications States
  const [continuousMeds, setContinuousMeds] = useState<string[]>(pd.continuousMeds ?? ['pregabalina']);
  const [customMedName, setCustomMedName] = useState('');

  // 5. Notification & Preferences States
  const [reminderOptIn, setReminderOptIn] = useState<boolean>(account.reminderOptIn ?? true);
  const [medicationReminderPush, setMedicationReminderPush] = useState<boolean>(account.medicationReminderPush ?? true);
  const [diaryMorningReminder, setDiaryMorningReminder] = useState<string>('08:00');
  const [diaryNightReminder, setDiaryNightReminder] = useState<string>('21:00');

  // 6. Interactive User Guide Accordions
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-diary');

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  // Instant Biometrics & Water Target Calculation
  const imcInfo = useMemo(() => {
    if (!height || !weight || Number(height) <= 0 || Number(weight) <= 0) return null;
    const hM = Number(height) / 100;
    const imc = Number(weight) / (hM * hM);
    let category = '';
    let color = '';
    let advice = '';
    if (imc < 18.5) {
      category = 'Abaixo do peso';
      color = 'text-amber-500';
      advice = 'Atenção especial à ingestão proteica e densidade óssea.';
    } else if (imc < 25) {
      category = 'Peso saudável';
      color = 'text-emerald-500 font-bold';
      advice = 'Distribuição de carga articular e perfil metabólico equilibrados.';
    } else if (imc < 30) {
      category = 'Sobrepeso (IMC ≥ 25)';
      color = 'text-amber-500 font-semibold';
      advice = 'Atenção à sobrecarga mecânica em joelhos e coluna lombar.';
    } else {
      category = 'Obesidade (IMC ≥ 30)';
      color = 'text-rose-500 font-bold';
      advice = 'O tecido adiposo atua secretando adipocinas pró-inflamatórias que amplificam a dor crônica.';
    }
    const waterTarget = Math.round(Number(weight) * 35);
    return {
      val: imc.toFixed(1),
      category,
      color,
      advice,
      waterTarget,
      waterCups: Math.round(waterTarget / 250)
    };
  }, [height, weight]);

  // Health Profile Completeness Score
  const profileCompleteness = useMemo(() => {
    let score = 0;
    const checks = [
      { label: 'Dados Básicos', done: !!name && !!gender && !!birthDate, points: 20 },
      { label: 'Biometria (Altura e Peso)', done: !!height && !!weight, points: 20 },
      { label: 'Diagnósticos Definidos', done: Object.values(diagnoses).some(Boolean), points: 20 },
      { label: 'Linhas de Base Calibradas', done: painBaseline > 0 && sleepBaselineHours > 0, points: 20 },
      { label: 'Medicações & Lembretes', done: continuousMeds.length > 0 && reminderOptIn, points: 20 }
    ];
    checks.forEach((c) => {
      if (c.done) score += c.points;
    });
    return {
      score,
      checks
    };
  }, [name, gender, birthDate, height, weight, diagnoses, painBaseline, sleepBaselineHours, continuousMeds, reminderOptIn]);

  // Calculate age from birthDate
  const age = useMemo(() => {
    if (!birthDate) return null;
    const bDate = new Date(birthDate);
    if (isNaN(bDate.getTime())) return null;
    const today = new Date();
    let calculatedAge = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge >= 0 && calculatedAge < 130 ? calculatedAge : null;
  }, [birthDate]);

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    onUpdateData((prev) => {
      // 1. Update Account
      const acc = prev.accounts.find((a) => a.id === account.id);
      if (acc) {
        acc.name = name.trim();
        acc.email = email.trim().toLowerCase();
        acc.gender = gender || null;
        acc.reminderOptIn = reminderOptIn;
        acc.medicationReminderPush = medicationReminderPush;
      }

      // 2. Update PatientData
      const pData = prev.patientData[account.id];
      if (pData) {
        pData.gender = gender || null;
        pData.birthDate = birthDate;
        pData.height = height !== '' ? Number(height) : undefined;
        pData.weight = weight !== '' ? Number(weight) : undefined;
        pData.diagnoses = diagnoses;
        pData.hormoneRelevant = hormoneRelevant;
        pData.cardiovascularRisk = cardiovascularRisk;
        pData.gastricSensitivity = gastricSensitivity;
        pData.painBaseline = painBaseline;
        pData.sleepBaselineHours = sleepBaselineHours;
        pData.fatigueBaseline = fatigueBaseline;
        pData.continuousMeds = continuousMeds;
      }
    });

    showToast('✓ Todas as configurações foram salvas com sucesso!', 'success');
  };

  const handleToggleDx = (key: string) => {
    if (DX[key]?.comingSoon) return;
    setDiagnoses((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleMed = (medId: string) => {
    setContinuousMeds((prev) =>
      prev.includes(medId) ? prev.filter((m) => m !== medId) : [...prev, medId]
    );
  };

  const handleAddCustomMed = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customMedName.trim();
    if (!trimmed) return;
    if (!continuousMeds.includes(trimmed)) {
      setContinuousMeds((prev) => [...prev, trimmed]);
      setCustomMedName('');
      showToast(`Medicação "${trimmed}" adicionada com sucesso.`, 'info');
    }
  };

  const handleManualSyncClick = async () => {
    if (!onManualCloudSync || isSyncingManual) return;
    setIsSyncingManual(true);
    try {
      const ok = await onManualCloudSync();
      if (ok) {
        showToast('✓ Dados clínicos sincronizados com a nuvem criptografada!', 'success');
      } else {
        showToast('Nuvem operando em modo offline. Dados salvos localmente.', 'info');
      }
    } catch {
      showToast('Erro ao sincronizar com o servidor em nuvem.', 'error');
    } finally {
      setIsSyncingManual(false);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const exportObject = {
      account,
      patientData: pd,
      exportedAt: new Date().toISOString(),
      appVersion: 'RITMA Health 2.0',
      lgpdNotice: 'Exportação em conformidade com Art. 18 da LGPD (Portabilidade de Dados)'
    };
    const jsonStr = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prontuario-ritma-${account.name.toLowerCase().replace(/\s+/g, '-')}-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Prontuário JSON exportado com sucesso!', 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    const logs = pd.dailyLogs || [];
    if (!logs.length) {
      showToast('Nenhum diário registrado para exportar.', 'info');
      return;
    }
    const headers = [
      'Data',
      'Dor (0-10)',
      'Fadiga (0-10)',
      'Horas de Sono',
      'Capacidade Funcional',
      'Humor',
      'Rigidez Matinal (min)',
      'Ingestao Hidrica (ml)',
      'Passos Wearable',
      'FC Repouso (bpm)',
      'Gatilhos',
      'Anotacoes'
    ];
    const rows = logs.map((l) => [
      l.date,
      l.pain ?? '',
      l.fatigue ?? '',
      l.sleep ?? '',
      l.function ?? '',
      l.mood ?? '',
      l.stiffness ?? '',
      l.waterIntake ?? '',
      l.wearableSync?.steps ?? '',
      l.wearableSync?.restingHeartRate ?? '',
      `"${(l.triggers || []).join('; ')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diarios-ritma-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Planilha CSV gerada com sucesso!', 'success');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.patientData) {
          onUpdateData((prev) => {
            prev.patientData[account.id] = parsed.patientData;
            if (parsed.account) {
              const acc = prev.accounts.find((a) => a.id === account.id);
              if (acc) {
                acc.name = parsed.account.name || acc.name;
              }
            }
          });
          showToast('✓ Prontuário importado e restaurado com sucesso!', 'success');
        } else {
          showToast('Arquivo inválido. Formato esperado não reconhecido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler o arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const navTabs: { id: SettingsSubTab; label: string; icon: any; badge?: string }[] = [
    { id: 'profile', label: '1. Perfil & Biometria', icon: User },
    { id: 'diagnoses', label: '2. Condições & Diagnósticos', icon: Heart },
    { id: 'baselines', label: '3. Linhas de Base (Basais)', icon: Sliders },
    { id: 'medications', label: '4. Medicamentos & Suplementos', icon: Pill },
    { id: 'notifications', label: '5. Lembretes & Alarmes', icon: Bell },
    { id: 'privacy', label: '6. Segurança, Exportação & LGPD', icon: Shield },
    { id: 'guide', label: '7. Guia de Uso & Referências', icon: BookOpen }
  ];

  return (
    <div className="space-y-6">
      {/* ── TOAST MESSAGE ── */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in duration-200 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : toastMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── PROFILE HERO CARD & HEALTH COMPLETENESS SCORE ── */}
      <div className="bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-indigo-500/10 dark:from-teal-950/30 dark:via-sky-950/20 dark:to-indigo-950/30 border border-teal-500/20 dark:border-teal-800/40 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {account.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                {account.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500 text-white uppercase tracking-wider">
                Plano Pro Ativo
              </span>
              <button
                type="button"
                onClick={handleManualSyncClick}
                disabled={isSyncingManual}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                }`}
                title="Clique para sincronizar com a nuvem agora"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingManual ? 'animate-spin' : ''}`} />
                <span>{cloudSyncStatus === 'synced' ? 'Nuvem Conectada' : 'Sincronizar'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {account.email} {age !== null ? `· ${age} anos` : ''} · {pd.dailyLogs?.length || 0} diários registrados no histórico
            </p>

            {/* Profile health score progress */}
            <div className="mt-2.5 flex items-center gap-3">
              <div className="w-36 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${profileCompleteness.score}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {profileCompleteness.score}% Calibrado
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Relaunch Interactive Onboarding */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Refazer a introdução guiada com preenchimento interativo e tour do aplicativo"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Refazer Onboarding Interativo</span>
          </button>
        </div>
      </div>

      {/* ── SETTINGS SUB-TABS NAVIGATION ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-2.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400 dark:text-teal-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT 1: PERFIL & BIOMETRIA ── */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveAll} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-500" /> Identificação Pessoal & Antropometria
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Mantenha seu peso e dados atualizados para calibrar as metas de hidratação e avaliar a sobrecarga mecânica articular.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail Cadastrado</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sexo Biológico</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              >
                <option value="">Não informado / Não especificado</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="other">Outro / Prefiro não informar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Data de Nascimento {age !== null ? `(${age} anos)` : ''}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Altura Corporal (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="Ex: 170"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peso Corporal (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="Ex: 70"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Instant Biometrics Gauge */}
          {imcInfo && (
            <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Avaliação Biomecânica em Tempo Real
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <strong className="text-lg text-slate-800 dark:text-slate-100 font-black">
                    IMC {imcInfo.val} kg/m²
                  </strong>
                  <span className={`text-xs ${imcInfo.color}`}>
                    ({imcInfo.category})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                  {imcInfo.advice}
                </span>
              </div>

              <div className="sm:text-right p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-100/60 dark:border-teal-900/40 shrink-0">
                <span className="text-[10px] text-slate-400 block font-medium">Meta Hídrica Protetora (35ml/kg):</span>
                <strong className="text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 sm:justify-end">
                  <Droplets className="w-4 h-4 text-teal-500 animate-bounce" />
                  {imcInfo.waterTarget.toLocaleString('pt-BR')} ml / dia
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Aprox. {imcInfo.waterCups} copos de 250ml
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Salvar Dados Pessoais
            </button>
          </div>
        </form>
      )}

      {/* ── TAB CONTENT 2: CONDIÇÕES & DIAGNÓSTICOS ── */}
      {activeSubTab === 'diagnoses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> Condições Monitoradas & Fatores Clínicos
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Ao selecionar uma condição, o RITMA habilita os módulos analíticos específicos e questionários validados correspondentes (ex: FIQr, RAPID3, WOMAC, HIT-6, CSI-7).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(DX).map((key) => {
              const conf = DX[key];
              const isSelected = !conf.comingSoon && !!diagnoses[key];
              return (
                <button
                  key={key}
                  type="button"
                  disabled={conf.comingSoon}
                  onClick={() => handleToggleDx(key)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    conf.comingSoon
                      ? 'opacity-60 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                      : isSelected
                      ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-400 dark:border-teal-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      {conf.icon}
                    </span>
                    <div className="truncate">
                      <strong className="text-xs text-slate-800 dark:text-slate-200 block truncate">
                        {conf.label}
                      </strong>
                      <span className="text-[10px] text-slate-400 block truncate font-normal">
                        {conf.desc}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hormonal & Menstrual tracking */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                Acompanhamento Hormonal / Ciclo Menstrual / Climatério
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Permite registrar fases foliculares, lúteas ou ondas de calor no diário de sintomas para prever gatilhos cíclicos de dor.
              </p>
            </div>
            <input
              type="checkbox"
              checked={hormoneRelevant}
              onChange={(e) => setHormoneRelevant(e.target.checked)}
              className="accent-rose-500 h-5 w-5 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Comorbidities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={gastricSensitivity}
                onChange={(e) => setGastricSensitivity(e.target.checked)}
                className="accent-teal-500 h-4.5 w-4.5 rounded mt-0.5 shrink-0"
              />
              <div className="space-y-0.5">
                <strong className="block text-slate-800 dark:text-slate-200">
                  Sensibilidade Gástrica / SII
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  Estômago sensível, refluxo, gastrite crônica ou Síndrome do Intestino Irritável.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={cardiovascularRisk}
                onChange={(e) => setCardiovascularRisk(e.target.checked)}
                className="accent-teal-500 h-4.5 w-4.5 rounded mt-0.5 shrink-0"
              />
              <div className="space-y-0.5">
                <strong className="block text-slate-800 dark:text-slate-200">
                  Risco Cardiorrenal / Hipertensão
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  Hipertensão arterial, colesterol elevado, diabetes ou histórico familiar precoce.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Salvar Condições
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: LINHAS DE BASE CLÍNICAS (BASELINES) ── */}
      {activeSubTab === 'baselines' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" /> Parâmetros de Linha de Base Clínica (Basais)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Sua linha de base representa o seu estado crônico habitual. Quando seus sintomas diários se desviam significativamente destes valores, o RITMA emite alertas de risco de crise.
            </p>
          </div>

          <div className="space-y-4">
            {/* Dor Basal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                    Nível de Dor Crônica Basal Habitual
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Média de dor que você sente num dia típico comum (sem crise aguda).
                  </span>
                </div>
                <span className="text-base font-black text-rose-500 font-mono bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
                  {painBaseline}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painBaseline}
                onChange={(e) => setPainBaseline(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 (Quase sem dor)</span>
                <span>5 (Moderada constante)</span>
                <span>10 (Severa contínua)</span>
              </div>
            </div>

            {/* Sono Basal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                    Média Habitual de Horas de Sono por Noite
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Quantidade de sono que você costuma dormir habitualmente.
                  </span>
                </div>
                <span className="text-base font-black text-sky-500 font-mono bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg">
                  {sleepBaselineHours}h / noite
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={sleepBaselineHours}
                onChange={(e) => setSleepBaselineHours(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>4 horas</span>
                <span>7 a 8 horas (Recomendado)</span>
                <span>12 horas</span>
              </div>
            </div>

            {/* Fadiga Basal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                    Nível Geral de Fadiga e Esgotamento Recorrente
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Cansaço de fundo que você sente no cotidiano.
                  </span>
                </div>
                <span className="text-base font-black text-amber-500 font-mono bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                  {fatigueBaseline}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueBaseline}
                onChange={(e) => setFatigueBaseline(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 (Energia estável)</span>
                <span>5 (Fadiga moderada)</span>
                <span>10 (Exaustão incapacitante)</span>
              </div>
            </div>
          </div>

          {/* Clinical Trigger Logic Box */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-indigo-900 dark:text-indigo-200 block">
                Como o RITMA detecta risco de crises (Flares)?
              </strong>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                O algoritmo compara seus logs diários contra sua dor basal ({painBaseline}/10). Quando a dor sobe <strong>≥ 2 pontos</strong> em relação ao basal por 48 horas, o sistema alerta no painel principal e ajusta as Dicas do Dia para alívio não-medicamentoso imediato.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Salvar Linha de Base
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 4: MEDICAMENTOS & SUPLEMENTOS ── */}
      {activeSubTab === 'medications' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-500" /> Medicamentos de Uso Contínuo & Suplementos
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Selecione as medicações e suplementos que você consome cronicamente. Elas aparecerão automaticamente pré-configuradas no seu diário diário para confirmação em 1 toque.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {[
              // Neuromoduladores & Dor Crônica
              { id: 'pregabalina', label: 'Pregabalina (Lyrica)', cat: 'Neuromodulador' },
              { id: 'gabapentina', label: 'Gabapentina', cat: 'Neuromodulador' },
              { id: 'duloxetina', label: 'Duloxetina (Cymbalta / Velija)', cat: 'Neuromodulador' },
              { id: 'venlafaxina', label: 'Venlafaxina', cat: 'Neuromodulador' },
              { id: 'amitriptilina', label: 'Amitriptilina', cat: 'Neuromodulador' },
              { id: 'nortriptilina', label: 'Nortriptilina (Pamelor)', cat: 'Neuromodulador' },
              { id: 'ciclobenzaprina', label: 'Ciclobenzaprina (Miosan)', cat: 'Relaxante Muscular' },

              // Imunobiológicos (Anti-TNF, Anti-IL, Inibidores de JAK)
              { id: 'adalimumabe', label: 'Adalimumabe (Humira)', cat: 'Anti-TNF' },
              { id: 'etanercepte', label: 'Etanercepte (Enbrel)', cat: 'Anti-TNF' },
              { id: 'infliximabe', label: 'Infliximabe (Remicade)', cat: 'Anti-TNF' },
              { id: 'golimumabe', label: 'Golimumabe (Simponi)', cat: 'Anti-TNF' },
              { id: 'certolizumabe', label: 'Certolizumabe Pegol (Cimzia)', cat: 'Anti-TNF' },
              { id: 'secuquinumabe', label: 'Secuquinumabe (Cosentyx)', cat: 'Anti-IL17' },
              { id: 'ustequinumabe', label: 'Ustequinumabe (Stelara)', cat: 'Anti-IL12/23' },
              { id: 'ixequizumabe', label: 'Ixequizumabe (Taltz)', cat: 'Anti-IL17' },
              { id: 'tocilizumabe', label: 'Tocilizumabe (Actemra)', cat: 'Anti-IL6' },
              { id: 'tofacitinibe', label: 'Tofacitinibe (Xeljanz)', cat: 'Inibidor de JAK' },
              { id: 'upadacitinibe', label: 'Upadacitinibe (Rinvoq)', cat: 'Inibidor de JAK' },
              { id: 'baricitinibe', label: 'Baricitinibe (Olumiant)', cat: 'Inibidor de JAK' },

              // DMARDs & Imunossupressores
              { id: 'metotrexato', label: 'Metotrexato (MTX)', cat: 'DMARD' },
              { id: 'leflunomida', label: 'Leflunomida (Arava)', cat: 'DMARD' },
              { id: 'hidroxicloroquina', label: 'Hidroxicloroquina (Reuquinol)', cat: 'DMARD' },
              { id: 'sulfassalazina', label: 'Sulfassalazina (Azulfin)', cat: 'DMARD' },
              { id: 'azatioprina', label: 'Azatioprina (Imuran)', cat: 'Imunossupressor' },
              { id: 'micofenolato', label: 'Micofenolato de Mofetila (Cellcept)', cat: 'Imunossupressor' },

              // Gota, Análogos GLP-1 & Metabólicos
              { id: 'alopurinol', label: 'Alopurinol', cat: 'Gota / Urato' },
              { id: 'febuxostate', label: 'Febuxostate', cat: 'Gota / Urato' },
              { id: 'colchicina', label: 'Colchicina', cat: 'Antigotoso' },
              { id: 'semaglutida', label: 'Semaglutida (Ozempic/Wegovy)', cat: 'Análogo GLP-1' },
              { id: 'tirzepatida', label: 'Tirzepatida (Mounjaro)', cat: 'GLP-1 / GIP' },

              // Suplementos Clínicos Baseados em Evidências
              { id: 'magnesio', label: 'Magnésio Quelato / Dimalato', cat: 'Suplemento' },
              { id: 'coq10', label: 'Coenzima Q10 (Ubiquinona)', cat: 'Suplemento' },
              { id: 'vitamina_d', label: 'Vitamina D3 (Colecalciferol)', cat: 'Suplemento' },
              { id: 'creatina', label: 'Creatina Monohidratada', cat: 'Suplemento' },
              { id: 'omega3', label: 'Ômega-3 EPA/DHA Concentrado', cat: 'Suplemento' },
              { id: 'curcumina', label: 'Curcumina Padronizada', cat: 'Fitoterápico' },
              { id: 'probioticos', label: 'Probióticos Multicepas', cat: 'Microbiota' },
              { id: 'melatonina', label: 'Melatonina (Sono)', cat: 'Suplemento' }
            ].map((med) => {
              const isChecked = continuousMeds.includes(med.id);
              return (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleToggleMed(med.id)}
                  className={`p-3 rounded-2xl border text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate pr-1">
                    <span className="block truncate font-semibold">{med.label}</span>
                    <span className="text-[9px] text-slate-400 block font-normal">{med.cat}</span>
                  </div>
                  {isChecked && <span className="text-teal-600 font-bold shrink-0">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Add custom medication input */}
          <form onSubmit={handleAddCustomMed} className="flex gap-2">
            <input
              type="text"
              value={customMedName}
              onChange={(e) => setCustomMedName(e.target.value)}
              placeholder="Adicionar outro medicamento ou suplemento..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </form>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              💡 Despertador & Horários Específicos:
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Para cadastrar horários de alarme sonoro, dosagens diárias e controle de estoque de comprimidos, acesse a aba dedicada <strong>"Medicamentos"</strong> no menu lateral principal.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Salvar Medicamentos
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 5: LEMBRETES & NOTIFICAÇÕES ── */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Preferências de Lembrete & Notificação
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Configure avisos discretos para preencher seu diário e não esquecer medicações nos horários corretos.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderOptIn}
                onChange={(e) => setReminderOptIn(e.target.checked)}
                className="accent-teal-500 h-5 w-5 rounded mt-0.5 shrink-0"
              />
              <div className="space-y-0.5">
                <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                  Lembrete Diário para Registro de Sintomas
                </strong>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Receba uma notificação discreta uma vez ao dia para não deixar lacunas no seu gráfico do RITMMA MAP.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={medicationReminderPush}
                onChange={(e) => setMedicationReminderPush(e.target.checked)}
                className="accent-teal-500 h-5 w-5 rounded mt-0.5 shrink-0"
              />
              <div className="space-y-0.5">
                <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                  Alarmes & Lembretes Sonoros de Medicação
                </strong>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Dispara o alerta sonoro e notificação push nos horários agendados dos seus medicamentos contínuos.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={showScientificMetrics}
                onChange={(e) => onToggleScientificMetrics(e.target.checked)}
                className="accent-teal-500 h-5 w-5 rounded mt-0.5 shrink-0"
              />
              <div className="space-y-0.5">
                <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                  Exibir Métricas Científicas Avançadas (Z-scores e Curvas Estatísticas)
                </strong>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Exibe desvios padronizados populacionais nos gráficos analíticos para revisão técnica com seu médico.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 6: SEGURANÇA, EXPORTAÇÃO & LGPD ── */}
      {activeSubTab === 'privacy' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Segurança, Backup e Privacidade LGPD
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Você tem controle total e irrestrito sobre os seus dados de saúde. Exporte seus diários ou consulte as garantias de privacidade.
            </p>
          </div>

          {/* Backup & Portability */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Exportar e Restaurar Registros Clínicos
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-500" /> Exportar Backup JSON Completo
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Exportar Planilha CSV (Para Médico)
              </button>

              <label className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-500" /> Restaurar de Backup JSON
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Scientific references modal trigger */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-500" /> Base de Evidências Clínicas Validadas
              </strong>
              <p className="text-[11px] text-slate-400">
                Mais de 55 estudos científicos peer-reviewed que validam as métricas, questionários e dicas do RITMA.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenEvidenceModal}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 font-bold rounded-xl text-xs hover:border-teal-500 transition-colors cursor-pointer shrink-0"
            >
              Consultar Estudos
            </button>
          </div>

          {/* Wipe data */}
          <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl space-y-2">
            <strong className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Exclusão Definitiva de Registros (Art. 18 LGPD)
            </strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Em total conformidade com a Lei Geral de Proteção de Dados, você pode apagar permanentemente todas as suas métricas e diários de dor deste aparelho a qualquer momento.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirmModal(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Apagar Meus Dados Definitivamente
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 7: GUIA DE USO & REFERÊNCIAS ── */}
      {activeSubTab === 'guide' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1 border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-500" /> Central de Aprendizado & Perguntas Frequentes
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Aprenda como interpretar seus gráficos e aproveitar ao máximo cada ferramenta clínica do RITMA.
            </p>
          </div>

          {/* Interactive Accordion FAQs */}
          <div className="space-y-3">
            {[
              {
                id: 'faq-diary',
                title: 'Como preencher o Diário em menos de 30 segundos?',
                content:
                  'O segredo é a consistência, não o perfeccionismo. Ajuste a nota de dor e sono nos sliders rápidos e marque apenas os gatilhos que chamaram a atenção no dia (ex: clima frio, noite em claro ou estresse). Seus medicamentos contínuos já ficam pré-selecionados.'
              },
              {
                id: 'faq-map',
                title: 'O que o RITMMA MAP revela sobre minha dor?',
                content:
                  'O RITMMA MAP cruza as curvas de dor, qualidade do sono, fatores climáticos e estresse. Na dor crônica e fibromialgia, é comum que uma noite de sono fragmentado (abaixo de 5h) provoque um aumento da dor 24 a 36 horas depois. O gráfico deixa essa correlação evidente para você e seu médico.'
              },
              {
                id: 'faq-flare',
                title: 'Como o aplicativo identifica uma Crise (Flare-up)?',
                content:
                  'Com base na sua Linha de Base Clínica habitual. Se sua dor basal for 3/10 e nos últimos dias você registrar 6/10 ou rigidez matinal prolongada (>45 min), o RITMA ativa o status de Alerta de Crise e sugere protocolos terapêuticos de alívio.'
              },
              {
                id: 'faq-doctor',
                title: 'Como conectar meu médico ou fisioterapeuta?',
                content:
                  'Peça o Código Clínico ao seu profissional de saúde (um código de 8 dígitos, como SILV-1234). Digite o código no seu painel ou leia o QR Code dele. O profissional passará a visualizar seus gráficos e relatórios consolidados em tempo real no consultório dele.'
              },
              {
                id: 'faq-wearable',
                title: 'Posso sincronizar Apple Watch, Garmin ou Fitbit?',
                content:
                  'Sim! Acesse a aba "Dispositivos & Sensores" no menu principal. Lá você pode conectar sensores Bluetooth em tempo real ou sincronizar dados automáticos de passos, sono profundo e variabilidade cardíaca (HRV).'
              }
            ].map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    <span>{faq.title}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-teal-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20">
                      {faq.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div>
              <strong className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                Quer rever o tutorial prático com simulador?
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Você pode refazer a introdução guiada passo a passo a qualquer momento sem perder seus dados existentes.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
            >
              Abrir Onboarding
            </button>
          </div>
        </div>
      )}

      {/* ── SECURITY CONFIRMATION MODAL (DELETE DATA) ── */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                Confirmar Exclusão de Todos os Dados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Esta ação apagará permanentemente todos os seus diários clínicos, métricas e parâmetros configurados neste aparelho. Para confirmar, digite <strong className="text-rose-600 dark:text-rose-400 font-mono">APAGAR</strong> abaixo:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Digite APAGAR para confirmar"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-center font-bold tracking-widest outline-none"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'APAGAR'}
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  onWipeData();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
