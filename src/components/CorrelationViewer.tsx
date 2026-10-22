/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component CorrelationViewer: Dynamic 14-day correlation analysis & dual-axis visualization
 * specifically comparing weather pressure, temperature, steps, sleep, and key clinical symptoms.
 */

import React, { useState, useMemo } from 'react';
import { DailyLog } from '../types';
import { fmtDate } from '../utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { 
  TrendingUp, 
  HelpCircle, 
  Info, 
  Thermometer, 
  Droplets, 
  Activity, 
  Moon, 
  Heart, 
  Sparkles, 
  CloudSun,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface CorrelationViewerProps {
  logs: DailyLog[];
}

interface VariableOption {
  key: string;
  label: string;
  color: string;
  unit: string;
  getValue: (log: DailyLog) => number | null | undefined;
}

export const CorrelationViewer: React.FC<CorrelationViewerProps> = ({ logs }) => {
  // Sort logs by date to ensure historical order
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  // Last 14 logs
  const last14Logs = useMemo(() => {
    return sortedLogs.slice(-14);
  }, [sortedLogs]);

  // Variable options for Source/Independent (A)
  const varAOptions: Record<string, VariableOption> = {
    'weather.pressure': {
      key: 'weather.pressure',
      label: 'Pressão Atmosférica',
      color: '#06b6d4', // cyan
      unit: 'hPa',
      getValue: (l) => l.weather?.pressure
    },
    'weather.temp': {
      key: 'weather.temp',
      label: 'Temperatura Média',
      color: '#f97316', // orange
      unit: '°C',
      getValue: (l) => l.weather?.temp
    },
    'weather.humidity': {
      key: 'weather.humidity',
      label: 'Umidade do Ar',
      color: '#0284c7', // sky
      unit: '%',
      getValue: (l) => l.weather?.humidity
    },
    'wearableSync.steps': {
      key: 'wearableSync.steps',
      label: 'Passos Diários',
      color: '#10b981', // emerald
      unit: 'passos',
      getValue: (l) => l.wearableSync?.steps
    },
    'sleepHours': {
      key: 'sleepHours',
      label: 'Duração do Sono',
      color: '#8b5cf6', // violet
      unit: 'horas',
      getValue: (l) => l.wearableSync?.sleepHours || l.sleep
    },
    'stress': {
      key: 'stress',
      label: 'Nível de Estresse',
      color: '#ef4444', // red
      unit: '/10',
      getValue: (l) => l.stressWork || l.stressFamily || l.stressPersonal
    },
    'hydration': {
      key: 'hydration',
      label: 'Ingestão de Água (Hidratação)',
      color: '#0284c7', // light blue
      unit: 'ml',
      getValue: (l) => l.waterIntake
    },
    'medicationAdherence': {
      key: 'medicationAdherence',
      label: 'Aderência aos Medicamentos',
      color: '#14b8a6', // teal
      unit: '%',
      getValue: (l) => l.medicationAdherence ? (Object.values(l.medicationAdherence).filter(s => s === 'taken').length / Math.max(1, Object.keys(l.medicationAdherence).length)) * 100 : (l.forgotMedication ? 0 : 100)
    },
    'physicalActivity': {
      key: 'physicalActivity',
      label: 'Atividade Física',
      color: '#f59e0b', // amber
      unit: 'min',
      getValue: (l) => l.exercise?.duration
    },
    'wearableSync.hrv': {
      key: 'wearableSync.hrv',
      label: 'Variabilidade Cardíaca (HRV)',
      color: '#ec4899', // pink
      unit: 'ms',
      getValue: (l) => l.wearableSync?.hrv
    },
    'wearableSync.restingHeartRate': {
      key: 'wearableSync.restingHeartRate',
      label: 'Freq. Cardíaca Repouso (FCR)',
      color: '#dc2626', // dark red
      unit: 'bpm',
      getValue: (l) => l.wearableSync?.restingHeartRate
    }
  };

  // Variable options for Clinical/Outcome (B)
  const varBOptions: Record<string, VariableOption> = {
    'pain': {
      key: 'pain',
      label: 'Nível de Dor',
      color: '#f43f5e', // rose
      unit: '/10',
      getValue: (l) => l.pain
    },
    'worstPain': {
      key: 'worstPain',
      label: 'Pico de Dor',
      color: '#be123c', // dark red
      unit: '/10',
      getValue: (l) => l.worstPain
    },
    'fatigue': {
      key: 'fatigue',
      label: 'Fadiga Percebida',
      color: '#eab308', // yellow
      unit: '/10',
      getValue: (l) => l.fatigue
    },
    'stiffness': {
      key: 'stiffness',
      label: 'Rigidez Matinal',
      color: '#a855f7', // purple
      unit: '/10',
      getValue: (l) => l.stiffness
    },
    'sleep': {
      key: 'sleep',
      label: 'Qualidade do Sono',
      color: '#06b6d4', // cyan
      unit: '/10',
      getValue: (l) => l.sleep
    },
    'mood': {
      key: 'mood',
      label: 'Estado de Humor',
      color: '#10b981', // emerald
      unit: '/5',
      getValue: (l) => l.mood
    }
  };

  const [selectedVarA, setSelectedVarA] = useState<string>('weather.pressure');
  const [selectedVarB, setSelectedVarB] = useState<string>('pain');

  const varA = varAOptions[selectedVarA];
  const varB = varBOptions[selectedVarB];

  // Map 14 days data for the chart and compute Pearson correlation
  const { chartData, correlation, validPairsCount } = useMemo(() => {
    const data: any[] = [];
    const xValues: number[] = [];
    const yValues: number[] = [];

    last14Logs.forEach((log) => {
      const valA = varA.getValue(log);
      const valB = varB.getValue(log);

      const hasA = valA !== null && valA !== undefined && !isNaN(valA);
      const hasB = valB !== null && valB !== undefined && !isNaN(valB);

      data.push({
        date: fmtDate(log.date, 's'),
        [varA.label]: hasA ? Number(valA) : null,
        [varB.label]: hasB ? Number(valB) : null,
      });

      if (hasA && hasB) {
        xValues.push(Number(valA));
        yValues.push(Number(valB));
      }
    });

    // Compute Pearson correlation coefficient r
    const n = xValues.length;
    let r = 0;
    if (n >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
      for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumXX += xValues[i] * xValues[i];
        sumYY += yValues[i] * yValues[i];
      }
      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
      r = den === 0 ? 0 : num / den;
    }

    return {
      chartData: data,
      correlation: r,
      validPairsCount: n
    };
  }, [last14Logs, varA, varB]);

  // Interpret Pearson correlation coefficient
  const correlationInterpretation = useMemo(() => {
    const absR = Math.abs(correlation);
    const isPositive = correlation > 0;

    if (validPairsCount < 3) {
      return {
        level: 'Dados Insuficientes',
        desc: `Precisamos de pelo menos 3 dias de registros concomitantes contendo ambas as variáveis no período de 14 dias para calcular a correlação de forma confiável. Atualmente você tem ${validPairsCount} correspondência(s).`,
        colorClass: 'text-slate-500 dark:text-slate-400',
        bgClass: 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800'
      };
    }

    if (absR < 0.2) {
      return {
        level: 'Sem correlação linear',
        desc: `A variação de "${varA.label}" parece não influenciar de forma linear ou direta o nível de "${varB.label}" nos últimos 14 dias (r = ${correlation.toFixed(2)}).`,
        colorClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/80'
      };
    }

    if (isPositive) {
      if (absR >= 0.6) {
        return {
          level: 'Forte Correlação Positiva',
          desc: `Existe uma relação direta e marcante (r = +${correlation.toFixed(2)}): quando "${varA.label}" sobe, o indicador "${varB.label}" também tende a aumentar de forma perceptível.`,
          colorClass: 'text-rose-600 dark:text-rose-400',
          bgClass: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-150/40 dark:border-rose-900/30'
        };
      } else {
        return {
          level: 'Correlação Positiva Moderada',
          desc: `Existe uma tendência sutil (r = +${correlation.toFixed(2)}): elevações em "${varA.label}" costumam acompanhar aumentos graduais em "${varB.label}".`,
          colorClass: 'text-amber-600 dark:text-amber-400',
          bgClass: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-150/40 dark:border-amber-900/30'
        };
      }
    } else {
      if (absR >= 0.6) {
        return {
          level: 'Forte Correlação Inversa',
          desc: `Observamos um comportamento oposto claro (r = ${correlation.toFixed(2)}): quando "${varA.label}" diminui (ex: queda na temperatura ou pressão), o indicador "${varB.label}" tende a subir significativamente.`,
          colorClass: 'text-sky-600 dark:text-sky-400',
          bgClass: 'bg-sky-50/50 dark:bg-sky-950/10 border-sky-150/40 dark:border-sky-900/30'
        };
      } else {
        return {
          level: 'Correlação Inversa Moderada',
          desc: `Existe um padrão de sutil oposição (r = ${correlation.toFixed(2)}): reduções em "${varA.label}" coincidem frequentemente com elevações brandas em "${varB.label}".`,
          colorClass: 'text-teal-600 dark:text-teal-400',
          bgClass: 'bg-teal-50/50 dark:bg-teal-950/10 border-teal-150/40 dark:border-teal-900/30'
        };
      }
    }
  }, [correlation, validPairsCount, varA.label, varB.label]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5">
      
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
        <div className="space-y-1">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-teal-500" />
            Análise Avançada de Sensibilidade (Últimos 14 dias)
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
            Selecione uma variável externa (métrica do relógio ou clima) e compare com seus sintomas reumatológicos.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">14 dias retrospectivos</span>
        </div>
      </div>

      {/* Selector controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950/25 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
        
        {/* Variable A Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Variável Externa ou Fisiológica (Eixo Esquerdo Y)
          </label>
          <div className="relative">
            <select
              value={selectedVarA}
              onChange={(e) => setSelectedVarA(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
            >
              {Object.values(varAOptions).map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Variable B Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sintoma Clínico / Escala de Dor (Eixo Direito Y)
          </label>
          <div className="relative">
            <select
              value={selectedVarB}
              onChange={(e) => setSelectedVarB(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
            >
              {Object.values(varBOptions).map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Multi axis line chart container */}
      <div className="space-y-2">
        {logs.length < 3 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">Dados históricos insuficientes</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Preencha o diário de sintomas por pelo menos 3 dias para poder ver o painel de correlações.</p>
          </div>
        ) : (
          <div className="h-64 w-full pr-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800/60" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-bold"
                />
                
                {/* Axis for Variable A */}
                <YAxis 
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-bold"
                  domain={['auto', 'auto']}
                />

                {/* Axis for Variable B */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-bold"
                  domain={[0, selectedVarB === 'mood' ? 5 : 10]}
                />

                <Tooltip 
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#94a3b8', paddingBottom: '4px' }}
                />
                
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconSize={10} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={varA.label}
                  stroke={varA.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={varB.label}
                  stroke={varB.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Clinical Correlation insight block */}
      <div className={`p-4 border rounded-xl flex items-start gap-3 transition-colors duration-200 ${correlationInterpretation.bgClass}`}>
        <div className="mt-0.5">
          <Info className={`w-4 h-4 ${correlationInterpretation.colorClass}`} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className={`text-xs font-extrabold ${correlationInterpretation.colorClass}`}>
              {correlationInterpretation.level}
            </span>
            {validPairsCount >= 3 && (
              <span className="text-[10px] font-mono font-bold bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                r = {correlation >= 0 ? '+' : ''}{correlation.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {correlationInterpretation.desc}
          </p>
          {validPairsCount >= 3 && Math.abs(correlation) >= 0.2 && (
            <div className="pt-2 flex items-center gap-1.5 text-[10px] text-teal-600 dark:text-teal-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Análise computada cruzando {validPairsCount} pontos de dados diários concomitantes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
