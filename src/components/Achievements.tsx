/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 * 
 * Component Achievements: Tracking streaks, small wins, clinical medals,
 * and newly discovered causal correlations to promote patient autonomy and self-security.
 */

import React, { useState, useMemo } from 'react';
import { DailyLog, PatientData } from '../types';
import { 
  Trophy, 
  Calendar, 
  Flame, 
  CheckCircle, 
  Award, 
  Heart, 
  Lightbulb, 
  HelpCircle, 
  Brain, 
  Droplet, 
  Activity, 
  Wind, 
  Sparkles,
  Compass,
  TrendingDown,
  Check,
  Zap,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AchievementsProps {
  patientData: PatientData;
  logs: DailyLog[];
  onSelectTab: (tab: string) => void;
}

interface Medal {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  progressMax: number;
  progressCurrent: number;
  isUnlocked: boolean;
  unlockedLabel: string;
}

export const Achievements: React.FC<AchievementsProps> = ({
  patientData,
  logs,
  onSelectTab
}) => {
  // Sort logs by date to compute streaks correctly
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  // Total active days (any log is an active day)
  const totalActiveDays = useMemo(() => {
    return logs.length;
  }, [logs]);

  // Current consecutive days streak
  const currentStreak = useMemo(() => {
    if (sortedLogs.length === 0) return 0;
    
    // Get unique dates that have logs
    const loggedDates = Array.from(new Set(sortedLogs.map(l => l.date)));
    
    // Let's count backwards starting from today (or the most recent log)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if the most recent log is today or yesterday to consider the streak alive
    const lastLogDateStr = loggedDates[loggedDates.length - 1];
    const lastLogDate = new Date(lastLogDateStr + 'T12:00:00');
    const diffTime = today.getTime() - lastLogDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 2) {
      // Streak is broken (last log was more than 1 day ago)
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(lastLogDateStr + 'T12:00:00');
    
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (loggedDates.includes(checkStr)) {
        streak++;
        // Go back 1 day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }, [sortedLogs]);

  // Count small wins (dias com dor sob controle ou hábitos protetores realizados)
  const smallWinsStats = useMemo(() => {
    let lowPainDays = 0;
    let waterGoalsMet = 0;
    let meditationDays = 0;
    let natureDays = 0;
    let noForgotMeds = 0;

    logs.forEach(l => {
      // Low Pain: pain exists and is <= 4
      if (l.pain !== undefined && l.pain !== null && l.pain <= 4) {
        lowPainDays++;
      }
      // Water Intake Goal met (either simple 'bastante' or intake >= 2000ml)
      if (
        (l.waterIntake !== undefined && l.waterIntake >= 2000) || 
        l.waterSimple === 'bastante' || 
        l.waterSimple === 'adequado'
      ) {
        waterGoalsMet++;
      }
      // Meditation/Mindfulness done
      if (l.mindfulnessDay || (l.triggers && l.triggers.includes('exercicio_respiracao_concluido'))) {
        meditationDays++;
      }
      // Nature contact done
      if (l.natureContact) {
        natureDays++;
      }
      // Took medications (forgotMedication is false or undefined)
      if (l.forgotMedication === false) {
        noForgotMeds++;
      }
    });

    return {
      lowPainDays,
      waterGoalsMet,
      meditationDays,
      natureDays,
      noForgotMeds,
      totalWins: lowPainDays + waterGoalsMet + meditationDays + natureDays + noForgotMeds
    };
  }, [logs]);

  // DYNAMIC CLINICAL CORRELATIONS SCANNER
  // Gives the user a deep sense of understanding, security, and knowledge of their own body.
  const personalCorrelations = useMemo(() => {
    const list: {
      type: 'positive' | 'neutral' | 'investigating';
      title: string;
      description: string;
      impact: string;
      icon: React.ElementType;
      badgeColor: string;
    }[] = [];

    if (logs.length < 5) {
      return [
        {
          type: 'investigating' as const,
          title: 'Mapeando Seus Padrões',
          description: 'Estamos calibrando os algoritmos de correlação de dor.',
          impact: `Registre mais ${5 - logs.length} dias para liberar suas primeiras correlações personalizadas.`,
          icon: HelpCircle,
          badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400'
        },
        {
          type: 'investigating' as const,
          title: 'Estilo de Vida & Dor',
          description: 'Analisaremos como o estresse familiar, profissional e o sono interagem diretamente com suas crises.',
          impact: 'Dica: Tente preencher o diário alimentar e o nível de estresse sempre no mesmo horário.',
          icon: Compass,
          badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400'
        }
      ];
    }

    // Correlation 1: Sleep quality vs. Pain
    const sleepLogs = logs.filter(l => l.sleep != null && l.pain != null);
    if (sleepLogs.length >= 3) {
      const goodSleepLowPain = sleepLogs.filter(l => l.sleep! >= 7 && l.pain! <= 4).length;
      const goodSleepTotal = sleepLogs.filter(l => l.sleep! >= 7).length;
      
      if (goodSleepTotal > 0 && (goodSleepLowPain / goodSleepTotal) >= 0.6) {
        const pct = Math.round((goodSleepLowPain / goodSleepTotal) * 100);
        list.push({
          type: 'positive',
          title: 'Fator de Proteção: Sono Reparador',
          description: `Identificamos que em ${pct}% dos dias em que você dormiu bem (nota ≥ 7), sua dor permaneceu sob controle (nota ≤ 4).`,
          impact: 'A estabilização do sono profundo limpa as citocinas inflamatórias cerebrais e melhora sua modulação natural de dor.',
          icon: Brain,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
        });
      }
    }

    // Correlation 2: Mindfulness vs. Pain
    const mindLogs = logs.filter(l => l.pain != null);
    const mindActiveLogs = mindLogs.filter(l => l.mindfulnessDay || (l.triggers && l.triggers.includes('exercicio_respiracao_concluido')));
    if (mindActiveLogs.length >= 2) {
      const mindLowPain = mindActiveLogs.filter(l => l.pain! <= 4).length;
      const pct = Math.round((mindLowPain / mindActiveLogs.length) * 100);
      
      if (pct >= 50) {
        list.push({
          type: 'positive',
          title: 'Autorregulação Autonômica Eficiente',
          description: `Seus registros indicam que em ${pct}% dos dias com prática de meditação ou respiração coerente, a dor ficou tolerável.`,
          impact: 'Este hábito diminui diretamente o tônus simpático (luta-ou-fuga) e reduz a hipersensibilidade do sistema nervoso central.',
          icon: Wind,
          badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400'
        });
      }
    }

    // Correlation 3: Nature Contact vs. Stress & Pain
    const natureLogs = logs.filter(l => l.natureContact && l.pain != null);
    if (natureLogs.length >= 2) {
      const natureLowPain = natureLogs.filter(l => l.pain! <= 4).length;
      const pct = Math.round((natureLowPain / natureLogs.length) * 100);
      
      if (pct >= 50) {
        list.push({
          type: 'positive',
          title: 'Natureza como Terapia Coadjuvante',
          description: `Em ${pct}% dos dias em que você teve contato ativo com a natureza, sua percepção de dor física foi atenuada.`,
          impact: 'A exposição ao verde diminui as ondas beta corticais, promovendo sensação de acolhimento físico.',
          icon: Heart,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
        });
      }
    }

    // Correlation 4: Water Intake
    const hydrationLogs = logs.filter(l => l.pain != null && (l.waterIntake != null || l.waterSimple != null));
    const goodHydrationLogs = hydrationLogs.filter(l => l.waterIntake! >= 2000 || l.waterSimple === 'bastante' || l.waterSimple === 'adequado');
    if (goodHydrationLogs.length >= 3) {
      const hydratedLowPain = goodHydrationLogs.filter(l => l.pain! <= 5).length;
      const pct = Math.round((hydratedLowPain / goodHydrationLogs.length) * 100);
      if (pct >= 60) {
        list.push({
          type: 'positive',
          title: 'Hidratação e Viscosidade de Dor',
          description: `Com hidratação em dia, a ocorrência de cefaleia ou espasmos musculares intensos reduziu em ${pct}% das ocasiões.`,
          impact: 'A água é vital para a nutrição dos discos intervertebrais e para manter a fáscia muscular lubrificada.',
          icon: Droplet,
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
        });
      }
    }

    // Add default analytical message if we have logs but no distinct positive correlations yet
    if (list.length === 0) {
      list.push({
        type: 'neutral',
        title: 'Buscando Co-relação de Crises',
        description: 'Análise de estressores ocupacionais e familiares em andamento.',
        impact: 'Continue alimentando seu diário de dor, sono e estresse para que o sistema cruze as flutuações clínicas com precisão.',
        icon: Lightbulb,
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
      });
    }

    return list;
  }, [logs]);

  // Medals calculation
  const medals: Medal[] = useMemo(() => {
    // Check which medals are unlocked
    const totalLogs = logs.length;
    
    // Check if body pain map was used
    const hasBodyMap = logs.some(l => l.predominant !== undefined || l.worstPain !== undefined);
    
    // Check if food diary triggers were used
    const hasFoodDiary = logs.some(l => l.triggers && l.triggers.length > 0);

    // Check if mindfulness was completed
    const hasMindfulness = logs.some(l => l.mindfulnessDay || (l.triggers && l.triggers.includes('exercicio_respiracao_concluido')));

    // Check if water goal was met
    const hasWaterGoal = smallWinsStats.waterGoalsMet >= 3;

    // Check if medication was fully taken (at least 3 days with forgotMedication = false)
    const hasMedsTaker = smallWinsStats.noForgotMeds >= 3;

    return [
      {
        id: 'first_log',
        title: 'Primeira Vitória',
        description: 'Realizou seu primeiro registro clínico no diário.',
        icon: Trophy,
        color: 'from-amber-400 to-amber-600 text-white shadow-amber-500/10',
        progressMax: 1,
        progressCurrent: Math.min(totalLogs, 1),
        isUnlocked: totalLogs >= 1,
        unlockedLabel: 'Registrado com sucesso!'
      },
      {
        id: 'log_3',
        title: 'Observador Focado',
        description: 'Completou 3 dias de diário de acompanhamento.',
        icon: Award,
        color: 'from-teal-400 to-teal-600 text-white shadow-teal-500/10',
        progressMax: 3,
        progressCurrent: Math.min(totalLogs, 3),
        isUnlocked: totalLogs >= 3,
        unlockedLabel: '3 dias de consistência!'
      },
      {
        id: 'log_7',
        title: 'Guardião de Hábitos',
        description: 'Completou 7 dias de registros de sintomas.',
        icon: Calendar,
        color: 'from-indigo-400 to-indigo-600 text-white shadow-indigo-500/10',
        progressMax: 7,
        progressCurrent: Math.min(totalLogs, 7),
        isUnlocked: totalLogs >= 7,
        unlockedLabel: '7 dias mapeados!'
      },
      {
        id: 'log_15',
        title: 'Mapeador Habitual',
        description: 'Completou 15 dias de auto-observação ativa.',
        icon: Flame,
        color: 'from-rose-400 to-rose-600 text-white shadow-rose-500/10',
        progressMax: 15,
        progressCurrent: Math.min(totalLogs, 15),
        isUnlocked: totalLogs >= 15,
        unlockedLabel: '15 dias incríveis!'
      },
      {
        id: 'mindful',
        title: 'Mente Consciente',
        description: 'Completou um exercício de respiração coerente.',
        icon: Wind,
        color: 'from-emerald-400 to-emerald-600 text-white shadow-emerald-500/10',
        progressMax: 1,
        progressCurrent: hasMindfulness ? 1 : 0,
        isUnlocked: hasMindfulness,
        unlockedLabel: 'Cérebro regulado!'
      },
      {
        id: 'food_detective',
        title: 'Investigador Alimentar',
        description: 'Identificou alimentos sob investigação de intolerância.',
        icon: Sparkles,
        color: 'from-pink-400 to-pink-600 text-white shadow-pink-500/10',
        progressMax: 1,
        progressCurrent: hasFoodDiary ? 1 : 0,
        isUnlocked: hasFoodDiary,
        unlockedLabel: 'Gatilhos mapeados!'
      },
      {
        id: 'cartographer',
        title: 'Cartógrafo da Dor',
        description: 'Mapeou focos e zonas de dor no mapa corporal.',
        icon: Activity,
        color: 'from-blue-400 to-blue-600 text-white shadow-blue-500/10',
        progressMax: 1,
        progressCurrent: hasBodyMap ? 1 : 0,
        isUnlocked: hasBodyMap,
        unlockedLabel: 'Zonas identificadas!'
      },
      {
        id: 'hydration_3d',
        title: 'Viscosidade Saudável',
        description: 'Atingiu a meta de hidratação diária por 3 dias.',
        icon: Droplet,
        color: 'from-cyan-400 to-cyan-600 text-white shadow-cyan-500/10',
        progressMax: 3,
        progressCurrent: Math.min(smallWinsStats.waterGoalsMet, 3),
        isUnlocked: hasWaterGoal,
        unlockedLabel: 'Fáscias lubrificadas!'
      }
    ];
  }, [logs, smallWinsStats]);

  // Level calculator based on unlocked medals
  const unlockedMedalsCount = useMemo(() => {
    return medals.filter(m => m.isUnlocked).length;
  }, [medals]);

  const selfKnowledgeLevel = useMemo(() => {
    if (unlockedMedalsCount >= 7) {
      return { level: 4, title: 'Mestre da Autonomia', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20', desc: 'Você domina seus gatilhos, entende suas variações clínicas de dor e é o principal gestor da sua reabilitação.' };
    }
    if (unlockedMedalsCount >= 4) {
      return { level: 3, title: 'Cientista de Si', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20', desc: 'Você consegue prever flutuações de sintomas e usa ferramentas não-farmacológicas (como respiração coerente) de forma estratégica.' };
    }
    if (unlockedMedalsCount >= 2) {
      return { level: 2, title: 'Observador Ativo', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20', desc: 'Você começou a conectar como o estresse, alimentação e sono influenciam o limiar da sua dor.' };
    }
    return { level: 1, title: 'Mapeador Iniciante', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20', desc: 'Seu foco principal é construir consistência de diário clínico para desenhar seu histórico de dor.' };
  }, [unlockedMedalsCount]);

  return (
    <div className="space-y-6">
      
      {/* ── HEADER STATUS BANNER ── */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-400 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <Trophy className="w-80 h-80" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          
          <div className="md:col-span-8 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full text-teal-100 w-max block">
              Plataforma de Autonomia Clínica
            </span>
            <h2 className="font-poppins font-black text-2xl sm:text-3xl tracking-tight text-white leading-tight">
              Suas Conquistas & Autoconhecimento
            </h2>
            <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed max-w-xl font-medium">
              Viver com dor crônica é um desafio diário. Registrar seus sintomas e descobrir o que te faz bem não é apenas burocracia: é assumir as rédeas da sua saúde. Cada dia registrado é uma vitória!
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3">
            
            {/* Active Days Card */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15 text-center flex flex-col justify-center">
              <span className="text-[9px] font-extrabold text-teal-100 uppercase tracking-wider block">Dias Ativos</span>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <Calendar className="w-4 h-4 text-emerald-200" />
                <span className="text-xl font-black text-white font-mono">{totalActiveDays}</span>
              </div>
              <span className="text-[8px] text-teal-50/80 mt-1 font-bold">Logs no App</span>
            </div>

            {/* Streak Card */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15 text-center flex flex-col justify-center">
              <span className="text-[9px] font-extrabold text-teal-100 uppercase tracking-wider block">Sequência</span>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <Flame className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                <span className="text-xl font-black text-white font-mono">{currentStreak}</span>
              </div>
              <span className="text-[8px] text-teal-50/80 mt-1 font-bold">Dias seguidos</span>
            </div>

          </div>

        </div>
      </div>

      {/* ── LEVEL & EMPOWERMENT DIALOG ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-amber-400 to-yellow-500 text-white rounded-2xl shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível de Autonomia</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${selfKnowledgeLevel.color}`}>
                Nível {selfKnowledgeLevel.level}: {selfKnowledgeLevel.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              {selfKnowledgeLevel.desc}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl shrink-0 border border-slate-100/50 dark:border-slate-850">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{unlockedMedalsCount} de {medals.length} Medalhas Ativas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── DYNAMIC CORRELATION LOGS / CONHECEDOR DE SI (7 cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-teal-500" /> Mapeamento de Causa e Efeito
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Correlações clínicas calculadas a partir dos seus logs ativos.</p>
            </div>
            
            <div className="px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded text-[9px] font-black tracking-widest uppercase">
              Ativo
            </div>
          </div>

          <div className="space-y-3">
            {personalCorrelations.map((corr, idx) => {
              const Icon = corr.icon;
              return (
                <div 
                  key={`corr-${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-2.5 hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-500 rounded-xl">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-200">
                        {corr.title}
                      </h4>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${corr.badgeColor}`}>
                      {corr.type === 'positive' ? 'Fator Protetor' : corr.type === 'neutral' ? 'Ajustando' : 'Mapeando'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed pl-1.5 border-l-2 border-slate-100 dark:border-slate-800">
                    {corr.description}
                  </p>

                  <div className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-950/10 p-2.5 rounded-xl flex items-start gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <span>{corr.impact}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empowerment quote card */}
          <div className="p-4 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-teal-500/10 dark:border-teal-500/5 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex gap-3">
            <Compass className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <strong>Segurança e Independência Clínica:</strong> Ao invés de aceitar a dor como um fardo imutável, o diário te ensina que seu corpo possui regras claras. Descobrir que sua dor reage à hidratação, sono ou respiração devolve a você o <strong>poder de decisão</strong> sobre a sua própria qualidade de vida.
            </div>
          </div>
        </div>

        {/* ── PEQUENAS VITÓRIAS DIÁRIAS (5 cols) ── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-850 pb-2.5">
            <h4 className="font-poppins font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Pequenas Vitórias Acumuladas
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Metas de autorregulação e bem-estar atingidas ao longo da sua jornada.</p>
          </div>

          <div className="space-y-3.5">
            
            {/* Meditação */}
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex gap-2 items-start">
                <Wind className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Sessões de Respiração Coerente</span>
                  <p className="text-[10px] text-slate-400 font-medium">Meditação de harmonização vagal registrada.</p>
                </div>
              </div>
              <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md text-teal-500">
                {smallWinsStats.meditationDays}x
              </span>
            </div>

            {/* Hidratação */}
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex gap-2 items-start">
                <Droplet className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Metas de Água Atingidas</span>
                  <p className="text-[10px] text-slate-400 font-medium">Dias com consumo adequado de líquidos.</p>
                </div>
              </div>
              <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md text-blue-500">
                {smallWinsStats.waterGoalsMet}x
              </span>
            </div>

            {/* Baixo Estresse */}
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex gap-2 items-start">
                <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Dias com Dor sob Controle</span>
                  <p className="text-[10px] text-slate-400 font-medium">Dias em que a dor foi de intensidade leve (≤ 4).</p>
                </div>
              </div>
              <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md text-rose-500">
                {smallWinsStats.lowPainDays}x
              </span>
            </div>

            {/* Contato com a Natureza */}
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex gap-2 items-start">
                <Compass className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Dias de Contato com Verde</span>
                  <p className="text-[10px] text-slate-400 font-medium">Atividades ao ar livre ou contato com plantas.</p>
                </div>
              </div>
              <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md text-emerald-500">
                {smallWinsStats.natureDays}x
              </span>
            </div>

            {/* Medicação Segura */}
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Consistência de Medicamentos</span>
                  <p className="text-[10px] text-slate-400 font-medium">Dias em que nenhuma medicação foi esquecida.</p>
                </div>
              </div>
              <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md text-indigo-500">
                {smallWinsStats.noForgotMeds}x
              </span>
            </div>

          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Engrenagem de Hábito</span>
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/30 rounded-xl text-[10px] text-indigo-800 dark:text-indigo-400 leading-normal font-medium">
              💡 <strong>Regra de Ouro da Dor Crônica:</strong> O cérebro aprende por repetição. Ao registrar e comemorar pequenas vitórias físicas, você treina seu cérebro a focar na sensação de controle e segurança, inibindo o circuito cortical hiperativo da dor.
            </div>
          </div>

        </div>

      </div>

      {/* ── MEDALS GRID SECTION (PEQUENAS MEDALHAS VISUAIS) ── */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="font-poppins font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Award className="w-4.5 h-4.5 text-amber-500" /> Suas Medalhas de Auto-Cuidado
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Conquistas desbloqueadas de acordo com seu engajamento no aplicativo.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {medals.map((medal) => {
            const Icon = medal.icon;
            return (
              <div 
                key={medal.id}
                className={`border rounded-2xl p-4.5 flex flex-col justify-between h-44 shadow-xs relative transition-all ${
                  medal.isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:shadow-md'
                    : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900/60 opacity-60'
                }`}
              >
                
                {/* Badge top layout */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-gradient-to-tr ${
                      medal.isUnlocked ? medal.color : 'from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-850 text-slate-400 dark:text-slate-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {medal.isUnlocked ? (
                      <span className="bg-emerald-500 text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3 font-bold" />
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                        Bloqueado
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">
                      {medal.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                      {medal.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar or unlock label */}
                <div className="space-y-1 pt-2 border-t border-slate-50 dark:border-slate-850/60">
                  {medal.isUnlocked ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black block">
                      {medal.unlockedLabel}
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span>Progresso</span>
                        <span className="font-mono">{medal.progressCurrent}/{medal.progressMax}</span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-300 dark:bg-slate-700 rounded-full" 
                          style={{ width: `${(medal.progressCurrent / medal.progressMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
