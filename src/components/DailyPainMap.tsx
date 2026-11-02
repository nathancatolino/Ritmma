/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component: DailyPainMap
 * Mapa de Dor Diário — Estrutura em 3 Etapas Clínicas:
 *   1) Seleção de áreas (Silhueta anatômica, Toque, Repetir dores de ontem, Irradiação)
 *   2) Intensidade (Graduação rápida ponto a ponto com [-] e [+], comparativo com ontem)
 *   3) Notas (Sensações clínicas, horário de pico e observações da dor física)
 * 
 * Totalmente responsivo para telas verticais de dispositivos móveis sem rolagem horizontal.
 * Não mistura nem repete variáveis do diário geral (como fadiga, sono ou humor).
 */

import React, { useState, useMemo } from 'react';
import { DailyLog, PatientData, AdvancedPainMark } from '../types';
import { todayISO, fmtDate } from '../utils';
import { 
  Heart, 
  Activity, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Clock, 
  FileText,
  RotateCcw,
  Layers,
  MapPin
} from 'lucide-react';
import { ATLAS_MASKS, AtlasMask } from '../data/atlasNathanV5Data';
import { getAnatomicalLabelForCoord, getAnatomicalIrradiationPath } from '../data/anatomicalRouter';

export interface DailyPainMapProps {
  logs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
  patientData?: PatientData;
  onUpdatePatientData?: (updater: (profile: PatientData) => void) => void;
  onFinish?: () => void;
  initialStep?: 1 | 2 | 3;
}

const PAIN_QUALITIES = [
  { key: 'queimacao', label: 'Queimação', icon: '🔥', desc: 'Dor tipo queimação ou calor' },
  { key: 'pontada', label: 'Pontada / Fisgada', icon: '⚡', desc: 'Dor penetrante e pontual' },
  { key: 'peso', label: 'Peso / Aperto', icon: '🪨', desc: 'Sensação de carga ou pressão' },
  { key: 'pulsatil', label: 'Latejante', icon: '💓', desc: 'Sensação rítmica de pulsação' },
  { key: 'choque', label: 'Choque / Formigamento', icon: '🔌', desc: 'Sensação elétrica ou dormência' },
  { key: 'rigidez', label: 'Rigidez muscular', icon: '🔒', desc: 'Travamento ou tensão aumentada' }
];

const WORST_TIMES = [
  { key: 'matinal', label: 'Ao acordar (manhã)', icon: '🌅' },
  { key: 'tarde', label: 'Durante a tarde', icon: '☀️' },
  { key: 'noite', label: 'Noite / descanso', icon: '🌙' },
  { key: 'madrugada', label: 'Madrugada', icon: '🌌' },
  { key: 'constante', label: 'Constante o dia todo', icon: '⏱️' }
];

