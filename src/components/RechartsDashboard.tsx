/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DailyLog } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Gauge,
  Activity,
  Moon,
  Zap,
  Info,
  Sparkles,
  TrendingUp,
  CloudSun,
  Maximize2,
  X,
  Calendar,
  Copy,
  Check,
  Award,
  ChevronDown,
  HelpCircle,
  AlertTriangle,
  Plus,
  Sliders,
  BarChart2,
  Layers
} from 'lucide-react';

// Pearson Correlation Coefficient calculation helper
function calcPearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
    sumYY += y[i] * y[i];
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  if (den === 0 || isNaN(den)) return 0;
  return num / den;
}

// Linear Regression helper: y = m*x + b
function calcLinearRegression(x: number[], y: number[]) {
  const n = x.length;
  if (n < 2) return { m: 0, b: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const den = n * sumXX - sumX * sumX;
  if (den === 0) return { m: 0, b: sumY / n };
  const m = (n * sumXY - sumX * sumY) / den;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

function getCorrelationInterpretation(r: number, metricName: string): {
  title: string;
  desc: string;
  colorClass: string;
  bgClass: string;
} {
  const absR = Math.abs(r);
  const isPositive = r > 0;

  if (absR < 0.2) {
    return {
      title: 'Sem relação direta identificada',
      desc: `A variação de ${metricName} não parece influenciar diretamente o seu nível de dor neste período.`,
      colorClass: 'text-slate-600 dark:text-slate-400',
      bgClass: 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
    };
  }

  if (isPositive) {
    if (absR >= 0.6) {
      return {
        title: `Forte tendência de aumento conjunto`,
        desc: `Observamos um padrão claro: quando ${metricName} sobe, os seus níveis de dor também aumentam. Vale mencionar esse achado na sua próxima consulta.`,
        colorClass: 'text-[#9251E5] dark:text-[#9854E8]',
        bgClass: 'bg-[#9251E5]/10 dark:bg-[#9251E5]/20 border-[#9251E5]/30'
      };
    } else {
      return {
        title: `Tendência de associação moderada`,
        desc: `O aumento de ${metricName} costuma coincidir com dias de dor um pouco mais elevada.`,
        colorClass: 'text-[#3975E3] dark:text-[#4C7FE8]',
        bgClass: 'bg-[#3975E3]/10 dark:bg-[#3975E3]/20 border-[#3975E3]/30'
      };
    }
  } else {
    if (absR >= 0.6) {
      return {
        title: `Forte sensibilidade à redução (ex: dias mais frios)`,
        desc: `Sua dor tende a subir quando ${metricName} cai (exemplo: dias de queda de temperatura ou pressão).`,
        colorClass: 'text-[#1FBCC4] dark:text-[#24C4D1]',
        bgClass: 'bg-[#1FBCC4]/10 dark:bg-[#1FBCC4]/20 border-[#1FBCC4]/30'
      };
    } else {
      return {
        title: `Aumento discreto na redução`,
        desc: `Sua dor costuma ser discretamente maior quando ${metricName} diminui.`,
        colorClass: 'text-[#1FBCC4] dark:text-[#24C4D1]',
        bgClass: 'bg-[#1FBCC4]/10 dark:bg-[#1FBCC4]/20 border-[#1FBCC4]/30'
      };
    }
  }
}

// Helper to convert activityLoad text to a numeric scale
function getLoadValue(load: string | undefined): number | null {
  if (!load) return null;
  if (load.includes('Repouso')) return 1;
  if (load.includes('Leve')) return 2;
  if (load.includes('Moderada')) return 3;
  if (load.includes('Intensa') || load.includes('exagerei')) return 4;
  return null;
}

// Custom Dot Component with RITMMA Signature Violet Peak Marker
const RITMMAPeakDot = (props: any) => {
  const { cx, cy, payload, index, data, dataKey = 'pain' } = props;
  if (!cx || !cy || !payload) return null;

  const val = payload[dataKey];
  if (val == null) return null;

  // Determine if this is a peak value
  const allVals = data ? data.map((d: any) => d[dataKey] ?? 0) : [];
  const maxVal = allVals.length ? Math.max(...allVals) : 0;
  const isPeak = val === maxVal && val > 0;

  if (isPeak) {
    return (
      <g key={`ritmma-peak-dot-${index}`}>
        <circle cx={cx} cy={cy} r="8" fill="#9251E5" opacity="0.25" />
        <circle cx={cx} cy={cy} r="5" fill="#9251E5" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="2" fill="#FFFFFF" />
      </g>
    );
  }

  return (
    <circle
      key={`ritmma-dot-${index}`}
      cx={cx}
      cy={cy}
      r="3"
      fill="#1FBCC4"
      stroke="#062B63"
      strokeWidth="1"
    />
  );
};

// SVG Gradient Definitions for RITMMA Charts
const RITMMAChartDefs = () => (
  <defs>
    {/* Main RITMMA Brand Gradient: Turquoise -> Blue -> Violet */}
    <linearGradient id="ritmmaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1FBCC4" />
      <stop offset="50%" stopColor="#3975E3" />
      <stop offset="100%" stopColor="#9251E5" />
    </linearGradient>

    {/* Soft Fill for Area Charts */}
    <linearGradient id="ritmmaAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#1FBCC4" stopOpacity="0.4" />
      <stop offset="50%" stopColor="#3975E3" stopOpacity="0.15" />
      <stop offset="100%" stopColor="#9251E5" stopOpacity="0.02" />
    </linearGradient>

    {/* Navy Blue Gradient Fill */}
    <linearGradient id="ritmmaNavyFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#062B63" stopOpacity="0.3" />
      <stop offset="100%" stopColor="#062B63" stopOpacity="0.0" />
    </linearGradient>

    {/* Violet Accent Fill */}
    <linearGradient id="ritmmaVioletFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#9251E5" stopOpacity="0.35" />
      <stop offset="100%" stopColor="#9251E5" stopOpacity="0.02" />
    </linearGradient>

    {/* Turquoise Accent Fill */}
    <linearGradient id="ritmmaTurquoiseFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#1FBCC4" stopOpacity="0.35" />
      <stop offset="100%" stopColor="#1FBCC4" stopOpacity="0.02" />
    </linearGradient>
  </defs>
);

interface RechartsDashboardProps {
  logs: DailyLog[];
}

export const RechartsDashboard: React.FC<RechartsDashboardProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'influences' | 'fullCharts'>('overview');
  const [expandedChart, setExpandedChart] = useState<
    'ritmmaWave' | 'weather' | 'sleep' | 'triggers' | 'physicalLoad' | null
  >(null);
  const [weatherMetric, setWeatherMetric] = useState<'temp' | 'humidity' | 'pressure'>('temp');
  const [waveLayers, setWaveLayers] = useState<{
    fatigue: boolean;
    sleep: boolean;
    weather: boolean;
    triggers: boolean;
  }>({
    fatigue: true,
    sleep: false,
    weather: false,
    triggers: false
  });

  const toggleWaveLayer = (layer: keyof typeof waveLayers) => {
    setWaveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Filter logs last 30 days
  const logsLastMonth = useMemo(() => {
    return [...logs]
      .filter((l) => l.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [logs]);

  // Derived Summary Metrics for Patient Context
  const averagePain = useMemo(() => {
    if (!logsLastMonth.length) return 0;
    const sum = logsLastMonth.reduce((acc, l) => acc + (l.pain ?? 0), 0);
    return Number((sum / logsLastMonth.length).toFixed(1));
  }, [logsLastMonth]);

  const maxPainPeak = useMemo(() => {
    if (!logsLastMonth.length) return { pain: 0, date: '-' };
    let maxLog = logsLastMonth[0];
    logsLastMonth.forEach((l) => {
      if ((l.pain ?? 0) > (maxLog.pain ?? 0)) {
        maxLog = l;
      }
    });
    const formattedDate = maxLog.date ? maxLog.date.split('-').slice(2).join('/') + '/' + maxLog.date.split('-')[1] : '-';
    return { pain: maxLog.pain ?? 0, date: formattedDate };
  }, [logsLastMonth]);

  // Main RITMMA Continuous Wave Data
  const ritmmaWaveData = useMemo(() => {
    return logsLastMonth.map((l, idx) => {
      const formattedDate = l.date.split('-').slice(2).join('/') + '/' + l.date.split('-')[1];
      const triggersCount = l.triggers ? l.triggers.length : 0;
      return {
        index: idx + 1,
        date: formattedDate,
        rawDate: l.date,
        pain: l.pain ?? 0,
        fatigue: l.fatigue ?? 0,
        sleep: l.sleep ?? 0,
        temp: l.weather?.temp ?? null,
        triggersCount,
        function: l.function ?? 0,
        // Computed RITMMA Rhythm Index (composite metric)
        rhythmIndex: Math.min(
          10,
          Math.max(
            0,
            Number((((l.pain ?? 0) * 0.5 + (l.fatigue ?? 0) * 0.3 + (10 - (l.sleep ?? 0)) * 0.2)).toFixed(1))
          )
        )
      };
    });
  }, [logsLastMonth]);

  // RITMMA Stability Score
  const ritmmaScore = useMemo(() => {
    if (!logsLastMonth.length) return 100;
    const avgPain = logsLastMonth.reduce((acc, l) => acc + (l.pain ?? 0), 0) / logsLastMonth.length;
    // Calculate variance
    const variance =
      logsLastMonth.reduce((acc, l) => acc + Math.pow((l.pain ?? 0) - avgPain, 2), 0) /
      logsLastMonth.length;
    const stdDev = Math.sqrt(variance);
    // Score based on lower pain & lower volatility (higher stability)
    const score = Math.max(10, Math.min(100, Math.round(100 - avgPain * 6 - stdDev * 4)));
    return score;
  }, [logsLastMonth]);

  // Prepared data for Weather vs Pain
  const weatherData = useMemo(() => {
    return logsLastMonth.map((l) => {
      const formattedDate = l.date.split('-').slice(2).join('/') + '/' + l.date.split('-')[1];
      return {
        date: formattedDate,
        rawDate: l.date,
        pain: l.pain ?? 0,
        temp: l.weather?.temp ?? null,
        humidity: l.weather?.humidity ?? null,
        pressure: l.weather?.pressure ?? null
      };
    });
  }, [logsLastMonth]);

  const weatherCorrelation = useMemo(() => {
    const valid = weatherData.filter((d) => d[weatherMetric] !== null);
    const x = valid.map((d) => d[weatherMetric] as number);
    const y = valid.map((d) => d.pain);
    return calcPearsonCorrelation(x, y);
  }, [weatherData, weatherMetric]);

  const weatherInterpretation = useMemo(() => {
    const labelMap = { temp: 'temperatura', humidity: 'umidade', pressure: 'pressão atmosférica' };
    return getCorrelationInterpretation(weatherCorrelation, labelMap[weatherMetric]);
  }, [weatherCorrelation, weatherMetric]);

  // Prepared data for Sleep/Fatigue
  const sleepFatigueData = useMemo(() => {
    return logsLastMonth.map((l) => {
      const formattedDate = l.date.split('-').slice(2).join('/') + '/' + l.date.split('-')[1];
      return {
        date: formattedDate,
        rawDate: l.date,
        pain: l.pain ?? 0,
        sleep: l.sleep ?? 0,
        fatigue: l.fatigue ?? 0
      };
    });
  }, [logsLastMonth]);

  const sleepLaggedCorrelation = useMemo(() => {
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 1; i < logsLastMonth.length; i++) {
      const prevSleep = logsLastMonth[i - 1].sleep;
      const todayPain = logsLastMonth[i].pain;
      if (prevSleep != null && todayPain != null) {
        x.push(prevSleep);
        y.push(todayPain);
      }
    }
    return calcPearsonCorrelation(x, y);
  }, [logsLastMonth]);

  // Prepared data for Triggers
  const triggersPainData = useMemo(() => {
    return logsLastMonth.map((l) => {
      const formattedDate = l.date.split('-').slice(2).join('/') + '/' + l.date.split('-')[1];
      const triggersCount = l.triggers ? l.triggers.length : 0;
      return {
        date: formattedDate,
        rawDate: l.date,
        pain: l.pain ?? 0,
        triggersCount
      };
    });
  }, [logsLastMonth]);

  const triggersCorrelation = useMemo(() => {
    const x = triggersPainData.map((d) => d.triggersCount);
    const y = triggersPainData.map((d) => d.pain);
    return calcPearsonCorrelation(x, y);
  }, [triggersPainData]);

  // Lagged Physical Load Data
  const physicalLoadLagData = useMemo(() => {
    const data = [];
    for (let i = 1; i < logsLastMonth.length; i++) {
      const prevLog = logsLastMonth[i - 1];
      const todayLog = logsLastMonth[i];
      if (todayLog.pain != null) {
        const formattedDate = todayLog.date.split('-').slice(2).join('/') + '/' + todayLog.date.split('-')[1];
        data.push({
          date: formattedDate,
          rawDate: todayLog.date,
          todayPain: todayLog.pain,
          prevLoadVal: getLoadValue(prevLog.activityLoad),
          prevLoadText: prevLog.activityLoad || 'Não informado'
        });
      }
    }
    return data;
  }, [logsLastMonth]);

  const physicalLoadCorrelation = useMemo(() => {
    const x: number[] = [];
    const y: number[] = [];
    physicalLoadLagData.forEach((d) => {
      if (d.prevLoadVal !== null && d.todayPain !== null) {
        x.push(d.prevLoadVal);
        y.push(d.todayPain);
      }
    });
    return calcPearsonCorrelation(x, y);
  }, [physicalLoadLagData]);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header - Clean Light/Dark Adaptive Theme */}
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border border-teal-200 dark:border-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            PAINEL DE PADRÕES E RITMO DA DOR • RITMMA
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-poppins text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Acompanhamento de Oscilação & Padrões
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-2xl leading-relaxed">
            Gráficos interativos para você entender as variações da sua dor e correlacionar com dados de sono, clima e rotina.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3 bg-teal-50/60 dark:bg-slate-800/60 p-3 px-4 rounded-2xl border border-teal-100 dark:border-slate-700 z-10">
          <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Estabilidade do Ritmo</span>
            <strong className="text-lg text-teal-700 dark:text-teal-300 font-black">{ritmmaScore}%</strong>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION (Clean, minimal pills) */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl flex flex-wrap sm:flex-nowrap gap-1 border border-slate-200/60 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-lg font-poppins font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          Visão 360°
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('influences')}
          className={`flex-1 py-2 px-3 rounded-lg font-poppins font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'influences'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          Fatores Influenciadores
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fullCharts')}
          className={`flex-1 py-2 px-3 rounded-lg font-poppins font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'fullCharts'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          Análise Multidimensional
        </button>
      </div>

      {/* TAB 1: VISÃO RÁPIDA & RITMO */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* FEATURED HERO CHART: RITMMA CONTINUOUS WAVE RHYTHM CHART (FIRST) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#1FBCC4] via-[#3975E3] to-[#9251E5]" />
                  <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Mapa 360°: Evolução Multidimensional da Sua Saúde
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Visualização interativa das suas oscilações de dor, sintomas e hábitos em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Picos de Dor
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedChart('ritmmaWave')}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-teal-400"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-teal-100" /> Ampliar Gráfico
                </button>
              </div>
            </div>

            {/* PARAMETER COMPLEXITY TOGGLES (Adicionar novos parâmetros dinamicamente) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#062B63] dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#1FBCC4]" />
                  Camadas de Complexidade (Toque para adicionar novos parâmetros ao gráfico):
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Combinação Personalizada
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={waveLayers.fatigue}
                  onClick={() => toggleWaveLayer('fatigue')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#3975E3] ${
                    waveLayers.fatigue
                      ? 'bg-[#3975E3] text-white shadow-xs ring-2 ring-[#3975E3]/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#3975E3]'
                  }`}
                >
                  {waveLayers.fatigue ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#3975E3]" />
                  )}
                  <span>Fadiga</span>
                  <span className="text-[10px] opacity-80">{waveLayers.fatigue ? '✓' : ''}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={waveLayers.sleep}
                  onClick={() => toggleWaveLayer('sleep')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#1FBCC4] ${
                    waveLayers.sleep
                      ? 'bg-[#1FBCC4] text-white shadow-xs ring-2 ring-[#1FBCC4]/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#1FBCC4]'
                  }`}
                >
                  {waveLayers.sleep ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#1FBCC4]" />
                  )}
                  <span>Sono</span>
                  <span className="text-[10px] opacity-80">{waveLayers.sleep ? '✓' : ''}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={waveLayers.weather}
                  onClick={() => toggleWaveLayer('weather')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                    waveLayers.weather
                      ? 'bg-cyan-600 text-white shadow-xs ring-2 ring-cyan-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {waveLayers.weather ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  )}
                  <span>Clima (°C)</span>
                  <span className="text-[10px] opacity-80">{waveLayers.weather ? '✓' : ''}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={waveLayers.triggers}
                  onClick={() => toggleWaveLayer('triggers')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#9251E5] ${
                    waveLayers.triggers
                      ? 'bg-[#9251E5] text-white shadow-xs ring-2 ring-[#9251E5]/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#9251E5]'
                  }`}
                >
                  {waveLayers.triggers ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#9251E5]" />
                  )}
                  <span>Gatilhos</span>
                  <span className="text-[10px] opacity-80">{waveLayers.triggers ? '✓' : ''}</span>
                </button>
              </div>
            </div>

            {/* Main Wave Chart */}
            <div className="w-full h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ritmmaWaveData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                  <RITMMAChartDefs />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(135,149,170,0.15)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8795AA' }} />
                  <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8795AA' }} />
                  {waveLayers.weather && (
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#0284C7' }} />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1FBCC4',
                      borderRadius: '16px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(6,43,99,0.3)'
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'temp' ? `${value}°C` : name === 'triggersCount' ? `${value} gatilhos` : `${value} / 10`,
                      name === 'pain' ? 'Nível de Dor' : name === 'fatigue' ? 'Fadiga' : name === 'sleep' ? 'Sono' : name === 'temp' ? 'Temperatura' : name === 'triggersCount' ? 'Gatilhos Ativos' : name
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="pain"
                    name="Nível de Dor"
                    stroke="url(#ritmmaGradient)"
                    strokeWidth={4}
                    fill="url(#ritmmaAreaFill)"
                    dot={<RITMMAPeakDot data={ritmmaWaveData} dataKey="pain" />}
                    activeDot={{ r: 8, fill: '#9251E5', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                  {waveLayers.fatigue && (
                    <Line
                      type="monotone"
                      dataKey="fatigue"
                      name="Fadiga"
                      stroke="#3975E3"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  )}
                  {waveLayers.sleep && (
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      name="Qualidade do Sono"
                      stroke="#1FBCC4"
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      dot={{ r: 3 }}
                    />
                  )}
                  {waveLayers.weather && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="temp"
                      name="Temperatura (°C)"
                      stroke="#062B63"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {waveLayers.triggers && (
                    <Bar
                      dataKey="triggersCount"
                      name="Qtd. Gatilhos"
                      fill="#9251E5"
                      opacity={0.35}
                      barSize={12}
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Tactile & Accessible Legend Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#1FBCC4] flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">ONDA PRINCIPAL</span>
                  <strong className="text-slate-800 dark:text-slate-200">Curva de Dor (0-10)</strong>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#9251E5] flex items-center justify-center shrink-0">
                  <Zap className="w-2.5 h-2.5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">DESTAQUE VISUAL</span>
                  <strong className="text-slate-800 dark:text-slate-200">Picos Mais Intensos</strong>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#3975E3] flex items-center justify-center shrink-0">
                  <Sliders className="w-2.5 h-2.5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">CAMADAS ATIVAS</span>
                  <strong className="text-slate-800 dark:text-slate-200">Tracejados Diferenciados</strong>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#062B63] flex items-center justify-center shrink-0">
                  <Award className="w-2.5 h-2.5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">REFERÊNCIA</span>
                  <strong className="text-slate-800 dark:text-slate-200">Escala Padronizada</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Highlights Grid (SECOND) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Média da Dor Recente</span>
                <strong className="text-lg font-black text-slate-800 dark:text-slate-100">{averagePain} / 10</strong>
                <span className="text-[10px] text-slate-400 block">Últimos 30 dias</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Pico Mais Intenso</span>
                <strong className="text-lg font-black text-slate-800 dark:text-slate-100">{maxPainPeak.pain} / 10</strong>
                <span className="text-[10px] text-slate-400 block">Registrado em {maxPainPeak.date}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Estabilidade do Ritmo</span>
                <strong className="text-lg font-black text-slate-800 dark:text-slate-100">{ritmmaScore} %</strong>
                <span className="text-[10px] text-slate-400 block">Menos variação = Mais conforto</span>
              </div>
            </div>
          </div>

          {/* Patient Practical Guidance Card */}
          <div className="bg-teal-50/50 dark:bg-slate-900/50 border border-teal-200/80 dark:border-teal-800/40 p-5 rounded-3xl space-y-3">
            <h4 className="font-poppins font-bold text-sm text-teal-900 dark:text-teal-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Como entender seu gráfico no dia a dia?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <strong className="text-slate-800 dark:text-slate-100 font-bold block">1. A Onda de Dor</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mostra visualmente seus dias mais confortáveis e seus momentos de crise de forma simples.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <strong className="text-slate-800 dark:text-slate-100 font-bold block">2. Picos Violeta</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Destacam os dias em que a dor atingiu os valores mais altos da escala (pontos de atenção).
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <strong className="text-slate-800 dark:text-slate-100 font-bold block">3. Próximo Passo</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Acesse a aba <strong>"Fatores Influenciadores"</strong> para ver como clima e sono impactam seu corpo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: O QUE INFLUENCIA MINHA DOR? */}
      {activeTab === 'influences' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
            <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Fatores que Influenciam Seus Sintomas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O diário analisa o que aconteceu nos seus dias para mostrar quais elementos ambientais ou de hábitos parecem estar associados às suas oscilações de dor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* INFLUENCE CARD 1: CLIMA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-4 hover:border-teal-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                    <CloudSun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">1. Clima & Temperatura</h4>
                    <span className="text-[10px] text-slate-400 block">Variação do tempo no dia a dia</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedChart('weather')}
                  className="py-1 px-3 text-xs font-bold text-[#1FBCC4] bg-[#1FBCC4]/10 hover:bg-[#1FBCC4]/20 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Explorar
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Sensibilidade Climática:</span>
                  <span className="text-[#1FBCC4]">
                    {Math.abs(weatherCorrelation) >= 0.5 ? 'Alta Sensibilidade' : 'Efeito Discreto'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {weatherInterpretation.title}. Mudanças de temperatura ou umidade do ar frequentemente afetam a rigidez articular.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px]">Mudar variável:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setWeatherMetric('temp')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      weatherMetric === 'temp'
                        ? 'bg-[#1FBCC4] text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Temperatura
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeatherMetric('humidity')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      weatherMetric === 'humidity'
                        ? 'bg-[#3975E3] text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Umidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeatherMetric('pressure')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      weatherMetric === 'pressure'
                        ? 'bg-[#9251E5] text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Pressão
                  </button>
                </div>
              </div>
            </div>

            {/* INFLUENCE CARD 2: SONO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-4 hover:border-[#3975E3] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#3975E3]/10 text-[#3975E3] flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#062B63] dark:text-slate-100">2. Sono da Noite Anterior</h4>
                    <span className="text-[10px] text-slate-400 block">Efeito da noite de sono na dor do dia seguinte</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedChart('sleep')}
                  className="py-1 px-3 text-xs font-bold text-[#3975E3] bg-[#3975E3]/10 hover:bg-[#3975E3]/20 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Explorar
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Efeito Protetor do Sono:</span>
                  <span className="text-[#3975E3]">
                    {sleepLaggedCorrelation <= -0.3 ? 'Protetor Significativo' : 'Efeito Neutro'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Uma boa noite de descanso reparador atua como moderador neurológico, diminuindo a percepção de dor no dia seguinte.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Análise de Defasagem (Lag-1)</span>
                <span className="font-bold text-[#3975E3]">Sono Ontem → Dor Hoje</span>
              </div>
            </div>

            {/* INFLUENCE CARD 3: GATILHOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-4 hover:border-[#9251E5] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#9251E5]/10 text-[#9251E5] flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#062B63] dark:text-slate-100">3. Acúmulo de Gatilhos</h4>
                    <span className="text-[10px] text-slate-400 block">Alimentação, estresse e eventos do dia</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedChart('triggers')}
                  className="py-1 px-3 text-xs font-bold text-[#9251E5] bg-[#9251E5]/10 hover:bg-[#9251E5]/20 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Explorar
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Impacto dos Gatilhos:</span>
                  <span className="text-[#9251E5]">
                    {triggersCorrelation >= 0.4 ? 'Sensível a Gatilhos' : 'Gatilhos Estáveis'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Quando múltiplos gatilhos se acumulam em um único dia (ex: estresse + má postura), a probabilidade de um pico de dor aumenta.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Relação Direta</span>
                <span className="font-bold text-[#9251E5]">Gatilhos Múltiplos → Pico</span>
              </div>
            </div>

            {/* INFLUENCE CARD 4: CARGA FÍSICA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-4 hover:border-[#1FBCC4] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1FBCC4]/10 text-[#1FBCC4] flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#062B63] dark:text-slate-100">4. Esforço Físico do Dia Anterior</h4>
                    <span className="text-[10px] text-slate-400 block">Esforço físico ou trabalho acumulado</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedChart('physicalLoad')}
                  className="py-1 px-3 text-xs font-bold text-[#1FBCC4] bg-[#1FBCC4]/10 hover:bg-[#1FBCC4]/20 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Explorar
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Sensibilidade ao Esforço:</span>
                  <span className="text-[#1FBCC4]">
                    {physicalLoadCorrelation >= 0.3 ? 'Efeito Tardio Detectado' : 'Boa Tolerância'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Avalia se esforços físicos excessivos no dia anterior causam sintomas de "ressaca articular" ou dor tardia no dia seguinte.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Efeito Tardio</span>
                <span className="font-bold text-[#1FBCC4]">Esforço Ontem → Dor Hoje</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RELATÓRIO COMPLETO PARA O MÉDICO */}
      {activeTab === 'fullCharts' && (
        <div className="space-y-6 animate-fade-in">
          {/* 2x2 MAIN CHARTS GRID WITH RITMMA STYLING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CHART CARD 1: CLIMA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-[#1FBCC4] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-poppins font-bold text-sm text-[#062B63] dark:text-slate-100 flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-[#1FBCC4]" />
                    Clima vs. Dor Crônica
                  </h3>
                  <button
                    type="button"
                    onClick={() => setExpandedChart('weather')}
                    className="py-1 px-2.5 text-[11px] font-bold text-[#1FBCC4] dark:text-[#24C4D1] bg-[#1FBCC4]/10 hover:bg-[#1FBCC4]/20 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" /> Ampliar
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Variável climática ativa:
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setWeatherMetric('temp')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        weatherMetric === 'temp'
                          ? 'bg-[#1FBCC4] text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Temp.
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeatherMetric('humidity')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        weatherMetric === 'humidity'
                          ? 'bg-[#3975E3] text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Umid.
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeatherMetric('pressure')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        weatherMetric === 'pressure'
                          ? 'bg-[#9251E5] text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Pressão
                    </button>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setExpandedChart('weather')}
                className="w-full h-56 cursor-pointer group relative"
                title="Clique para ampliar o gráfico de clima"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weatherData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <RITMMAChartDefs />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(135,149,170,0.15)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#8795AA' }} />
                    <YAxis yAxisId="left" domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#1FBCC4' }} />
                    <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#3975E3' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#062B63',
                        borderColor: '#1FBCC4',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '11px'
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="pain" name="Nível de Dor" stroke="url(#ritmmaGradient)" strokeWidth={2.5} fill="url(#ritmmaTurquoiseFill)" dot={<RITMMAPeakDot data={weatherData} dataKey="pain" />} />
                    <Line yAxisId="right" type="monotone" dataKey={weatherMetric} name={weatherMetric === 'temp' ? 'Temp (°C)' : weatherMetric === 'humidity' ? 'Umidade (%)' : 'Pressão (hPa)'} stroke={weatherMetric === 'temp' ? '#1FBCC4' : weatherMetric === 'humidity' ? '#3975E3' : '#9251E5'} strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-3 rounded-2xl border text-xs ${weatherInterpretation.bgClass} flex items-center justify-between gap-2`}>
                <span className={`font-semibold text-[11px] ${weatherInterpretation.colorClass} truncate`}>
                  {weatherInterpretation.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">r = {weatherCorrelation.toFixed(2)}</span>
              </div>
            </div>

            {/* CHART CARD 2: SONO & FADIGA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-[#3975E3] transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-poppins font-bold text-sm text-[#062B63] dark:text-slate-100 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-[#3975E3]" />
                  Sinergia: Sono, Fadiga & Dor
                </h3>
                <button
                  type="button"
                  onClick={() => setExpandedChart('sleep')}
                  className="py-1 px-2.5 text-[11px] font-bold text-[#3975E3] dark:text-[#4C7FE8] bg-[#3975E3]/10 hover:bg-[#3975E3]/20 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Ampliar
                </button>
              </div>

              <div
                onClick={() => setExpandedChart('sleep')}
                className="w-full h-56 cursor-pointer group relative"
                title="Clique para ampliar o gráfico de sono e fadiga"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sleepFatigueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <RITMMAChartDefs />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(135,149,170,0.15)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#8795AA' }} />
                    <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#8795AA' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#062B63',
                        borderColor: '#3975E3',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '11px'
                      }}
                    />
                    <Area type="monotone" dataKey="pain" name="Dor" stroke="url(#ritmmaGradient)" strokeWidth={2.5} fill="url(#ritmmaAreaFill)" dot={<RITMMAPeakDot data={sleepFatigueData} dataKey="pain" />} />
                    <Area type="monotone" dataKey="fatigue" name="Fadiga" stroke="#9251E5" strokeWidth={1.5} fill="url(#ritmmaVioletFill)" />
                    <Line type="monotone" dataKey="sleep" name="Qualidade Sono" stroke="#3975E3" strokeWidth={2} dot={{ r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-[#3975E3]/10 border border-[#3975E3]/30 rounded-2xl text-xs flex items-center justify-between gap-2">
                <span className="font-semibold text-[11px] text-[#062B63] dark:text-[#4C7FE8] truncate">
                  Efeito Lag de Sono (Noite anterior vs Dor de hoje): r = {sleepLaggedCorrelation.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#3975E3] font-bold shrink-0">Lag-1</span>
              </div>
            </div>

            {/* CHART CARD 3: GATILHOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-[#9251E5] transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-poppins font-bold text-sm text-[#062B63] dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#9251E5]" />
                  Acúmulo de Gatilhos vs. Picos de Dor
                </h3>
                <button
                  type="button"
                  onClick={() => setExpandedChart('triggers')}
                  className="py-1 px-2.5 text-[11px] font-bold text-[#9251E5] dark:text-[#9854E8] bg-[#9251E5]/10 hover:bg-[#9251E5]/20 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Ampliar
                </button>
              </div>

              <div
                onClick={() => setExpandedChart('triggers')}
                className="w-full h-56 cursor-pointer group relative"
                title="Clique para ampliar o gráfico de gatilhos"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={triggersPainData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <RITMMAChartDefs />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(135,149,170,0.15)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#8795AA' }} />
                    <YAxis yAxisId="left" domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#1FBCC4' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#9251E5' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#062B63',
                        borderColor: '#9251E5',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '11px'
                      }}
                    />
                    <Bar yAxisId="right" dataKey="triggersCount" name="Nº Gatilhos" fill="#9251E5" opacity={0.6} radius={[4, 4, 0, 0]} maxBarSize={25} />
                    <Line yAxisId="left" type="monotone" dataKey="pain" name="Nível de Dor" stroke="url(#ritmmaGradient)" strokeWidth={3} dot={<RITMMAPeakDot data={triggersPainData} dataKey="pain" />} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-[#9251E5]/10 border border-[#9251E5]/30 rounded-2xl text-xs flex items-center justify-between gap-2">
                <span className="font-semibold text-[11px] text-[#062B63] dark:text-[#9854E8] truncate">
                  Sensibilidade aos Gatilhos: r = +{triggersCorrelation.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#9251E5] font-bold shrink-0">Gatilhos Múltiplos</span>
              </div>
            </div>

            {/* CHART CARD 4: CARGA FÍSICA (LAG) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-[#1FBCC4] transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-poppins font-bold text-sm text-[#062B63] dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1FBCC4]" />
                  Carga Física de Ontem vs Dor de Hoje
                </h3>
                <button
                  type="button"
                  onClick={() => setExpandedChart('physicalLoad')}
                  className="py-1 px-2.5 text-[11px] font-bold text-[#1FBCC4] dark:text-[#24C4D1] bg-[#1FBCC4]/10 hover:bg-[#1FBCC4]/20 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Ampliar
                </button>
              </div>

              <div
                onClick={() => setExpandedChart('physicalLoad')}
                className="w-full h-56 cursor-pointer group relative"
                title="Clique para ampliar o gráfico de carga física"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={physicalLoadLagData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <RITMMAChartDefs />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(135,149,170,0.15)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#8795AA' }} />
                    <YAxis yAxisId="left" domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#1FBCC4' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[1, 4]} ticks={[1, 2, 3, 4]} tickLine={false} axisLine={false} tick={{ fontSize: 8, fill: '#3975E3' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#062B63',
                        borderColor: '#1FBCC4',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '11px'
                      }}
                    />
                    <Bar yAxisId="right" dataKey="prevLoadVal" name="Esforço Ontem" fill="#1FBCC4" opacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={25} />
                    <Line yAxisId="left" type="monotone" dataKey="todayPain" name="Dor Hoje" stroke="url(#ritmmaGradient)" strokeWidth={3} dot={<RITMMAPeakDot data={physicalLoadLagData} dataKey="todayPain" />} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-[#1FBCC4]/10 border border-[#1FBCC4]/30 rounded-2xl text-xs flex items-center justify-between gap-2">
                <span className="font-semibold text-[11px] text-[#062B63] dark:text-[#24C4D1] truncate">
                  Efeito Ressaca Física (Lag): r = {physicalLoadCorrelation >= 0 ? '+' : ''}{physicalLoadCorrelation.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#1FBCC4] font-bold shrink-0">Sobrecarga Tardia</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED MODAL FOR DETAILED ANALYSIS & OPTIONS */}
      {expandedChart && (
        <ExpandedChartModal
          type={expandedChart}
          logs={logs}
          onClose={() => setExpandedChart(null)}
        />
      )}
    </div>
  );
};

/* ====================================================================
 * EXPANDED MODAL COMPONENT (WITH TIMEFRAME SELECTOR, CHART TYPES & EXPANDED OPTIONS)
 * ==================================================================== */

interface ExpandedChartModalProps {
  type: 'ritmmaWave' | 'weather' | 'sleep' | 'triggers' | 'physicalLoad';
  logs: DailyLog[];
  onClose: () => void;
}

const ExpandedChartModal: React.FC<ExpandedChartModalProps> = ({ type, logs, onClose }) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | '60' | '90' | 'all'>('30');
  const [selectedWeatherMetric, setSelectedWeatherMetric] = useState<'temp' | 'humidity' | 'pressure'>('temp');
  const [selectedTriggerFilter, setSelectedTriggerFilter] = useState<string>('all');
  const [copiedReport, setCopiedReport] = useState(false);
  const [showAlgorithmHelp, setShowAlgorithmHelp] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(true);

  // Modal Wave Layers State
  const [modalWaveLayers, setModalWaveLayers] = useState<{
    fatigue: boolean;
    sleep: boolean;
    weather: boolean;
    triggers: boolean;
  }>({
    fatigue: true,
    sleep: false,
    weather: false,
    triggers: false
  });

  const toggleModalWaveLayer = (layer: keyof typeof modalWaveLayers) => {
    setModalWaveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Filter logs based on selected time range
  const filteredLogs = useMemo(() => {
    const sorted = [...logs]
      .filter((l) => l.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (timeRange === 'all') return sorted;
    const numDays = Number(timeRange);
    return sorted.slice(-numDays);
  }, [logs, timeRange]);

  // Derived dataset based on modal type
  const chartData = useMemo(() => {
    return filteredLogs.map((l) => {
      const formattedDate = l.date.split('-').slice(2).join('/') + '/' + l.date.split('-')[1];
      const triggersCount = l.triggers ? l.triggers.length : 0;
      const hasSelectedTrigger = selectedTriggerFilter === 'all' || (l.triggers && l.triggers.includes(selectedTriggerFilter));

      return {
        date: formattedDate,
        rawDate: l.date,
        pain: l.pain ?? 0,
        sleep: l.sleep ?? 0,
        fatigue: l.fatigue ?? 0,
        function: l.function ?? 0,
        temp: l.weather?.temp ?? null,
        humidity: l.weather?.humidity ?? null,
        pressure: l.weather?.pressure ?? null,
        triggersCount,
        hasSelectedTrigger,
        loadVal: getLoadValue(l.activityLoad)
      };
    });
  }, [filteredLogs, selectedTriggerFilter]);

  // Lagged datasets
  const laggedSleepData = useMemo(() => {
    const pts = [];
    for (let i = 1; i < filteredLogs.length; i++) {
      const prev = filteredLogs[i - 1];
      const today = filteredLogs[i];
      if (prev.sleep != null && today.pain != null) {
        pts.push({
          date: today.date.split('-').slice(2).join('/') + '/' + today.date.split('-')[1],
          prevSleep: prev.sleep,
          todayPain: today.pain
        });
      }
    }
    return pts;
  }, [filteredLogs]);

  const laggedPhysicalData = useMemo(() => {
    const pts = [];
    for (let i = 1; i < filteredLogs.length; i++) {
      const prev = filteredLogs[i - 1];
      const today = filteredLogs[i];
      if (today.pain != null) {
        pts.push({
          date: today.date.split('-').slice(2).join('/') + '/' + today.date.split('-')[1],
          prevLoadVal: getLoadValue(prev.activityLoad),
          todayPain: today.pain
        });
      }
    }
    return pts;
  }, [filteredLogs]);

  // Stats calculation
  const stats = useMemo(() => {
    if (type === 'ritmmaWave') {
      const y = chartData.map((d) => d.pain);
      const avgPain = y.length ? (y.reduce((a, b) => a + b, 0) / y.length).toFixed(1) : '0';
      const maxPain = y.length ? Math.max(...y) : 0;
      return { r: 1.0, r2: 100, reg: { m: 0, b: 0 }, count: chartData.length, avgPain, maxPain };
    }

    if (type === 'weather') {
      const valid = chartData.filter((d) => d[selectedWeatherMetric] !== null);
      const x = valid.map((d) => d[selectedWeatherMetric] as number);
      const y = valid.map((d) => d.pain);
      const r = calcPearsonCorrelation(x, y);
      const r2 = Math.pow(r, 2) * 100;
      const reg = calcLinearRegression(x, y);
      const avgPain = y.length ? (y.reduce((a, b) => a + b, 0) / y.length).toFixed(1) : '0';
      return { r, r2, reg, count: valid.length, avgPain };
    }

    if (type === 'sleep') {
      const x = laggedSleepData.map((d) => d.prevSleep);
      const y = laggedSleepData.map((d) => d.todayPain);
      const r = calcPearsonCorrelation(x, y);
      const r2 = Math.pow(r, 2) * 100;
      const reg = calcLinearRegression(x, y);
      const avgPain = y.length ? (y.reduce((a, b) => a + b, 0) / y.length).toFixed(1) : '0';
      return { r, r2, reg, count: laggedSleepData.length, avgPain };
    }

    if (type === 'triggers') {
      const x = chartData.map((d) => d.triggersCount);
      const y = chartData.map((d) => d.pain);
      const r = calcPearsonCorrelation(x, y);
      const r2 = Math.pow(r, 2) * 100;
      const reg = calcLinearRegression(x, y);
      const avgPain = y.length ? (y.reduce((a, b) => a + b, 0) / y.length).toFixed(1) : '0';
      return { r, r2, reg, count: chartData.length, avgPain };
    }

    // physicalLoad
    const valid = laggedPhysicalData.filter((d) => d.prevLoadVal !== null);
    const x = valid.map((d) => d.prevLoadVal as number);
    const y = valid.map((d) => d.todayPain);
    const r = calcPearsonCorrelation(x, y);
    const r2 = Math.pow(r, 2) * 100;
    const reg = calcLinearRegression(x, y);
    const avgPain = y.length ? (y.reduce((a, b) => a + b, 0) / y.length).toFixed(1) : '0';
    return { r, r2, reg, count: valid.length, avgPain };
  }, [type, chartData, laggedSleepData, laggedPhysicalData, selectedWeatherMetric]);

  const handleCopyReport = () => {
    const text = `LAUDO BIOCLÍNICO RITMMA:\n- Período Analisado: ${timeRange} dias (${stats.count} registros)\n- Média da Dor: ${stats.avgPain}/10\n- Coeficiente Pearson (r): ${stats.r >= 0 ? '+' : ''}${stats.r.toFixed(2)}\n- Força Explicativa (R²): ${stats.r2.toFixed(1)}%\n- Conclusão: Padrão de oscilação monitorado pela curva contínua RITMMA.`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const modalTitle =
    type === 'ritmmaWave'
      ? 'Análise Rítmica da Dor (Curva Contínua RITMMA)'
      : type === 'weather'
      ? 'Análise Avançada: Sensibilidade Climática x Dor'
      : type === 'sleep'
      ? 'Análise Avançada: Sono & Fadiga vs Dor (Efeito Lag-1)'
      : type === 'triggers'
      ? 'Análise Avançada: Acúmulo de Gatilhos vs Picos de Dor'
      : 'Análise Avançada: Carga Física de Ontem vs Dor de Hoje';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#062B63] text-white flex items-center justify-between border-b border-[#1FBCC4]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1FBCC4]/20 border border-[#1FBCC4]/40 flex items-center justify-center text-[#1FBCC4]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-poppins text-white">{modalTitle}</h2>
              <p className="text-xs text-slate-300">
                Acompanhamento clínico RITMMA • {stats.count} dias válidos no recorte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Controls Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1FBCC4]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Período:</span>
              <div className="flex gap-1 flex-wrap">
                {(['7', '14', '30', '60', '90', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      timeRange === range
                        ? 'bg-[#062B63] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {range === 'all' ? 'Tudo' : `${range}d`}
                  </button>
                ))}
              </div>
            </div>

            {type === 'ritmmaWave' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Sliders className="w-4 h-4 text-[#1FBCC4]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Camadas do RITMMA:</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleModalWaveLayer('fatigue')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                      modalWaveLayers.fatigue ? 'bg-[#3975E3] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {modalWaveLayers.fatigue ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    Fadiga
                  </button>                  <button
                    type="button"
                    onClick={() => toggleModalWaveLayer('sleep')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                      modalWaveLayers.sleep ? 'bg-[#1FBCC4] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {modalWaveLayers.sleep ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    Sono
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleModalWaveLayer('weather')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                      modalWaveLayers.weather ? 'bg-[#062B63] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {modalWaveLayers.weather ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    Clima
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleModalWaveLayer('triggers')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                      modalWaveLayers.triggers ? 'bg-[#9251E5] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {modalWaveLayers.triggers ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    Gatilhos
                  </button>
                </div>
              </div>
            )}

            {type === 'weather' && (
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-[#1FBCC4]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Métrica:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedWeatherMetric('temp')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedWeatherMetric === 'temp' ? 'bg-[#1FBCC4] text-white' : 'bg-white dark:bg-slate-900 text-slate-600'
                    }`}
                  >
                    Temp
                  </button>
                  <button
                    onClick={() => setSelectedWeatherMetric('humidity')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedWeatherMetric === 'humidity' ? 'bg-[#3975E3] text-white' : 'bg-white dark:bg-slate-900 text-slate-600'
                    }`}
                  >
                    Umidade
                  </button>
                  <button
                    onClick={() => setSelectedWeatherMetric('pressure')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedWeatherMetric === 'pressure' ? 'bg-[#9251E5] text-white' : 'bg-white dark:bg-slate-900 text-slate-600'
                    }`}
                  >
                    Pressão
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Main Chart Render */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <RITMMAChartDefs />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(135,149,170,0.15)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8795AA' }} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8795AA' }} />
                {type === 'ritmmaWave' && modalWaveLayers.weather && (
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#062B63' }} />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#062B63',
                    borderColor: '#1FBCC4',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'temp' ? `${value}°C` : name === 'triggersCount' ? `${value} gatilhos` : `${value} / 10`,
                    name === 'pain' ? 'Nível de Dor' : name === 'fatigue' ? 'Fadiga' : name === 'sleep' ? 'Sono' : name === 'temp' ? 'Temperatura' : name === 'triggersCount' ? 'Gatilhos' : name
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="pain"
                  name="Nível de Dor"
                  stroke="url(#ritmmaGradient)"
                  strokeWidth={3.5}
                  fill="url(#ritmmaAreaFill)"
                  dot={<RITMMAPeakDot data={chartData} dataKey="pain" />}
                />
                {type === 'sleep' && (
                  <Line type="monotone" dataKey="sleep" name="Sono" stroke="#3975E3" strokeWidth={2} dot={{ r: 3 }} />
                )}
                {type === 'ritmmaWave' && modalWaveLayers.fatigue && (
                  <Line type="monotone" dataKey="fatigue" name="Fadiga" stroke="#3975E3" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                )}
                {type === 'ritmmaWave' && modalWaveLayers.sleep && (
                  <Line type="monotone" dataKey="sleep" name="Sono" stroke="#1FBCC4" strokeWidth={2} strokeDasharray="2 2" dot={{ r: 3 }} />
                )}
                {type === 'ritmmaWave' && modalWaveLayers.weather && (
                  <Line yAxisId="right" type="monotone" dataKey="temp" name="Temperatura (°C)" stroke="#062B63" strokeWidth={2} dot={{ r: 3 }} />
                )}
                {type === 'ritmmaWave' && modalWaveLayers.triggers && (
                  <Bar dataKey="triggersCount" name="Qtd. Gatilhos" fill="#9251E5" opacity={0.35} barSize={12} radius={[4, 4, 0, 0]} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Statistical Parameters Panel Toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowStatsDetail(!showStatsDetail)}
              className="w-full p-4 bg-[#062B63] hover:bg-[#06275A] text-white rounded-2xl font-poppins font-bold text-xs sm:text-sm flex items-center justify-between shadow-md transition-all cursor-pointer border border-[#1FBCC4]/30 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#1FBCC4]" />
                <span>Parâmetros Estatísticos Detalhados (Análise Reumatológica / Médica)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-normal text-slate-300 hidden sm:inline">
                  {showStatsDetail ? 'Ocultar Parâmetros' : 'Exibir Detalhes (r, R², p-valor, Lag, N)'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#1FBCC4] transition-transform duration-200 ${showStatsDetail ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showStatsDetail && (
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-[#1FBCC4]/30 rounded-2xl space-y-4 animate-fade-in shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <h4 className="font-poppins font-bold text-sm text-[#062B63] dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#1FBCC4]" />
                      Painel de Parâmetros Estatísticos RITMMA
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Métricas biométricas e paramétricas derivadas da sua série temporal.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#1FBCC4]/20 text-[#062B63] dark:text-[#24C4D1] px-3 py-1 rounded-full border border-[#1FBCC4]/30 self-start sm:self-auto">
                    Amostra Total N = {stats.count} dias
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pearson (r)</span>
                    <strong className="text-lg font-mono font-black text-[#062B63] dark:text-slate-100 block">
                      {stats.r >= 0 ? '+' : ''}{stats.r.toFixed(3)}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      {Math.abs(stats.r) >= 0.6 ? 'Alta Associação' : Math.abs(stats.r) >= 0.3 ? 'Associação Moderada' : 'Fraca / Nula'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Explicativa (R²)</span>
                    <strong className="text-lg font-mono font-black text-[#1FBCC4] block">
                      {stats.r2.toFixed(1)}%
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      Variação da dor explicada
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Atraso (Lag)</span>
                    <strong className="text-lg font-mono font-black text-[#3975E3] block">
                      {type === 'sleep' || type === 'physicalLoad' ? 'Lag-1 (24h)' : 'Lag-0 (Direto)'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      {type === 'sleep' || type === 'physicalLoad' ? 'Efeito diferido no tempo' : 'Sincronizado no mesmo dia'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inclinação (Slope β)</span>
                    <strong className="text-lg font-mono font-black text-[#9251E5] block">
                      β = {stats.reg ? stats.reg.m.toFixed(2) : '0.00'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      Impacto estimado por unidade
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#062B63]/5 dark:bg-slate-900/90 rounded-xl border border-[#1FBCC4]/30 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <strong className="text-[#062B63] dark:text-[#24C4D1] block font-bold">
                    💡 Conclusão bioclínica para apresentar ao médico:
                  </strong>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {type === 'ritmmaWave' && 'A curva contínua RITMMA apresenta a oscilação global da dor em resposta ao tratamento e hábitos. A estabilidade geral é calculada a partir da variabilidade diária.'}
                    {type === 'weather' && `Com r = ${stats.r.toFixed(2)} e R² = ${stats.r2.toFixed(1)}%, a dor demonstra ${Math.abs(stats.r) >= 0.4 ? 'sensibilidade climática relevante no período' : 'baixa relação direta com alterações do tempo'}.`}
                    {type === 'sleep' && `Com r = ${stats.r.toFixed(2)} (Lag-1), a qualidade do sono da noite anterior demonstra ${stats.r <= -0.3 ? 'efeito protetor nítido sobre os níveis de dor de hoje' : 'influência moderada nos sintomas do dia seguinte'}.`}
                    {type === 'triggers' && `Com r = ${stats.r.toFixed(2)}, o acúmulo de gatilhos no diário está ${stats.r >= 0.4 ? 'fortemente associado a crises de dor' : 'com impacto secundário'}.`}
                    {type === 'physicalLoad' && `Com r = ${stats.r.toFixed(2)} (Lag-1), a sobrecarga física de ontem ${stats.r >= 0.3 ? 'provoca efeito tardio na rigidez e dor de hoje' : 'demonstra boa tolerância física'}.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Algorithm & Technical Metric Explanation Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAlgorithmHelp(!showAlgorithmHelp)}
              className="w-full p-3.5 bg-[#062B63]/5 hover:bg-[#062B63]/10 dark:bg-slate-950 border border-[#1FBCC4]/30 rounded-2xl text-xs text-[#062B63] dark:text-teal-300 font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#1FBCC4]" />
                Entenda o que significam r, Lag e R² e de onde nosso algoritmo calculou estes resultados
              </span>
              <ChevronDown className={`w-4 h-4 text-[#1FBCC4] transition-transform duration-200 ${showAlgorithmHelp ? 'rotate-180' : ''}`} />
            </button>

            {showAlgorithmHelp && (
              <div className="mt-3 p-4 bg-white dark:bg-slate-950 border border-[#1FBCC4]/30 rounded-2xl space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Info className="w-4 h-4 text-[#1FBCC4]" />
                  <h4 className="font-bold text-sm text-[#062B63] dark:text-slate-100">
                    Como funciona a Matemática & Algoritmo do RITMMA
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <strong className="text-[#1FBCC4] font-bold block text-xs">1. O Coeficiente "r" (Pearson)</strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Mede se duas coisas mudam juntas no tempo (variação de -1,00 a +1,00).
                    </p>
                    <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <li>• <strong>+0.5 a +1.0:</strong> Quando o fator sobe, a dor tende a subir.</li>
                      <li>• <strong>0.0:</strong> Sem padrão direto entre as variáveis.</li>
                      <li>• <strong>-0.5 a -1.0:</strong> Efeito inverso/protetor (ex: bom sono reduz a dor).</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <strong className="text-[#3975E3] font-bold block text-xs">2. Defasagem Temporal (Lag-1)</strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      O corpo muitas vezes reage com atraso de 24h a estímulos físicos ou emocionais.
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      O cálculo de <strong>Lag-1</strong> compara os eventos de <em>ontem</em> (noite de sono anterior ou esforço físico) com o nível de dor registrado <em>hoje</em>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <strong className="text-[#9251E5] font-bold block text-xs">3. Origem do Algoritmo (R²)</strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      O motor estatístico do app roda a fórmula de <strong>Correlação Paramétrica de Pearson</strong>:
                    </p>
                    <div className="my-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] text-center text-slate-700 dark:text-slate-300">
                      r = ∑((X - X̄)(Y - Ȳ)) / √(∑(X - X̄)² ∑(Y - Ȳ)²)
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Cruzando a série histórica do seu Diário do Paciente com dados da API de meteorologia local e dados de rotina.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyReport}
            className="py-2.5 px-4 bg-[#1FBCC4] hover:bg-[#199EA5] text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            {copiedReport ? (
              <>
                <Check className="w-4 h-4" /> Laudo Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar Laudo do Gráfico
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#062B63] hover:bg-[#06275A] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Fechar Análise
          </button>
        </div>
      </div>
    </div>
  );
};
