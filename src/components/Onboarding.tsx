/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, PatientData } from '../types';
import { DX } from '../data';
import {
  Sparkles,
  CalendarDays,
  Clock,
  Heart,
  Shield,
  CheckCircle,
  User,
  Activity,
  Moon,
  Pill,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Check,
  Zap,
  Droplets,
  Sliders,
  Bell,
  Layers,
  FileText,
  Share2,
  Stethoscope,
  Info,
  Flame,
  Award,
  Play,
  TrendingDown,
  RefreshCw,
  HelpCircle,
  Smile,
  AlertTriangle
} from 'lucide-react';
import { RitmaLogo } from './RitmaLogo';

export interface OnboardingCompletedData {
  name: string;
  gender: string | null;
  birthDate: string;
  height: number | '';
  weight: number | '';
  diagnoses: Record<string, boolean>;
  hormoneRelevant: boolean;
  painBaseline: number;
  sleepBaselineHours: number;
  fatigueBaseline: number;
  continuousMeds: string[];
  cardiovascularRisk: boolean;
  gastricSensitivity: boolean;
  reminderOptIn: boolean;
}

interface OnboardingProps {
  onComplete?: (
    diagnoses: Record<string, boolean>,
    hormoneRelevant: boolean,
    fullData?: OnboardingCompletedData
  ) => void;
  account?: Account;
  patientData?: PatientData;
  onFinish?: () => void;
  isModal?: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  account,
  patientData,
  onFinish,
  isModal = false
}) => {
  const [step, setStep] = useState(0);

  // Step 2: Personal Profile & Biometrics
  const [name, setName] = useState(account?.name || '');
  const [gender, setGender] = useState<string>(patientData?.gender || account?.gender || '');
  const [birthDate, setBirthDate] = useState<string>(patientData?.birthDate || '');
  const [height, setHeight] = useState<number | ''>(patientData?.height ?? 170);
  const [weight, setWeight] = useState<number | ''>(patientData?.weight ?? 70);

  // Step 3: Diagnoses & Conditions
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Record<string, boolean>>({
    ...(patientData?.diagnoses || { fibromialgia: true })
  });
  const [hormoneRelevant, setHormoneRelevant] = useState<boolean>(patientData?.hormoneRelevant ?? false);
  const [cardiovascularRisk, setCardiovascularRisk] = useState<boolean>(patientData?.cardiovascularRisk ?? false);
  const [gastricSensitivity, setGastricSensitivity] = useState<boolean>(patientData?.gastricSensitivity ?? false);

  // Step 4: Clinical Baselines
  const [painBaseline, setPainBaseline] = useState<number>(patientData?.painBaseline ?? 3);
  const [sleepBaselineHours, setSleepBaselineHours] = useState<number>(patientData?.sleepBaselineHours ?? 7);
  const [fatigueBaseline, setFatigueBaseline] = useState<number>(patientData?.fatigueBaseline ?? 4);

  // Step 5: Continuous Medications & Supplements
  const [continuousMeds, setContinuousMeds] = useState<string[]>(patientData?.continuousMeds ?? ['pregabalina']);
  const [reminderOptIn, setReminderOptIn] = useState<boolean>(account?.reminderOptIn ?? true);

  // Step 6: Interactive Simulator Playground States
  const [simulatorTab, setSimulatorTab] = useState<'diary' | 'map' | 'tips' | 'doctor'>('diary');
  
  // Interactive Simulator - Mini Diary
  const [simPain, setSimPain] = useState<number>(5);
  const [simSleep, setSimSleep] = useState<number>(6);
  const [simTriggers, setSimTriggers] = useState<string[]>(['Frio ou Chuva']);
  const [simSubmitted, setSimSubmitted] = useState<boolean>(false);

  // Interactive Simulator - Map comparison
  const [simMapMode, setSimMapMode] = useState<'badSleep' | 'goodSleep'>('badSleep');

  const TOTAL_STEPS = 7;

  // Real-time BMI calculation
  const imcInfo = (() => {
    if (!height || !weight || Number(height) <= 0 || Number(weight) <= 0) return null;
    const hM = Number(height) / 100;
    const imc = Number(weight) / (hM * hM);
    let category = '';
    let color = '';
    let advice = '';
    if (imc < 18.5) {
      category = 'Abaixo do peso';
      color = 'text-amber-500';
      advice = 'Atenção à massa magra e densidade mineral óssea.';
    } else if (imc < 25) {
      category = 'Peso saudável';
      color = 'text-emerald-500 font-bold';
      advice = 'Distribuição de carga articular e perfil metabólico ideais.';
    } else if (imc < 30) {
      category = 'Sobrepeso (IMC ≥ 25)';
      color = 'text-amber-500 font-semibold';
      advice = 'Atenção ao impacto mecânico em joelhos, quadris e coluna lombar.';
    } else {
      category = 'Obesidade (IMC ≥ 30)';
      color = 'text-rose-500 font-bold';
      advice = 'O tecido adiposo atua como órgão endócrino inflamatório que amplifica a dor crônica.';
    }
    return {
      val: imc.toFixed(1),
      category,
      color,
      advice,
      waterTarget: Math.round(Number(weight) * 35),
      waterCups: Math.round((Number(weight) * 35) / 250)
    };
  })();

  const handleToggleDx = (key: string) => {
    if (DX[key]?.comingSoon) return;
    setSelectedDiagnoses((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleMed = (medId: string) => {
    setContinuousMeds((prev) =>
      prev.includes(medId) ? prev.filter((m) => m !== medId) : [...prev, medId]
    );
  };

  const handleToggleSimTrigger = (trigger: string) => {
    setSimTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleComplete = () => {
    if (typeof Notification !== 'undefined' && reminderOptIn && Notification.permission !== 'granted') {
      try {
        Notification.requestPermission();
      } catch (e) {}
    }

    const fullData: OnboardingCompletedData = {
      name: name.trim() || account?.name || 'Paciente',
      gender: gender || null,
      birthDate,
      height,
      weight,
      diagnoses: selectedDiagnoses,
      hormoneRelevant,
      painBaseline,
      sleepBaselineHours,
      fatigueBaseline,
      continuousMeds,
      cardiovascularRisk,
      gastricSensitivity,
      reminderOptIn
    };

    onComplete?.(selectedDiagnoses, hormoneRelevant, fullData);
    onFinish?.();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const stepTitles = [
    'Boas-vindas',
    'Perfil & Biometria',
    'Condições de Saúde',
    'Linhas de Base',
    'Medicamentos & Hábitos',
    'Aprenda a Usar (Simulador)',
    'Tudo Pronto!'
  ];

  return (
    <div className={`flex flex-col items-center justify-center ${isModal ? 'p-0' : 'min-h-[85vh] px-4 py-8'}`}>
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 transition-colors relative flex flex-col justify-between min-h-[620px]">
        {/* Top Progress bar and current step info */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {step + 1}
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  {stepTitles[step]}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Passo {step + 1} de {TOTAL_STEPS} · {Math.round(((step + 1) / TOTAL_STEPS) * 100)}% concluído
                </span>
              </div>
            </div>

            {onFinish && (
              <button
                type="button"
                onClick={onFinish}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Pular Introdução
              </button>
            )}
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* ══════════════════════════════════════════════════
              PASSO 0: BOAS-VINDAS & PROPÓSITO
          ══════════════════════════════════════════════════ */}
          {step === 0 && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="flex justify-center">
                <RitmaLogo size="xl" showTagline={true} />
              </div>

              <div className="space-y-2 max-w-xl mx-auto">
                <h2 className="font-poppins font-bold text-2xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Bem-vindo ao seu painel clínico interativo
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  O <strong>RITMA</strong> conecta dor crônica, sono reparador, fatores climáticos, gatilhos de rotina e tratamentos em padrões claros e visuais. Em apenas <strong>3 minutos</strong>, vamos calibrar o aplicativo para as suas necessidades e ensinar como tirar o máximo proveito dele.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xs mb-1">
                    1
                  </div>
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Preenchimento Rápido
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Cadastramos sua biometria, diagnósticos e linhas de base de dor uma única vez.
                  </p>
                </div>

                <div className="p-4 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-xs mb-1">
                    2
                  </div>
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Aprenda na Prática
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Um simulador interativo para você testar como funciona o registro em 30 segundos.
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs mb-1">
                    3
                  </div>
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Autonomia & LGPD
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Seus dados são 100% criptografados e você tem controle total para exportá-los.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 1: PERFIL & BIOMETRIA
          ══════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-500" />
                  <span>Identificação Pessoal & Biometria Dinâmica</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Usamos seus dados biométricos para calcular automaticamente seu índice de massa corporal (IMC) e a meta de hidratação protetora articular recomendada.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ana Maria Silva"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sexo Biológico</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="other">Outro / Prefiro não informar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Altura (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="Ex: 170"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Peso (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="Ex: 70"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Instant biometric gauge */}
              {imcInfo && (
                <div className="p-4 bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-indigo-500/10 border border-teal-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Cálculo Antropométrico Instantâneo
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className="text-lg text-slate-800 dark:text-slate-100 font-black">
                        IMC {imcInfo.val} kg/m²
                      </strong>
                      <span className={`text-xs ${imcInfo.color}`}>
                        ({imcInfo.category})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {imcInfo.advice}
                    </p>
                  </div>

                  <div className="text-left sm:text-right p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-teal-100 dark:border-teal-900/40 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Meta Hídrica Protetora (35ml/kg):
                    </span>
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
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 2: CONDIÇÕES & DIAGNÓSTICOS
          ══════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span>Quais condições de saúde você deseja monitorar?</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  O RITMA adapta automaticamente as escalas clínicas validadas (FIQr, RAPID3, HIT-6, WOMAC) e o mapa anatômico de dor de acordo com o que você selecionar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                {Object.keys(DX).map((key) => {
                  const conf = DX[key];
                  const isSelected = !conf.comingSoon && !!selectedDiagnoses[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={conf.comingSoon}
                      onClick={() => handleToggleDx(key)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        conf.comingSoon
                          ? 'opacity-60 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
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

              {/* Specific clinical factors */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fatores Clínicos & Neurovegetativos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hormoneRelevant}
                      onChange={(e) => setHormoneRelevant(e.target.checked)}
                      className="accent-rose-500 h-4 w-4 rounded mt-0.5 shrink-0"
                    />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-200">
                        Ciclo Menstrual / Climatério
                      </strong>
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        Registrar TPM, ovulação ou ondas de calor para cruzar com picos de dor.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gastricSensitivity}
                      onChange={(e) => setGastricSensitivity(e.target.checked)}
                      className="accent-teal-500 h-4 w-4 rounded mt-0.5 shrink-0"
                    />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-200">
                        Sensibilidade Gástrica / SII
                      </strong>
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        Ativa diário de evacuação (Escala Bristol) e tolerância a alimentos.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 3: LINHAS DE BASE CLÍNICAS (BASELINES)
          ══════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  <span>Sua Linha de Base Clínica (Seu Estado Habitual)</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Estes valores são a sua âncora de normalidade. O RITMA compara cada diário com sua linha de base para sinalizar precocemente quando você está entrando em uma <strong>crise aguda (flare)</strong>.
                </p>
              </div>

              <div className="space-y-3.5 bg-slate-50/60 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                {/* 1. Dor Basal */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Dor Crônica Habitual (1 a 10)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        A dor que você sente num dia comum, sem estar em crise aguda.
                      </span>
                    </div>
                    <span className="text-sm font-black text-rose-500 font-mono bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
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
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>1 (Leve incômodo)</span>
                    <span>5 (Moderada constante)</span>
                    <span>10 (Incapacitante)</span>
                  </div>
                </div>

                {/* 2. Sono Basal */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Média Habitual de Sono por Noite
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Quantas horas você costuma dormir habitualmente.
                      </span>
                    </div>
                    <span className="text-sm font-black text-sky-500 font-mono bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg">
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
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>4 horas</span>
                    <span>7-8 horas (Ideal)</span>
                    <span>12 horas</span>
                  </div>
                </div>

                {/* 3. Fadiga Basal */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Fadiga e Esgotamento de Fundo (1 a 10)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Cansaço basal que você carrega na sua rotina diária.
                      </span>
                    </div>
                    <span className="text-sm font-black text-amber-500 font-mono bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
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
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>1 (Disposição boa)</span>
                    <span>5 (Cansaço moderado)</span>
                    <span>10 (Exaustão incapacitante)</span>
                  </div>
                </div>
              </div>

              {/* Real-time flare logic trigger explanation */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-normal">
                  <strong>Ponto de corte de crise:</strong> Se num registro futuro sua dor subir para <strong>{Math.min(10, painBaseline + 2)}/10</strong> ou mais, o RITMA ativará o Alerta de Crise e indicará protocolos validados de repouso ativo e termoterapia.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 4: MEDICAMENTOS & LEMBRETES
          ══════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-500" />
                  <span>Tratamento em Curso & Lembretes Inteligentes</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Selecione as medicações e suplementos que você toma de forma contínua. Elas aparecerão pré-carregadas no seu diário com um único clique de confirmação.
                </p>
              </div>

              {/* Medication grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {[
                  // Neuromoduladores & Dor
                  { id: 'pregabalina', label: 'Pregabalina (Lyrica)', cat: 'Neuromodulador' },
                  { id: 'gabapentina', label: 'Gabapentina', cat: 'Neuromodulador' },
                  { id: 'duloxetina', label: 'Duloxetina (Cymbalta)', cat: 'Neuromodulador' },
                  { id: 'venlafaxina', label: 'Venlafaxina', cat: 'Neuromodulador' },
                  { id: 'amitriptilina', label: 'Amitriptilina', cat: 'Neuromodulador' },
                  { id: 'ciclobenzaprina', label: 'Ciclobenzaprina', cat: 'Relaxante Muscular' },

                  // Imunobiológicos
                  { id: 'adalimumabe', label: 'Adalimumabe (Humira)', cat: 'Anti-TNF' },
                  { id: 'etanercepte', label: 'Etanercepte (Enbrel)', cat: 'Anti-TNF' },
                  { id: 'infliximabe', label: 'Infliximabe (Remicade)', cat: 'Anti-TNF' },
                  { id: 'secuquinumabe', label: 'Secuquinumabe (Cosentyx)', cat: 'Anti-IL17' },
                  { id: 'ustequinumabe', label: 'Ustequinumabe (Stelara)', cat: 'Anti-IL12/23' },
                  { id: 'upadacitinibe', label: 'Upadacitinibe (Rinvoq)', cat: 'Inibidor de JAK' },
                  { id: 'tofacitinibe', label: 'Tofacitinibe (Xeljanz)', cat: 'Inibidor de JAK' },

                  // DMARDs & Imunossupressores
                  { id: 'metotrexato', label: 'Metotrexato (MTX)', cat: 'DMARD' },
                  { id: 'leflunomida', label: 'Leflunomida (Arava)', cat: 'DMARD' },
                  { id: 'hidroxicloroquina', label: 'Hidroxicloroquina (Reuquinol)', cat: 'DMARD' },
                  { id: 'sulfassalazina', label: 'Sulfassalazina', cat: 'DMARD' },
                  { id: 'azatioprina', label: 'Azatioprina', cat: 'Imunossupressor' },

                  // Metabólicos & Gota
                  { id: 'semaglutida', label: 'Semaglutida (Ozempic/Wegovy)', cat: 'Análogo GLP-1' },
                  { id: 'tirzepatida', label: 'Tirzepatida (Mounjaro)', cat: 'GLP-1/GIP' },
                  { id: 'alopurinol', label: 'Alopurinol', cat: 'Gota / Urato' },
                  { id: 'colchicina', label: 'Colchicina', cat: 'Antigotoso' },

                  // Suplementos Baseados em Evidências
                  { id: 'magnesio', label: 'Magnésio Quelato / Dimalato', cat: 'Suplemento' },
                  { id: 'coq10', label: 'Coenzima Q10', cat: 'Suplemento' },
                  { id: 'vitamina_d', label: 'Vitamina D3', cat: 'Suplemento' },
                  { id: 'creatina', label: 'Creatina Monohidratada', cat: 'Suplemento' },
                  { id: 'omega3', label: 'Ômega-3 EPA/DHA', cat: 'Suplemento' },
                  { id: 'curcumina', label: 'Curcumina Padronizada', cat: 'Fitoterápico' },
                  { id: 'probioticos', label: 'Probióticos Multicepas', cat: 'Microbiota' }
                ].map((med) => {
                  const isChecked = continuousMeds.includes(med.id);
                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => handleToggleMed(med.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-2xs'
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

              {/* Reminder preferences card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderOptIn}
                    onChange={(e) => setReminderOptIn(e.target.checked)}
                    className="accent-teal-500 h-5 w-5 rounded mt-0.5 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <strong className="text-xs text-slate-800 dark:text-slate-200 block">
                      Ativar Lembretes Discretos de Diário
                    </strong>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Um aviso rápido uma vez ao dia no seu horário preferido (ex: à noite ou ao acordar) para garantir que seus gráficos não tenham lacunas.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 5: APRENDA A USAR (SIMULADOR INTERATIVO)
          ══════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Aprenda a Usar na Prática: Laboratório Interativo</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Experimente cada função fundamental do aplicativo agora mesmo para dominar o RITMA em segundos.
                </p>
              </div>

              {/* Sub-tabs switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
                {[
                  { id: 'diary', label: '1. Diário em 30s', icon: CalendarDays },
                  { id: 'map', label: '2. RITMMA MAP', icon: Activity },
                  { id: 'tips', label: '3. Dica do Dia', icon: Sparkles },
                  { id: 'doctor', label: '4. Conexão Médica', icon: Stethoscope }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = simulatorTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSimulatorTab(item.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: MINI DIARY SIMULATOR */}
              {simulatorTab === 'diary' && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-850 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-teal-500" /> Simule o preenchimento de hoje:
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                      Interativo
                    </span>
                  </div>

                  {/* Slider Dor */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Intensidade da Dor Hoje:</span>
                      <strong className="text-rose-500 font-black">{simPain}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={simPain}
                      onChange={(e) => {
                        setSimPain(Number(e.target.value));
                        setSimSubmitted(false);
                      }}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  {/* Triggers */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      Gatilhos Identificados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Frio ou Chuva', 'Estresse no Trabalho', 'Noite Mal Dormida', 'Esforço Físico Exagerado', 'Café em Excesso'].map((t) => {
                        const isPicked = simTriggers.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              handleToggleSimTrigger(t);
                              setSimSubmitted(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                              isPicked
                                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isPicked ? '✓ ' : '+ '}{t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit mini simulation */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSimSubmitted(true)}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Testar Envio do Diário</span>
                    </button>

                    {simSubmitted && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Registro gravado em 12 segundos!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: RITMMA MAP SIMULATOR */}
              {simulatorTab === 'map' && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Como o RITMMA MAP revela seus padrões:
                    </span>
                    <div className="flex gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSimMapMode('badSleep')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          simMapMode === 'badSleep'
                            ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-2xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Sono Ruim (4h)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimMapMode('goodSleep')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          simMapMode === 'goodSleep'
                            ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-2xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Sono Bom (8h)
                      </button>
                    </div>
                  </div>

                  {/* Simulated Visual Graph Card */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="h-28 flex items-end justify-between gap-3 px-2 pt-4 border-b border-slate-100 dark:border-slate-800">
                      {[
                        { day: 'Seg', pain: 4, sleep: 7 },
                        { day: 'Ter', pain: 3, sleep: 8 },
                        { day: 'Qua', pain: simMapMode === 'badSleep' ? 8 : 4, sleep: simMapMode === 'badSleep' ? 3 : 7.5 },
                        { day: 'Qui', pain: simMapMode === 'badSleep' ? 7 : 3, sleep: simMapMode === 'badSleep' ? 4 : 8 }
                      ].map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center gap-1.5 h-20">
                            {/* Pain bar */}
                            <div
                              className="w-3 rounded-t-md bg-rose-500 transition-all duration-500"
                              style={{ height: `${item.pain * 10}%` }}
                              title={`Dor: ${item.pain}/10`}
                            />
                            {/* Sleep bar */}
                            <div
                              className="w-3 rounded-t-md bg-sky-500 transition-all duration-500"
                              style={{ height: `${item.sleep * 10}%` }}
                              title={`Sono: ${item.sleep}h`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{item.day}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Dor</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Sono</span>
                      </div>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {simMapMode === 'badSleep'
                          ? '⚠️ Correlação inversa: Sono ruim elevou a dor no dia seguinte!'
                          : '✓ Estabilidade clínica: Sono reparador protegeu contra crise.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DICA DO DIA */}
              {simulatorTab === 'tips' && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Recomendações Baseadas nos Seus Sintomas
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                      Evidências EULAR/ACR
                    </span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        🌙 Categoria Sono & Pacing
                      </span>
                      <span className="text-[10px] text-slate-400">Acionada por dor matinal</span>
                    </div>
                    <strong className="text-xs text-slate-800 dark:text-slate-100 block">
                      Aquecimento Passivo & Higiene do Sono Guiada
                    </strong>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Um banho morno (38°C) de 15 minutos 90 min antes de dormir reduz o tônus simpático e a rigidez fascial, com respaldo em metanálises da Cochrane.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCTOR CONNECTION */}
              {simulatorTab === 'doctor' && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-sky-500" /> Acompanhamento com Seu Profissional
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
                      Código de 8 Dígitos
                    </span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      Seu médico, fisioterapeuta ou nutricionista possui um <strong>Código Clínico</strong> (ex: <code className="font-mono text-teal-600 dark:text-teal-400 font-bold">SILV-1234</code>).
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Ao inserir o código no menu do paciente, o profissional terá acesso em tempo real às suas médias de dor, evitando que você precise tentar se lembrar de semanas atrás durante a consulta.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 6: TUDO PRONTO & RESUMO CLÍNICO
          ══════════════════════════════════════════════════ */}
          {step === 6 && (
            <div className="space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Tudo Calibrado! Seu Passaporte RITMA Está Pronto
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Confira o resumo da sua configuração. Você poderá alterar qualquer parâmetro a qualquer momento na aba <strong>Configurações</strong>.
                </p>
              </div>

              {/* Patient Passport Summary Card */}
              <div className="max-w-md mx-auto p-4 bg-slate-50/90 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{name || 'Paciente'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                    Plano Ativo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Condições Monitoradas:</span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {Object.keys(selectedDiagnoses).filter((k) => selectedDiagnoses[k]).length} condições ativas
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Dor Basal Habitual:</span>
                    <strong className="text-rose-500 font-bold">{painBaseline}/10</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Sono Médio:</span>
                    <strong className="text-sky-500 font-bold">{sleepBaselineHours}h / noite</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Meta Hídrica Diária:</span>
                    <strong className="text-teal-600 dark:text-teal-400 font-bold">
                      {imcInfo?.waterTarget ? `${imcInfo.waterTarget} ml` : 'Não calculada'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                🔒 Seus dados clínicos são protegidos sob a LGPD com criptografia e você mantém total autonomia sobre seus relatórios médicos.
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER NAVIGATION CONTROLS ── */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:opacity-95 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{step === TOTAL_STEPS - 1 ? 'Concluir e Ir ao Painel' : 'Avançar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
