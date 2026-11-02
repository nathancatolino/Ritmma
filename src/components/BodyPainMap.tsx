/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component BodyPainMap:
 * Integrated Medical Pain Atlas (Dr. Nathan v5)
 * - Official Dr. Nathan clinical art & masks (corpo-anterior, corpo-posterior, mao-direita, mao-esquerda, pe-direito, pe-esquerdo, wpi-anterior, wpi-posterior).
 * - 4 Specialized Clinical Instruments:
 *   1. Dor livre (geral): mapeamento de pontos, intensidade 0-10, características clínicas.
 *   2. WPI-19 (Fibromialgia ACR): 19 polígonos anatômicos oficiais com cálculo dinâmico (0 a 19) e indicador de dor difusa (WPI ≥ 7).
 *   3. DAS28 (Artrite reumatóide): 28 articulações clássicas (ombros, cotovelos, punhos, joelhos, 10 MCFs e 10 IFPs) com contagem de dor e edema.
 *   4. Artrite psoriásica & Enteses (PsA): articulações periféricas, enteses (Aquiles e fáscia plantar) e MTFs dos pés.
 * - Modo Avançado (v5): Ponto focal, Área/Mancha circular translúcida, Linha de irradiação com seta direcional e Localização articular declarada.
 * - Suporte completo ao histórico de 14 dias, presets rápidos conscientes, persistência via DailyLog.bodyPainMap e DailyLog.advancedPainMarks.
 * - Tooltips em minúsculas com apenas a primeira letra maiúscula (formato sentença).
 */

import React, { useState, useMemo, useRef } from 'react';
import { DailyLog, PatientData, AdvancedPainMark } from '../types';
import { todayISO, fmtDate } from '../utils';
import { 
  Activity, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Heart, 
  Zap, 
  History,
  Check,
  CheckCircle2,
  BarChart2,
  RotateCcw,
  Sparkles,
  Info,
  ZoomIn,
  ZoomOut,
  List,
  Eye,
  Sliders,
  X,
  Loader2,
  Stethoscope,
  Layers,
  ArrowRight,
  Circle,
  HelpCircle,
  Move
} from 'lucide-react';
import { Tooltip, InfoTooltip } from './Tooltip';
import { ATLAS_MASKS, WPI19_REGIONS, DAS28_JOINTS, AtlasMask, WpiRegion, Das28Joint } from '../data/atlasNathanV5Data';
import { getAnatomicalLabelForCoord, getAnatomicalIrradiationPath } from '../data/anatomicalRouter';

export interface BodyPainMapProps {
  logs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
  patientData?: PatientData;
  onUpdatePatientData?: (updater: (profile: PatientData) => void) => void;
  isEmbedded?: boolean;
}

export type ClinicalInstrument = 'free' | 'wpi19' | 'das28' | 'psa' | 'advanced';
export type VisualScope = 'body' | 'hand' | 'foot' | 'all';
export type AdvancedMode = 'point' | 'region' | 'radiation' | 'joint';

const ASSET_NAMES: Record<string, string> = {
  'corpo-anterior': 'Vista anterior',
  'corpo-posterior': 'Vista posterior',
  'mao-direita': 'Mão direita (dorso)',
  'mao-esquerda': 'Mão esquerda (dorso)',
  'pe-direito': 'Pé direito (dorso)',
  'pe-esquerdo': 'Pé esquerdo (dorso)',
  'wpi-anterior': 'Vista anterior (WPI)',
  'wpi-posterior': 'Vista posterior (WPI)'
};

const PAIN_QUALITIES = [
  'Dolorimento',
  'Pontada',
  'Queimação',
  'Pressão / Peso',
  'Fisgada',
  'Latejamento',
  'Câimbra',
  'Choque / Formigamento',
  'Rigidez'
];

const PAIN_CHARACTERS = [
  { key: 'queimacao', label: 'Queimação', icon: '🔥', description: 'Dor tipo queimação ou calor intenso, característica frequente de hipersensibilidade e sensibilização central.' },
  { key: 'pontada', label: 'Pontada / agulhada', icon: '⚡', description: 'Dor penetrante e pontual tipo agulhada ou fisgada súbita.' },
  { key: 'peso', label: 'Peso / pressão', icon: '🪨', description: 'Sensação pesada de aperto, carga ou esmagamento na musculatura ou articulação.' },
  { key: 'pulsatil', label: 'Latejante', icon: '💓', description: 'Dor com sensação rítmica de pulsação ou batimento.' },
  { key: 'choque', label: 'Choque / formigamento', icon: '🔌', description: 'Sensação de eletricidade, dormência ou formigamento por irritação nervosa.' },
  { key: 'rigidez', label: 'Rigidez muscular', icon: '🔒', description: 'Travamento, tensão muscular aumentada e dificuldade para alongar o membro.' }
];

const BODY_REGIONS_LIST = [
  { id: 'cabeca', label: 'Cabeça / face', side: 'front', asset: 'corpo-anterior', x: 240, y: 70 },
  { id: 'pescoco_ant', label: 'Pescoço anterior', side: 'front', asset: 'corpo-anterior', x: 240, y: 140 },
  { id: 'ombro_dir', label: 'Ombro direito', side: 'front', asset: 'corpo-anterior', x: 145, y: 226 },
  { id: 'ombro_esq', label: 'Ombro esquerdo', side: 'front', asset: 'corpo-anterior', x: 365, y: 226 },
  { id: 'torax', label: 'Tórax / peito', side: 'front', asset: 'corpo-anterior', x: 240, y: 260 },
  { id: 'cotovelo_dir', label: 'Cotovelo direito', side: 'front', asset: 'corpo-anterior', x: 118, y: 378 },
  { id: 'cotovelo_esq', label: 'Cotovelo esquerdo', side: 'front', asset: 'corpo-anterior', x: 392, y: 378 },
  { id: 'abdomen', label: 'Abdômen', side: 'front', asset: 'corpo-anterior', x: 240, y: 400 },
  { id: 'punho_dir', label: 'Punho direito', side: 'front', asset: 'corpo-anterior', x: 75, y: 498 },
  { id: 'punho_esq', label: 'Punho esquerdo', side: 'front', asset: 'corpo-anterior', x: 424, y: 498 },
  { id: 'quadril_dir', label: 'Quadril direito', side: 'front', asset: 'corpo-anterior', x: 190, y: 480 },
  { id: 'quadril_esq', label: 'Quadril esquerdo', side: 'front', asset: 'corpo-anterior', x: 310, y: 480 },
  { id: 'coxa_dir', label: 'Coxa direita', side: 'front', asset: 'corpo-anterior', x: 180, y: 580 },
  { id: 'coxa_esq', label: 'Coxa esquerda', side: 'front', asset: 'corpo-anterior', x: 320, y: 580 },
  { id: 'joelho_dir', label: 'Joelho direito', side: 'front', asset: 'corpo-anterior', x: 207, y: 642 },
  { id: 'joelho_esq', label: 'Joelho esquerdo', side: 'front', asset: 'corpo-anterior', x: 303, y: 642 },
  { id: 'perna_dir', label: 'Canela / perna direita', side: 'front', asset: 'corpo-anterior', x: 195, y: 780 },
  { id: 'perna_esq', label: 'Canela / perna esquerda', side: 'front', asset: 'corpo-anterior', x: 305, y: 780 },
  { id: 'pe_dir_ant', label: 'Pé direito', side: 'front', asset: 'corpo-anterior', x: 180, y: 920 },
  { id: 'pe_esq_ant', label: 'Pé esquerdo', side: 'front', asset: 'corpo-anterior', x: 320, y: 920 },
  // Posterior
  { id: 'nuca', label: 'Nuca / occipital', side: 'back', asset: 'corpo-posterior', x: 280, y: 65 },
  { id: 'cervical', label: 'Coluna cervical', side: 'back', asset: 'corpo-posterior', x: 280, y: 150 },
  { id: 'escapula_dir', label: 'Escápula direita', side: 'back', asset: 'corpo-posterior', x: 375, y: 280 },
  { id: 'escapula_esq', label: 'Escápula esquerda', side: 'back', asset: 'corpo-posterior', x: 185, y: 280 },
  { id: 'dorso_toracico', label: 'Dorso / torácica', side: 'back', asset: 'corpo-posterior', x: 280, y: 320 },
  { id: 'lombar', label: 'Coluna lombar', side: 'back', asset: 'corpo-posterior', x: 280, y: 470 },
  { id: 'gluteo_dir', label: 'Glúteo direito', side: 'back', asset: 'corpo-posterior', x: 330, y: 620 },
  { id: 'gluteo_esq', label: 'Glúteo esquerdo', side: 'back', asset: 'corpo-posterior', x: 230, y: 620 },
  { id: 'coxa_dir_post', label: 'Coxa direita posterior', side: 'back', asset: 'corpo-posterior', x: 340, y: 730 },
  { id: 'coxa_esq_post', label: 'Coxa esquerda posterior', side: 'back', asset: 'corpo-posterior', x: 220, y: 730 },
  { id: 'poplitea_dir', label: 'Joelho direito posterior', side: 'back', asset: 'corpo-posterior', x: 330, y: 830 },
  { id: 'poplitea_esq', label: 'Joelho esquerdo posterior', side: 'back', asset: 'corpo-posterior', x: 230, y: 830 },
  { id: 'panturrilha_dir', label: 'Panturrilha direita', side: 'back', asset: 'corpo-posterior', x: 340, y: 920 },
  { id: 'panturrilha_esq', label: 'Panturrilha esquerda', side: 'back', asset: 'corpo-posterior', x: 220, y: 920 },
  { id: 'aquiles_dir', label: 'Tendão de Aquiles direito', side: 'back', asset: 'corpo-posterior', x: 345, y: 1040 },
  { id: 'aquiles_esq', label: 'Tendão de Aquiles esquerdo', side: 'back', asset: 'corpo-posterior', x: 215, y: 1040 }
];

