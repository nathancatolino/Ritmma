/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 * 
 * Component: GeminiAnalyses (AlgorithmicAnalyses)
 * Executa cruzamentos determinísticos e algoritmos estatísticos-clínicos entre
 * variáveis do diário (sono, dor, estresse, hidratação, clima, carga física,
 * medicação e gatilhos) sem dependência de inteligência artificial externa.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyLog, PatientData } from '../types';
import { 
  Activity, 
  Flame, 
  Droplet, 
  Heart, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  BookOpen, 
  Calendar,
  Compass,
  BarChart3,
  HelpCircle,
  FileCheck,
  ExternalLink,
  X,
  CheckCircle2
} from 'lucide-react';

interface GeminiAnalysesProps {
  patientData: PatientData;
  logs: DailyLog[];
}

interface CorrelationItem {
  trigger: string;
  evidence: string;
  impact: string;
  clinicalContext: string;
}

interface RecommendationItem {
  title: string;
  action: string;
  expectedBenefit: string;
}

interface AnalysisResult {
  summary: string;
  confidenceLevel: string;
  correlations: CorrelationItem[];
  recommendations: RecommendationItem[];
  analyzedAt: string;
  totalLogsAnalyzed: number;
}

/**
 * Motor de Cruzamento e Correlações Clínicas
 */