export const DailyPainMap: React.FC<DailyPainMapProps> = ({
  logs,
  onSaveLog,
  patientData,
  onUpdatePatientData,
  onFinish,
  initialStep = 1
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [viewFilter, setViewFilter] = useState<'both' | 'front' | 'back'>('both');
  const [advMode, setAdvMode] = useState<'point' | 'region' | 'radiation'>('point');
  const [regionRadius, setRegionRadius] = useState<number>(45);
  const [pendingRadiation, setPendingRadiation] = useState<{ asset: string; x: number; y: number } | null>(null);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Active day's log
  const currentLog = useMemo(() => {
    return logs.find((l) => l.date === selectedDate) || null;
  }, [logs, selectedDate]);

  // Current pain marks for today
  const currentMarks: AdvancedPainMark[] = useMemo(() => {
    return currentLog?.advancedPainMarks || [];
  }, [currentLog]);

  // Find yesterday's or latest prior log with pain markings
  const yesterdayLog = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    const exact = logs.find((l) => l.date === yesterdayStr && (
      (l.advancedPainMarks && l.advancedPainMarks.length > 0) ||
      (l.bodyPainMap && Object.values(l.bodyPainMap).some((v) => Number(v) > 0))
    ));
    if (exact) return exact;

    const previousWithData = logs
      .filter((l) => l.date < selectedDate && (
        (l.advancedPainMarks && l.advancedPainMarks.length > 0) ||
        (l.bodyPainMap && Object.values(l.bodyPainMap).some((v) => Number(v) > 0))
      ))
      .sort((a, b) => b.date.localeCompare(a.date));

    return previousWithData[0] || null;
  }, [logs, selectedDate]);

  const yesterdayPointsCount = useMemo(() => {
    if (!yesterdayLog) return 0;
    const marksCount = yesterdayLog.advancedPainMarks?.length || 0;
    if (marksCount > 0) return marksCount;
    return Object.values(yesterdayLog.bodyPainMap || {}).filter((v) => Number(v) > 0).length;
  }, [yesterdayLog]);

  // Show gentle feedback toast
  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Base log creator
  const getBaseLog = (): DailyLog => {
    return currentLog || {
      date: selectedDate,
      bodyPainMap: {},
      advancedPainMarks: []
    };
  };

  // Recalculate pain average when marks change
  const recalculateAndSaveMarks = (newMarks: AdvancedPainMark[], extraFields?: Partial<DailyLog>) => {
    const base = getBaseLog();
    const updatedMap: Record<string, number> = {};
    newMarks.forEach((m) => {
      updatedMap[m.id] = m.intensity;
    });

    const activeIntensities = newMarks.map((m) => m.intensity).filter((v) => v > 0);
    const autoWorst = activeIntensities.length > 0 ? Math.max(...activeIntensities) : (base.worstPain ?? null);
    const autoAvg = activeIntensities.length > 0 ? Math.round(activeIntensities.reduce((a, b) => a + b, 0) / activeIntensities.length) : (base.pain ?? null);

    onSaveLog({
      ...base,
      pain: autoAvg,
      worstPain: autoWorst,
      bodyPainMap: updatedMap,
      advancedPainMarks: newMarks,
      ...(extraFields || {})
    });
  };

  // Handle repeating yesterday's pain markings
  const handleRepeatYesterday = () => {
    if (!yesterdayLog) return;

    const base = getBaseLog();
    let importedMarks: AdvancedPainMark[] = [];
    const newPainMap: Record<string, number> = {};

    if (yesterdayLog.advancedPainMarks && yesterdayLog.advancedPainMarks.length > 0) {
      importedMarks = yesterdayLog.advancedPainMarks.map((m) => ({
        ...m,
        id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        previousIntensity: m.intensity,
        source: 'yesterday_clone',
        createdAt: new Date().toISOString()
      }));
      importedMarks.forEach((m) => {
        newPainMap[m.id] = m.intensity;
      });
    }

    onSaveLog({
      ...base,
      pain: yesterdayLog.pain ?? base.pain,
      worstPain: yesterdayLog.worstPain ?? base.worstPain,
      bodyPainMap: newPainMap,
      advancedPainMarks: importedMarks,
      painCharacter: yesterdayLog.painCharacter || base.painCharacter,
      painWorstTime: yesterdayLog.painWorstTime || base.painWorstTime
    });

    triggerToast(`✓ ${importedMarks.length} área(s) de ontem carregadas!`);
  };

  // Step intensity up or down (+1 / -1)
  const handleStepIntensity = (markId: string, delta: number) => {
    const mark = currentMarks.find((m) => m.id === markId);
    if (!mark) return;

    const nextIntensity = Math.max(0, Math.min(10, mark.intensity + delta));
    const nextMarks = currentMarks.map((m) => (m.id === markId ? { ...m, intensity: nextIntensity } : m));
    recalculateAndSaveMarks(nextMarks);
  };

  // Set direct intensity
  const handleSetIntensity = (markId: string, intensity: number) => {
    const nextMarks = currentMarks.map((m) => (m.id === markId ? { ...m, intensity } : m));
    recalculateAndSaveMarks(nextMarks);
  };

  // Delete mark
  const handleDeleteMark = (markId: string) => {
    const nextMarks = currentMarks.filter((m) => m.id !== markId);
    if (selectedMarkId === markId) setSelectedMarkId(null);
    recalculateAndSaveMarks(nextMarks);
    triggerToast('✓ Área de dor removida.');
  };

  // Clear all marks
  const handleClearAll = () => {
    const base = getBaseLog();
    onSaveLog({
      ...base,
      bodyPainMap: {},
      advancedPainMarks: []
    });
    setConfirmClearOpen(false);
    setSelectedMarkId(null);
    triggerToast('✓ Todas as áreas foram limpas.');
  };

  // Toggle pain characteristic trait
  const handleToggleQuality = (key: string) => {
    const base = getBaseLog();
    const current = base.painCharacter || [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    onSaveLog({ ...base, painCharacter: next });
  };

  // Select worst pain time
  const handleSelectWorstTime = (key: 'matinal' | 'tarde' | 'noite' | 'madrugada' | 'constante') => {
    const base = getBaseLog();
    onSaveLog({ ...base, painWorstTime: key });
  };

  // Update pain notes
  const handleUpdatePainNotes = (notes: string) => {
    const base = getBaseLog();
    onSaveLog({ ...base, notes });
  };

  // Handle canvas click to place point or radiation
  const handleCanvasClick = (asset: string, e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mask = ATLAS_MASKS[asset];
    if (!mask) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const scaleX = mask.width / rect.width;
    const scaleY = mask.height / rect.height;

    const x = Math.round(clientX * scaleX);
    const y = Math.round(clientY * scaleY);

    if (advMode === 'radiation') {
      if (!pendingRadiation) {
        setPendingRadiation({ asset, x, y });
        return;
      }

      // Complete radiation line
      const markId = 'm_' + Date.now().toString(36);
      const originName = getAnatomicalLabelForCoord(pendingRadiation.asset, pendingRadiation.x, pendingRadiation.y);
      const destName = getAnatomicalLabelForCoord(asset, x, y);
      const label = `Irradiação: ${originName} → ${destName}`;

      const newMark: AdvancedPainMark = {
        id: markId,
        type: 'radiation',
        asset: pendingRadiation.asset,
        x: pendingRadiation.x,
        y: pendingRadiation.y,
        to: { asset, x, y },
        intensity: 5,
        side: 'central',
        quality: 'Fisgada',
        label,
        createdAt: new Date().toISOString()
      };

      setPendingRadiation(null);
      setSelectedMarkId(markId);
      recalculateAndSaveMarks([...currentMarks, newMark]);
      triggerToast(`✓ ${label} registrada!`);
      return;
    }

    // Point or Region mode
    const markId = 'm_' + Date.now().toString(36);
    const anatomicalName = getAnatomicalLabelForCoord(asset, x, y);
    const label = advMode === 'region' 
      ? `Área (${regionRadius}px) · ${anatomicalName}` 
      : anatomicalName;

    const newMark: AdvancedPainMark = {
      id: markId,
      type: advMode,
      asset,
      x,
      y,
      radius: advMode === 'region' ? regionRadius : undefined,
      intensity: 5,
      side: anatomicalName.toLowerCase().includes('direito') || anatomicalName.toLowerCase().includes('direita') ? 'direita' : anatomicalName.toLowerCase().includes('esquerdo') || anatomicalName.toLowerCase().includes('esquerda') ? 'esquerda' : 'central',
      quality: 'Dolorimento',
      label,
      createdAt: new Date().toISOString()
    };

    setSelectedMarkId(markId);
    recalculateAndSaveMarks([...currentMarks, newMark]);
    triggerToast(`✓ ${label} adicionada!`);
  };

  // Active figures based on viewFilter
  const activeFigures = useMemo(() => {
    if (viewFilter === 'front') return ['corpo-anterior'];
    if (viewFilter === 'back') return ['corpo-posterior'];
    return ['corpo-anterior', 'corpo-posterior'];
  }, [viewFilter]);

  return (
    <div id="pain-history-silhouette" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4 w-full min-w-0 max-w-full overflow-hidden scroll-mt-20">
      
      {/* CABEÇALHO DO MAPA COM AS 3 ETAPAS UNIFORMIZADAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5 min-w-0">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Mapa de Dor Diário</span>
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-poppins mt-0.5 break-words leading-tight">
            {currentStep === 1 && 'Etapa 1: Seleção de Áreas no Corpo'}
            {currentStep === 2 && 'Etapa 2: Graduação de Intensidade'}
            {currentStep === 3 && 'Etapa 3: Notas e Características da Dor'}
          </h3>
        </div>

        {/* 3 STEPS TABS NAVIGATOR (Uniformizado e Responsivo) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-center truncate ${
              currentStep === 1
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] flex items-center justify-center font-black shrink-0">1</span>
            <span className="truncate">Áreas</span>
            {currentMarks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-black shrink-0">
                {currentMarks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-center truncate ${
              currentStep === 2
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] flex items-center justify-center font-black shrink-0">2</span>
            <span className="truncate">Intensidade</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-center truncate ${
              currentStep === 3
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] flex items-center justify-center font-black shrink-0">3</span>
            <span className="truncate">Notas</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST DISCRETO */}
      {feedbackToast && (
        <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="break-words leading-tight">{feedbackToast}</span>
        </div>
      )}

      {/* =========================================================================
          ETAPA 1: SELEÇÃO DE ÁREAS (SILHUETA, TOQUE, REPETIR ONTEM, IRRADIAÇÃO)
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-3.5 animate-in fade-in duration-200 w-full min-w-0">
          
          {/* BARRA DE FERRAMENTAS DO MAPA */}
          <div className="w-full flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-0">
            
            {/* Linha 1: Seletor de Visão e Repetir Ontem */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 min-w-0">
              
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setViewFilter('front')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'front'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Frente
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('back')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'back'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Costas
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('both')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'both'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Ambas
                </button>
              </div>

              {/* Botão Repetir Dores de Ontem */}
              {yesterdayLog && (
                <button
                  type="button"
                  onClick={handleRepeatYesterday}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-500/15 via-teal-500/25 to-emerald-500/15 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700/60 hover:from-teal-500/30 hover:to-emerald-500/30 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
                  title={`Trazer os pontos marcados em ${fmtDate(yesterdayLog.date, 's')}`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="whitespace-nowrap">Repetir dores de ontem</span>
                  {yesterdayPointsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-600 text-white font-black">
                      {yesterdayPointsCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Linha 2: Ferramentas de Desenho e Limpeza */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 min-w-0">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => { setAdvMode('point'); setPendingRadiation(null); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    advMode === 'point'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600'
                  }`}
                >
                  ● Ponto
                </button>
                <button
                  type="button"
                  onClick={() => { setAdvMode('region'); setPendingRadiation(null); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    advMode === 'region'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600'
                  }`}
                >
                  ◯ Área
                </button>
                <button
                  type="button"
                  onClick={() => { setAdvMode('radiation'); setPendingRadiation(null); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    advMode === 'radiation'
                      ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-300/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                  }`}
                >
                  ➔ Irradiação
                </button>
              </div>

              {/* Ajuste de Raio e Limpar */}
              <div className="flex items-center gap-2 shrink-0">
                {advMode === 'region' && (
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-bold">
                    <span>Raio: {regionRadius}px</span>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      value={regionRadius}
                      onChange={(e) => setRegionRadius(Number(e.target.value))}
                      className="w-14 accent-teal-600 cursor-pointer"
                    />
                  </div>
                )}

                {currentMarks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="px-2.5 py-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar áreas</span>
                  </button>
                )}
              </div>
            </div>

            {/* Aviso de Modo Irradiacao */}
            {advMode === 'radiation' && (
              <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between min-w-0">
                <span className="break-words leading-tight flex-1">
                  {pendingRadiation 
                    ? `Origem: ${getAnatomicalLabelForCoord(pendingRadiation.asset, pendingRadiation.x, pendingRadiation.y)}. Toque agora no ponto de destino.` 
                    : 'Toque no ponto de origem da dor no corpo para traçar a irradiação.'}
                </span>
                {pendingRadiation && (
                  <button
                    type="button"
                    onClick={() => setPendingRadiation(null)}
                    className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer text-[10px] ml-2 shrink-0"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CONFIRMAÇÃO DE LIMPEZA */}
          {confirmClearOpen && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <span className="font-bold text-rose-800 dark:text-rose-300 break-words">
                Deseja remover todas as áreas de dor marcadas para hoje?
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* SILHUETA ANATÔMICA VERTICAL RESPONSIVA (Zero rolagem horizontal) */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-3xl flex flex-col items-center select-none w-full min-w-0 max-w-full overflow-x-hidden">
            <div className={`w-full grid items-center justify-center ${
              activeFigures.length === 1 
                ? 'grid-cols-1 max-w-[320px] mx-auto gap-2' 
                : 'grid-cols-2 max-w-[580px] mx-auto gap-2 sm:gap-3'
            }`}>
              {activeFigures.map((assetKey) => {
                const mask: AtlasMask = ATLAS_MASKS[assetKey] || {
                  asset: assetKey,
                  width: 479,
                  height: 984,
                  path: ''
                };

                return (
                  <div key={assetKey} className="flex flex-col items-center w-full min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">
                      {assetKey === 'corpo-anterior' ? 'Vista Anterior' : 'Vista Posterior'}
                    </span>

                    <div className="relative w-full aspect-[479/984] max-h-[44vh] flex items-center justify-center">
                      <svg
                        viewBox={`0 0 ${mask.width} ${mask.height}`}
                        className="w-full h-full max-h-[44vh] drop-shadow-xs select-none"
                        onClick={(e) => handleCanvasClick(assetKey, e)}
                        style={{ cursor: 'crosshair', touchAction: 'manipulation' }}
                      >
                        <defs>
                          <clipPath id={`clip-${assetKey}`}>
                            <path d={mask.path} />
                          </clipPath>
                          <marker
                            id={`arrow-${assetKey}`}
                            viewBox="0 0 10 10"
                            refX="8"
                            refY="5"
                            markerWidth="5"
                            markerHeight="5"
                            orient="auto-start-reverse"
                          >
                            <path d="M 0 1.5 L 9 5 L 0 8.5 Z" fill="#b45309" />
                          </marker>
                        </defs>

                        {/* Arte oficial anatomica */}
                        <image
                          href={`/anatomy/${assetKey}.png`}
                          width={mask.width}
                          height={mask.height}
                          x="0"
                          y="0"
                          pointerEvents="none"
                        />

                        {/* Mascara de clique */}
                        <path
                          d={mask.path}
                          fill="transparent"
                          pointerEvents="auto"
                        />

                        {/* Pontos e Irradiações */}
                        {currentMarks.filter((m) => m.asset === assetKey || m.to?.asset === assetKey).map((m) => {
                          const isSelected = selectedMarkId === m.id;
                          const opacity = 0.2 + (m.intensity / 10) * 0.25;

                          return (
                            <g
                              key={m.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMarkId(m.id);
                              }}
                              className="cursor-pointer"
                            >
                              {m.type === 'region' && m.asset === assetKey && (
                                <circle
                                  cx={m.x}
                                  cy={m.y}
                                  r={m.radius || 45}
                                  fill="#f16b76"
                                  fillOpacity={opacity}
                                  stroke="#d76071"
                                  strokeDasharray="5 3"
                                  strokeWidth="1.5"
                                  clipPath={`url(#clip-${assetKey})`}
                                />
                              )}

                              {m.type === 'radiation' && m.asset === assetKey && m.to && m.to.asset === assetKey && (
                                <g>
                                  <path
                                    d={getAnatomicalIrradiationPath(assetKey, { x: m.x, y: m.y }, { x: m.to.x, y: m.to.y })}
                                    fill="none"
                                    stroke={isSelected ? '#b45309' : '#d97706'}
                                    strokeWidth={isSelected ? 4 : 3}
                                    strokeLinecap="round"
                                    markerEnd={`url(#arrow-${assetKey})`}
                                  />
                                  <path
                                    d={getAnatomicalIrradiationPath(assetKey, { x: m.x, y: m.y }, { x: m.to.x, y: m.to.y })}
                                    fill="none"
                                    stroke="#fef08a"
                                    strokeWidth={2}
                                    strokeDasharray="6 8"
                                    strokeLinecap="round"
                                    className="animate-pulse"
                                  />
                                </g>
                              )}

                              {m.asset === assetKey && (
                                <g className="transition-transform active:scale-95">
                                  {isSelected && (
                                    <circle
                                      cx={m.x}
                                      cy={m.y}
                                      r="15"
                                      fill="none"
                                      stroke="#0284c7"
                                      strokeWidth="2.5"
                                      className="animate-pulse"
                                    />
                                  )}
                                  <circle
                                    cx={m.x}
                                    cy={m.y}
                                    r={m.intensity >= 7 ? 8 : 7}
                                    fill={
                                      m.type === 'radiation' ? '#d97706' :
                                      m.intensity >= 7 ? '#e11d48' :
                                      m.intensity >= 4 ? '#ea580c' :
                                      '#d97706'
                                    }
                                    stroke="white"
                                    strokeWidth="1.8"
                                  />
                                  <text
                                    x={m.x}
                                    y={m.y + 3.5}
                                    textAnchor="middle"
                                    className="text-[9px] font-black fill-white pointer-events-none select-none"
                                  >
                                    {m.intensity}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}

                        {/* Pino de Origem pendente da Irradiacao */}
                        {pendingRadiation && pendingRadiation.asset === assetKey && (
                          <g>
                            <circle
                              cx={pendingRadiation.x}
                              cy={pendingRadiation.y}
                              r="15"
                              fill="#f59e0b"
                              fillOpacity="0.4"
                              className="animate-ping"
                            />
                            <circle
                              cx={pendingRadiation.x}
                              cy={pendingRadiation.y}
                              r="8"
                              fill="#d97706"
                              stroke="white"
                              strokeWidth="2"
                            />
                          </g>
                        )}
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RESUMO DAS ÁREAS SELECIONADAS HOJE */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate">
                {currentMarks.length > 0 
                  ? `${currentMarks.length} área(s) de dor marcada(s) no corpo:` 
                  : 'Nenhuma área de dor marcada hoje.'}
              </span>
              {currentMarks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 min-w-0">
                  {currentMarks.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full"
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <span>Avançar para Intensidade</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 2: GRADUAÇÃO DE INTENSIDADE (0 A 10 PONTO A PONTO VIA [-] E [+])
          Exclusiva para graduar a intensidade de cada área selecionada
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
          
          <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-200 min-w-0">
            <span className="font-bold block">Defina a intensidade de dor para cada área marcada:</span>
            <span className="text-[11px] text-teal-700/80 dark:text-teal-300/80">
              Use os botões <strong>+</strong> e <strong>-</strong> para ajustar rapidamente, ou toque no número desejado.
            </span>
          </div>

          {currentMarks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
              <p className="font-bold text-slate-600 dark:text-slate-300">Nenhuma área selecionada.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Retorne à Etapa 1 para tocar na silhueta e marcar onde você sente dor, ou importe as dores de ontem.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Voltar e Marcar Áreas
              </button>
            </div>
          ) : (
            <div className="space-y-3 w-full min-w-0">
              {currentMarks.map((m) => {
                const isSelected = selectedMarkId === m.id;
                const diff = m.previousIntensity !== undefined ? m.intensity - m.previousIntensity : null;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarkId(m.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer min-w-0 w-full space-y-2.5 ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Linha superior: Nome da área, badge de tendência e botão excluir */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block break-words leading-tight">
                          {m.label}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 min-w-0">
                          {diff !== null ? (
                            diff < 0 ? (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                                ▼ Melhorou ({diff})
                              </span>
                            ) : diff > 0 ? (
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 shrink-0">
                                ▲ Piorou (+{diff})
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                                = Sem alteração
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md shrink-0">
                              Nova área
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 capitalize shrink-0">
                            {m.type === 'radiation' ? 'Irradiação' : m.type === 'region' ? 'Área ampla' : 'Ponto focal'}
                          </span>
                        </div>
                      </div>

                      {/* Botão de Excluir */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMark(m.id);
                        }}
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Remover esta área de dor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Linha de Intensidade: Stepper [-] [Nota/10] [+] e escala rápida */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800 min-w-0" onClick={(e) => e.stopPropagation()}>
                      
                      {/* Stepper Rápido */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStepIntensity(m.id, -1)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-90 transition-all cursor-pointer"
                          title="Reduzir intensidade da dor"
                        >
                          -
                        </button>

                        <span className={`w-14 text-center text-xs font-black py-1 px-2 rounded-xl border shrink-0 ${
                          m.intensity >= 7 ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-900' :
                          m.intensity >= 4 ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/70 border-orange-200 dark:border-orange-900' :
                          'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900'
                        }`}>
                          {m.intensity}/10
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStepIntensity(m.id, 1)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-90 transition-all cursor-pointer"
                          title="Aumentar intensidade da dor"
                        >
                          +
                        </button>
                      </div>

                      {/* Escala Direta 0 a 10 (Responsiva para toque direto) */}
                      <div className="grid grid-cols-11 gap-1 flex-1 min-w-0">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSetIntensity(m.id, num)}
                            className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center min-w-0 ${
                              m.intensity === num
                                ? 'bg-teal-600 text-white font-black shadow-xs scale-105'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* NAVEGAÇÃO INFERIOR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Áreas</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <span>Avançar para Notas & Características</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 3: NOTAS E CARACTERÍSTICAS DA DOR (SENSAÇÃO, HORÁRIO, OBSERVAÇÕES)
          Focada exclusivamente nas notas clínicas do mapa de dor física
          ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
          
          {/* 1. Sensação Predominante da Dor */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Qual é a sensação predominante da dor nestas áreas?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full min-w-0">
              {PAIN_QUALITIES.map((q) => {
                const isSelected = (currentLog?.painCharacter || []).includes(q.key);
                return (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => handleToggleQuality(q.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 min-w-0 ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base shrink-0">{q.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs block truncate">{q.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{q.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Horário em que a dor esteve pior */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Em qual momento do dia a dor foi mais intensa?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full min-w-0">
              {WORST_TIMES.map((t) => {
                const isSelected = currentLog?.painWorstTime === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleSelectWorstTime(t.key as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-0 ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs break-words leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Observações / Anotações Médicas do Paciente */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 min-w-0">
            <label htmlFor="pain-notes-textarea" className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Observações ou notas adicionais sobre a dor (opcional):
            </label>
            <textarea
              id="pain-notes-textarea"
              value={currentLog?.notes || ''}
              onChange={(e) => handleUpdatePainNotes(e.target.value)}
              placeholder="Ex: Dor na lombar piorou após dirigir; joelho aliviou com compressa morna..."
              rows={3}
              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
            />
          </div>

          {/* NAVEGAÇÃO INFERIOR & SALVAMENTO FINAL */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Intensidade</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerToast('✓ Mapa de dor salvo com sucesso!');
                if (onFinish) onFinish();
              }}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Mapa de Dor</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
