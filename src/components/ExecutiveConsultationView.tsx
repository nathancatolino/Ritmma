/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DailyLog, PatientData, Account, MedicationConfig, ClinicalConsultationNote } from '../types';
import { fmtDate, todayISO, uid } from '../utils';
import { DX } from '../data';
import { detectAdverseReactionsInSymptoms, AdverseReactionMatch } from '../data/adverseDrugReactions';
import {
  Stethoscope,
  ArrowLeft,
  Printer,
  Copy,
  CheckCircle,
  Activity,
  AlertTriangle,
  Pill,
  Save,
  Clock,
  Sparkles,
  Info,
  Calendar,
  FileText,
  User,
  Heart,
  HelpCircle,
  Phone,
  Maximize2
} from 'lucide-react';

export interface ExecutiveConsultationViewProps {
  patientData: PatientData;
  patientAccount: Account;
  currentDoctor: Account;
  onBack?: () => void;
  onUpdatePatientData: (updater: (prev: PatientData) => void) => void;
  isEmbedded?: boolean;
  allPatients?: { acc: Account; pd: PatientData }[];
  onSelectPatient?: (pid: string) => void;
  onOpenFullScreen?: (pid: string) => void;
}

export const ExecutiveConsultationView: React.FC<ExecutiveConsultationViewProps> = ({
  patientData,
  patientAccount,
  currentDoctor,
  onBack,
  onUpdatePatientData,
  isEmbedded = false,
  allPatients,
  onSelectPatient,
  onOpenFullScreen
}) => {
  const [selectedRange, setSelectedRange] = useState<'14' | '30' | 'all'>('30');
  const [copiedToast, setCopiedToast] = useState(false);
  const [savedNoteToast, setSavedNoteToast] = useState(false);
  const [activeAdrTooltip, setActiveAdrTooltip] = useState<AdverseReactionMatch | null>(null);

  // New consultation note state
  const [consultationNotes, setConsultationNotes] = useState('');
  const [consultationPlan, setConsultationPlan] = useState('');

  // Logs in chronological order
  const logs = useMemo(() => {
    return [...(patientData.dailyLogs || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [patientData.dailyLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (selectedRange === 'all') return logs;
    const days = Number(selectedRange);
    return logs.slice(-days);
  }, [logs, selectedRange]);

  // Active Diagnoses
  const activeDxs = useMemo(() => {
    return Object.keys(patientData.diagnoses || {}).filter((k) => patientData.diagnoses[k]);
  }, [patientData.diagnoses]);

  // Continuous and active medications
  const continuousMedNames = useMemo(() => {
    const list: string[] = [];
    if (patientData.continuousMeds && patientData.continuousMeds.length) {
      list.push(...patientData.continuousMeds);
    }
    if (patientData.medications && patientData.medications.length) {
      patientData.medications.forEach((m) => {
        if (!list.includes(m.name.toLowerCase())) {
          list.push(m.name);
        }
      });
    }
    return list;
  }, [patientData.continuousMeds, patientData.medications]);

  // Gather reported symptoms from recent logs
  const recentSymptomsList = useMemo(() => {
    const symptomsSet = new Set<string>();

    filteredLogs.forEach((l) => {
      // Direct symptom fields
      if (l.abdominalPain && l.abdominalPain >= 3) symptomsSet.add('dor_estomago');
      if (l.bloating && l.bloating >= 3) symptomsSet.add('inchaço / distensão abdominal');
      if (l.headache) symptomsSet.add('dor de cabeça / cefaleia');
      if (l.paresthesia) symptomsSet.add('dormência / formigamento');
      if (l.sensitivities && l.sensitivities.length) {
        l.sensitivities.forEach((s) => symptomsSet.add(s));
      }
      if (l.brainFog && l.brainFog >= 4) symptomsSet.add('névoa cerebral / lentidão');
      if (l.sleepRestorative === 'nao') symptomsSet.add('sono não restaurador / insônia');

      // Notes mentions or other symptom fields
      if (l.notes) {
        const lower = l.notes.toLowerCase();
        if (lower.includes('nausea') || lower.includes('enjoo') || lower.includes('náusea')) symptomsSet.add('náusea');
        if (lower.includes('afta') || lower.includes('estomatite')) symptomsSet.add('aftas');
        if (lower.includes('azia') || lower.includes('queimação') || lower.includes('refluxo')) symptomsSet.add('azia / refluxo');
        if (lower.includes('insonia') || lower.includes('insônia')) symptomsSet.add('insônia');
        if (lower.includes('tontura') || lower.includes('vertigem')) symptomsSet.add('tontura');
        if (lower.includes('queda') && lower.includes('cabelo')) symptomsSet.add('queda de cabelo');
        if (lower.includes('diarreia') || lower.includes('diarréia')) symptomsSet.add('diarreia');
        if (lower.includes('edema') || lower.includes('inchaço')) symptomsSet.add('edema / inchaço');
        if (lower.includes('visão') || lower.includes('visao') || lower.includes('turva')) symptomsSet.add('distúrbios visuais');
      }
    });

    // Default sample if sparse logs
    if (symptomsSet.size === 0) {
      symptomsSet.add('náusea');
      symptomsSet.add('fadiga');
      symptomsSet.add('rigidez matinal');
    }

    return Array.from(symptomsSet);
  }, [filteredLogs]);

  // Run adverse drug reaction correlation (exclusively for physician)
  const adrMatches = useMemo(() => {
    return detectAdverseReactionsInSymptoms(recentSymptomsList, continuousMedNames);
  }, [recentSymptomsList, continuousMedNames]);

  // Averages for the period
  const avgPain = useMemo(() => {
    const valid = filteredLogs.map((l) => l.pain).filter((v) => v != null && !isNaN(v!)) as number[];
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : '-';
  }, [filteredLogs]);

  const avgFatigue = useMemo(() => {
    const valid = filteredLogs.map((l) => l.fatigue).filter((v) => v != null && !isNaN(v!)) as number[];
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : '-';
  }, [filteredLogs]);

  const avgSleep = useMemo(() => {
    const valid = filteredLogs.map((l) => l.sleep).filter((v) => v != null && !isNaN(v!)) as number[];
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : '-';
  }, [filteredLogs]);

  // Adherence calculation
  const adherenceRate = useMemo(() => {
    if (!filteredLogs.length) return 100;
    const forgottenCount = filteredLogs.filter((l) => l.forgotMedication === true).length;
    return Math.max(0, Math.round(((filteredLogs.length - forgottenCount) / filteredLogs.length) * 100));
  }, [filteredLogs]);

  // Top painful body regions in the period
  const topPainRegions = useMemo(() => {
    const regionScores: Record<string, { count: number; totalIntensity: number }> = {};
    filteredLogs.forEach((l) => {
      if (l.bodyPainMap) {
        Object.entries(l.bodyPainMap).forEach(([reg, val]) => {
          const numVal = Number(val);
          if (numVal > 0) {
            if (!regionScores[reg]) regionScores[reg] = { count: 0, totalIntensity: 0 };
            regionScores[reg].count += 1;
            regionScores[reg].totalIntensity += numVal;
          }
        });
      }
      if (l.advancedPainMarks && l.advancedPainMarks.length) {
        l.advancedPainMarks.forEach((m) => {
          const key = m.label || m.structure || m.asset;
          if (!regionScores[key]) regionScores[key] = { count: 0, totalIntensity: 0 };
          regionScores[key].count += 1;
          regionScores[key].totalIntensity += m.intensity || 5;
        });
      }
    });

    const list = Object.entries(regionScores).map(([name, data]) => ({
      name,
      count: data.count,
      avg: (data.totalIntensity / data.count).toFixed(1)
    }));

    return list.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredLogs]);

  // Save consultation note handler
  const handleSaveNote = () => {
    if (!consultationNotes.trim() && !consultationPlan.trim()) return;

    const newNote: ClinicalConsultationNote = {
      id: uid(),
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      date: todayISO(),
      subjectiveNotes: consultationNotes.trim(),
      plan: consultationPlan.trim(),
      createdAt: new Date().toISOString()
    };

    onUpdatePatientData((prev) => {
      if (!prev.clinicalNotes) {
        prev.clinicalNotes = [];
      }
      prev.clinicalNotes.unshift(newNote);
    });

    setSavedNoteToast(true);
    setTimeout(() => setSavedNoteToast(false), 3500);
  };

  const handleCopySummary = () => {
    const text = `
RESUMO EXECUTIVO DE CONSULTA CLÍNICA - RITMA
Paciente: ${patientAccount.name}
Diagnósticos: ${activeDxs.map((dx) => DX[dx]?.label || dx).join(', ')}
Período Avaliado: Últimos ${selectedRange === 'all' ? 'todos os' : selectedRange} dias (${filteredLogs.length} logs)

MÉTRICAS CORE:
• Dor Média: ${avgPain}/10
• Fadiga Média: ${avgFatigue}/10
• Qualidade do Sono: ${avgSleep}/10
• Adesão Farmacológica: ${adherenceRate}%

FARMACOTERAPIA CONTÍNUA:
${continuousMedNames.length ? continuousMedNames.map((m) => `• ${m}`).join('\n') : '• Nenhuma medicação contínua registrada'}

FARMACOVIGILÂNCIA (AVISOS MÉDICOS DE ADR):
${adrMatches.length ? adrMatches.map((m) => `• ${m.reportedSymptom}: Possível ADR de ${m.drugName} (${m.reactionDisplayName})`).join('\n') : '• Nenhum efeito adverso correspondente identificado no período.'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const content = (
    <div className={`space-y-4 ${isEmbedded ? '' : 'max-w-7xl mx-auto'}`}>
      {/* Patient Switcher Bar if multiple patients and embedded */}
      {allPatients && allPatients.length > 1 && onSelectPatient && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl shadow-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto select-none py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Paciente em Atendimento:</span>
            </span>
            {allPatients.map((p) => {
              const isSelected = p.acc.id === patientAccount.id;
              return (
                <button
                  key={p.acc.id}
                  type="button"
                  onClick={() => onSelectPatient(p.acc.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  <span>{p.acc.name}</span>
                </button>
              );
            })}
          </div>

          {onOpenFullScreen && (
            <button
              type="button"
              onClick={() => onOpenFullScreen(patientAccount.id)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-200/50 dark:border-indigo-900/40 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Expandir para tela cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Modo Foco / Tela Cheia</span>
            </button>
          )}
        </div>
      )}

      {/* Top Clinical Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-poppins font-black text-lg md:text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                {patientAccount.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30">
                Resumo Clínico Executivo
              </span>
            </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-400">
                <span>{patientAccount.email}</span>
                <span>·</span>
                <span>{logs.length} logs preenchidos</span>
                {activeDxs.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {activeDxs.map((dx) => DX[dx]?.label).join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Range Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedRange('14')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedRange === '14'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                14 dias
              </button>
              <button
                onClick={() => setSelectedRange('30')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedRange === '30'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                30 dias
              </button>
              <button
                onClick={() => setSelectedRange('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedRange === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Histórico
              </button>
            </div>

            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Dashboard Grid (Single-Screen Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT COLUMN: Telemetry, Evolution Curve & Anatomical Map (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 4 KPIs Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dor Média</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-rose-500">{avgPain}</span>
                  <span className="text-xs text-slate-400 font-semibold">/10</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fadiga Média</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-amber-500">{avgFatigue}</span>
                  <span className="text-xs text-slate-400 font-semibold">/10</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualidade Sono</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-blue-500">{avgSleep}</span>
                  <span className="text-xs text-slate-400 font-semibold">/10</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adesão a Remédios</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-black ${adherenceRate >= 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {adherenceRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Curva de Evolução Consolidada (Dor, Fadiga e Sono) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-poppins font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Evolução dos Últimos {selectedRange === 'all' ? 'Dias' : `${selectedRange} Dias`}
                  </h3>
                  <span className="text-[10px] text-slate-400">Tendência diária de dor, fadiga e qualidade de sono</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-rose-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Dor
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Fadiga
                  </span>
                  <span className="flex items-center gap-1 text-blue-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Sono
                  </span>
                </div>
              </div>

              {/* Simplified Clean Line Chart */}
              {filteredLogs.length > 0 ? (
                <div className="h-32 w-full pt-1 select-none">
                  {(() => {
                    const W = 500;
                    const H = 100;
                    const padX = 15;
                    const padY = 10;
                    const pts = filteredLogs;
                    const getX = (i: number) => pts.length <= 1 ? W / 2 : padX + (i * (W - padX * 2)) / (pts.length - 1);
                    const getY = (v: number | null | undefined) => {
                      const val = v == null ? 0 : Math.min(10, Math.max(0, v));
                      return padY + (H - padY * 2) * (1 - val / 10);
                    };

                    const painPath = pts.map((p, i) => `${getX(i)},${getY(p.pain)}`).join(' ');
                    const fatiguePath = pts.map((p, i) => `${getX(i)},${getY(p.fatigue)}`).join(' ');
                    const sleepPath = pts.map((p, i) => `${getX(i)},${getY(p.sleep)}`).join(' ');

                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
                        {/* Horizontal guide lines */}
                        <line x1={padX} y1={getY(2)} x2={W - padX} y2={getY(2)} stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
                        <line x1={padX} y1={getY(5)} x2={W - padX} y2={getY(5)} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                        <line x1={padX} y1={getY(8)} x2={W - padX} y2={getY(8)} stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />

                        {/* Sleep Line */}
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2 2" points={sleepPath} />
                        {/* Fatigue Line */}
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.85" points={fatiguePath} />
                        {/* Pain Line */}
                        <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" points={painPath} />

                        {/* Points */}
                        {pts.map((p, i) => (
                          <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(p.pain)}
                            r="3"
                            fill="#f43f5e"
                            className="cursor-pointer hover:r-4 transition-all"
                          >
                            <title>{`${fmtDate(p.date, 's')} — Dor: ${p.pain ?? '-'}, Fadiga: ${p.fatigue ?? '-'}, Sono: ${p.sleep ?? '-'}`}</title>
                          </circle>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Sem registros diários no período selecionado.
                </div>
              )}
            </div>

            {/* Mini-Mapa de Dor & Regiões Anatômicas Recentes */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-poppins font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Regiões de Dor Mais Frequentes (Últimos Registros)
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Freq. & Intensidade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topPainRegions.length > 0 ? (
                  topPainRegions.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {r.name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-medium">{r.count}x</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                          {r.avg}/10
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-4 text-center text-xs text-slate-400 italic">
                    Nenhum ponto anatômico detalhado registrado recentemente no mapa de dor.
                  </div>
                )}
              </div>
            </div>

            {/* Medicações em Uso & Adesão Real */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-poppins font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Farmacoterapia Contínua & Prescrição</span>
                </h3>
                <span className="text-[10px] text-slate-400">Uso contínuo declarado</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {patientData.medications && patientData.medications.length > 0 ? (
                  patientData.medications.map((m) => (
                    <div key={m.id} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">{m.name}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {m.dosage} · {m.frequency} {m.scheduleTime ? `(${m.scheduleTime})` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        Ativo
                      </span>
                    </div>
                  ))
                ) : continuousMedNames.length > 0 ? (
                  continuousMedNames.map((med, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{med}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        Em uso contínuo
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-center text-xs text-slate-400 italic">
                    Nenhuma medicação contínua configurada no perfil do paciente.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Symptoms with Discreet Adverse Reaction Markers + Consultation Notes (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Sintomas da Semana com Marcador Discreto de Efeito Adverso (ADR) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-poppins font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Sintomas Relatados no Período
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Cruzamento clínico com fármacos em uso
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/30">
                  🔒 Somente Médico
                </span>
              </div>

              {/* Symptom chips with discrete ADR badge */}
              <div className="space-y-2">
                {recentSymptomsList.map((symptom, sIdx) => {
                  // Find if there is an ADR match for this symptom
                  const matchedAdr = adrMatches.find((m) => m.reportedSymptom === symptom);

                  return (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 flex items-center justify-between text-xs transition-all hover:border-slate-200 dark:hover:border-slate-750"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {symptom.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Discreet ADR marker if matched */}
                      {matchedAdr ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveAdrTooltip(activeAdrTooltip?.reportedSymptom === symptom ? null : matchedAdr)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 transition-colors cursor-pointer select-none"
                            title="Clique para ver detalhes farmacológicos deste possível efeito adverso"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Possível ADR ({matchedAdr.drugName.split(' ')[0]})</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Estável</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Popover / Detail modal when clicking the ADR badge */}
              {activeAdrTooltip && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-amber-800 dark:text-amber-300 font-bold block">
                        Farmacovigilância: {activeAdrTooltip.reactionDisplayName}
                      </strong>
                      <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5">
                        Fármaco correlacionado: <strong>{activeAdrTooltip.drugName}</strong> ({activeAdrTooltip.drugClass})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAdrTooltip(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    💡 <strong>Conduta sugerida:</strong> {activeAdrTooltip.physicianAdvice}
                  </p>
                  <div className="text-[9px] text-slate-400 italic border-t border-amber-500/20 pt-1">
                    🔒 Este marcador e orientação são gerados para apoio de conduta médica e não são exibidos na tela do paciente.
                  </div>
                </div>
              )}
            </div>

            {/* Evolução da Consulta Atual (Prontuário Médico) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-poppins font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Anotação Clínica da Consulta Atual</span>
                </h3>
                <span className="text-[10px] text-slate-400">{todayISO()}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Queixas, Impressão Diagnóstica e Exame Clínico
                  </label>
                  <textarea
                    rows={3}
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Ex: Paciente relata dor articular persistente em MCFs. Rigidez matinal de 45 min. Tolerando bem MTX, náusea leve controlada..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Conduta Terapêutica / Ajustes de Prescrição
                  </label>
                  <textarea
                    rows={2}
                    value={consultationPlan}
                    onChange={(e) => setConsultationPlan(e.target.value)}
                    placeholder="Ex: Manter MTX 15mg/sem. Ajustar ácido fólico para 5mg D+1 e D+2. Solicitar hemograma e transaminases em 30 dias..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Evolução no Prontuário</span>
                </button>
              </div>

              {/* Histórico de Anotações Clínicas Anteriores */}
              {patientData.clinicalNotes && patientData.clinicalNotes.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Histórico de Evoluções ({patientData.clinicalNotes.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {patientData.clinicalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">{note.doctorName}</strong>
                          <span className="text-slate-400">{fmtDate(note.date, 's')}</span>
                        </div>
                        {note.subjectiveNotes && (
                          <p className="text-slate-600 dark:text-slate-400 leading-normal">
                            {note.subjectiveNotes}
                          </p>
                        )}
                        {note.plan && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5">
                            Conduta: {note.plan}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
  );

  return (
    <div className={isEmbedded ? 'space-y-4' : 'min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3 sm:p-5 md:p-6 font-sans'}>
      {/* Toast notifications */}
      {copiedToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>Resumo copiado com sucesso!</span>
        </div>
      )}
      {savedNoteToast && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>Evolução salva no prontuário do paciente!</span>
        </div>
      )}

      {content}
    </div>
  );
};

export default ExecutiveConsultationView;
