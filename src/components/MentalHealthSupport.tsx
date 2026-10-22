/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 * 
 * Component MentalHealthSupport: Advanced psychological tracking,
 * cognitive behavioral coping tools, and clinical breathing regulation.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyLog, PatientData, PeriodicMetric } from '../types';
import { todayISO, fmtDate } from '../utils';
import { PatientMetrics } from './PatientMetrics';
import { 
  Brain, 
  Activity, 
  Smile, 
  Frown, 
  Wind, 
  Play, 
  Square, 
  ChevronRight, 
  BookOpen, 
  Heart, 
  Compass, 
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock,
  CheckCircle,
  ShieldCheck,
  ZapOff
} from 'lucide-react';

interface MentalHealthSupportProps {
  patientData: PatientData;
  logs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
  onSaveMetric: (metric: PeriodicMetric) => void;
}

export const MentalHealthSupport: React.FC<MentalHealthSupportProps> = ({
  patientData,
  logs,
  onSaveLog,
  onSaveMetric
}) => {
  // Tabs for the Mental Health panel
  type SubTab = 'tools' | 'tracker' | 'questionnaires' | 'coping';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('tools');

  // --- Date state for Daily Stress Tracker ---
  const [trackerDate, setTrackerDate] = useState<string>(todayISO());

  // --- Breathing Tool States ---
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inspire' | 'expirar' | 'sustentar'>('inspire');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(120); // 2 minutes in seconds
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(120);
  const [completedBreathingToday, setCompletedBreathingToday] = useState(false);

  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play synthetic tone using browser native AudioContext
  const playSynthesizedTone = (freq: number, dur: number) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      console.warn('Audio Context blocked or not supported by browser:', e);
    }
  };

  // Coherent Breathing (6 breaths per minute -> 5s inhale, 5s exhale)
  useEffect(() => {
    if (breathingActive) {
      // Clean start
      setBreathingPhase('inspire');
      setBreathingSecondsLeft(5);
      playSynthesizedTone(523.25, 0.4); // C5 tone for start

      breathingIntervalRef.current = setInterval(() => {
        setBreathingSecondsLeft((prev) => {
          if (prev <= 1) {
            // Toggle phase
            setBreathingPhase((currentPhase) => {
              const nextPhase = currentPhase === 'inspire' ? 'expirar' : 'inspire';
              if (nextPhase === 'inspire') {
                playSynthesizedTone(523.25, 0.45); // C5 tone on inhale
              } else {
                playSynthesizedTone(392.00, 0.45); // G4 tone on exhale
              }
              return nextPhase;
            });
            return 5; // 5 seconds cycle
          }
          return prev - 1;
        });
      }, 1000);

      sessionIntervalRef.current = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            // End Session
            setBreathingActive(false);
            setCompletedBreathingToday(true);
            playSynthesizedTone(659.25, 0.8); // E5 for success
            
            // Auto log breathing in the daily log triggers
            const todayLog = logs.find(l => l.date === todayISO());
            const baseLog: DailyLog = todayLog || {
              date: todayISO(),
              notes: ''
            };
            const currentTriggers = new Set(baseLog.triggers || []);
            currentTriggers.add('exercicio_respiracao_concluido');
            
            onSaveLog({
              ...baseLog,
              mindfulnessDay: true,
              triggers: Array.from(currentTriggers)
            });

            return timerDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      setSessionTimeLeft(timerDuration);
      setBreathingSecondsLeft(5);
    }

    return () => {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [breathingActive, timerDuration, soundEnabled]);

  const changeTimerPreset = (minutes: number) => {
    setTimerDuration(minutes * 60);
    setSessionTimeLeft(minutes * 60);
    setBreathingActive(false);
  };

  const formattedTimeLeft = useMemo(() => {
    const mins = Math.floor(sessionTimeLeft / 60);
    const secs = sessionTimeLeft % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [sessionTimeLeft]);

  // --- Coping Strategies DB ---
  const copingCards = [
    {
      id: 'catastrophizing',
      title: 'Desconstrução da Catastrofização de Dor',
      category: 'Reenquadramento Cognitivo (TCC)',
      description: 'Como quebrar o ciclo onde o cérebro interpreta a dor como um alerta de perigo extremo iminente.',
      steps: [
        'Reconheça o pensamento: Identifique pensamentos automáticos como "isso nunca vai passar" ou "meu corpo está destruído".',
        'Avalie cientificamente: A dor crônica é um erro de calibração do sistema nervoso (sensibilização central), não um indicador de lesão ativa no tecido.',
        'Substitua a mensagem: Mentalize: "Minha dor é real e desconfortável, mas meu corpo está fisicamente seguro agora. Esse alerta vai diminuir."'
      ],
      impact: 'Reduz a hipervigilância cortical e acalma o sistema nervoso simpático.'
    },
    {
      id: 'grounding',
      title: 'Técnica de Aterramento 5-4-3-2-1',
      category: 'Regulação Rápida em Crises',
      description: 'Método de atenção plena para desconectar o cérebro da hiperfocalização nos estímulos nociceptivos (dor aguda).',
      steps: [
        '👁️ 5 Coisas que você vê: Observe detalhes ao redor (uma cor, um reflexo, uma textura).',
        '🖐️ 4 Coisas que pode tocar: Sinta o toque da roupa na pele, a solidez da cadeira, os pés no chão.',
        '👂 3 Coisas que pode ouvir: Preste atenção no zumbido do vento, um carro passando, a sua respiração.',
        '👃 2 Coisas que pode cheirar: Identifique aromas sutis no ambiente.',
        '👅 1 Coisa que pode saborear: Sinta o gosto residual na boca ou beba um gole de água focando no sabor.'
      ],
      impact: 'Desvia a atenção executiva do córtex somatossensorial, atenuando a dor percebida.'
    },
    {
      id: 'pacing',
      title: 'Pacing: Ritmo Inteligente de Atividade',
      category: 'Prevenção de Crises (Fadiga/Dor)',
      description: 'O segredo de planejar pausas e evitar o efeito de "boom e colapso" (fazer muito num dia bom e ficar acamado depois).',
      steps: [
        'Descubra sua cota segura: Quantos minutos você consegue caminhar ou digitar antes que a dor comece a subir?',
        'Parada programada: Faça pausas de 5 minutos *antes* de atingir esse limite, mesmo que se sinta cheio de energia.',
        'Paciência no progresso: Aumente o volume de atividade de forma linear e lenta (ex: apenas 10% a mais por semana).'
      ],
      impact: 'Estabiliza a tolerância neuromuscular e reconquista a funcionalidade sem disparar espasmos.'
    },
    {
      id: 'bodyscan',
      title: 'Escaneamento Corporal Neutro',
      category: 'Mindfulness e Desensibilização',
      description: 'Aprender a direcionar a atenção consciente para partes do corpo que não estão doendo ou que estão em repouso confortável.',
      steps: [
        'Acomode-se e feche os olhos. Concentre-se inteiramente no topo da sua cabeça e desça devagar.',
        'Foque em ilhas de conforto: Gaste mais tempo sentindo o relaxamento nos lobos da orelha, nas palmas das mãos ou nas solas dos pés.',
        'Não lute contra a dor: Se a mente for atraída para a área com dor, observe-a sem julgar e volte gentilmente a atenção para uma zona neutra.'
      ],
      impact: 'Treina a plasticidade cerebral para não processar a dor como o único sinal do corpo.'
    }
  ];

  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // --- Active Tracker Date Log ---
  const currentLog = useMemo(() => {
    return logs.find((l) => l.date === trackerDate) || null;
  }, [logs, trackerDate]);

  // Handle saving stress and protective behaviors
  const handleSaveStressValue = (field: 'stressWork' | 'stressFamily' | 'stressPersonal', value: number) => {
    const baseLog: DailyLog = currentLog || {
      date: trackerDate,
      notes: ''
    };

    onSaveLog({
      ...baseLog,
      [field]: value
    });
  };

  const handleSaveStressContext = (text: string) => {
    const baseLog: DailyLog = currentLog || {
      date: trackerDate,
      notes: ''
    };

    onSaveLog({
      ...baseLog,
      stressContext: text
    });
  };

  const toggleProtectiveBehavior = (field: 'mindfulnessDay' | 'psychotherapyDay' | 'hobbies' | 'lovedOnes' | 'natureContact') => {
    const baseLog: DailyLog = currentLog || {
      date: trackerDate,
      notes: ''
    };

    onSaveLog({
      ...baseLog,
      [field]: !baseLog[field]
    });
  };

  // Stress stats derived over last 30 days
  const stressStats = useMemo(() => {
    const recentLogs = logs.filter(l => l.stressWork !== undefined || l.stressFamily !== undefined || l.stressPersonal !== undefined).slice(-30);
    const count = recentLogs.length;
    if (count === 0) return null;

    let workSum = 0, familySum = 0, personalSum = 0;
    let workCount = 0, familyCount = 0, personalCount = 0;

    recentLogs.forEach(l => {
      if (l.stressWork !== undefined && l.stressWork !== null) { workSum += l.stressWork; workCount++; }
      if (l.stressFamily !== undefined && l.stressFamily !== null) { familySum += l.stressFamily; familyCount++; }
      if (l.stressPersonal !== undefined && l.stressPersonal !== null) { personalSum += l.stressPersonal; personalCount++; }
    });

    return {
      workAvg: workCount > 0 ? Number((workSum / workCount).toFixed(1)) : null,
      familyAvg: familyCount > 0 ? Number((familySum / familyCount).toFixed(1)) : null,
      personalAvg: personalCount > 0 ? Number((personalSum / personalCount).toFixed(1)) : null
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => { setBreathingActive(false); setActiveSubTab('tools'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'tools'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Wind className="w-4 h-4" />
          Exercício de Respiração Coerente
        </button>

        <button
          type="button"
          onClick={() => { setBreathingActive(false); setActiveSubTab('tracker'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'tracker'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Smile className="w-4 h-4" />
          Rastreador de Estresse Diário
        </button>

        <button
          type="button"
          onClick={() => { setBreathingActive(false); setActiveSubTab('coping'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'coping'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Compass className="w-4 h-4" />
          Estratégias de Enfrentamento (TCC)
        </button>

        <button
          type="button"
          onClick={() => { setBreathingActive(false); setActiveSubTab('questionnaires'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'questionnaires'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Escalas & Escores Clínicos
        </button>
      </div>

      {/* --- TAB CONTENT: BREATHING TOOLS --- */}
      {activeSubTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Interactive Guided Bubble Panel (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm text-center space-y-6 flex flex-col items-center justify-center min-h-[460px]">
            
            <div className="w-full text-left">
              <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest block">Exercício Clínico</span>
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 mt-0.5">
                Modulação Autonômica via Respiração de Ressonância
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xl">
                Respire devagar seguindo a expansão do círculo abaixo. Esta frequência (6 ciclos/min) maximiza a coerência cardíaca, equilibrando o sistema nervoso simpático e reduzindo a hipersensibilidade de dor no cérebro.
              </p>
            </div>

            {/* Breathing Bubble */}
            <div className="relative w-52 h-52 flex items-center justify-center my-4">
              {/* Outer expanding ring */}
              <div 
                className={`absolute inset-0 rounded-full bg-teal-500/10 dark:bg-teal-500/5 transition-all duration-1000 ${
                  breathingActive 
                    ? breathingPhase === 'inspire' 
                      ? 'scale-110 opacity-100' 
                      : 'scale-75 opacity-40'
                    : 'scale-90 opacity-40'
                }`}
              />

              {/* Middle animated circle */}
              <div 
                className={`absolute w-44 h-44 rounded-full border border-teal-300/40 bg-teal-500/5 dark:bg-teal-950/20 transition-all duration-1000 ease-in-out ${
                  breathingActive 
                    ? breathingPhase === 'inspire' 
                      ? 'scale-105 rotate-12' 
                      : 'scale-90 -rotate-12'
                    : 'scale-100'
                }`}
              />

              {/* Inner core circle with text */}
              <div 
                className={`w-36 h-36 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 dark:from-teal-600 dark:to-emerald-500 text-white flex flex-col items-center justify-center shadow-lg transition-transform duration-1000 ease-in-out ${
                  breathingActive && breathingPhase === 'inspire' ? 'scale-110' : 'scale-90'
                }`}
              >
                <Wind className="w-6 h-6 animate-pulse" />
                <span className="text-sm font-black uppercase tracking-wider mt-1.5 font-poppins">
                  {breathingActive ? (breathingPhase === 'inspire' ? 'Inspire' : 'Expire') : 'Pronto'}
                </span>
                {breathingActive && (
                  <span className="text-xs font-mono font-bold bg-black/10 px-2 py-0.5 rounded-full mt-1">
                    {breathingSecondsLeft}s
                  </span>
                )}
              </div>
            </div>

            {/* Session Timer & Sound Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-50 dark:border-slate-850 pt-5 w-full">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Sessão: <strong className="font-mono text-slate-700 dark:text-slate-200">{formattedTimeLeft}</strong></span>
              </div>

              {/* Sound toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  soundEnabled
                    ? 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/20 dark:border-teal-900'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                }`}
                title={soundEnabled ? 'Sons Ativos (Clique para silenciar)' : 'Silenciado (Clique para ativar bips acústicos)'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px] hidden sm:inline">{soundEnabled ? 'Áudio Ativo' : 'Áudio Mudo'}</span>
              </button>
            </div>

            {/* Command Buttons */}
            <div className="flex items-center gap-3">
              {!breathingActive ? (
                <button
                  type="button"
                  onClick={() => setBreathingActive(true)}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-teal-500/10"
                >
                  <Play className="w-4 h-4" /> Iniciar Exercício
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setBreathingActive(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" /> Pausar Sessão
                </button>
              )}
            </div>

            {completedBreathingToday && (
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2 px-4 rounded-xl flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Parabéns! Sessão realizada e arquivada como fator protetor de dor hoje.
              </div>
            )}
          </div>

          {/* Educational Sidebar (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-poppins font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-50 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-teal-500" /> Como isso atua no seu corpo?
            </h4>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">1. Desativação da Luta-ou-Fuga</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  O prolongamento da expiração ativa instantaneamente o nervo vago. Isso sinaliza ao cérebro que o corpo está seguro, reduzindo o batimento cardíaco e os hormônios de estresse (cortisol).
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">2. Alívio de Tensão Muscular</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pacientes com dor crônica tendem a respirar de forma superficial e rápida, o que tensiona a musculatura acessória do pescoço e ombros, agravando contraturas e cervicalgias.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">3. Reorganização Neuroquímica</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Focar na respiração ritmada ativa o córtex pré-frontal, inibindo o córtex insular e a amígdala que amplificam os estímulos de dor crônica.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Selecione a Duração</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 5].map((mins) => {
                  const isActive = timerDuration === mins * 60;
                  return (
                    <button
                      key={`timer-${mins}`}
                      type="button"
                      onClick={() => changeTimerPreset(mins)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900'
                      }`}
                    >
                      {mins} Min{mins > 1 ? 's' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: DAILY MOOD & STRESS TRACKER --- */}
      {activeSubTab === 'tracker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* Tracker configuration forms (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3 gap-2">
              <div>
                <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">
                  Estressores Clínicos e Fatores de Proteção
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Configure como foi a sua carga psicológica para a data selecionada.</p>
              </div>

              {/* Date Input */}
              <input
                type="date"
                value={trackerDate}
                max={todayISO()}
                onChange={(e) => {
                  if (e.target.value) setTrackerDate(e.target.value);
                }}
                className="p-1 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer focus:outline-none"
              />
            </div>

            {/* Three Stress Domains */}
            <div className="space-y-4">
              
              {/* Stress Work */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">📊 Nível de Estresse Ocupacional / Trabalho</span>
                  <span className="text-xs font-mono font-bold text-teal-500">
                    {currentLog?.stressWork ?? 0}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={currentLog?.stressWork ?? 0}
                  onChange={(e) => handleSaveStressValue('stressWork', parseInt(e.target.value))}
                  className="w-full accent-teal-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Tranquilo (0)</span>
                  <span>Sobrecarga Extrema (10)</span>
                </div>
              </div>

              {/* Stress Family */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🏠 Nível de Tensão Familiar / Doméstica</span>
                  <span className="text-xs font-mono font-bold text-teal-500">
                    {currentLog?.stressFamily ?? 0}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={currentLog?.stressFamily ?? 0}
                  onChange={(e) => handleSaveStressValue('stressFamily', parseInt(e.target.value))}
                  className="w-full accent-teal-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Harmonia (0)</span>
                  <span>Conflito Severo (10)</span>
                </div>
              </div>

              {/* Stress Personal */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">💭 Sobrecarga Mental & Ansiedade Pessoal</span>
                  <span className="text-xs font-mono font-bold text-teal-500">
                    {currentLog?.stressPersonal ?? 0}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={currentLog?.stressPersonal ?? 0}
                  onChange={(e) => handleSaveStressValue('stressPersonal', parseInt(e.target.value))}
                  className="w-full accent-teal-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Paz interior (0)</span>
                  <span>Hipervigilância / Crise (10)</span>
                </div>
              </div>

            </div>

            {/* Protective Behaviors Checkbox Grid */}
            <div className="space-y-2 border-t border-slate-50 dark:border-slate-850 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Atividades de Fortalecimento Emocional</span>
              <div className="grid grid-cols-2 gap-2.5">
                
                <button
                  type="button"
                  onClick={() => toggleProtectiveBehavior('mindfulnessDay')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                    currentLog?.mindfulnessDay
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100 dark:bg-slate-950 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Wind className="w-4 h-4 text-teal-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Meditação / Relaxamento</span>
                    <span className="text-[9px] text-slate-400 block font-medium">Atenção plena ou bips de respiração</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleProtectiveBehavior('psychotherapyDay')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                    currentLog?.psychotherapyDay
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100 dark:bg-slate-950 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smile className="w-4 h-4 text-pink-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Sessão de Psicoterapia</span>
                    <span className="text-[9px] text-slate-400 block font-medium">Sessão de suporte profissional realizada</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleProtectiveBehavior('hobbies')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                    currentLog?.hobbies
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100 dark:bg-slate-950 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Hobby / Lazer Saudável</span>
                    <span className="text-[9px] text-slate-400 block font-medium">Livros, música, escrita ou artes</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleProtectiveBehavior('lovedOnes')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                    currentLog?.lovedOnes
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100 dark:bg-slate-950 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Contato Social Positivo</span>
                    <span className="text-[9px] text-slate-400 block font-medium">Conversa estimulante com amigos/parceiro</span>
                  </div>
                </button>

              </div>
            </div>

            {/* Text Context */}
            <div className="space-y-1.5 border-t border-slate-50 dark:border-slate-850 pt-4">
              <label htmlFor="stress-context-area" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block cursor-pointer">
                Contexto Emocional e Eventos Relevantes
              </label>
              <textarea
                id="stress-context-area"
                className="inp w-full p-2.5 h-16 min-h-[64px] rounded-xl text-xs"
                placeholder="Ex: Tive uma reunião desgastante no trabalho à tarde que gerou contratura nos ombros, mas melhorei após meditação..."
                value={currentLog?.stressContext || ''}
                onChange={(e) => handleSaveStressContext(e.target.value)}
              />
            </div>
          </div>

          {/* Statistical Column (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            
            <div className="border-b border-slate-50 dark:border-slate-850 pb-2">
              <h4 className="font-poppins font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-500" /> Variação Clínica de Estressores
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Média ponderada baseada nos registros ativos dos últimos 30 dias.</p>
            </div>

            {stressStats ? (
              <div className="space-y-4 pt-1">
                {/* Work Stress Avg Bar */}
                {stressStats.workAvg !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Média Estresse Trabalho</span>
                      <span className="font-mono text-teal-600">{stressStats.workAvg}/10</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full" 
                        style={{ width: `${stressStats.workAvg * 10}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Family Stress Avg Bar */}
                {stressStats.familyAvg !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Média Estresse Familiar</span>
                      <span className="font-mono text-purple-600">{stressStats.familyAvg}/10</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${stressStats.familyAvg * 10}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Personal Stress Avg Bar */}
                {stressStats.personalAvg !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Média Sobrecarga Mental</span>
                      <span className="font-mono text-pink-600">{stressStats.personalAvg}/10</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-500 rounded-full" 
                        style={{ width: `${stressStats.personalAvg * 10}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Dynamic Correlation Message */}
                <div className="p-3 bg-purple-50/40 dark:bg-purple-950/10 border border-purple-100/40 dark:border-purple-900/20 rounded-xl text-[10.5px] text-purple-800 dark:text-purple-400 font-medium leading-relaxed">
                  💡 <strong>Correlação Clínica Importante:</strong> Crises de dores crônicas ocorrem frequentemente 24h a 48h após picos de sobrecarga ocupacional ou ansiedade pessoal devido à liberação prolongada de catecolaminas pró-nociceptivas. Manter seus estressores sob controle ajuda a quebrar esse ciclo somático.
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Dados Insuficientes</p>
                <p className="text-[10px] mt-0.5">Insira o estresse no painel ao lado para ver o balanço histórico.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: ACTIVE COPING CARDS --- */}
      {activeSubTab === 'coping' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50/40 dark:from-teal-950/15 dark:to-slate-900/50 p-4 border border-teal-100/50 dark:border-teal-900/30 text-xs text-teal-800 dark:text-teal-300 rounded-2xl flex gap-3 leading-relaxed shadow-sm">
            <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Treinamento Cognitivo Prático:</strong> Diferente da dor aguda que serve como alerta de lesão, a dor crônica funciona como um alarme residencial que disparou por defeito técnico (hipersensibilidade central). Utilize as técnicas estruturadas abaixo nos dias difíceis para ajudar a desarmar esse falso alarme.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {copingCards.map((card) => {
              const isExpanded = expandedCard === card.id;
              return (
                <div 
                  key={card.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 hover:border-slate-200 dark:hover:border-slate-800 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">
                        {card.category}
                      </span>
                    </div>

                    <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                      {card.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {card.description}
                    </p>

                    {/* Expanded Step-by-Step Instructions */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2.5 mt-2 animate-fade-in text-xs font-semibold">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Como Praticar Passo a Passo</span>
                        <ul className="space-y-2 text-slate-700 dark:text-slate-200">
                          {card.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-2 items-start leading-relaxed font-semibold">
                              <span className="font-mono text-teal-500 font-extrabold">{idx + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-[10px] text-teal-600 dark:text-teal-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Benefício Clínico: {card.impact}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                    className="w-full mt-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Recolher Guia' : 'Acessar Guia Completo'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PATIENT METRICS / CLINICAL QUESTIONNAIRES --- */}
      {activeSubTab === 'questionnaires' && (
        <div className="animate-fade-in bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <PatientMetrics patientData={patientData} onSaveMetric={onSaveMetric} />
        </div>
      )}

    </div>
  );
};