export const BodyPainMap: React.FC<BodyPainMapProps> = ({ 
  logs, 
  onSaveLog,
  patientData,
  onUpdatePatientData,
  isEmbedded = false
}) => {
  // Selected date
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  // Clinical instrument
  const [instrument, setInstrument] = useState<ClinicalInstrument>('free');
  // Visual scope ('body' | 'hand' | 'foot' | 'all')
  const [scope, setScope] = useState<VisualScope>('body');
  // Advanced tools mode ('point' | 'region' | 'radiation' | 'joint')
  const [advMode, setAdvMode] = useState<AdvancedMode>('point');
  // Radiation pending start point
  const [pendingRadiation, setPendingRadiation] = useState<{ asset: string; x: number; y: number } | null>(null);
  // Current region/marker selection
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  // Radius for circular region (px)
  const [regionRadius, setRegionRadius] = useState<number>(45);
  // View mode filter ('both' | 'front' | 'back' | 'list')
  const [viewFilter, setViewFilter] = useState<'both' | 'front' | 'back' | 'list'>('both');
  // Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveStatusState, setSaveStatusState] = useState<'idle' | 'saving' | 'saved'>('idle');
  // Clear confirmation
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  // Selected joint name from dropdown
  const [jointDropdownName, setJointDropdownName] = useState<string>('Ombro');
  // Preset proposal modal
  const [presetDraft, setPresetDraft] = useState<{
    key: string;
    label: string;
    description: string;
    icon: string;
    pain: number;
    worstPain: number;
    fatigue: number;
    functionVal: number;
    notesPrefix: string;
    suggestedRegions: string[];
  } | null>(null);

  // Active log
  const currentLog = useMemo(() => {
    return logs.find((l) => l.date === selectedDate) || null;
  }, [logs, selectedDate]);

  // Current pain map: regionKey -> score (0-10)
  const currentPainMap: Record<string, number> = useMemo(() => {
    return currentLog?.bodyPainMap || {};
  }, [currentLog]);

  // Current advanced marks list
  const currentMarks: AdvancedPainMark[] = useMemo(() => {
    return currentLog?.advancedPainMarks || [];
  }, [currentLog]);

  // Status message helper
  const triggerStatus = (msg: string, state: 'saving' | 'saved' = 'saved') => {
    setStatusMessage(msg);
    setSaveStatusState(state);
    if (state === 'saved') {
      setTimeout(() => {
        setStatusMessage((prev) => (prev === msg ? null : prev));
        setSaveStatusState((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 3000);
    }
  };

  // Base log creator
  const getBaseLog = (): DailyLog => {
    return currentLog || {
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
  };

  // Recalculate auto pain values
  const recalculateAndSave = (updatedMap: Record<string, number>, updatedMarks?: AdvancedPainMark[]) => {
    const base = getBaseLog();
    const activeValues = Object.values(updatedMap).map(Number).filter((v) => !isNaN(v) && v > 0);
    let autoPain = base.pain;
    let autoWorst = base.worstPain;

    if (activeValues.length > 0) {
      const avg = Math.round(activeValues.reduce((sum, v) => sum + v, 0) / activeValues.length);
      const max = Math.max(...activeValues);
      autoPain = avg;
      autoWorst = max;
    }

    onSaveLog({
      ...base,
      pain: autoPain,
      worstPain: autoWorst,
      bodyPainMap: updatedMap,
      ...(updatedMarks !== undefined ? { advancedPainMarks: updatedMarks } : {})
    });
  };

  // Find yesterday's or previous day's log with pain points
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

  // Handle repeating yesterday's pain markings with memory
  const handleRepeatYesterday = () => {
    if (!yesterdayLog) return;
    triggerStatus('Carregando dores do dia anterior...', 'saving');

    const base = getBaseLog();
    let newMarks: AdvancedPainMark[] = [];
    const newPainMap: Record<string, number> = { ...(yesterdayLog.bodyPainMap || {}) };

    if (yesterdayLog.advancedPainMarks && yesterdayLog.advancedPainMarks.length > 0) {
      newMarks = yesterdayLog.advancedPainMarks.map((m) => ({
        ...m,
        id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        previousIntensity: m.intensity,
        source: 'yesterday_clone',
        createdAt: new Date().toISOString()
      }));
      newMarks.forEach((m) => {
        newPainMap[m.id] = m.intensity;
      });
    } else if (yesterdayLog.bodyPainMap) {
      Object.entries(yesterdayLog.bodyPainMap).forEach(([key, val]) => {
        const numVal = Number(val);
        if (numVal > 0) {
          const regionInfo = BODY_REGIONS_LIST.find((r) => r.id === key);
          if (regionInfo) {
            newMarks.push({
              id: 'm_' + Date.now().toString(36) + '_' + key,
              type: 'point',
              asset: regionInfo.asset,
              x: regionInfo.x,
              y: regionInfo.y,
              intensity: numVal,
              previousIntensity: numVal,
              side: regionInfo.side === 'front' ? 'frente' : 'costas',
              quality: 'Dolorimento',
              label: regionInfo.label,
              source: 'yesterday_clone',
              createdAt: new Date().toISOString()
            });
          }
        }
      });
    }

    onSaveLog({
      ...base,
      pain: yesterdayLog.pain ?? base.pain,
      worstPain: yesterdayLog.worstPain ?? base.worstPain,
      bodyPainMap: newPainMap,
      advancedPainMarks: newMarks
    });

    setTimeout(() => {
      triggerStatus(`✓ ${newMarks.length || Object.keys(newPainMap).length} ponto(s) do dia anterior importados! Ajuste melhora ou piora com os botões + e -.`, 'saved');
    }, 250);
  };

  // Step intensity up or down by 1 (+/-)
  const handleStepIntensity = (markId: string, delta: number) => {
    const mark = currentMarks.find((m) => m.id === markId);
    if (mark) {
      const nextVal = Math.max(0, Math.min(10, mark.intensity + delta));
      handleUpdateMarkIntensity(markId, nextVal);
      return;
    }
    const currentVal = currentPainMap[markId] || 0;
    const nextVal = Math.max(0, Math.min(10, currentVal + delta));
    const updatedMap = { ...currentPainMap };
    if (nextVal === 0) {
      delete updatedMap[markId];
    } else {
      updatedMap[markId] = nextVal;
    }
    recalculateAndSave(updatedMap);
  };

  // Toggle WPI 19 region
  const handleToggleWpiRegion = (regionId: string) => {
    const reg = WPI19_REGIONS.find((r) => r.id === regionId);
    if (!reg) return;

    const updatedMap = { ...currentPainMap };
    const currentScore = updatedMap[regionId] || 0;
    const newScore = currentScore > 0 ? 0 : 5;

    triggerStatus(`Atualizando ${reg.label}...`, 'saving');

    if (newScore === 0) {
      delete updatedMap[regionId];
    } else {
      updatedMap[regionId] = newScore;
    }

    setSelectedStructureId(regionId);
    recalculateAndSave(updatedMap);

    setTimeout(() => {
      triggerStatus(newScore > 0 ? `✓ ${reg.label} marcado no WPI` : `✓ ${reg.label} desmarcado`, 'saved');
    }, 200);
  };

  // Toggle DAS28 joint (dor / edema)
  const handleToggleDas28Joint = (jointId: string, type: 'tender' | 'swollen' = 'tender') => {
    const joint = DAS28_JOINTS.find((j) => j.id === jointId);
    if (!joint) return;

    const updatedMap = { ...currentPainMap };
    const key = type === 'swollen' ? `${jointId}_swollen` : jointId;
    const isCurrentlyActive = (updatedMap[key] || 0) > 0;
    const newScore = isCurrentlyActive ? 0 : 5;

    triggerStatus(`Atualizando ${joint.label}...`, 'saving');

    if (newScore === 0) {
      delete updatedMap[key];
    } else {
      updatedMap[key] = newScore;
    }

    setSelectedStructureId(jointId);
    recalculateAndSave(updatedMap);

    setTimeout(() => {
      triggerStatus(
        newScore > 0 
          ? `✓ ${joint.label} marcado (${type === 'swollen' ? 'edema' : 'dor'})` 
          : `✓ ${joint.label} desmarcado`, 
        'saved'
      );
    }, 200);
  };

  // Click on anatomical silhouette in Free / Advanced mode
  const handleSvgSilhouetteClick = (asset: string, event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const q = point.matrixTransform(ctm.inverse());
    const mask = ATLAS_MASKS[asset];
    if (!mask) return;

    const x = Math.max(0, Math.min(mask.width, Math.round(q.x)));
    const y = Math.max(0, Math.min(mask.height, Math.round(q.y)));

    if (instrument === 'wpi19') {
      // In WPI mode, clicks handled by regions
      return;
    }

    if (advMode === 'radiation') {
      if (!pendingRadiation) {
        setPendingRadiation({ asset, x, y });
        const originLabel = getAnatomicalLabelForCoord(asset, x, y);
        triggerStatus(`Origem em "${originLabel}". Toque agora no destino da irradiação.`, 'saving');
        return;
      } else {
        const markId = 'm_' + Date.now().toString(36);
        const originLabel = getAnatomicalLabelForCoord(pendingRadiation.asset, pendingRadiation.x, pendingRadiation.y);
        const destLabel = getAnatomicalLabelForCoord(asset, x, y);
        const label = `Irradiação: ${originLabel} → ${destLabel}`;

        const newMark: AdvancedPainMark = {
          id: markId,
          type: 'radiation',
          asset: pendingRadiation.asset,
          x: pendingRadiation.x,
          y: pendingRadiation.y,
          to: { asset, x, y },
          intensity: 6,
          side: originLabel.toLowerCase().includes('direito') || originLabel.toLowerCase().includes('direita') ? 'direita' : originLabel.toLowerCase().includes('esquerdo') || originLabel.toLowerCase().includes('esquerda') ? 'esquerda' : 'bilateral',
          quality: 'Choque / Formigamento',
          label,
          createdAt: new Date().toISOString()
        };
        const nextMarks = [...currentMarks, newMark];
        setPendingRadiation(null);
        setSelectedMarkId(markId);
        triggerStatus(`✓ ${label} registrada!`, 'saving');
        
        const updatedMap = { ...currentPainMap, [markId]: 6 };
        recalculateAndSave(updatedMap, nextMarks);
        setTimeout(() => triggerStatus('✓ Irradiação anatômica salva com sucesso!', 'saved'), 200);
        return;
      }
    }

    // Point, Region or Joint mode
    const markId = 'm_' + Date.now().toString(36);
    const anatomicalName = getAnatomicalLabelForCoord(asset, x, y);
    const label = advMode === 'joint' 
      ? `${jointDropdownName} · ${anatomicalName}` 
      : advMode === 'region' 
      ? `Área de dor (${regionRadius}px) · ${anatomicalName}` 
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
      structure: advMode === 'joint' ? jointDropdownName : undefined,
      label,
      createdAt: new Date().toISOString()
    };

    const nextMarks = [...currentMarks, newMark];
    setSelectedMarkId(markId);
    const updatedMap = { ...currentPainMap, [markId]: 5 };
    recalculateAndSave(updatedMap, nextMarks);

    triggerStatus(`✓ ${label} registrado!`, 'saved');
  };

  // Delete a mark
  const handleDeleteMark = (id: string) => {
    const nextMarks = currentMarks.filter((m) => m.id !== id);
    const updatedMap = { ...currentPainMap };
    delete updatedMap[id];
    setSelectedMarkId(null);
    recalculateAndSave(updatedMap, nextMarks);
    triggerStatus('✓ Marcação removida!', 'saved');
  };

  // Update mark intensity (0 to 10)
  const handleUpdateMarkIntensity = (markId: string, intensity: number) => {
    const mark = currentMarks.find((m) => m.id === markId);
    const updatedMap = { ...currentPainMap };

    if (intensity === 0) {
      delete updatedMap[markId];
    } else {
      updatedMap[markId] = intensity;
    }

    let nextMarks = currentMarks;
    if (mark) {
      nextMarks = currentMarks.map((m) => m.id === markId ? { ...m, intensity } : m);
    }

    recalculateAndSave(updatedMap, nextMarks);
    triggerStatus(`✓ Intensidade definida para ${intensity}/10`, 'saved');
  };

  // Safe clear
  const handleClearAllRegions = () => {
    if (currentLog) {
      triggerStatus('Limpando registros do dia...', 'saving');
      onSaveLog({
        ...currentLog,
        bodyPainMap: {},
        advancedPainMarks: []
      });
      setTimeout(() => {
        triggerStatus('✓ Todos os registros de dor deste dia foram limpos e salvos.', 'saved');
      }, 250);
    }
    setConfirmClearOpen(false);
    setSelectedMarkId(null);
    setSelectedStructureId(null);
  };

  // Toggle pain characteristic
  const handleTogglePainCharacter = (trait: string) => {
    const base = getBaseLog();
    const currentTraits = base.painCharacter || [];
    const nextTraits = currentTraits.includes(trait)
      ? currentTraits.filter((t) => t !== trait)
      : [...currentTraits, trait];

    triggerStatus('Salvando característica de dor...', 'saving');

    onSaveLog({
      ...base,
      painCharacter: nextTraits
    });

    setTimeout(() => {
      triggerStatus('✓ Característica de dor atualizada e salva!', 'saved');
    }, 250);
  };

  // Preset Handlers
  const handleOpenPresetProposal = (type: 'severe' | 'moderate' | 'fatigue_fog' | 'mild_stable' | 'pain_free') => {
    const base = getBaseLog();

    if (type === 'severe') {
      setPresetDraft({
        key: 'severe',
        label: 'Crise aguda / flare intenso',
        description: 'Sugestão para episódios agudos de dor e exaustão física.',
        icon: '🚨',
        pain: 8,
        worstPain: 9,
        fatigue: 8,
        functionVal: 3,
        notesPrefix: '[Registro rápido]: Crise aguda / flare intenso.',
        suggestedRegions: ['lombar', 'cervical', 'dorso_toracico']
      });
    } else if (type === 'moderate') {
      setPresetDraft({
        key: 'moderate',
        label: 'Dor moderada e sobrecarga',
        description: 'Sugestão para dias de dor palpável com limitação funcional moderada.',
        icon: '⚡',
        pain: 5,
        worstPain: 6,
        fatigue: 5,
        functionVal: 5,
        notesPrefix: '[Registro rápido]: Dor moderada e sobrecarga.',
        suggestedRegions: []
      });
    } else if (type === 'fatigue_fog') {
      setPresetDraft({
        key: 'fatigue_fog',
        label: 'Fadiga severa & névoa mental',
        description: 'Sugestão para exaustão extrema com lentidão de raciocínio.',
        icon: '🧠',
        pain: base.pain ?? 4,
        worstPain: base.worstPain ?? 5,
        fatigue: 9,
        functionVal: 4,
        notesPrefix: '[Registro rápido]: Exaustão severa e névoa mental.',
        suggestedRegions: []
      });
    } else if (type === 'mild_stable') {
      setPresetDraft({
        key: 'mild_stable',
        label: 'Dia estável (dor leve)',
        description: 'Sugestão para dias calmos com boa tolerância e dor controlada.',
        icon: '🛡️',
        pain: 2,
        worstPain: 3,
        fatigue: 3,
        functionVal: 7,
        notesPrefix: '[Registro rápido]: Dia estável com dor controlada.',
        suggestedRegions: []
      });
    } else if (type === 'pain_free') {
      setPresetDraft({
        key: 'pain_free',
        label: 'Sem dor (0/10)',
        description: 'Sugestão para dias confortáveis, sem dores mapeadas.',
        icon: '🟢',
        pain: 0,
        worstPain: 0,
        fatigue: 1,
        functionVal: 9,
        notesPrefix: '[Registro rápido]: Sem dor hoje.',
        suggestedRegions: []
      });
    }
  };

  const handleConfirmPresetDraft = () => {
    if (!presetDraft) return;
    const base = getBaseLog();

    let updatedMap = { ...(base.bodyPainMap || {}) };
    let updatedMarks = currentMarks;

    if (presetDraft.key === 'pain_free') {
      updatedMap = {};
      updatedMarks = [];
    } else if (presetDraft.suggestedRegions.length > 0 && Object.keys(updatedMap).length === 0) {
      presetDraft.suggestedRegions.forEach((regKey) => {
        updatedMap[regKey] = 7;
      });
      if (presetDraft.suggestedRegions.includes('lombar')) {
        updatedMap['lombar'] = 8;
      }
    }

    triggerStatus(`Salvando ${presetDraft.label}...`, 'saving');

    onSaveLog({
      ...base,
      pain: presetDraft.pain,
      worstPain: presetDraft.worstPain,
      fatigue: presetDraft.fatigue,
      function: presetDraft.functionVal,
      bodyPainMap: updatedMap,
      advancedPainMarks: updatedMarks,
      notes: (base.notes ? base.notes + '\n' : '') + presetDraft.notesPrefix
    });

    setTimeout(() => {
      triggerStatus(`✓ ${presetDraft.label} registrado e salvo com sucesso!`, 'saved');
    }, 250);
    setPresetDraft(null);
  };

  // Real-time WPI-19 score
  const wpiScore = useMemo(() => {
    let score = 0;
    WPI19_REGIONS.forEach((region) => {
      if ((currentPainMap[region.id] || 0) > 0) {
        score++;
      }
    });
    return score;
  }, [currentPainMap]);

  // Real-time DAS28 tender joint count (0 to 28)
  const das28Count = useMemo(() => {
    let count = 0;
    DAS28_JOINTS.forEach((joint) => {
      if ((currentPainMap[joint.id] || 0) > 0) {
        count++;
      }
    });
    return count;
  }, [currentPainMap]);

  // Real-time DAS28 swollen joint count (0 to 28)
  const das28SwollenCount = useMemo(() => {
    let count = 0;
    DAS28_JOINTS.forEach((joint) => {
      if ((currentPainMap[`${joint.id}_swollen`] || 0) > 0) {
        count++;
      }
    });
    return count;
  }, [currentPainMap]);

  // Stats for the currently selected day
  const currentDayStats = useMemo(() => {
    const entries = Object.entries(currentPainMap).filter(([, v]) => Number(v) > 0);
    const count = entries.length;
    const avg = count > 0 ? (entries.reduce((sum, [, v]) => sum + Number(v), 0) / count).toFixed(1) : '0.0';
    const worstVal = entries.length > 0 ? Math.max(...entries.map(([, v]) => Number(v))) : 0;
    return { count, avg, worstVal };
  }, [currentPainMap]);

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
      const painValues = Object.values(painMap).map(Number).filter((v) => !isNaN(v) && v > 0);
      const painCount = painValues.length;
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

  // Figures to render based on instrument and scope
  const activeFigures: string[] = useMemo(() => {
    if (instrument === 'wpi19') {
      if (viewFilter === 'front') return ['wpi-anterior'];
      if (viewFilter === 'back') return ['wpi-posterior'];
      return ['wpi-anterior', 'wpi-posterior'];
    }
    if (scope === 'hand') {
      return ['mao-direita', 'mao-esquerda'];
    }
    if (scope === 'foot') {
      return ['pe-direito', 'pe-esquerdo'];
    }
    if (scope === 'all') {
      return ['corpo-anterior', 'corpo-posterior', 'mao-direita', 'mao-esquerda', 'pe-direito', 'pe-esquerdo'];
    }
    if (viewFilter === 'front') return ['corpo-anterior'];
    if (viewFilter === 'back') return ['corpo-posterior'];
    return ['corpo-anterior', 'corpo-posterior'];
  }, [instrument, scope, viewFilter]);

  // Current selected mark details
  const selectedMark = useMemo(() => {
    if (!selectedMarkId) return null;
    return currentMarks.find((m) => m.id === selectedMarkId) || null;
  }, [selectedMarkId, currentMarks]);

  return (
    <div className="space-y-4" id="pain-history-silhouette">
      
      {/* 1. TOP HERO: REGISTRO RÁPIDO DO ESTADO (1 TOQUE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Registro rápido de estado
                <InfoTooltip
                  title="Atalhos clínicos de estado"
                  content="Presets clínicos de 1 toque projetados para momentos em que você está com dor intensa, fadiga ou sem tempo para preenchimento minucioso. Ao selecionar, um modal de confirmação permite ajustar os valores antes de salvar."
                />
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {selectedDate === todayISO() ? 'Hoje' : fmtDate(selectedDate, 's')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Toque em uma opção para registrar seu estado imediato em 1 segundo.
              </p>
            </div>
          </div>

          {/* Feedback status */}
          <div className="h-6 flex items-center">
            {statusMessage ? (
              <span className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border animate-in fade-in ${
                saveStatusState === 'saving'
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
              }`}>
                {saveStatusState === 'saving' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {statusMessage}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Dor atual: <strong className="text-slate-700 dark:text-slate-300 font-bold">{currentLog?.pain != null ? `${currentLog.pain}/10` : 'Pendente'}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 5 Quick State Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Tooltip title="Crise aguda (dor 8+, fadiga 8)" content="Configura dor forte, exaustão física e rigidez para dias de crise severa. Permite ajuste fino antes de salvar." position="bottom">
            <button
              type="button"
              onClick={() => handleOpenPresetProposal('severe')}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentLog?.pain != null && currentLog.pain >= 8
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                  : 'bg-slate-50 hover:bg-rose-50/50 dark:bg-slate-800/60 dark:hover:bg-rose-950/20 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Crise aguda</span>
                <span className="text-sm">🚨</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dor 8+, fadiga alta</p>
            </button>
          </Tooltip>

          <Tooltip title="Dor moderada (dor 5, fadiga 5)" content="Dia com incômodo moderado persistente que exige pausas e reduz a velocidade das atividades cotidianas." position="bottom">
            <button
              type="button"
              onClick={() => handleOpenPresetProposal('moderate')}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentLog?.pain != null && currentLog.pain >= 4 && currentLog.pain <= 7
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                  : 'bg-slate-50 hover:bg-amber-50/50 dark:bg-slate-800/60 dark:hover:bg-amber-950/20 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Dor moderada</span>
                <span className="text-sm">⚡</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dor 5/10, limitação</p>
            </button>
          </Tooltip>

          <Tooltip title="Fadiga & névoa mental (fog)" content="Exaustão profunda física ou mental, lentidão no raciocínio e falta de energia mesmo com dor relativamente baixa." position="bottom">
            <button
              type="button"
              onClick={() => handleOpenPresetProposal('fatigue_fog')}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentLog?.fatigue != null && currentLog.fatigue >= 8
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-slate-50 hover:bg-purple-50/50 dark:bg-slate-800/60 dark:hover:bg-purple-950/20 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Fadiga & fog</span>
                <span className="text-sm">🧠</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Névoa e exaustão</p>
            </button>
          </Tooltip>

          <Tooltip title="Dia estável (dor 2, boa função)" content="Sintomas leves, sob controle e sem impacto relevante nas suas atividades diárias." position="bottom">
            <button
              type="button"
              onClick={() => handleOpenPresetProposal('mild_stable')}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentLog?.pain != null && currentLog.pain >= 1 && currentLog.pain <= 3
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/30'
                  : 'bg-slate-50 hover:bg-teal-50/50 dark:bg-slate-800/60 dark:hover:bg-teal-950/20 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">Dia estável</span>
                <span className="text-sm">🛡️</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dor leve 2/10</p>
            </button>
          </Tooltip>

          <Tooltip title="Sem dor (0/10)" content="Ausência completa de dor e limitação física. Dia confortável e produtivo." position="bottom" className="col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => handleOpenPresetProposal('pain_free')}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentLog?.pain === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 hover:bg-emerald-50/50 dark:bg-slate-800/60 dark:hover:bg-emerald-950/20 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Sem dor</span>
                <span className="text-sm">🟢</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">0/10, dia bom</p>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. ATLAS CLÍNICO NATHAN V5 CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-4">
        
        {/* Navigation & Clinical Schema Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" />
                Atlas anatômico de dor
              </h3>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                Atlas Nathan v5 Integrado
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mapeamento de dor com arte clínica original neutralizada, regiões WPI-19 e articulações DAS28.
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1 hover:text-teal-500 text-slate-400 cursor-pointer"
                title="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                max={todayISO()}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                disabled={selectedDate === todayISO()}
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1 hover:text-teal-500 text-slate-400 disabled:opacity-30 cursor-pointer"
                title="Próximo dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CLINICAL INSTRUMENT SELECTOR TABS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <Tooltip title="Esquema clínico: dor livre" content="Mapeamento corporal global completo (0 a 10) sem restrição de critérios para registro integral de sintomas.">
              <button
                type="button"
                onClick={() => {
                  setInstrument('free');
                  if (scope !== 'body') setScope('body');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  instrument === 'free'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs border border-teal-200/60 dark:border-teal-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-500" />
                Dor livre (geral)
              </button>
            </Tooltip>

            <Tooltip title="Esquema clínico: WPI-19 (fibromialgia)" content="19 regiões padronizadas do Colégio Americano de Reumatologia (ACR) com cálculo em tempo real do índice WPI (0 a 19).">
              <button
                type="button"
                onClick={() => {
                  setInstrument('wpi19');
                  setScope('body');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  instrument === 'wpi19'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs border border-purple-200/60 dark:border-purple-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                WPI · 19 regiões
                {wpiScore > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {wpiScore}/19
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip title="Esquema clínico: DAS28 (artrite reumatóide)" content="28 articulações clássicas avaliadas na artrite reumatóide: ombros, cotovelos, punhos, joelhos, 10 MCFs e 10 IFPs.">
              <button
                type="button"
                onClick={() => {
                  setInstrument('das28');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  instrument === 'das28'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs border border-rose-200/60 dark:border-rose-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
                DAS28 · 28 juntas
                {das28Count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    {das28Count}/28
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip title="Esquema clínico: artrite psoriásica & enteses" content="Vista com articulações periféricas, enteses (Aquiles, fáscia plantar) e MTFs dos pés.">
              <button
                type="button"
                onClick={() => {
                  setInstrument('psa');
                  setScope('foot');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  instrument === 'psa'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs border border-amber-200/60 dark:border-amber-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🦴 PsA & enteses
              </button>
            </Tooltip>

            <Tooltip title="Mapa de dor avançado (v5)" content="Instrumentos avançados: ponto, área circular translúcida, linha de irradiação com seta e articulação declarada.">
              <button
                type="button"
                onClick={() => {
                  setInstrument('advanced');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  instrument === 'advanced'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200/60 dark:border-sky-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ✨ Mapa avançado
              </button>
            </Tooltip>
          </div>

          {/* Scope Switcher */}
          <div className="flex items-center gap-1 self-end sm:self-center">
            {instrument !== 'wpi19' && (
              <div className="inline-flex bg-slate-200/70 dark:bg-slate-850 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setScope('body')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    scope === 'body'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Corpo
                </button>
                <button
                  type="button"
                  onClick={() => setScope('hand')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    scope === 'hand'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Mãos
                </button>
                <button
                  type="button"
                  onClick={() => setScope('foot')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    scope === 'foot'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Pés
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    scope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Todas
                </button>
              </div>
            )}
            <Tooltip title="Modo lista acessível" content="Exibe todas as regiões em formato de lista textual para acessibilidade por teclado ou leitor de tela.">
              <button
                type="button"
                onClick={() => setViewFilter(viewFilter === 'list' ? 'both' : 'list')}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  viewFilter === 'list'
                    ? 'bg-teal-50 text-teal-600 border-teal-300 dark:bg-teal-950 dark:text-teal-300'
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* TOOL SUB-BAR (AVAILABLE IN FREE AND ADVANCED MODES) */}
        {(instrument === 'free' || instrument === 'advanced') && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-sky-50/70 dark:bg-sky-950/20 rounded-2xl border border-sky-200/70 dark:border-sky-900/40 text-xs w-full max-w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sky-900 dark:text-sky-200 text-[11px]">Ferramenta:</span>
              <button
                type="button"
                onClick={() => { setAdvMode('point'); setPendingRadiation(null); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-xs ${
                  advMode === 'point'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-sky-300'
                }`}
              >
                ● Ponto de dor
              </button>
              <button
                type="button"
                onClick={() => { setAdvMode('region'); setPendingRadiation(null); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-xs ${
                  advMode === 'region'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-sky-300'
                }`}
              >
                ◯ Área circular
              </button>
              <button
                type="button"
                onClick={() => { setAdvMode('radiation'); setPendingRadiation(null); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  advMode === 'radiation'
                    ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-300/40'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                ➔ Irradiação anatômica
              </button>
              {instrument === 'advanced' && (
                <button
                  type="button"
                  onClick={() => { setAdvMode('joint'); setPendingRadiation(null); }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-xs ${
                    advMode === 'joint'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  🦴 Articular
                </button>
              )}
            </div>

            {/* Sub-controls depending on tool */}
            <div className="flex items-center gap-2 flex-wrap">
              {advMode === 'region' && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold">Raio da área: {regionRadius}px</span>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={regionRadius}
                    onChange={(e) => setRegionRadius(Number(e.target.value))}
                    className="w-20 accent-sky-600 cursor-pointer"
                  />
                </div>
              )}
              {advMode === 'joint' && (
                <select
                  value={jointDropdownName}
                  onChange={(e) => setJointDropdownName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  {scope === 'hand' ? (
                    <>
                      <option value="Punho">Punho</option>
                      <option value="MCF 1">MCF 1 (Polegar)</option>
                      <option value="MCF 2">MCF 2 (Indicador)</option>
                      <option value="MCF 3">MCF 3 (Médio)</option>
                      <option value="MCF 4">MCF 4 (Anelar)</option>
                      <option value="MCF 5">MCF 5 (Mínimo)</option>
                      <option value="IFP 1">IFP 1</option>
                      <option value="IFP 2">IFP 2</option>
                      <option value="IFP 3">IFP 3</option>
                      <option value="IFP 4">IFP 4</option>
                      <option value="IFP 5">IFP 5</option>
                      <option value="IFD 2">IFD 2</option>
                      <option value="IFD 3">IFD 3</option>
                      <option value="IFD 4">IFD 4</option>
                      <option value="IFD 5">IFD 5</option>
                    </>
                  ) : scope === 'foot' ? (
                    <>
                      <option value="Tornozelo">Tornozelo</option>
                      <option value="Tendão de Aquiles">Tendão de Aquiles</option>
                      <option value="Fáscia Plantar">Fáscia Plantar</option>
                      <option value="MTF 1">MTF 1 (Hálux)</option>
                      <option value="MTF 2">MTF 2</option>
                      <option value="MTF 3">MTF 3</option>
                      <option value="MTF 4">MTF 4</option>
                      <option value="MTF 5">MTF 5</option>
                    </>
                  ) : (
                    <>
                      <option value="ATM">ATM (Mandíbula)</option>
                      <option value="Ombro">Ombro</option>
                      <option value="Cotovelo">Cotovelo</option>
                      <option value="Punho">Punho</option>
                      <option value="Coluna cervical">Coluna cervical</option>
                      <option value="Coluna torácica">Coluna torácica</option>
                      <option value="Coluna lombar">Coluna lombar</option>
                      <option value="Sacroilíaca">Sacroilíaca</option>
                      <option value="Quadril">Quadril</option>
                      <option value="Joelho">Joelho</option>
                      <option value="Tornozelo">Tornozelo</option>
                    </>
                  )}
                </select>
              )}
              {advMode === 'radiation' && (
                <div className="flex items-center gap-2">
                  {pendingRadiation ? (
                    <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                      <span>Origem marcada ({getAnatomicalLabelForCoord(pendingRadiation.asset, pendingRadiation.x, pendingRadiation.y)}). Toque no destino anatômico.</span>
                      <button
                        type="button"
                        onClick={() => setPendingRadiation(null)}
                        className="ml-1 text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer text-[10px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                      Toque na origem da dor e depois no destino (a linha seguirá o trajeto anatômico).
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLINICAL SUMMARY PILL STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Pontos ativos</span>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400">{currentDayStats.count}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Pico / Pior dor</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
              {currentDayStats.worstVal > 0 ? `${currentDayStats.worstVal}/10` : '0/10'}
            </span>
          </div>

          <div className="bg-purple-50/60 dark:bg-purple-950/20 p-2.5 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold uppercase">Escore WPI</span>
              <InfoTooltip
                title="Escore WPI (fibromialgia)"
                content="Widespread Pain Index: pontua 19 regiões padronizadas do ACR. Escore ≥ 7 preenche o critério de dor difusa para fibromialgia."
              />
            </div>
            <div className="text-right">
              <span className={`text-sm font-black ${wpiScore >= 7 ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {wpiScore}/19
              </span>
              <span className="text-[9px] block text-purple-600 dark:text-purple-400 font-semibold">
                {wpiScore >= 7 ? 'Critério dor difusa' : 'Dor focal/moderada'}
              </span>
            </div>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/20 p-2.5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold uppercase">DAS28 (NAD)</span>
              <InfoTooltip
                title="Escore DAS28 (artrite reumatóide)"
                content="Número de Articulações Dolorosas (NAD de 0 a 28) em ombros, cotovelos, punhos, joelhos, MCFs e IFPs."
              />
            </div>
            <div className="text-right">
              <span className={`text-sm font-black ${das28Count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {das28Count}/28
              </span>
              <span className="text-[9px] block text-rose-600 dark:text-rose-400 font-semibold">
                {das28Count >= 10 ? 'Alta atividade' : das28Count >= 4 ? 'Moderada' : das28Count > 0 ? 'Leve' : 'Remissão'}
              </span>
            </div>
          </div>
        </div>

        {/* 14-Day Timeline Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-teal-500" />
              Histórico recente (Selecione um dia para visualizar no corpo):
            </span>
            {selectedDate !== todayISO() && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayISO())}
                className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Voltar para hoje
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            {recentDaysList.map((day) => {
              const isSelected = day.date === selectedDate;
              const hasPain = day.painCount > 0;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-between p-2 rounded-2xl min-w-[54px] border transition-all cursor-pointer ${
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
                  
                  <div className="my-1 flex items-center justify-center">
                    {hasPain ? (
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          isSelected
                            ? 'bg-white text-teal-700'
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
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-200' : 'bg-slate-300 dark:bg-slate-600'}`} />
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

        {/* WORKSPACE: VISUAL CANVAS OR LIST MODE */}
        {viewFilter === 'list' ? (
          /* ================= ACCESSIBLE ANATOMICAL LIST MODE ================= */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <List className="w-5 h-5 text-teal-500" />
                Lista anatômica acessível
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {BODY_REGIONS_LIST.map((reg) => {
                const score = currentPainMap[reg.id] || 0;
                return (
                  <div
                    key={reg.id}
                    className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                        {reg.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {reg.side === 'front' ? 'Anterior' : 'Posterior'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[0, 2, 5, 8, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            const updatedMap = { ...currentPainMap };
                            if (val === 0) delete updatedMap[reg.id];
                            else updatedMap[reg.id] = val;
                            recalculateAndSave(updatedMap);
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            score === val
                              ? val === 0
                                ? 'bg-slate-600 text-white'
                                : val <= 3
                                ? 'bg-amber-500 text-white'
                                : val <= 6
                                ? 'bg-orange-500 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {val === 0 ? 'Sem dor' : val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= VISUAL FIGURES RENDERER ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1 w-full max-w-full">
            
            {/* THE VISUAL CANVAS (7 cols) */}
            <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-3xl flex flex-col items-center relative select-none w-full max-w-full overflow-x-hidden">
              
              {/* UNIFIED TOP TOOLBAR: View switch + Repeat Yesterday + Draw tools + Clear */}
              <div className="w-full flex flex-col gap-2.5 mb-3 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
                {/* Line 1: View Filter + Yesterday Memory */}
                <div className="w-full flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-850 p-1 rounded-2xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setViewFilter('front')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        viewFilter === 'front'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Frente
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewFilter('back')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        viewFilter === 'back'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Costas
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewFilter('both')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        viewFilter === 'both'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Ambas (lado a lado)
                    </button>
                  </div>

                  {/* Repeat Yesterday Memory Button */}
                  {yesterdayLog && (
                    <button
                      type="button"
                      onClick={handleRepeatYesterday}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-500/15 via-teal-500/25 to-emerald-500/15 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700/60 hover:from-teal-500/30 hover:to-emerald-500/30 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      title={`Importar os pontos registrados em ${fmtDate(yesterdayLog.date, 's')}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Repetir dores de ontem</span>
                      {yesterdayPointsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-600 text-white font-black">
                          {yesterdayPointsCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Line 2: Drawing Tools & Quick Clear */}
                <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => { setAdvMode('point'); setPendingRadiation(null); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        advMode === 'point'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'
                      }`}
                    >
                      ● Ponto livre
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdvMode('region'); setPendingRadiation(null); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        advMode === 'region'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'
                      }`}
                    >
                      ◯ Área circular
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
                      ➔ Irradiação anatômica
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {advMode === 'region' && (
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-bold">
                        <span>Raio: {regionRadius}px</span>
                        <input
                          type="range"
                          min="15"
                          max="90"
                          value={regionRadius}
                          onChange={(e) => setRegionRadius(Number(e.target.value))}
                          className="w-14 accent-sky-600 cursor-pointer"
                        />
                      </div>
                    )}
                    {currentDayStats.count > 0 && (
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(true)}
                        className="px-2 py-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Limpar todos os pontos deste dia"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification hint for radiation mode */}
                {advMode === 'radiation' && (
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                    <span>
                      {pendingRadiation 
                        ? `Origem marcada em ${getAnatomicalLabelForCoord(pendingRadiation.asset, pendingRadiation.x, pendingRadiation.y)}. Toque no destino para traçar o trajeto anatômico.` 
                        : 'Toque no ponto de origem da dor no corpo para iniciar a irradiação.'}
                    </span>
                    {pendingRadiation && (
                      <button
                        type="button"
                        onClick={() => setPendingRadiation(null)}
                        className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer text-[10px]"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* SVG CARDS CONTAINER - Scaled without horizontal scroll */}
              <div className={`w-full grid items-center justify-center ${
                activeFigures.length === 1 
                  ? 'grid-cols-1 max-w-[360px] mx-auto gap-3' 
                  : activeFigures.length === 2 
                  ? 'grid-cols-2 max-w-[680px] mx-auto gap-2 sm:gap-4' 
                  : 'grid-cols-2 sm:grid-cols-3 max-w-[680px] mx-auto gap-2 sm:gap-3'
              }`}>
                {activeFigures.map((assetKey) => {
                  const mask: AtlasMask = ATLAS_MASKS[assetKey] || {
                    asset: assetKey,
                    width: assetKey.includes('corpo') ? 479 : 288,
                    height: assetKey.includes('corpo') ? 984 : 393,
                    path: ''
                  };

                  return (
                    <div
                      key={assetKey}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center shadow-2xs relative w-full"
                    >
                      <span className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {ASSET_NAMES[assetKey] || assetKey}
                      </span>

                      <div className="w-full relative aspect-auto flex items-center justify-center">
                        <svg
                          data-asset={assetKey}
                          viewBox={`0 0 ${mask.width} ${mask.height}`}
                          preserveAspectRatio="xMidYMid meet"
                          className="w-full h-auto select-none max-h-[55vh] sm:max-h-[500px]"
                          onClick={(e) => handleSvgSilhouetteClick(assetKey, e)}
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

                          {/* OFFICIAL NATHAN PNG ANATOMY ARTWORK */}
                          <image
                            href={`/anatomy/${assetKey}.png`}
                            width={mask.width}
                            height={mask.height}
                            x="0"
                            y="0"
                            pointerEvents="none"
                          />

                          {/* CLICKABLE MASK SILHOUETTE */}
                          <path
                            d={mask.path}
                            fill="transparent"
                            style={{ cursor: instrument === 'wpi19' ? 'default' : 'crosshair' }}
                            pointerEvents={instrument === 'wpi19' ? 'none' : 'auto'}
                          />

                          {/* 1. WPI-19 POLYGONS (WHEN IN WPI MODE) */}
                          {instrument === 'wpi19' && WPI19_REGIONS.filter(r => r.asset === assetKey).map((reg) => {
                            const isSelected = (currentPainMap[reg.id] || 0) > 0;
                            const isActive = selectedStructureId === reg.id;

                            return (
                              <g key={reg.id} className="cursor-pointer">
                                <path
                                  d={reg.path}
                                  fill={isSelected ? 'rgba(78, 135, 190, 0.45)' : 'transparent'}
                                  stroke={isActive ? '#0284c7' : isSelected ? '#3e7bab' : 'rgba(100, 150, 200, 0.15)'}
                                  strokeWidth={isActive ? 3 : isSelected ? 2.5 : 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWpiRegion(reg.id);
                                  }}
                                >
                                  <title>{reg.label}</title>
                                </path>

                                {isSelected && (
                                  <circle
                                    cx={reg.x}
                                    cy={reg.y}
                                    r="9"
                                    fill="#3e7bab"
                                    stroke="white"
                                    strokeWidth="2"
                                    pointerEvents="none"
                                  />
                                )}
                              </g>
                            );
                          })}

                          {/* 2. DAS28 JOINTS (WHEN IN DAS28 MODE) */}
                          {instrument === 'das28' && DAS28_JOINTS.filter(j => j.asset === assetKey).map((joint) => {
                            const isTender = (currentPainMap[joint.id] || 0) > 0;
                            const isSwollen = (currentPainMap[`${joint.id}_swollen`] || 0) > 0;
                            const isSelected = selectedStructureId === joint.id;

                            return (
                              <g
                                key={joint.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleDas28Joint(joint.id, 'tender');
                                }}
                                className="cursor-pointer group"
                              >
                                <circle cx={joint.x} cy={joint.y} r="16" fill="transparent" />
                                {isSelected && (
                                  <circle cx={joint.x} cy={joint.y} r="14" fill="none" stroke="#1FBCC4" strokeWidth="2.5" className="animate-pulse" />
                                )}
                                <circle
                                  cx={joint.x}
                                  cy={joint.y}
                                  r={isTender || isSwollen ? 8 : 6}
                                  fill={
                                    isTender && isSwollen
                                      ? '#d54778'
                                      : isTender
                                      ? '#ef8857'
                                      : isSwollen
                                      ? '#9a75c9'
                                      : '#edf3f7'
                                  }
                                  stroke={isTender || isSwollen ? '#ffffff' : '#607e99'}
                                  strokeWidth="1.8"
                                />
                                {(isTender || isSwollen) && (
                                  <text
                                    x={joint.x}
                                    y={joint.y + 3}
                                    textAnchor="middle"
                                    className="text-[7px] font-black fill-white select-none pointer-events-none"
                                  >
                                    {isTender && isSwollen ? 'D+E' : isTender ? 'D' : 'E'}
                                  </text>
                                )}
                              </g>
                            );
                          })}

                          {/* 3. ADVANCED & FREE PAIN MARKS (POINTS, REGIONS, RADIATION) */}
                          {currentMarks.filter(m => m.asset === assetKey || m.to?.asset === assetKey).map((m) => {
                            const isCurrentSelected = selectedMarkId === m.id;
                            const opacity = 0.15 + (m.intensity / 10) * 0.22;
                            const color = m.type === 'joint' 
                              ? '#6684bd' 
                              : m.type === 'radiation' 
                              ? '#e2a14a' 
                              : m.intensity >= 7 
                              ? '#db5c73' 
                              : m.intensity >= 4 
                              ? '#e98759' 
                              : '#d0a05d';

                            return (
                              <g
                                key={m.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMarkId(m.id);
                                  setSelectedStructureId(null);
                                }}
                                className="cursor-pointer group"
                              >
                                {/* Region / Circular area */}
                                {m.type === 'region' && m.asset === assetKey && (
                                  <circle
                                    cx={m.x}
                                    cy={m.y}
                                    r={m.radius || 45}
                                    fill="#f16b76"
                                    fillOpacity={opacity}
                                    stroke="#d76071"
                                    strokeOpacity="0.75"
                                    strokeDasharray="5 3"
                                    strokeWidth="1.5"
                                    clipPath={`url(#clip-${assetKey})`}
                                  />
                                )}

                                {/* Anatomical Radiation line with directional flow */}
                                {m.type === 'radiation' && m.asset === assetKey && m.to && m.to.asset === assetKey && (
                                  <g>
                                    {/* Outer glow aura */}
                                    <path
                                      d={getAnatomicalIrradiationPath(assetKey, { x: m.x, y: m.y }, { x: m.to.x, y: m.to.y })}
                                      fill="none"
                                      stroke="#f59e0b"
                                      strokeWidth={isCurrentSelected ? 8 : 6}
                                      strokeOpacity={0.25}
                                      strokeLinecap="round"
                                    />
                                    {/* Main anatomical tract */}
                                    <path
                                      d={getAnatomicalIrradiationPath(assetKey, { x: m.x, y: m.y }, { x: m.to.x, y: m.to.y })}
                                      fill="none"
                                      stroke={isCurrentSelected ? '#b45309' : '#d97706'}
                                      strokeWidth={isCurrentSelected ? 4 : 3}
                                      strokeLinecap="round"
                                      markerEnd={`url(#arrow-${assetKey})`}
                                    />
                                    {/* Animated neural pulse dash */}
                                    <path
                                      d={getAnatomicalIrradiationPath(assetKey, { x: m.x, y: m.y }, { x: m.to.x, y: m.to.y })}
                                      fill="none"
                                      stroke="#fef08a"
                                      strokeWidth={2}
                                      strokeDasharray="6 8"
                                      strokeLinecap="round"
                                      className="animate-pulse"
                                      opacity={0.9}
                                    />
                                  </g>
                                )}

                                {/* Destination point for radiation */}
                                {m.type === 'radiation' && m.to && m.to.asset === assetKey && (
                                  <g>
                                    <circle cx={m.to.x} cy={m.to.y} r="10" fill="#f59e0b" fillOpacity="0.3" className="animate-pulse" />
                                    <circle cx={m.to.x} cy={m.to.y} r="4" fill="#b45309" stroke="white" strokeWidth="1.5" />
                                  </g>
                                )}

                                {/* Main Marker Pin */}
                                {m.asset === assetKey && (
                                  <g>
                                    {isCurrentSelected && (
                                      <circle cx={m.x} cy={m.y} r="14" fill={color} opacity="0.2" className="animate-pulse" />
                                    )}
                                    <circle
                                      cx={m.x}
                                      cy={m.y}
                                      r={isCurrentSelected ? 8 : 6.5}
                                      fill={color}
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x={m.x}
                                      y={m.y + 2.8}
                                      textAnchor="middle"
                                      className="text-[7px] font-black fill-white select-none pointer-events-none"
                                    >
                                      {m.intensity}
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}

                          {/* Pending Radiation Origin Pin with pulse ring */}
                          {pendingRadiation && pendingRadiation.asset === assetKey && (
                            <g>
                              <circle
                                cx={pendingRadiation.x}
                                cy={pendingRadiation.y}
                                r="16"
                                fill="#f59e0b"
                                fillOpacity="0.35"
                                className="animate-ping"
                              />
                              <circle
                                cx={pendingRadiation.x}
                                cy={pendingRadiation.y}
                                r="8.5"
                                fill="#d97706"
                                stroke="white"
                                strokeWidth="2.5"
                              />
                            </g>
                          )}
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-400/50 rounded-full inline-block" /> Anatomia neutra
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#4e82ba] rounded-full inline-block" /> Região WPI
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#ef8857] rounded-full inline-block" /> Dor (DAS28)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#9a75c9] rounded-full inline-block" /> Edema (DAS28)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#e11d48] rounded-full inline-block animate-pulse" /> Dor intensa (7-10)
                </span>
              </div>
            </div>

            {/* DEDICATED CONTROL PANEL & RATING DOCK (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* QUICK ACTIVE POINTS WITH [+] AND [-] STEPPERS */}
              {currentMarks.length > 0 && (
                <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Pontos ativos de hoje ({currentMarks.length})
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                      Ajuste rápido (+ / -)
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {currentMarks.map((m) => {
                      const isSelected = selectedMarkId === m.id;
                      const diff = m.previousIntensity !== undefined ? m.intensity - m.previousIntensity : null;

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMarkId(m.id);
                            setSelectedStructureId(null);
                          }}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {m.label}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {diff !== null ? (
                                diff < 0 ? (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                                    ▼ Melhorou ({diff})
                                  </span>
                                ) : diff > 0 ? (
                                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded-md">
                                    ▲ Piorou (+{diff})
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
                                    = Mantido
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                                  Novo ponto
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper buttons [-] score [+] */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleStepIntensity(m.id, -1)}
                              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-90 transition-all cursor-pointer"
                              title="Reduzir intensidade da dor"
                            >
                              -
                            </button>

                            <span className={`w-8 text-center text-xs font-black px-1 py-0.5 rounded-lg ${
                              m.intensity >= 7 ? 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60' :
                              m.intensity >= 4 ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60' :
                              'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60'
                            }`}>
                              {m.intensity}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleStepIntensity(m.id, 1)}
                              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-90 transition-all cursor-pointer"
                              title="Aumentar intensidade da dor"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMark(m.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-0.5 cursor-pointer"
                              title="Remover ponto de dor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RATING DOCK */}
              <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                  <div>
                    <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
                      {selectedMark ? 'Marcação selecionada' : selectedStructureId ? 'Estrutura selecionada' : 'Selecione uma área'}
                    </span>
                    <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {selectedMark ? (
                        <>
                          {selectedMark.type === 'radiation' ? (
                            <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          ) : (
                            <Activity className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{selectedMark.label}</span>
                        </>
                      ) : selectedStructureId ? (
                        <>
                          <Activity className="w-4 h-4 text-teal-500" />
                          {WPI19_REGIONS.find(r => r.id === selectedStructureId)?.label || 
                           DAS28_JOINTS.find(j => j.id === selectedStructureId)?.label || 
                           BODY_REGIONS_LIST.find(b => b.id === selectedStructureId)?.label || 
                           selectedStructureId}
                        </>
                      ) : (
                        'Toque no mapa para avaliar'
                      )}
                    </h4>
                  </div>

                  {(selectedMark || selectedStructureId) && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {selectedMark 
                        ? `Nota: ${selectedMark.intensity}/10` 
                        : selectedStructureId && (currentPainMap[selectedStructureId] || 0) > 0
                        ? `Nota: ${currentPainMap[selectedStructureId]}/10`
                        : 'Sem dor'}
                    </span>
                  )}
                </div>

                {/* Score Keypad */}
                {(selectedMark || selectedStructureId) ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Definir nível de dor (0 a 10):
                      </span>
                      <div className="grid grid-cols-11 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                          const activeScore = selectedMark 
                            ? selectedMark.intensity 
                            : selectedStructureId 
                            ? (currentPainMap[selectedStructureId] || 0) 
                            : 0;
                          const isCurrent = activeScore === score;

                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => {
                                if (selectedMark) {
                                  handleUpdateMarkIntensity(selectedMark.id, score);
                                } else if (selectedStructureId) {
                                  const updatedMap = { ...currentPainMap };
                                  if (score === 0) delete updatedMap[selectedStructureId];
                                  else updatedMap[selectedStructureId] = score;
                                  recalculateAndSave(updatedMap);
                                }
                              }}
                              className={`py-2 text-xs font-bold rounded-lg transition-all active:scale-90 duration-150 select-none cursor-pointer ${
                                isCurrent
                                  ? score === 0
                                    ? 'bg-slate-700 text-white shadow-xs scale-105'
                                    : score <= 3
                                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                                    : score <= 6
                                    ? 'bg-orange-500 text-white shadow-xs scale-105'
                                    : 'bg-rose-600 text-white shadow-xs scale-105'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                              }`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Tiers */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { label: 'Sem dor', val: 0, cls: 'hover:border-slate-400' },
                        { label: 'Leve (2)', val: 2, cls: 'hover:border-amber-400' },
                        { label: 'Moderada (5)', val: 5, cls: 'hover:border-orange-400' },
                        { label: 'Intensa (8)', val: 8, cls: 'hover:border-rose-400' }
                      ].map((tier) => (
                        <button
                          key={tier.val}
                          type="button"
                          onClick={() => {
                            if (selectedMark) {
                              handleUpdateMarkIntensity(selectedMark.id, tier.val);
                            } else if (selectedStructureId) {
                              const updatedMap = { ...currentPainMap };
                              if (tier.val === 0) delete updatedMap[selectedStructureId];
                              else updatedMap[selectedStructureId] = tier.val;
                              recalculateAndSave(updatedMap);
                            }
                          }}
                          className="py-1 px-2 text-[10px] font-bold rounded-xl border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500 cursor-pointer"
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>

                    {/* Delete button if mark */}
                    {selectedMark && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMark(selectedMark.id)}
                        className="w-full min-h-[44px] py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                      >
                        <Trash2 className="w-4 h-4" /> Remover esta marcação
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>Toque diretamente no corpo ou nas articulações para avaliar a dor de hoje.</p>
                    {instrument === 'wpi19' && (
                      <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 text-[11px]">
                        <strong>Regra do WPI:</strong> Marque cada região onde sentiu dor nos últimos 7 dias. O escore vai de 0 a 19.
                      </div>
                    )}
                    {instrument === 'das28' && (
                      <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-[11px]">
                        <strong>Avaliação DAS28:</strong> Avalia ombros, cotovelos, punhos, joelhos e juntas dos dedos nas mãos.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SENSATION & PAIN TRAITS */}
              <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Sensação predominante da dor:
                    <InfoTooltip
                      title="Qualidade da dor"
                      content="A descrição do tipo de dor ajuda seu médico a distinguir dores inflamatórias, miofasciais e neuropáticas para calibrar o tratamento farmacológico."
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAIN_CHARACTERS.map((char) => {
                    const isSelected = (currentLog?.painCharacter || []).includes(char.key);
                    return (
                      <Tooltip key={char.key} title={char.label} content={char.description} position="top">
                        <button
                          type="button"
                          onClick={() => handleTogglePainCharacter(char.key)}
                          className={`w-full p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span>{char.icon}</span>
                          <span className="truncate">{char.label}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* SUMMARY & RESET */}
              <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                    Resumo do dia ({fmtDate(selectedDate, 's')})
                  </span>
                  {currentDayStats.count > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearOpen(true)}
                      className="text-slate-400 hover:text-rose-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Limpar dia
                    </button>
                  )}
                </div>

                {confirmClearOpen && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
                    <p className="font-bold text-rose-800 dark:text-rose-300 text-[11px]">
                      Remover todos os pontos deste dia?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearAllRegions}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(false)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Pontos ativos</span>
                    <strong className="text-base font-bold text-slate-800 dark:text-slate-100">{currentDayStats.count}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Média</span>
                    <strong className="text-base font-bold text-slate-800 dark:text-slate-100">{currentDayStats.avg}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CONSCIOUS PRESET CONFIRMATION MODAL */}
      {presetDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{presetDraft.icon}</span>
                <div>
                  <h4 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                    {presetDraft.label}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proposta de registro rápido para {selectedDate === todayISO() ? 'hoje' : fmtDate(selectedDate, 's')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPresetDraft(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {presetDraft.description}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Valores propostos para confirmação:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Dor média:</span>
                  <strong className="text-sm font-bold text-rose-600 dark:text-rose-400">{presetDraft.pain}/10</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Pior dor:</span>
                  <strong className="text-sm font-bold text-rose-600 dark:text-rose-400">{presetDraft.worstPain}/10</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Fadiga:</span>
                  <strong className="text-sm font-bold text-purple-600 dark:text-purple-400">{presetDraft.fatigue}/10</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Capacidade funcional:</span>
                  <strong className="text-sm font-bold text-teal-600 dark:text-teal-400">{presetDraft.functionVal}/10</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmPresetDraft}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Confirmar e registrar
              </button>
              <button
                type="button"
                onClick={() => setPresetDraft(null)}
                className="min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
