/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DailyLog, PatientData, Account, FlareAlert, MedicationConfig, ScheduledEventConfig } from '../types';
import { fmtDate, todayISO, calcBaseline, adherence, genInsights, triggerDelta } from '../utils';
import { DX, REFERENCES } from '../data';
import {
  Stethoscope,
  ArrowLeft,
  Printer,
  AlertTriangle,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Activity,
  Award,
  Clock,
  Pill,
  User,
  Heart,
  CalendarDays
} from 'lucide-react';

interface ConsultationSummaryProps {
  patientData: PatientData;
  patientAccount: Account;
  onBack: () => void;
}

interface MiniIndicatorChartProps {
  label: string;
  field: string;
  color: string;
  baselineMean?: number;
  baselineSd?: number;
  logs: DailyLog[];
}

const MiniIndicatorChart: React.FC<MiniIndicatorChartProps> = ({
  label,
  field,
  color,
  baselineMean,
  baselineSd,
  logs
}) => {
  // Extract values
  const points = useMemo(() => {
    return logs
      .map((l) => ({
        date: l.date,
        val: l[field as keyof DailyLog] as number | null
      }))
      .filter((p) => p.val != null && !isNaN(p.val!)) as { date: string; val: number }[];
  }, [logs, field]);

  const periodMean = useMemo(() => {
    if (!points.length) return null;
    return points.reduce((acc, p) => acc + p.val, 0) / points.length;
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center h-44">
        <span className="text-slate-400 text-xs italic">Sem registros de {label} no período</span>
      </div>
    );
  }

  const W = 320;
  const H = 100;
  const PaddingX = 20;
  const PaddingY = 15;
  const maxVal = 10;

  const getX = (index: number) => {
    if (points.length < 2) return W / 2;
    return PaddingX + (index * (W - PaddingX * 2)) / (points.length - 1);
  };

  const getY = (val: number) => {
    return PaddingY + (H - PaddingY * 2) * (1 - val / maxVal);
  };

  const pathAttr = points.map((p, i) => `${getX(i)},${getY(p.val)}`).join(' ');

  const baselineY = baselineMean != null ? getY(baselineMean) : null;
  const baselinePlusSdY = baselineMean != null && baselineSd != null ? getY(Math.min(10, baselineMean + baselineSd)) : null;
  const baselineMinusSdY = baselineMean != null && baselineSd != null ? getY(Math.max(0, baselineMean - baselineSd)) : null;

  const isImprovement = (() => {
    if (periodMean == null || baselineMean == null) return null;
    if (field === 'sleep' || field === 'function') {
      return periodMean >= baselineMean;
    } else {
      return periodMean <= baselineMean;
    }
  })();

  const delta = periodMean != null && baselineMean != null ? Math.abs(periodMean - baselineMean) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between print:border print:shadow-none">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{label}</h4>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {periodMean != null ? periodMean.toFixed(1) : '-'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">/10 médio</span>
          </div>
        </div>
        {baselineMean != null && (
          <div className="text-right text-[10px]">
            <span className="text-slate-400 font-medium block">Histórico Basal: <strong>{baselineMean.toFixed(1)}</strong></span>
            {periodMean != null && delta > 0.1 && (
              <span className={`font-bold mt-0.5 inline-block px-1.5 py-0.5 rounded text-[9px] ${
                isImprovement ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
              }`}>
                {isImprovement ? 'Melhora' : 'Piora'} de {delta.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative h-20 w-full select-none mt-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block">
          {/* Shaded baseline band (Mean +/- 1 SD) if available */}
          {baselineMean != null && baselineSd != null && baselinePlusSdY != null && baselineMinusSdY != null && (
            <rect
              x={PaddingX}
              y={Math.min(baselinePlusSdY, baselineMinusSdY)}
              width={W - PaddingX * 2}
              height={Math.abs(baselinePlusSdY - baselineMinusSdY)}
              fill={color}
              opacity="0.05"
              rx="2.5"
            />
          )}

          {/* Baseline Mean Line */}
          {baselineY != null && (
            <g>
              <line
                x1={PaddingX}
                y1={baselineY}
                x2={W - PaddingX}
                y2={baselineY}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <text
                x={W - PaddingX + 3}
                y={baselineY}
                fill="#94a3b8"
                fontSize="6"
                fontWeight="black"
                alignmentBaseline="middle"
              >
                MÉDIA BASAL
              </text>
            </g>
          )}

          {/* Daily Values Line */}
          {points.length >= 2 ? (
            <polyline
              points={pathAttr}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Dots on nodes */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(p.val)}
                r="3"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2"
              />
              {(i === 0 || i === points.length - 1) && (
                <text
                  x={getX(i)}
                  y={H - 2}
                  fill="#94a3b8"
                  fontSize="6.5"
                  fontWeight="bold"
                  textAnchor={i === 0 ? "start" : "end"}
                >
                  {p.date.split('-')[2]}/{p.date.split('-')[1]}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export const ConsultationSummary: React.FC<ConsultationSummaryProps> = ({
  patientData,
  patientAccount,
  onBack
}) => {
  const [copiedToast, setCopiedToast] = useState(false);

  // Sort logs in ascending chronological order for charts
  const chronLogs = useMemo(() => {
    return [...patientData.dailyLogs].sort((a, b) => a.date.localeCompare(b.date));
  }, [patientData.dailyLogs]);

  // Find date of last registered consultation (reumatoloConsult === true)
  const lastConsultLog = useMemo(() => {
    const reverseLogs = [...chronLogs].reverse();
    return reverseLogs.find((l) => l.reumatoloConsult === true);
  }, [chronLogs]);

  const lastConsultDate = lastConsultLog?.date;

  // Set default range to 'since_last' if a consultation exists, else default to '30'
  const [selectedRange, setSelectedRange] = useState<'since_last' | '30' | '14' | 'all'>(
    lastConsultDate ? 'since_last' : '30'
  );

  // Filter logs based on selected range
  const filteredLogs = useMemo(() => {
    if (selectedRange === 'since_last' && lastConsultDate) {
      return chronLogs.filter((l) => l.date >= lastConsultDate);
    }
    if (selectedRange === '30') {
      const limit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return chronLogs.filter((l) => l.date >= limit);
    }
    if (selectedRange === '14') {
      const limit = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return chronLogs.filter((l) => l.date >= limit);
    }
    return chronLogs;
  }, [chronLogs, selectedRange, lastConsultDate]);

  // Compute exact days count in the filtered range
  const periodDaysCount = useMemo(() => {
    if (filteredLogs.length === 0) return 30;
    if (selectedRange === 'since_last' && lastConsultDate) {
      const diffTime = Math.abs(new Date().getTime() - new Date(lastConsultDate + 'T00:00:00').getTime());
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    if (selectedRange === '30') return 30;
    if (selectedRange === '14') return 14;
    return chronLogs.length || 30;
  }, [filteredLogs, selectedRange, lastConsultDate, chronLogs]);

  // Calculate adherence using utils function
  const adherenceInfo = useMemo(() => {
    return adherence(patientData, periodDaysCount);
  }, [patientData, periodDaysCount]);

  // Baseline configs
  const baseline = useMemo(() => {
    return patientData.baseline || calcBaseline(patientData.dailyLogs);
  }, [patientData]);

  // Flare alerts filtered by dates in the period
  const periodFlareAlerts = useMemo(() => {
    if (!filteredLogs.length) return [];
    const start = filteredLogs[0].date;
    const end = filteredLogs[filteredLogs.length - 1].date;
    return patientData.flareAlerts
      .filter((alert) => alert.date >= start && alert.date <= end)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [patientData.flareAlerts, filteredLogs]);

  // Insights based specifically on this period's logs
  const periodInsights = useMemo(() => {
    if (filteredLogs.length < 3) return [];
    const tempProfile: PatientData = {
      ...patientData,
      dailyLogs: filteredLogs
    };
    return genInsights(tempProfile, 'all');
  }, [patientData, filteredLogs]);

  // Triggers delta in the period
  const periodTriggers = useMemo(() => {
    return triggerDelta(filteredLogs, 1); // minN=1 to capture triggers occurring within this short consultation interval
  }, [filteredLogs]);

  // Aggregate medication adherence in the period
  const medStats = useMemo(() => {
    const stats: Record<string, { taken: number; forgotten: number; skipped: number; total: number }> = {};
    filteredLogs.forEach((log) => {
      if (log.medicationAdherence) {
        Object.entries(log.medicationAdherence).forEach(([medName, status]) => {
          const nameClean = medName.trim();
          if (!stats[nameClean]) {
            stats[nameClean] = { taken: 0, forgotten: 0, skipped: 0, total: 0 };
          }
          stats[nameClean].total++;
          if (status === 'taken') stats[nameClean].taken++;
          else if (status === 'forgotten') stats[nameClean].forgotten++;
          else if (status === 'skipped') stats[nameClean].skipped++;
        });
      }
    });
    return stats;
  }, [filteredLogs]);

  // Compare active medications with logs to see if anything was modified or removed
  const currentMedNames = useMemo(() => {
    return new Set((patientData.medications || []).map((m) => m.name.toLowerCase().trim()));
  }, [patientData.medications]);

  const removedOrChangedMeds = useMemo(() => {
    return Object.keys(medStats).filter(
      (medName) => !currentMedNames.has(medName.toLowerCase().trim())
    );
  }, [medStats, currentMedNames]);

  // Track completed events/therapies in the period
  const therapyCounts = useMemo(() => {
    const counts = {
      psychotherapy: 0,
      physiotherapy: 0,
      massage: 0,
      mindfulness: 0,
      acupuncture: 0,
      reumatologista: 0,
    };
    filteredLogs.forEach((l) => {
      if (l.psychotherapyDay) counts.psychotherapy++;
      if (l.physiotherapyDay) counts.physiotherapy++;
      if (l.massageDay) counts.massage++;
      if (l.mindfulnessDay) counts.mindfulness++;
      if (l.acupunctureDay) counts.acupuncture++;
      if (l.reumatoloConsult) counts.reumatologista++;
    });
    return counts;
  }, [filteredLogs]);

  const activeDxs = useMemo(() => {
    return Object.keys(patientData.diagnoses).filter((k) => patientData.diagnoses[k]);
  }, [patientData.diagnoses]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = () => {
    const avgPain = filteredLogs.length
      ? (filteredLogs.reduce((a, b) => a + (b.pain || 0), 0) / filteredLogs.length).toFixed(1)
      : '-';
    const avgFatigue = filteredLogs.length
      ? (filteredLogs.reduce((a, b) => a + (b.fatigue || 0), 0) / filteredLogs.length).toFixed(1)
      : '-';
    const avgSleep = filteredLogs.length
      ? (filteredLogs.reduce((a, b) => a + (b.sleep || 0), 0) / filteredLogs.length).toFixed(1)
      : '-';

    const text = `
📋 RELATÓRIO DE SAÚDE & EVOLUÇÃO - RITMMA
Paciente: ${patientAccount.name}
Período: ${filteredLogs.length > 0 ? `${fmtDate(filteredLogs[0].date, 's')} a ${fmtDate(filteredLogs[filteredLogs.length - 1].date, 's')}` : 'Sem dados'} (${periodDaysCount} dias avaliados)

📊 MÉDIAS DO PERÍODO (Escala 0-10):
• Dor Média: ${avgPain}/10
• Fadiga Média: ${avgFatigue}/10
• Qualidade do Sono: ${avgSleep}/10

💊 ADERÊNCIA A MEDICAÇÕES:
• Adesão Geral: ${adherenceInfo.rate}% (${adherenceInfo.takenCount} tomadas de ${adherenceInfo.expectedCount} previstas)

⚡ MEDICAÇÕES DE CRISE (SOS):
${Object.keys(medStats).length ? Object.entries(medStats).map(([med, st]) => `• ${med}: ${(st as { taken: number }).taken} uso(s)`).join('\n') : '• Nenhum resgate registrado no período.'}

🔍 GATILHOS E PADRÕES MAIS RELEVANTES:
${periodTriggers.length ? periodTriggers.map(t => `• ${t.trigger}: variação de ${t.delta > 0 ? '+' : ''}${t.delta.toFixed(1)} em dor`).join('\n') : '• Sem gatilhos atípicos mapeados.'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-6 md:p-8 font-sans print:bg-white print:text-black print:p-0">
      {/* Dynamic print-only style tag */}
      <style>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card-grid {
            grid-template-cols: 1fr 1fr !important;
          }
          .print-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            box-shadow: none !important;
          }
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6 print:space-y-4 print:max-w-full print:p-0">
        
        {/* Toast confirmation for clipboard copy */}
        {copiedToast && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            <span>Relatório copiado para a área de transferência!</span>
          </div>
        )}

        {/* Navigation & Toolbar Header (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm no-print">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
              {lastConsultDate && (
                <button
                  onClick={() => setSelectedRange('since_last')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedRange === 'since_last'
                      ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Desde Último Registro
                </button>
              )}
              <button
                onClick={() => setSelectedRange('30')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedRange === '30'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Últimos 30 Dias
              </button>
              <button
                onClick={() => setSelectedRange('14')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedRange === '14'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Últimos 14 Dias
              </button>
              <button
                onClick={() => setSelectedRange('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedRange === 'all'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Todo Histórico
              </button>
            </div>

            {/* Copy & Print Buttons */}
            <button
              onClick={handleCopyToClipboard}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              title="Copiar resumo textual para colar onde desejar"
            >
              <span>📋 Copiar Texto</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer select-none"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar PDF / Imprimir</span>
            </button>
          </div>
        </div>

        {/* Clinical Document Shell */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none print:space-y-6">
          
          {/* Document Header */}
          <div className="border-b pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:pb-4 print:border-b-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 print:bg-slate-100 print:text-black">
                  <Stethoscope className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest print:text-slate-600">
                  Modo Consulta · Relatório de Evolução
                </span>
              </div>
              <h1 className="font-poppins font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tight">
                {patientAccount.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {activeDxs.map((dx) => (
                  <span
                    key={dx}
                    className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md print:bg-slate-100 print:text-black"
                  >
                    {DX[dx]?.icon} {DX[dx]?.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-left md:text-right text-xs text-slate-400 font-medium">
              <span className="block text-slate-500 font-bold">
                Período: <span className="text-slate-800 dark:text-slate-100">
                  {filteredLogs.length > 0 ? `${fmtDate(filteredLogs[0].date, 's')} a ${fmtDate(filteredLogs[filteredLogs.length - 1].date, 's')}` : 'Sem dados'}
                </span>
              </span>
              <span className="block mt-0.5">
                Total de dias avaliados: <strong className="text-slate-700 dark:text-slate-300">{periodDaysCount} dias</strong> (Logs preenchidos: {filteredLogs.length})
              </span>
              {lastConsultDate && (
                <span className="block mt-0.5 text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold print:text-slate-600">
                  Última consulta registrada: {fmtDate(lastConsultDate, 'dt')}
                </span>
              )}
            </div>
          </div>

          {/* Core Metrics & Adherence Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
            
            {/* Quick Summary Widgets */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 print:border">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">
                    {adherenceInfo.pct}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Adesão ao Diário
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium">
                    {adherenceInfo.filled} de {adherenceInfo.days} logs preenchidos
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 print:border">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">
                    {periodFlareAlerts.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Alertas de Flare (Crise)
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium">
                    {periodFlareAlerts.filter(a => a.level === 'HIGH').length} graves · {periodFlareAlerts.filter(a => a.level === 'MODERATE').length} moderados
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Standing Clinic Tip */}
            <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 p-4 rounded-2xl flex items-start gap-3 print:border">
              <Award className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">Modo Rápido de Consultório</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Focado em apoiar decisões rápidas de conduta e ajustes terapêuticos. Imprima para arquivar o sumário físico de prontuário.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Evolution of 4 core indicators */}
          <div className="space-y-4 print-avoid-break">
            <h3 className="font-poppins font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b pb-1">
              1) Evolução dos 4 Indicadores Clínicos Core
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              <MiniIndicatorChart
                label="Dor"
                field="pain"
                color="#f43f5e"
                baselineMean={baseline.pain?.mean}
                baselineSd={baseline.pain?.sd}
                logs={filteredLogs}
              />
              <MiniIndicatorChart
                label="Fadiga"
                field="fatigue"
                color="#f59e0b"
                baselineMean={baseline.fatigue?.mean}
                baselineSd={baseline.fatigue?.sd}
                logs={filteredLogs}
              />
              <MiniIndicatorChart
                label="Qualidade Sono"
                field="sleep"
                color="#6366f1"
                baselineMean={baseline.sleep?.mean}
                baselineSd={baseline.sleep?.sd}
                logs={filteredLogs}
              />
              <MiniIndicatorChart
                label="Capacidade Funcional"
                field="function"
                color="#10b981"
                baselineMean={baseline.function?.mean}
                baselineSd={baseline.function?.sd}
                logs={filteredLogs}
              />
            </div>
          </div>

          {/* Section 2 & 3: Alerts List & Adherence Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 print-avoid-break">
            
            {/* Flare Alerts of the Period */}
            <div className="space-y-4">
              <h3 className="font-poppins font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b pb-1">
                2) Histórico de Alertas de Crise no Período
              </h3>

              {periodFlareAlerts.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  ✓ Nenhum alerta clínico de exacerbação relevante no período.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 print:max-h-none print:overflow-visible">
                  {periodFlareAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          alert.level === 'HIGH' ? 'bg-rose-500' : alert.level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {fmtDate(alert.date, 's')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        alert.level === 'HIGH'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          : alert.level === 'MODERATE'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {alert.level} (Score {alert.score.toFixed(1)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Insights & Trigger Delta */}
            <div className="space-y-4">
              <h3 className="font-poppins font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b pb-1">
                3) Gatilhos Ativos Identificados no Período
              </h3>

              {periodTriggers.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  Não houve correlação de gatilho suficiente no diário neste intervalo.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {periodTriggers.map((trg, idx) => {
                    const absVal = Math.abs(trg.value);
                    const impactClass = trg.value > 1.2
                      ? 'text-rose-500'
                      : trg.value > 0.4
                      ? 'text-amber-500'
                      : 'text-emerald-500';

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 shadow-xs"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <strong className="text-slate-700 dark:text-slate-200">{trg.label}</strong>
                          <span className={`font-black uppercase text-[10px] ${impactClass}`}>
                            {trg.value > 0 ? `+${trg.value.toFixed(1)} Dor` : `${trg.value.toFixed(1)} Dor`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Registrado {trg.n} vezes no período</span>
                          <span className="italic">
                            {trg.value > 1.0 ? '⚠️ Impacto Importante' : trg.value > 0 ? 'Flutuação Leve' : 'Modulador Positivo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Clinical Insights (from genInsights) */}
          <div className="space-y-4 print-avoid-break">
            <h3 className="font-poppins font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b pb-1">
              4) Principais Insights Clínicos no Período
            </h3>

            {periodInsights.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center text-xs text-slate-400 font-medium">
                Sinais estáveis. Continue estimulando o registro contínuo para geração de novas orientações e cruzamento de dados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {periodInsights.map((ins, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 text-xs"
                  >
                    <span className="text-lg flex-shrink-0 select-none">{ins.ic}</span>
                    <div className="space-y-0.5">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {ins.text}
                        {ins.refIds && ins.refIds.length > 0 && (
                          <span className="ml-1.5 inline-flex gap-1">
                            {ins.refIds.map((refId) => {
                              const ref = REFERENCES.find(([id]) => id === refId);
                              if (!ref) return null;
                              const [,,,,,url] = ref;
                              return (
                                <a
                                  key={refId}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 px-1 rounded font-mono font-bold hover:text-slate-700 transition-colors"
                                  title={`${ref[1]} (${ref[4]}) - ${ref[2]}`}
                                >
                                  [{refId}]
                                </a>
                              );
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Medications & Event Changes */}
          <div className="space-y-4 print-avoid-break">
            <h3 className="font-poppins font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b pb-1">
              5) Tratamento & Terapias (Uso no Período)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
              
              {/* Medication Compliance Stats */}
              <div className="space-y-3 bg-slate-50/40 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-indigo-500" />
                  <span>Adesão Farmacológica</span>
                </h4>

                {Object.keys(medStats).length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">
                    Nenhuma tomada farmacológica contínua registrada no diário do período.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(medStats).map(([medName, s]) => {
                      const stat = s as { taken: number; forgotten: number; skipped: number; total: number };
                      const isCurrent = currentMedNames.has(medName.toLowerCase().trim());
                      const pctTaken = stat.total ? Math.round((stat.taken / stat.total) * 100) : 0;

                      return (
                        <div key={medName} className="text-xs space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              {medName}
                              {!isCurrent && (
                                <span className="bg-rose-50 text-rose-600 text-[8px] px-1 py-0.2 rounded dark:bg-rose-950/30 dark:text-rose-400">
                                  Removido/Modificado
                                </span>
                              )}
                            </span>
                            <span className={pctTaken > 80 ? 'text-emerald-500' : pctTaken > 50 ? 'text-amber-500' : 'text-rose-500'}>
                              {pctTaken}% Tomado ({stat.taken}/{stat.total})
                            </span>
                          </div>
                          
                          {/* Mini Progress Bar */}
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: `${(stat.taken / stat.total) * 100}%` }} title="Tomado" />
                            <div className="h-full bg-rose-400" style={{ width: `${(stat.forgotten / stat.total) * 100}%` }} title="Esquecido" />
                            <div className="h-full bg-slate-300 dark:bg-slate-600" style={{ width: `${(stat.skipped / stat.total) * 100}%` }} title="Pulado" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Listing current prescription as benchmark */}
                {patientData.medications && patientData.medications.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[10px] space-y-1">
                    <span className="font-bold text-slate-400 uppercase tracking-widest block mb-1">Prescrição Configurada Atualmente:</span>
                    {patientData.medications.map((m) => (
                      <div key={m.id} className="text-slate-500 dark:text-slate-400">
                        • <strong>{m.name}</strong> {m.dosage} — {m.frequency} {m.scheduleTime ? `(${m.scheduleTime})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Therapy & Scheduled Event Completion */}
              <div className="space-y-3 bg-slate-50/40 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  <span>Terapias & Atividades Realizadas</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-2.5 rounded-xl shadow-xs">
                    <span className="text-slate-400 block font-medium">Fisioterapia</span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                      {therapyCounts.physiotherapy} sessões
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-2.5 rounded-xl shadow-xs">
                    <span className="text-slate-400 block font-medium">Psicoterapia</span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                      {therapyCounts.psychotherapy} sessões
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-2.5 rounded-xl shadow-xs">
                    <span className="text-slate-400 block font-medium">Mindfulness</span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                      {therapyCounts.mindfulness} sessões
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-2.5 rounded-xl shadow-xs">
                    <span className="text-slate-400 block font-medium">Acupuntura</span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                      {therapyCounts.acupuncture} sessões
                    </span>
                  </div>
                </div>

                {/* Show active scheduled events configurations */}
                {patientData.scheduledEvents && patientData.scheduledEvents.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[10px] space-y-1">
                    <span className="font-bold text-slate-400 uppercase tracking-widest block mb-1">Rotina de Cuidados Prescrita:</span>
                    {patientData.scheduledEvents.filter(e => e.active).map((e) => {
                      const recMap: Record<string, string> = {
                        weekly: 'Semanal',
                        biweekly: 'A cada 15 dias',
                        monthly: 'Mensal',
                        none: 'Evento Único'
                      };
                      return (
                        <div key={e.id} className="text-slate-500 dark:text-slate-400">
                          • <strong>{e.title}</strong> — {recMap[e.recurrence] || e.recurrence}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Clinician Signature Area (Visible only in Print) */}
          <div className="hidden print:block pt-12 text-xs border-t-2 mt-16 print-avoid-break">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="border-b h-10 w-full" />
                <span className="block font-bold">Assinatura do Profissional Responsável</span>
                <span className="block text-[10px] text-slate-400">CRM / COFEN / CREFITO / CRP nº __________________</span>
              </div>
              <div className="text-right space-y-1 self-end">
                <span className="block font-bold">RITMA CLINICAL DECISION SUPPORT SYSTEM</span>
                <span className="block text-[10px] text-slate-400">Documento impresso de suporte clínico gerado em {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ConsultationSummary;
