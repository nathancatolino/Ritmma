/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component BodyPainMap / VisualPainHistoryMap:
 * Interactive human silhouette (Front & Back) for visual pain recording and
 * longitudinal pain history tracking integrated into the patient's main view.
 */

import React, { useState, useMemo } from 'react';
import { DailyLog, PatientData } from '../types';
import { todayISO, fmtDate } from '../utils';
import { 
  Activity, 
  Sparkles, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp, 
  Award, 
  Heart, 
  User, 
  Wand2, 
  RefreshCw, 
  X, 
  Sparkle, 
  Zap, 
  ShieldAlert, 
  Clock,
  History,
  CheckCircle2,
  Filter,
  BarChart2,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';

export interface BodyPainMapProps {
  logs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
  patientData?: PatientData;
  onUpdatePatientData?: (updater: (profile: PatientData) => void) => void;
  isEmbedded?: boolean;
}

export interface BodyRegion {
  key: string;
  label: string;
  side: 'front' | 'back';
  category: 'head_neck' | 'upper_body' | 'arms' | 'spine_pelvis' | 'legs';
  x: number;
  y: number;
  description: string;
}

export const ANATOMICAL_REGIONS: BodyRegion[] = [
  // FRONT VIEW (Centered at x = 100, y: 50 to 445)
  { key: 'cabeça_frente', label: 'Cabeça', side: 'front', category: 'head_neck', x: 100, y: 50, description: 'Cefaleia, dor temporomandibular ou facial' },
  { key: 'pescoço_frente', label: 'Pescoço Anterior', side: 'front', category: 'head_neck', x: 100, y: 92, description: 'Garganta, tireoide ou cervical anterior' },
  { key: 'ombro_esquerdo_frente', label: 'Ombro Esquerdo', side: 'front', category: 'upper_body', x: 60, y: 110, description: 'Articulação do ombro esquerdo' },
  { key: 'ombro_direito_frente', label: 'Ombro Direito', side: 'front', category: 'upper_body', x: 140, y: 110, description: 'Articulação do ombro direito' },
  { key: 'peito_frente', label: 'Tórax / Peito', side: 'front', category: 'upper_body', x: 100, y: 140, description: 'Costelas, esterno ou musculatura peitoral' },
  { key: 'cotovelo_esquerdo_frente', label: 'Cotovelo Esquerdo', side: 'front', category: 'arms', x: 42, y: 175, description: 'Face anterior ou articulação do cotovelo' },
  { key: 'cotovelo_direito_frente', label: 'Cotovelo Direito', side: 'front', category: 'arms', x: 158, y: 175, description: 'Face anterior ou articulação do cotovelo' },
  { key: 'abdômen_frente', label: 'Abdômen', side: 'front', category: 'upper_body', x: 100, y: 195, description: 'Dor visceral, estomacal ou muscular abdominal' },
  { key: 'punho_mão_esquerda_frente', label: 'Punho / Mão Esquerda', side: 'front', category: 'arms', x: 28, y: 235, description: 'Pequenas articulações e punho esquerdo' },
  { key: 'punho_mão_direita_frente', label: 'Punho / Mão Direita', side: 'front', category: 'arms', x: 172, y: 235, description: 'Pequenas articulações e punho direito' },
  { key: 'quadril_esquerdo_frente', label: 'Quadril Esquerdo', side: 'front', category: 'spine_pelvis', x: 74, y: 245, description: 'Articulação coxo-femoral esquerda' },
  { key: 'quadril_direito_frente', label: 'Quadril Direito', side: 'front', category: 'spine_pelvis', x: 126, y: 245, description: 'Articulação coxo-femoral direita' },
  { key: 'coxa_esquerda_frente', label: 'Coxa Esquerda', side: 'front', category: 'legs', x: 76, y: 295, description: 'Musculatura quadríceps esquerda' },
  { key: 'coxa_direita_frente', label: 'Coxa Direita', side: 'front', category: 'legs', x: 124, y: 295, description: 'Musculatura quadríceps direita' },
  { key: 'joelho_esquerdo_frente', label: 'Joelho Esquerdo', side: 'front', category: 'legs', x: 76, y: 345, description: 'Articulação patelar e ligamentos' },
  { key: 'joelho_direito_frente', label: 'Joelho Direito', side: 'front', category: 'legs', x: 124, y: 345, description: 'Articulação patelar e ligamentos' },
  { key: 'canela_panturrilha_esquerda_frente', label: 'Canela Esquerda', side: 'front', category: 'legs', x: 74, y: 395, description: 'Face anterior da tíbia esquerda' },
  { key: 'canela_panturrilha_direita_frente', label: 'Canela Direita', side: 'front', category: 'legs', x: 126, y: 395, description: 'Face anterior da tíbia direita' },
  { key: 'pé_esquerdo_frente', label: 'Pé Esquerdo', side: 'front', category: 'legs', x: 70, y: 445, description: 'Articulações do tarso, metatarso e dedos' },
  { key: 'pé_direito_frente', label: 'Pé Direito', side: 'front', category: 'legs', x: 130, y: 445, description: 'Articulações do tarso, metatarso e dedos' },

  // BACK VIEW (Centered at x = 300, y: 50 to 445)
  { key: 'nuca_cabeça_atrás', label: 'Cabeça Posterior / Nuca', side: 'back', category: 'head_neck', x: 300, y: 50, description: 'Região occipital ou cefaleia tensional' },
  { key: 'pescoço_cervical_atrás', label: 'Pescoço / Cervical', side: 'back', category: 'head_neck', x: 300, y: 92, description: 'Coluna cervical e trapézio superior' },
  { key: 'ombro_esquerdo_atrás', label: 'Ombro Esquerdo Posterior', side: 'back', category: 'upper_body', x: 260, y: 110, description: 'Escápula ou ombro posterior esquerdo' },
  { key: 'ombro_direito_atrás', label: 'Ombro Direito Posterior', side: 'back', category: 'upper_body', x: 340, y: 110, description: 'Escápula ou ombro posterior direito' },
  { key: 'costas_superior_atrás', label: 'Dorso / Torácica', side: 'back', category: 'spine_pelvis', x: 300, y: 145, description: 'Coluna torácica ou região interescapular' },
  { key: 'cotovelo_esquerdo_atrás', label: 'Cotovelo Esquerdo Posterior', side: 'back', category: 'arms', x: 242, y: 175, description: 'Olécrano ou face posterior' },
  { key: 'cotovelo_direito_atrás', label: 'Cotovelo Direito Posterior', side: 'back', category: 'arms', x: 358, y: 175, description: 'Olécrano ou face posterior' },
  { key: 'lombar_atrás', label: 'Coluna Lombar', side: 'back', category: 'spine_pelvis', x: 300, y: 205, description: 'Região lombar ou transição lombo-sacra' },
  { key: 'mão_esquerda_atrás', label: 'Mão Esquerda Posterior', side: 'back', category: 'arms', x: 228, y: 235, description: 'Dorso da mão e punho esquerdo' },
  { key: 'mão_direita_atrás', label: 'Mão Direita Posterior', side: 'back', category: 'arms', x: 372, y: 235, description: 'Dorso da mão e punho direito' },
  { key: 'glúteo_quadril_esquerdo_atrás', label: 'Glúteo / Quadril Esquerdo', side: 'back', category: 'spine_pelvis', x: 274, y: 250, description: 'Região glútea ou quadril posterior' },
  { key: 'glúteo_quadril_direito_atrás', label: 'Glúteo / Quadril Direito', side: 'back', category: 'spine_pelvis', x: 326, y: 250, description: 'Região glútea ou quadril posterior' },
  { key: 'coxa_esquerda_atrás', label: 'Coxa Esquerda Posterior', side: 'back', category: 'legs', x: 276, y: 300, description: 'Isquiotibiais' },
  { key: 'coxa_direita_atrás', label: 'Coxa Direita Posterior', side: 'back', category: 'legs', x: 324, y: 300, description: 'Isquiotibiais' },
  { key: 'joelho_esquerdo_atrás', label: 'Joelho Esquerdo Posterior', side: 'back', category: 'legs', x: 276, y: 350, description: 'Fossa poplítea' },
  { key: 'joelho_direito_atrás', label: 'Joelho Direito Posterior', side: 'back', category: 'legs', x: 324, y: 350, description: 'Fossa poplítea' },
  { key: 'panturrilha_esquerda_atrás', label: 'Panturrilha Esquerda', side: 'back', category: 'legs', x: 274, y: 400, description: 'Músculo gastrocnêmio' },
  { key: 'panturrilha_direita_atrás', label: 'Panturrilha Direita', side: 'back', category: 'legs', x: 326, y: 400, description: 'Músculo gastrocnêmio' },
  { key: 'calcanhar_pé_esquerdo_atrás', label: 'Calcanhar / Pé Esquerdo', side: 'back', category: 'legs', x: 270, y: 445, description: 'Tendão de Aquiles ou sola do pé' },
  { key: 'calcanhar_pé_direito_atrás', label: 'Calcanhar / Pé Direito', side: 'back', category: 'legs', x: 330, y: 445, description: 'Tendão de Aquiles ou sola do pé' }
];

export const PAIN_CHARACTERS = [
  { key: 'queimacao', label: 'Queimação / Calor', icon: '🔥' },
  { key: 'pontada', label: 'Pontada / Agulhada', icon: '⚡' },
  { key: 'peso', label: 'Peso / Pressão', icon: '🪨' },
  { key: 'pulsatil', label: 'Pulsátil / Latejante', icon: '💓' },
  { key: 'choque', label: 'Choque / Dormência', icon: '🔌' },
  { key: 'rigidez', label: 'Rigidez Muscular', icon: '🔒' }
];

export const BodyPainMap: React.FC<BodyPainMapProps> = ({ 
  logs, 
  onSaveLog,
  patientData,
  onUpdatePatientData,
  isEmbedded = false
}) => {
  // Selected date for visualization and editing
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  // Selected body region for interactive scoring
  const [selectedRegionKey, setSelectedRegionKey] = useState<string | null>(null);
  // View mode filter (all, front only, back only)
  const [viewFilter, setViewFilter] = useState<'both' | 'front' | 'back'>('both');
  // Safe in-app confirmation modal for clearing day's map
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Show AI silhouette calibration drawer
  const [showIaCustomizer, setShowIaCustomizer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);
  // Toast notification for instant saves
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Current log for selected date
  const currentLog = useMemo(() => {
    return logs.find((l) => l.date === selectedDate) || null;
  }, [logs, selectedDate]);

  // Current pain map: regionKey -> score (0-10)
  const currentPainMap: Record<string, number> = useMemo(() => {
    return currentLog?.bodyPainMap || {};
  }, [currentLog]);

  const activeRegion = useMemo(() => {
    if (!selectedRegionKey) return null;
    return ANATOMICAL_REGIONS.find((r) => r.key === selectedRegionKey) || null;
  }, [selectedRegionKey]);

  // Trigger feedback toast
  const triggerSaveToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Update specific pain point intensity
  const handleUpdateRegionPain = (score: number) => {
    if (!selectedRegionKey) return;
    const updatedMap = { ...currentPainMap };
    const regLabel = activeRegion?.label || selectedRegionKey;

    if (score === 0) {
      delete updatedMap[selectedRegionKey];
      triggerSaveToast(`${regLabel}: Dor removida`);
    } else {
      updatedMap[selectedRegionKey] = score;
      triggerSaveToast(`${regLabel}: Dor ${score}/10 registrada`);
    }

    // Base log construction
    const baseLog: DailyLog = currentLog || {
      date: selectedDate,
      pain: undefined,
      fatigue: undefined,
      sleep: undefined,
      function: undefined,
      worstPain: undefined,
      stiffness: undefined,
      mood: undefined,
      notes: ''
    };

    // Calculate auto pain scores if not manually set
    const activeValues = Object.values(updatedMap);
    let autoPain = baseLog.pain;
    let autoWorst = baseLog.worstPain;

    if (activeValues.length > 0) {
      const avg = Math.round(activeValues.reduce((sum, v) => sum + v, 0) / activeValues.length);
      const max = Math.max(...activeValues);
      
      if (baseLog.pain === undefined || baseLog.pain === null) {
        autoPain = avg;
      }
      if (baseLog.worstPain === undefined || baseLog.worstPain === null || max > (baseLog.worstPain || 0)) {
        autoWorst = max;
      }
    }

    onSaveLog({
      ...baseLog,
      pain: autoPain,
      worstPain: autoWorst,
      bodyPainMap: updatedMap
    });
  };

  // Safe in-app clear
  const handleConfirmClear = () => {
    if (currentLog) {
      onSaveLog({
        ...currentLog,
        bodyPainMap: {}
      });
      triggerSaveToast('Pontos de dor do dia limpos');
    }
    setShowClearConfirm(false);
    setSelectedRegionKey(null);
  };

  // Toggle pain sensation characteristic
  const handleTogglePainCharacter = (trait: string) => {
    const baseLog: DailyLog = currentLog || {
      date: selectedDate,
      notes: ''
    };
    const currentTraits = baseLog.painCharacter || [];
    const nextTraits = currentTraits.includes(trait)
      ? currentTraits.filter((t) => t !== trait)
      : [...currentTraits, trait];

    onSaveLog({
      ...baseLog,
      painCharacter: nextTraits
    });
    triggerSaveToast('Característica de dor atualizada');
  };

  // Quick Flare-up Check-in Presets
  const handleApplyFlarePreset = (type: 'severe' | 'moderate' | 'fatigue_fog' | 'mild_stable') => {
    const baseLog: DailyLog = currentLog || {
      date: selectedDate,
      notes: ''
    };

    if (type === 'severe') {
      onSaveLog({
        ...baseLog,
        pain: 8,
        worstPain: 9,
        fatigue: 8,
        notes: (baseLog.notes ? baseLog.notes + '\n' : '') + '[Registro Rápido]: Crise Aguda / Flare Intenso.',
        bodyPainMap: Object.keys(baseLog.bodyPainMap || {}).length > 0 ? baseLog.bodyPainMap : {
          'costas_superior_atrás': 8,
          'lombar_atrás': 8,
          'pescoço_cervical_atrás': 7
        }
      });
      triggerSaveToast('Preset de Crise Aguda aplicado!');
    } else if (type === 'moderate') {
      onSaveLog({
        ...baseLog,
        pain: 5,
        worstPain: 6,
        fatigue: 5,
        notes: (baseLog.notes ? baseLog.notes + '\n' : '') + '[Registro Rápido]: Dor moderada e sobrecarga.'
      });
      triggerSaveToast('Preset de Dor Moderada aplicado!');
    } else if (type === 'fatigue_fog') {
      onSaveLog({
        ...baseLog,
        fatigue: 9,
        brainFog: 8,
        pain: baseLog.pain ?? 4,
        worstPain: baseLog.worstPain ?? 5,
        notes: (baseLog.notes ? baseLog.notes + '\n' : '') + '[Registro Rápido]: Exaustão severa e névoa mental.'
      });
      triggerSaveToast('Preset de Fadiga e Névoa aplicado!');
    } else if (type === 'mild_stable') {
      onSaveLog({
        ...baseLog,
        pain: 2,
        worstPain: 3,
        fatigue: 3,
        function: 7,
        notes: (baseLog.notes ? baseLog.notes + '\n' : '') + '[Registro Rápido]: Dia estável com dor sob controle.'
      });
      triggerSaveToast('Preset de Dia Estável aplicado!');
    }
  };

  // Calibrate silhouette from biometrics
  const handleCalibrateBiotype = () => {
    if (!onUpdatePatientData) return;
    setIsGenerating(true);
    const autoGender = patientData?.gender || 'F';
    const h = patientData?.height || 170;
    const w = patientData?.weight || 70;
    const hM = h / 100;
    const imc = w / (hM * hM);
    const autoBiotype = imc < 18.5 ? 'slim' : imc >= 26 ? 'strong' : 'average';

    try {
      onUpdatePatientData((profile) => {
        profile.customSilhouetteBiotype = autoBiotype;
        profile.customSilhouetteStyle = 'clinical';
        profile.gender = autoGender;
      });
      setGenSuccessMsg('Silhueta clínica calibrada com suas medidas de perfil (Gênero e Biótipo)!');
      setTimeout(() => setGenSuccessMsg(null), 5000);
    } finally {
      setIsGenerating(false);
      setShowIaCustomizer(false);
    }
  };

  // Restore silhouette
  const handleRestoreDefaultSilhouette = () => {
    if (!onUpdatePatientData) return;
    onUpdatePatientData((profile) => {
      delete profile.customSilhouetteSvg;
      delete profile.customSilhouetteBiotype;
      delete profile.customSilhouetteStyle;
    });
    setGenSuccessMsg('Silhueta restaurada para o padrão clínico!');
    setTimeout(() => setGenSuccessMsg(null), 3000);
  };

  // Stats for the currently selected day
  const currentDayStats = useMemo(() => {
    const entries = Object.entries(currentPainMap);
    const count = entries.length;
    const avg = count > 0 ? (entries.reduce((sum, [, v]) => sum + v, 0) / count).toFixed(1) : '0.0';
    
    let worstName = 'Nenhum';
    let worstVal = 0;
    let frontCount = 0;
    let backCount = 0;

    entries.forEach(([key, val]) => {
      const reg = ANATOMICAL_REGIONS.find((r) => r.key === key);
      if (reg) {
        if (reg.side === 'front') frontCount++;
        else backCount++;
        if (val > worstVal) {
          worstVal = val;
          worstName = `${reg.label} (${val}/10)`;
        }
      }
    });

    return { count, avg, worstName, worstVal, frontCount, backCount };
  }, [currentPainMap]);

  // Longitudinal hotspot stats (last 30 days)
  const hotspotStats = useMemo(() => {
    const thirtyDaysLogs = logs.slice(-30);
    const frequencyMap: Record<string, { count: number; totalIntensity: number; label: string }> = {};

    thirtyDaysLogs.forEach((l) => {
      if (l.bodyPainMap) {
        Object.entries(l.bodyPainMap).forEach(([key, score]) => {
          const numScore = Number(score);
          if (numScore > 0) {
            const reg = ANATOMICAL_REGIONS.find((r) => r.key === key);
            const label = reg?.label || key;
            if (!frequencyMap[key]) {
              frequencyMap[key] = { count: 0, totalIntensity: 0, label };
            }
            frequencyMap[key].count += 1;
            frequencyMap[key].totalIntensity += numScore;
          }
        });
      }
    });

    const sorted = Object.entries(frequencyMap)
      .map(([key, data]) => ({
        key,
        label: data.label,
        count: data.count,
        avgIntensity: (data.totalIntensity / data.count).toFixed(1),
        percentage: Math.round((data.count / Math.max(1, thirtyDaysLogs.length)) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 5);
  }, [logs]);

  // Recent 14-day history timeline entries
  const recentDaysList = useMemo(() => {
    const dates: { date: string; label: string; painCount: number; maxPain: number; generalPain: number | null }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const log = logs.find((l) => l.date === iso);
      const painMap = log?.bodyPainMap || {};
      const painValues = Object.values(painMap).map(Number).filter((v) => !isNaN(v));
      const painCount = painValues.filter((v) => v > 0).length;
      const maxPain = painValues.length > 0 ? Math.max(...painValues) : 0;
      
      const dayLabel = i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : fmtDate(iso, 's');
      dates.push({
        date: iso,
        label: dayLabel,
        painCount,
        maxPain,
        generalPain: log?.pain ?? null
      });
    }
    return dates;
  }, [logs]);

  return (
    <div className={`space-y-5 ${isEmbedded ? '' : 'p-2'}`} id="pain-history-silhouette">
      {/* HEADER: Title & Quick Date Scrubber */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 inline-block">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Silhueta Anatômica & Registro de Dor
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60 uppercase tracking-wider">
                  Mapa Corporal
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione áreas no corpo para registrar a intensidade da dor de hoje ou navegue nos dias anteriores para ver o histórico anatômico.
            </p>
          </div>

          {/* Quick Date Control */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 rounded-xl text-slate-500 cursor-pointer transition-colors"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="p-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
            />

            <button
              type="button"
              disabled={selectedDate === todayISO()}
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 rounded-xl text-slate-500 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedDate !== todayISO() && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayISO())}
                className="px-2.5 py-1.5 text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer"
              >
                Voltar para Hoje
              </button>
            )}
          </div>
        </div>

        {/* 14-DAY TIMELINE SCRUBBER: Visual interactive strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-teal-500" />
              Histórico Recente (Toque na data para ver o mapa daquele dia):
            </span>
            <span>{selectedDate === todayISO() ? 'Exibindo: Hoje' : `Exibindo: ${fmtDate(selectedDate, 's')}`}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {recentDaysList.map((day) => {
              const isSelected = day.date === selectedDate;
              const hasPain = day.painCount > 0;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-between p-2 rounded-2xl min-w-[56px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500 text-white border-teal-600 shadow-sm scale-105'
                      : hasPain
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {day.label}
                  </span>
                  
                  {/* Dot / Pain Indicator */}
                  <div className="my-1 flex items-center justify-center">
                    {hasPain ? (
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          isSelected
                            ? 'bg-white text-teal-700 shadow-xs'
                            : day.maxPain >= 7
                            ? 'bg-rose-500 text-white animate-pulse'
                            : day.maxPain >= 4
                            ? 'bg-orange-500 text-white'
                            : 'bg-amber-400 text-slate-900'
                        }`}
                      >
                        {day.painCount}
                      </span>
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-teal-200' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    )}
                  </div>

                  <span className={`text-[9px] font-medium ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                    {day.generalPain != null ? `${day.generalPain}/10` : hasPain ? `${day.maxPain}/10` : '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {saveToast && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>

      {/* QUICK FLARE / CRISIS 1-TAP PRESET BAR */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-3xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Registro Rápido de Estado ({selectedDate === todayISO() ? 'Hoje' : fmtDate(selectedDate, 's')})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> 1 toque para economizar energia nos dias difíceis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleApplyFlarePreset('severe')}
            className="p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Crise Aguda</span>
              <span className="text-xs">🚨</span>
            </div>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Dor 8/10, Fadiga intensa</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyFlarePreset('moderate')}
            className="p-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Dor Moderada</span>
              <span className="text-xs">⚡</span>
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Dor 5/10, Sobrecarga</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyFlarePreset('fatigue_fog')}
            className="p-2.5 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/70 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300">Fadiga & Fog</span>
              <span className="text-xs">🧠</span>
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Fadiga 9/10, Névoa 8/10</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyFlarePreset('mild_stable')}
            className="p-2.5 rounded-2xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/70 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">Dia Estável</span>
              <span className="text-xs">🛡️</span>
            </div>
            <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">Dor leve 2/10, Funcional</p>
          </button>
        </div>
      </div>

      {/* MAIN VISUAL WORKSPACE: SILHOUETTE + RATING CONTROLS + SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: THE HUMAN SILHOUETTE (ANTERIOR & POSTERIOR) (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-4 flex flex-col items-center">
          
          {/* Top toolbar over silhouette */}
          <div className="w-full flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Visualização:
              </span>
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewFilter('both')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'both'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Frente & Costas
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('front')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'front'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Frente
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('back')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'back'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Costas
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIaCustomizer(!showIaCustomizer)}
              className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-teal-200 dark:border-teal-900/60"
            >
              <Wand2 className="w-3 h-3" /> Calibrar Biótipo
            </button>
          </div>

          {/* Biotype Calibrator Box */}
          {showIaCustomizer && (
            <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-2.5 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-teal-500" /> Calibração Antropométrica da Silhueta
                </span>
                <button
                  type="button"
                  onClick={() => setShowIaCustomizer(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                A silhueta é ajustada com base na sua altura ({patientData?.height || 170} cm), peso ({patientData?.weight || 70} kg) e gênero para proporcionalidade clínica.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleCalibrateBiotype}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Confirmar Calibração
                </button>
                {patientData?.customSilhouetteBiotype && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaultSilhouette}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                )}
              </div>
            </div>
          )}

          {genSuccessMsg && (
            <div className="w-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-2.5 rounded-xl text-xs text-teal-800 dark:text-teal-300 font-semibold flex items-center gap-2 animate-in fade-in">
              <Sparkle className="w-4 h-4 text-teal-600" />
              <span>{genSuccessMsg}</span>
            </div>
          )}

          {/* Instruction banner */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <strong>Como registrar:</strong> Toque em qualquer círculo (pin) no corpo para definir a intensidade.
            </span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {currentDayStats.count} pontos ativos
            </span>
          </div>

          {/* THE SVG VECTOR SILHOUETTE */}
          <div className="relative w-full max-w-[440px] aspect-[4/5] bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-2 border border-slate-100 dark:border-slate-800 flex items-center justify-center select-none">
            
            {/* Front & Back visual labels */}
            {(viewFilter === 'both' || viewFilter === 'front') && (
              <div className="absolute left-6 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                Frente
              </div>
            )}
            {(viewFilter === 'both' || viewFilter === 'back') && (
              <div className="absolute right-6 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                Costas
              </div>
            )}

            <svg
              viewBox={
                viewFilter === 'front'
                  ? '0 0 200 500'
                  : viewFilter === 'back'
                  ? '200 0 200 500'
                  : '0 0 400 500'
              }
              className="w-full h-full select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* FRONT VIEW SILHOUETTE */}
              {(viewFilter === 'both' || viewFilter === 'front') && (
                <g id="body-front-outline">
                  {/* Head */}
                  <ellipse cx="100" cy="50" rx="16" ry="21" className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  {/* Left Arm Front */}
                  <path 
                    d="M 92,71 C 86,75 80,82 72,88 C 62,95 50,102 44,110 C 38,118 36,128 35,138 C 33,158 35,182 39,202 C 41,212 43,222 44,232 C 44.5,236 43,240 39,242 C 34,244.5 28,242 26,236 C 24,230 23,218 25,200 C 27,180 30,160 34,140 C 38,120 44,104 52,94 C 60,84 72,78 84,76 C 88,75 90,73 90,71 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Right Arm Front */}
                  <path 
                    d="M 108,71 C 114,75 120,82 128,88 C 138,95 150,102 156,110 C 162,118 164,128 165,138 C 167,158 165,182 161,202 C 159,212 157,222 156,232 C 155.5,236 157,240 161,242 C 166,244.5 172,242 174,236 C 176,230 177,218 175,200 C 173,180 170,160 166,140 C 162,120 156,104 148,94 C 140,84 128,78 116,76 C 112,75 110,73 110,71 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Torso Front */}
                  <path 
                    d="M 91,68 C 91,78 88,82 82,85 C 76,88 68,93 64,102 C 60,110 58,118 58,126 L 58,212 C 58,222 61,228 66,234 C 71,239 76,241 82,242 L 118,242 C 124,241 129,239 134,234 C 139,228 142,222 142,212 L 142,126 C 142,118 140,110 136,102 C 132,93 124,88 118,85 C 112,82 109,78 109,68 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Left Leg Front */}
                  <path 
                    d="M 70,240 L 76,345 L 74,445 L 64,445 L 66,345 L 85,240 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Right Leg Front */}
                  <path 
                    d="M 130,240 L 124,345 L 126,445 L 136,445 L 134,345 L 115,240 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Anatomical Contours Front */}
                  <path d="M 70,95 Q 100,105 130,95" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <path d="M 68,136 Q 100,146 132,136 M 100,138 L 100,165" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <path d="M 82,185 Q 100,188 118,185 M 80,208 Q 100,211 120,208" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <circle cx="76" cy="345" r="4.5" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <circle cx="124" cy="345" r="4.5" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                </g>
              )}

              {/* BACK VIEW SILHOUETTE */}
              {(viewFilter === 'both' || viewFilter === 'back') && (
                <g id="body-back-outline">
                  {/* Head Back */}
                  <ellipse cx="300" cy="50" rx="16" ry="21" className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  {/* Left Arm Back */}
                  <path 
                    d="M 292,71 C 286,75 280,82 272,88 C 262,95 250,102 244,110 C 238,118 236,128 235,138 C 233,158 235,182 239,202 C 241,212 243,222 244,232 C 244.5,236 243,240 239,242 C 234,244.5 228,242 226,236 C 224,230 223,218 225,200 C 227,180 230,160 234,140 C 238,120 244,104 252,94 C 260,84 272,78 284,76 C 288,75 290,73 290,71 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Right Arm Back */}
                  <path 
                    d="M 308,71 C 314,75 320,82 328,88 C 338,95 350,102 356,110 C 362,118 364,128 365,138 C 367,158 365,182 361,202 C 359,212 357,222 356,232 C 355.5,236 357,240 361,242 C 366,244.5 372,242 374,236 C 376,230 377,218 375,200 C 373,180 370,160 366,140 C 362,120 356,104 348,94 C 340,84 328,78 316,76 C 312,75 310,73 310,71 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Torso Back */}
                  <path 
                    d="M 291,68 C 291,78 288,82 282,85 C 276,88 268,93 264,102 C 260,110 258,118 258,126 L 258,212 C 258,222 261,228 266,234 C 271,239 276,241 282,242 L 318,242 C 324,241 329,239 334,234 C 339,228 342,222 342,212 L 342,126 C 342,118 340,110 336,102 C 332,93 324,88 318,85 C 312,82 309,78 309,68 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Left Leg Back */}
                  <path 
                    d="M 270,240 L 276,345 L 274,445 L 264,445 L 266,345 L 285,240 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Right Leg Back */}
                  <path 
                    d="M 330,240 L 324,345 L 326,445 L 336,445 L 334,345 L 315,240 Z" 
                    className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
                  />
                  {/* Spine and Contours Back */}
                  <path d="M 300,92 L 300,234" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1 stroke-dasharray-[2,2]" />
                  <path d="M 284,124 Q 274,134 280,148 Q 288,143 290,129 Z" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <path d="M 316,124 Q 326,134 320,148 Q 312,143 310,129 Z" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <path d="M 282,195 Q 300,191 318,195" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                  <path d="M 270,350 Q 276,348 282,350 M 318,350 Q 324,348 330,350" fill="none" className="stroke-slate-200 dark:stroke-slate-700/60 stroke-1" />
                </g>
              )}

              {/* ACTIVE HIGHLIGHT RING FOR SELECTED REGION */}
              {ANATOMICAL_REGIONS.map((reg) => {
                if (reg.key !== selectedRegionKey) return null;
                if (viewFilter === 'front' && reg.side === 'back') return null;
                if (viewFilter === 'back' && reg.side === 'front') return null;
                return (
                  <circle
                    key={`high-${reg.key}`}
                    cx={reg.x}
                    cy={reg.y}
                    r={20}
                    className="fill-teal-500/15 stroke-teal-500 stroke-[1.8] stroke-dasharray-[3,3] animate-spin"
                    style={{ transformOrigin: `${reg.x}px ${reg.y}px`, animationDuration: '8s' }}
                  />
                );
              })}

              {/* RENDER THE TOUCHABLE ANATOMICAL HOTSPOTS (PINS) */}
              {ANATOMICAL_REGIONS.map((reg) => {
                if (viewFilter === 'front' && reg.side === 'back') return null;
                if (viewFilter === 'back' && reg.side === 'front') return null;

                const val = currentPainMap[reg.key];
                const isActive = reg.key === selectedRegionKey;
                const hasPain = val !== undefined && val > 0;

                return (
                  <g 
                    key={reg.key}
                    className="group cursor-pointer"
                    onClick={() => setSelectedRegionKey(reg.key)}
                  >
                    {/* Generous touch target (44px diameter) */}
                    <circle
                      cx={reg.x}
                      cy={reg.y}
                      r={22}
                      className="fill-transparent stroke-none cursor-pointer"
                    />

                    {/* Outer pulse for severe pain (>= 7) */}
                    {hasPain && val >= 7 && (
                      <circle 
                        cx={reg.x} 
                        cy={reg.y} 
                        r={16} 
                        className="fill-none stroke-rose-500/60 dark:stroke-rose-400/60 stroke-1.5 animate-ping"
                        style={{ transformOrigin: `${reg.x}px ${reg.y}px`, animationDuration: '2.5s' }}
                      />
                    )}

                    {/* Active pin glow */}
                    {isActive && (
                      <circle
                        cx={reg.x}
                        cy={reg.y}
                        r={15}
                        className="fill-none stroke-teal-500/40 dark:stroke-teal-400/40 stroke-2 animate-pulse"
                      />
                    )}

                    {/* Hover highlight circle */}
                    <circle
                      cx={reg.x}
                      cy={reg.y}
                      r={isActive ? 12 : 9.5}
                      className="fill-none stroke-teal-400/0 group-hover:stroke-teal-400/70 group-hover:stroke-[1.5] transition-all duration-150"
                    />

                    {/* Visible Pin Circle */}
                    <circle
                      cx={reg.x}
                      cy={reg.y}
                      r={isActive ? 10 : 8}
                      className={`transition-all duration-200 ${
                        isActive 
                          ? 'stroke-slate-900 dark:stroke-slate-100 stroke-2 shadow-lg' 
                          : 'stroke-white dark:stroke-slate-950 stroke-[1.5]'
                      }`}
                      fill={
                        !hasPain
                          ? 'rgba(148, 163, 184, 0.55)'
                          : val <= 3
                          ? '#f59e0b' // amber-500
                          : val <= 6
                          ? '#ea580c' // orange-600
                          : '#e11d48' // rose-600
                      }
                    />

                    {/* Score Number inside Pin */}
                    {hasPain && (
                      <text
                        x={reg.x}
                        y={reg.y + 3.2}
                        textAnchor="middle"
                        className="text-[8.5px] font-black fill-white dark:fill-slate-100 font-sans pointer-events-none select-none"
                      >
                        {val}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Quick in-canvas floating score selector when region is tapped */}
            {activeRegion && (
              <div className="absolute inset-x-3 bottom-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-xl space-y-2.5 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
                      Classificar Dor Local
                    </span>
                    <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-500" />
                      {activeRegion.label}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({activeRegion.side === 'front' ? 'Frente' : 'Costas'})
                      </span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      (currentPainMap[activeRegion.key] || 0) === 0
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        : currentPainMap[activeRegion.key] <= 3
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        : currentPainMap[activeRegion.key] <= 6
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                      {currentPainMap[activeRegion.key] !== undefined && currentPainMap[activeRegion.key] > 0
                        ? `Dor: ${currentPainMap[activeRegion.key]}/10`
                        : 'Sem dor'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedRegionKey(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 1-tap rating buttons 0 to 10 */}
                <div className="space-y-1">
                  <div className="grid grid-cols-11 gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isCurrent = (currentPainMap[activeRegion.key] || 0) === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleUpdateRegionPain(score)}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            isCurrent
                              ? score === 0
                                ? 'bg-slate-600 text-white shadow-xs'
                                : score <= 3
                                ? 'bg-amber-500 text-white shadow-xs'
                                : score <= 6
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[8px] font-semibold text-slate-400 px-0.5">
                    <span>0: Sem Dor</span>
                    <span>5: Moderada</span>
                    <span>10: Máxima</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Color Key */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-300/80 rounded-full inline-block border border-white dark:border-slate-800" />
              Sem dor (0)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500 rounded-full inline-block border border-white dark:border-slate-800" />
              Leve (1-3)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-orange-500 rounded-full inline-block border border-white dark:border-slate-800" />
              Moderada (4-6)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-600 rounded-full inline-block border border-white dark:border-slate-800 animate-pulse" />
              Intensa (7-10)
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: REGION DETAIL / PAIN PROFILE & 30-DAY HOTSPOTS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* CARD 1: Selected Region Focus Or Quick Picker */}
          {activeRegion ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3.5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
                    Região em Foco
                  </span>
                  <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-500" />
                    {activeRegion.label}
                  </h4>
                </div>
                
                <span className={`px-2.5 py-1 text-xs font-bold rounded-xl ${
                  (currentPainMap[activeRegion.key] || 0) === 0
                    ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    : currentPainMap[activeRegion.key] <= 3
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    : currentPainMap[activeRegion.key] <= 6
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                }`}>
                  {currentPainMap[activeRegion.key] !== undefined && currentPainMap[activeRegion.key] > 0
                    ? `${currentPainMap[activeRegion.key]}/10`
                    : 'Sem dor'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {activeRegion.description}.
              </p>

              {/* Slider for precision */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Intensidade:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {currentPainMap[activeRegion.key] || 0} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={currentPainMap[activeRegion.key] || 0}
                  onChange={(e) => handleUpdateRegionPain(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: 'Sem Dor', val: 0, color: 'bg-slate-100 text-slate-700' },
                  { label: 'Leve (2)', val: 2, color: 'bg-amber-100 text-amber-800' },
                  { label: 'Mod. (5)', val: 5, color: 'bg-orange-100 text-orange-800' },
                  { label: 'Forte (8)', val: 8, color: 'bg-rose-100 text-rose-800' }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleUpdateRegionPain(p.val)}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                      (currentPainMap[activeRegion.key] || 0) === p.val
                        ? 'ring-2 ring-teal-500 ' + p.color
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3 text-center">
              <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center mx-auto text-teal-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100">
                  Nenhuma Região Selecionada
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Toque em um ponto do corpo ou escolha na lista de regiões mais frequentes abaixo para classificar a dor.
                </p>
              </div>

              {/* Quick selection pills for common regions */}
              <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                {ANATOMICAL_REGIONS.slice(0, 6).map((reg) => (
                  <button
                    key={reg.key}
                    type="button"
                    onClick={() => setSelectedRegionKey(reg.key)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                  >
                    {reg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CARD 2: Sensação & Características Clínicas da Dor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-poppins font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Como é a Dor Hoje? (Sensação Predominante)
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {PAIN_CHARACTERS.map((char) => {
                const isSelected = (currentLog?.painCharacter || []).includes(char.key);
                return (
                  <button
                    key={char.key}
                    type="button"
                    onClick={() => handleTogglePainCharacter(char.key)}
                    className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-300 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{char.icon}</span>
                    <span className="truncate">{char.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD 3: Daily Summary & 30-Day Hotspot Analysis */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-poppins font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                Resumo do Dia ({fmtDate(selectedDate, 's')})
              </h4>
              {currentDayStats.count > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                  title="Limpar pontos deste dia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* In-app Clear Confirmation Prompt */}
            {showClearConfirm && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-300">
                  Deseja remover todos os pontos de dor deste dia?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Sim, Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {currentDayStats.count === 0 ? (
              <div className="text-center py-4 text-slate-400 dark:text-slate-500 space-y-1">
                <Heart className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-semibold">Nenhum ponto de dor registrado para esta data.</p>
                <p className="text-[10px]">Clique na silhueta para mapear seus pontos dolorosos.</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Pontos Ativos</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-lg font-poppins">{currentDayStats.count}</strong>
                    <span className="text-[9px] text-slate-400 block">{currentDayStats.frontCount} frente / {currentDayStats.backCount} costas</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Média Local</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-lg font-poppins">{currentDayStats.avg}</strong>
                    <span className="text-[9px] text-slate-400 block">escala de 1 a 10</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Pico de Dor:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{currentDayStats.worstName}</strong>
                </div>
              </div>
            )}

            {/* 30-Day Hotspot Analysis List */}
            {hotspotStats.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <BarChart2 className="w-3 h-3 text-teal-500" /> Áreas Mais Afetadas (30d)
                  </span>
                  <span className="text-[10px] text-slate-400">Frequência</span>
                </div>

                <div className="space-y-1.5">
                  {hotspotStats.map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setSelectedRegionKey(item.key)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50/60 dark:bg-slate-800/40 dark:hover:bg-teal-950/30 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="space-y-0.5">
                        <strong className="font-semibold text-slate-700 dark:text-slate-200 block">
                          {item.label}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {item.count} dias registrados • Média {item.avgIntensity}/10
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        {item.percentage}%
                      </span>
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
};