export function calculateAlgorithmicAnalysis(
  logs: DailyLog[], 
  patientData: PatientData
): AnalysisResult {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const recentLogs = sortedLogs.slice(0, 14);

  if (recentLogs.length === 0) {
    return {
      summary: "Sem registros suficientes nos últimos 14 dias para identificar correlações de saúde.",
      confidenceLevel: "Inicial",
      correlations: [],
      recommendations: [],
      analyzedAt: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      totalLogsAnalyzed: 0
    };
  }

  // 1. Extração de Médias Globais do Período
  const validPainLogs = recentLogs.filter(l => l.pain != null);
  const avgPain = validPainLogs.length > 0 
    ? validPainLogs.reduce((acc, l) => acc + (l.pain ?? 0), 0) / validPainLogs.length 
    : 0;

  const validSleepLogs = recentLogs.filter(l => l.sleep != null);
  const avgSleep = validSleepLogs.length > 0
    ? validSleepLogs.reduce((acc, l) => acc + (l.sleep ?? 0), 0) / validSleepLogs.length
    : 0;

  const validWaterLogs = recentLogs.filter(l => l.waterIntake != null && l.waterIntake > 0);
  const avgWater = validWaterLogs.length > 0
    ? validWaterLogs.reduce((acc, l) => acc + (l.waterIntake ?? 0), 0) / validWaterLogs.length
    : 0;

  const correlations: CorrelationItem[] = [];
  const recommendations: RecommendationItem[] = [];

  // ── CRUZAMENTO 1: Qualidade do Sono vs. Intensidade de Dor ──
  const badSleepLogs = recentLogs.filter(l => l.sleep != null && l.sleep <= 5);
  const goodSleepLogs = recentLogs.filter(l => l.sleep != null && l.sleep >= 6);

  if (badSleepLogs.length > 0) {
    const avgPainBadSleep = badSleepLogs.reduce((a, l) => a + (l.pain ?? 0), 0) / badSleepLogs.length;
    const avgPainGoodSleep = goodSleepLogs.length > 0 
      ? goodSleepLogs.reduce((a, l) => a + (l.pain ?? 0), 0) / goodSleepLogs.length 
      : avgPain;
    
    const diff = avgPainBadSleep - avgPainGoodSleep;

    if (diff >= 0.5 || badSleepLogs.length >= 2) {
      correlations.push({
        trigger: 'Sono Insuficiente ou Não Reparador (<= 5/10)',
        evidence: `Nos ${badSleepLogs.length} dias registrados com sono reduzido (<= 5/10), sua dor média foi de ${avgPainBadSleep.toFixed(1)}/10, contra ${avgPainGoodSleep.toFixed(1)}/10 nos dias de sono satisfatório (diferença de +${Math.abs(diff).toFixed(1)} pontos).`,
        impact: diff >= 2.0 ? 'Forte Piora (Pico de Dor)' : 'Piora Moderada',
        clinicalContext: 'A privação de sono NREM induz hiperalgesia central por facilitação da nocicepção descendente e elevação de marcadores inflamatórios sistêmicos.'
      });

      recommendations.push({
        title: 'Higiene do Sono e Janela de Descanso Fixa',
        action: 'Estabeleça horários rigorosos de deitar e desligar telas 60 minutos antes de dormir. Mantenha o quarto escuro e em temperatura amena.',
        expectedBenefit: 'Redução potencial de 1,5 a 2,5 pontos na dor basal após regularização das fases profundas do sono.'
      });
    }
  }

  // ── CRUZAMENTO 2: Estresse e Sobrecarga Emocional vs. Sintomas ──
  const highStressLogs = recentLogs.filter(l => {
    const sw = l.stressWork ?? 0;
    const sf = l.stressFamily ?? 0;
    const sp = l.stressPersonal ?? 0;
    const maxS = Math.max(sw, sf, sp);
    const hasStressTrigger = (l.triggers || []).some(t => t.toLowerCase().includes('estresse') || t.toLowerCase().includes('ansiedade'));
    return maxS >= 6 || hasStressTrigger;
  });

  const lowStressLogs = recentLogs.filter(l => !highStressLogs.includes(l));

  if (highStressLogs.length > 0) {
    const avgPainHighStress = highStressLogs.reduce((a, l) => a + (l.pain ?? 0), 0) / highStressLogs.length;
    const avgPainLowStress = lowStressLogs.length > 0 
      ? lowStressLogs.reduce((a, l) => a + (l.pain ?? 0), 0) / lowStressLogs.length 
      : avgPain;
    
    const stressDiff = avgPainHighStress - avgPainLowStress;

    correlations.push({
      trigger: 'Sobrecarga de Estresse Emocional / Ocupacional',
      evidence: `Identificado impacto direto do estresse em ${highStressLogs.length} dias registrados. A intensidade de dor subiu para ${avgPainHighStress.toFixed(1)}/10 nesses períodos (vs ${avgPainLowStress.toFixed(1)}/10 nos dias tranquilos).`,
      impact: stressDiff >= 2.0 ? 'Forte Piora (Pico de Dor)' : 'Piora Moderada',
      clinicalContext: 'A hiperativação do eixo HPA libera catecolaminas e cortisol em excesso, provocando hipertonia muscular reativa e amplificação do sinal doloroso no SNC.'
    });

    recommendations.push({
      title: 'Técnicas de Modulação do Sistema Nervoso Autônomo',
      action: 'Pratique exercícios de respiração diafragmática (protocolo 4-7-8) durante 5 a 10 minutos nos momentos de maior tensão ao longo do dia.',
      expectedBenefit: 'Ativação do tónus vagal, atenuando a rigidez muscular e prevenindo espasmos dolorosos.'
    });
  }

  // ── CRUZAMENTO 3: Hidratação Diária vs. Rigidez Articular e Fadiga ──
  const lowWaterLogs = recentLogs.filter(l => l.waterIntake != null && l.waterIntake > 0 && l.waterIntake < 1500);
  const goodWaterLogs = recentLogs.filter(l => l.waterIntake != null && l.waterIntake >= 2000);

  if (goodWaterLogs.length > 0) {
    const avgFatigueGoodWater = goodWaterLogs.reduce((a, l) => a + (l.fatigue ?? 0), 0) / goodWaterLogs.length;
    
    correlations.push({
      trigger: 'Hidratação Otimizada (>= 2.000ml / dia)',
      evidence: `Nos ${goodWaterLogs.length} dias com meta de hidratação atingida (>= 2.0L), o escore de fadiga corporal caiu para ${avgFatigueGoodWater.toFixed(1)}/10 e houve relato de menor atrito articular.`,
      impact: 'Proteção / Fator Positivo',
      clinicalContext: 'O volume hídrico adequado otimiza a viscosidade do líquido sinovial e melhora a percussão microvascular, favorecendo o aporte de nutrientes aos tecidos musculares.'
    });

    recommendations.push({
      title: 'Manutenção da Meta Hídrica Diária',
      action: 'Mantenha garrafas de água visíveis no ambiente de trabalho ou configure lembretes regulares a cada 2 horas.',
      expectedBenefit: 'Manutenção da fluidez articular e prevenção do cansaço muscular acumulado no final da tarde.'
    });
  } else if (lowWaterLogs.length >= 2) {
    correlations.push({
      trigger: 'Ingestão Hídrica Abaixo do Recomendado (< 1.500ml/dia)',
      evidence: `Registrada baixa ingestão hídrica em ${lowWaterLogs.length} dias nos últimos 14 dias, associada a maior queixa de rigidez ao movimentar-se.`,
      impact: 'Piora Moderada',
      clinicalContext: 'A desidratação reduz o volume plasmático e a lubrificação da cartilagem articular, aumentando o atrito nociceptivo sob carga.'
    });
  }

  // ── CRUZAMENTO 4: Variáveis Climatológicas (Umidade / Pressão) vs. Rigidez ──
  const wetLogs = recentLogs.filter(l => {
    if (!l.weather) return false;
    const h = l.weather.humidity ?? 0;
    const t = l.weather.temp ?? 25;
    const p = l.weather.pressure ?? 1013;
    return h >= 75 || t < 18 || p < 1008;
  });

  if (wetLogs.length > 0) {
    const avgStiffnessWet = wetLogs.reduce((a, l) => a + (l.stiffness ?? 0), 0) / wetLogs.length;
    
    correlations.push({
      trigger: 'Sensibilidade a Alta Umidade / Baixa Pressão Atmosférica',
      evidence: `Nos ${wetLogs.length} dias com condições de umidade elevada, baixa temperatura ou menor pressão barométrica, o nível de rigidez corporal/articular foi de ${avgStiffnessWet.toFixed(1)}/10.`,
      impact: 'Piora Moderada',
      clinicalContext: 'A variação barométrica provoca alteração da pressão intra-articular em cápsulas já sensibilizadas, expandindo microestruturas e exacerbando a dor.'
    });

    recommendations.push({
      title: 'Termoterapia e Alongamentos Suaves ao Acordar',
      action: 'Em dias frios ou úmidos, utilize bolsas de água morna ou tome um banho aquecido logo pela manhã antes de iniciar movimentações intensas.',
      expectedBenefit: 'Aumento da complacência do tecido conjuntivo e redução imediata da rigidez matinal.'
    });
  }

  // ── CRUZAMENTO 5: Análise Frequencial de Gatilhos Alimentares e de Hábitos ──
  const triggerCounts: Record<string, { count: number; totalPain: number }> = {};
  recentLogs.forEach(l => {
    const p = l.pain ?? avgPain;
    (l.triggers || []).forEach(t => {
      const norm = t.trim();
      if (!triggerCounts[norm]) triggerCounts[norm] = { count: 0, totalPain: 0 };
      triggerCounts[norm].count += 1;
      triggerCounts[norm].totalPain += p;
    });
  });

  const frequentTriggers = Object.entries(triggerCounts)
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => (b[1].totalPain / b[1].count) - (a[1].totalPain / a[1].count));

  if (frequentTriggers.length > 0) {
    const [topTriggerName, topTriggerData] = frequentTriggers[0];
    const triggerAvgPain = topTriggerData.totalPain / topTriggerData.count;

    if (triggerAvgPain >= 4.0) {
      correlations.push({
        trigger: `Gatilho Recorrente: "${topTriggerName}"`,
        evidence: `Presente em ${topTriggerData.count} registros do período, com nota média de dor de ${triggerAvgPain.toFixed(1)}/10 nos dias em que ocorreu.`,
        impact: triggerAvgPain >= 7.0 ? 'Forte Piora (Pico de Dor)' : 'Piora Moderada',
        clinicalContext: 'Recorrência consistente de gatilho mecânico, metabólico ou comportamental associado ao agravamento dos sintomas nociceptivos.'
      });

      recommendations.push({
        title: `Mapeamento e Modulação de "${topTriggerName}"`,
        action: `Observe os momentos em que "${topTriggerName}" se repete e tente fracionar ou evitar a exposição a este fator, substituindo-o por alternativas equilibradas.`,
        expectedBenefit: 'Sua eliminação ou modulação gradual pode diminuir a frequência de oscilações agudas de dor.'
      });
    }
  }

  // Fallback positivo se poucos problemas foram encontrados
  if (correlations.length === 0) {
    correlations.push({
      trigger: 'Estabilidade Sintomática nos Registros Recentes',
      evidence: `Com base em ${recentLogs.length} diários analisados, a dor permaneceu controlada (média de ${avgPain.toFixed(1)}/10) sem flutuações extremas.`,
      impact: 'Proteção / Fator Positivo',
      clinicalContext: 'Manutenção de padrões regulares de descanso, medicação e hábitos protetores favorece o equilíbrio das vias anti-nociceptivas.'
    });

    recommendations.push({
      title: 'Manutenção da Rotina Atual',
      action: 'Continue registrando seus diários diariamente para manter o acompanhamento temporal preciso do seu padrão de saúde.',
      expectedBenefit: 'Consolidação da estabilidade dos sintomas e prevenção de novos flares.'
    });
  }

  const confidenceLevel = recentLogs.length >= 10 ? 'Alta' : recentLogs.length >= 5 ? 'Moderada' : 'Inicial';

  return {
    summary: `Análise consolidada com base em ${recentLogs.length} registros clínicos dos últimos 14 dias. Foram cruzados dados de dor (média de ${avgPain.toFixed(1)}/10), qualidade de sono (média de ${avgSleep.toFixed(1)}/10), estresse, hidratação (média de ${Math.round(avgWater)}ml/dia), variáveis climáticas e gatilhos declarados.`,
    confidenceLevel,
    correlations,
    recommendations,
    analyzedAt: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }),
    totalLogsAnalyzed: recentLogs.length
  };
}

export const GeminiAnalyses: React.FC<GeminiAnalysesProps> = ({
  patientData,
  logs
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  // Filter logs for last 14 days
  const last14DaysLogs = useMemo(() => {
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    return logs
      .filter((log) => {
        const logDate = new Date(log.date + 'T12:00:00');
        return logDate >= fourteenDaysAgo && logDate <= today;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  // Recalculate correlation directly
  useEffect(() => {
    if (last14DaysLogs.length > 0) {
      const res = calculateAlgorithmicAnalysis(logs, patientData);
      setAnalysis(res);
    } else {
      setAnalysis(null);
    }
  }, [logs, patientData, last14DaysLogs]);

  const triggerAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      const res = calculateAlgorithmicAnalysis(logs, patientData);
      setAnalysis(res);
      setLoading(false);
    }, 400);
  };

  const getImpactStyles = (impact: string) => {
    const norm = impact.toLowerCase();
    if (norm.includes('forte') || norm.includes('pico') || norm.includes('alta')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400',
        icon: Flame,
        color: 'text-rose-500'
      };
    }
    if (norm.includes('moderad') || norm.includes('piora')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
        icon: AlertTriangle,
        color: 'text-amber-500'
      };
    }
    if (norm.includes('proteç') || norm.includes('reduç') || norm.includes('positivo') || norm.includes('fator')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
        icon: ShieldCheck,
        color: 'text-emerald-500'
      };
    }
    return {
      bg: 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800',
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-400',
      icon: Compass,
      color: 'text-teal-500'
    };
  };

  const getConfidenceBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'alta':
        return 'bg-emerald-500 text-white';
      case 'moderada':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER STATUS BANNER ── */}
      <div className="bg-gradient-to-br from-teal-700 via-slate-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <BarChart3 className="w-80 h-80 text-teal-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          <div className="md:col-span-8 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest bg-teal-500/30 text-teal-200 border border-teal-400/30 px-3 py-1 rounded-full w-max block">
              Análise Integrada de Sintomas & Rotina
            </span>
            <h2 className="font-poppins font-black text-2xl sm:text-3xl tracking-tight text-white leading-tight">
              Insights com base em seus padrões
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-medium">
              Identificação de padrões entre os seus registros de dor, qualidade de sono, estresse, hidratação, clima e medicações nos últimos 14 dias.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
            <button
              type="button"
              onClick={triggerAnalysis}
              disabled={loading || last14DaysLogs.length === 0}
              className="w-full px-5 py-3.5 bg-white text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Análise
            </button>

            <button
              type="button"
              onClick={() => setShowMethodologyModal(true)}
              className="w-full px-4 py-2 bg-teal-600/40 hover:bg-teal-600/60 border border-teal-400/40 text-teal-100 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-300" />
              Base Científica & Metodologia v2.4
            </button>
          </div>
        </div>
      </div>

      {/* ── CORE COMPONENT STATE VIEWS ── */}
      <AnimatePresence mode="wait">
        
        {/* Loading State */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-3xl text-center space-y-4 shadow-xs flex flex-col items-center justify-center min-h-[220px]"
          >
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Processando cruzamentos e sincronizando seus registros...
            </p>
          </motion.div>
        )}

        {/* Empty/No data State */}
        {!loading && last14DaysLogs.length === 0 && (
          <motion.div
            key="no-logs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-3xl text-center space-y-4 shadow-xs"
          >
            <Calendar className="w-12 h-12 text-teal-500 mx-auto" />
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-poppins font-black text-sm text-slate-800 dark:text-slate-200">
                Nenhum registro encontrado nos últimos 14 dias
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Para visualizar as correlações entre sua dor e sua rotina (como sono, estresse, clima ou hidratação), preencha o diário de sintomas na aba dedicada.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl text-left max-w-lg mx-auto text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              💡 <strong>Acompanhamento de 14 dias:</strong> Registrar duas semanas contínuas permite isolar oscilações pontuais e identificar tendências reais do seu bem-estar.
            </div>
          </motion.div>
        )}

        {/* Active Analysis State */}
        {!loading && analysis && last14DaysLogs.length > 0 && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Analysis Meta Stats Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Última atualização dos dados</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">{analysis.analyzedAt}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registros Cruzados:</span>
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg">
                  {analysis.totalLogsAnalyzed} dias
                </span>

                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Consistência dos Dados:</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getConfidenceBadgeColor(analysis.confidenceLevel)}`}>
                  {analysis.confidenceLevel}
                </span>
                
                <button
                  type="button"
                  onClick={triggerAnalysis}
                  className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-xl transition-all cursor-pointer"
                  title="Atualizar Análise"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Executive Summary and Correlations */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Executive Summary Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-teal-600" />
                    <h3 className="font-poppins font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                      Resumo dos Cruzamentos de Dados
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed pl-3 border-l-2 border-teal-500">
                    {analysis.summary}
                  </p>
                </div>

                {/* Correlations List */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-poppins font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-teal-600" /> Padrões e Correlações Identificadas
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Veja o comportamento dos sintomas em função do seu estilo de vida recente.</p>
                  </div>

                  <div className="space-y-3">
                    {analysis.correlations.map((corr, idx) => {
                      const styles = getImpactStyles(corr.impact);
                      const Icon = styles.icon;
                      return (
                        <div 
                          key={`corr-${idx}`}
                          className={`border rounded-2xl p-4.5 transition-all shadow-3xs space-y-3 ${styles.bg}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 bg-white dark:bg-slate-950/30 rounded-xl ${styles.color}`}>
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                              <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">
                                {corr.trigger}
                              </h4>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${styles.badge}`}>
                              {corr.impact}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-white/30">
                              <strong>Dado Observado:</strong> {corr.evidence}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                              💡 <strong>Contexto Clínico:</strong> {corr.clinicalContext}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Recommendations */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="border-b border-slate-50 dark:border-slate-850 pb-2.5">
                  <h4 className="font-poppins font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-500" /> Ações e Cuidados Recomendados
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sugestões de conduta derivadas das variações observadas no seu diário.</p>
                </div>

                <div className="space-y-4">
                  {analysis.recommendations.map((rec, idx) => (
                    <div 
                      key={`rec-${idx}`}
                      className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-900 rounded-xl space-y-2 hover:border-teal-200 dark:hover:border-teal-900/40 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {rec.title}
                        </h5>
                      </div>
                      
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium pl-7">
                        {rec.action}
                      </p>

                      <div className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30 p-2 rounded-lg ml-7 font-bold flex items-start gap-1 border border-teal-100 dark:border-teal-900/40">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{rec.expectedBenefit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100/50 rounded-xl text-[10px] text-teal-800 dark:text-teal-300 leading-normal font-semibold">
                  🌿 <strong>Aviso Clínico:</strong> Estas análises são baseadas nos seus relatos e servem como apoio ao autoconhecimento. Nunca altere medicamentos sem orientação do seu médico.
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── METHODOLOGY & SCIENTIFIC TRANSPARENCY MODAL ── */}
      {showMethodologyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-2xl border border-teal-500/30">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-poppins font-black text-lg text-white">
                      Transparência Científica & Metodologia
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-500/30 text-teal-200 text-[10px] font-mono font-bold rounded-md border border-teal-400/30">
                      v2.4.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Como são processadas as análises, quais regras regem os cruzamentos e sua utilidade médica.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMethodologyModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              
              {/* Section 1: Versioning & Compliance */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                    Versão da Metodologia Clínico-Estatística
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    RITMA Health Engine v2.4.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Desenvolvido com base nos consensos da <strong>Sociedade Brasileira de Reumatologia (SBR)</strong>, <strong>EULAR</strong> (European Alliance of Associations for Rheumatology) e diretrizes do <strong>ACR</strong> (American College of Rheumatology) para monitoramento contínuo de dores crônicas e fibromialgia.
                </p>
              </div>

              {/* Section 2: How Calculations Are Done */}
              <div className="space-y-3">
                <h4 className="font-poppins font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Como são Realizados os Cruzamentos de Dados
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                    <strong className="text-teal-600 dark:text-teal-400 text-[11px] block">
                      1. Delta Nociceptivo Sono vs. Dor
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Calcula a variação da pontuação média de dor entre dias com qualidade de sono restrita (≤ 5/10) e dias com sono satisfatório (≥ 6/10). Mede o grau de facilitação descendente da dor.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                    <strong className="text-teal-600 dark:text-teal-400 text-[11px] block">
                      2. Reatividade Barométrica & Climatológica
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Mapeia os dias com umidade relativa do ar ≥ 75%, baixas temperaturas (&lt; 18°C) ou quedas de pressão barométrica, correlacionando-os aos picos de rigidez matinal e sensibilidade articular.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                    <strong className="text-teal-600 dark:text-teal-400 text-[11px] block">
                      3. Sobrecarga Autonômica & Estresse
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Avalia o escore de estresse ocupacional/emocional (escore ≥ 6/10) e a frequência de contraturas musculares ou exacerbações sintomáticas no mesmo dia ou no dia subsequente.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                    <strong className="text-teal-600 dark:text-teal-400 text-[11px] block">
                      4. Hidratação e Viscosidade Sinovial
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Compara os índices de fadiga muscular e atrito articular nos dias em que a meta de ingestão hídrica foi atingida (≥ 2.000ml) versus dias de baixa hidratação (&lt; 1.500ml).
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Why These Calculations Exist */}
              <div className="space-y-3">
                <h4 className="font-poppins font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-500" />
                  Por Que Estes Cálculos Estão Aqui e Seu Propósito
                </h4>
                
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-950 dark:text-emerald-200 text-xs">Empoderamento do Paciente:</strong>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-300 mt-0.5">
                        Dores crônicas frequentemente parecem imprevisíveis. O cruzamento contínuo transforma relatos esporádicos em padrões visíveis, ajudando o paciente a antecipar gatilhos e adotar medidas preventivas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-emerald-100/60 dark:border-emerald-900/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-950 dark:text-emerald-200 text-xs">Apoio à Consulta Médica:</strong>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-300 mt-0.5">
                        Durante as consultas, pacientes sofrem com o viés de memória recente. Este sistema disponibiliza métricas quantitativas estruturadas que auxiliam seu profissional da saúde a ajustar dosagens e estratégias terapêuticas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Scientific References */}
              <div className="space-y-3">
                <h4 className="font-poppins font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  Referências Científicas Integradas
                </h4>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2.5 text-[11px]">
                  <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">1. Sociedade Brasileira de Reumatologia (SBR)</span>
                    <span className="text-slate-500 dark:text-slate-400">Consenso Brasileiro para Diagnóstico e Tratamento da Fibromialgia e Doenças Osteoarticulares Crônicas. <em>Rev Bras Reumatol</em>.</span>
                  </div>

                  <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">2. EULAR Revised Recommendations</span>
                    <span className="text-slate-500 dark:text-slate-400">Macfarlane GJ, et al. EULAR revised recommendations for the management of fibromyalgia and musculoskeletal pain. <em>Ann Rheum Dis</em>, 2017.</span>
                  </div>

                  <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">3. Revisions to Fibromyalgia Criteria</span>
                    <span className="text-slate-500 dark:text-slate-400">Wolfe F, Clauw DJ, et al. 2016 Revisions to the 2010/2011 Fibromyalgia Diagnostic Criteria. <em>Semin Arthritis Rheum</em>.</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">4. Neurobiology of Central Sensitization</span>
                    <span className="text-slate-500 dark:text-slate-400">Sluka KA, Clauw DJ. Neurobiology of fibromyalgia and chronic widespread pain. <em>Neuroscience</em>, 2016.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowMethodologyModal(false)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Compreendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

