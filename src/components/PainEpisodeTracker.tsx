/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component: PainEpisodeTracker (Registro de Episódios de Dor & Crises)
 * Permite registrar múltiplas crises de dor ao longo do dia, com horários de início e término,
 * intensidade inicial, máxima e final, características, gatilhos, sintomas associados e
 * avaliação estruturada da resposta a intervenções farmacológicas e não farmacológicas.
 */

import React, { useState } from 'react';
import { PainEpisode, InterventionResponse, ChronosData, Account } from '../types';
import { todayISO, fmtDate } from '../utils';
import {
  Flame,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Pill,
  ShieldCheck,
  Activity,
  X,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Trash2,
  HeartPulse,
  Thermometer,
  Timer,
  Check
} from 'lucide-react';
import { Tooltip, InfoTooltip } from './Tooltip';

interface PainEpisodeTrackerProps {
  data: ChronosData;
  account: Account;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  onClose?: () => void;
}

const COMMON_LOCATIONS = [
  'Cabeça / Têmporas',
  'Cervical / Pescoço',
  'Ombros / Trapézio',
  'Coluna Dorsal / Torácica',
  'Lombar / Coluna Baixa',
  'Quadril / Pelve',
  'Mãos e Dedos',
  'Punhos',
  'Joelhos',
  'Tornozelos e Pés',
  'Mandíbula / ATM',
  'Dor Difusa (Corpo Todo)'
];

const PAIN_CHARACTERS = [
  { id: 'queimação', label: 'Queimação / Ardência' },
  { id: 'pontada', label: 'Pontada / Agulhada' },
  { id: 'latejante', label: 'Latejante / Pulsátil' },
  { id: 'peso', label: 'Sensação de Peso / Cansaço' },
  { id: 'choque', label: 'Choque / Elétrica' },
  { id: 'aperto', label: 'Aperto / Pressão / Faixa' },
  { id: 'rigidez', label: 'Rigidez / Travamento' },
  { id: 'profunda', label: 'Dor Óssea / Profunda' }
];

const ASSOCIATED_SYMPTOMS = [
  'Náusea / Enjoo',
  'Fotofobia (Sensibilidade à luz)',
  'Fonofobia (Sensibilidade a ruídos)',
  'Tontura / Instabilidade',
  'Alodinia (Dor ao toque leve na pele)',
  'Fadiga Extrema / Fraqueza',
  'Visão Turva',
  'Dormência / Formigamento'
];

const COMMON_TRIGGERS = [
  'Estresse / Tensão emocional',
  'Esforço físico excessivo',
  'Mudança de clima / Frio / Chuva',
  'Noite mal dormida / Insônia',
  'Postura prolongada (computador/em pé)',
  'Atraso na medicação habitual',
  'Alimentação pesada / Jejum longo',
  'Movimento repetitivo'
];

const NON_PHARMACOLOGICAL_OPTIONS = [
  'Repouso no escuro / silêncio',
  'Bolsa de calor local / Água morna',
  'Gelo / Crioterapia local',
  'Alongamento suave / Relaxamento',
  'Técnicas de respiração lenta',
  'Massagem suave',
  'Fisioterapia motora',
  'Hidratação abundante'
];

export const PainEpisodeTracker: React.FC<PainEpisodeTrackerProps> = ({
  data,
  account,
  onUpdateData,
  onClose
}) => {
  const patientData = data.patientData[account.id] || {
    diagnoses: {},
    gender: account.gender || null,
    hormoneRelevant: false,
    baseline: null,
    periodicMetrics: [],
    flareAlerts: [],
    dailyLogs: [],
    painEpisodes: []
  };

  const episodes: PainEpisode[] = patientData.painEpisodes || [];

  // Modal / Form state for creating or editing an episode
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState<string>(todayISO());
  const [startTime, setStartTime] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [endTime, setEndTime] = useState<string>('');
  const [ongoing, setOngoing] = useState<boolean>(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [initialPain, setInitialPain] = useState<number>(6);
  const [peakPain, setPeakPain] = useState<number>(7);
  const [finalPain, setFinalPain] = useState<number | undefined>(undefined);
  const [character, setCharacter] = useState<string[]>([]);
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Interventions sub-form state
  const [interventions, setInterventions] = useState<InterventionResponse[]>([]);
  const [isAddingIntervention, setIsAddingIntervention] = useState(false);
  const [intType, setIntType] = useState<'pharmacological' | 'non_pharmacological'>('pharmacological');
  const [intName, setIntName] = useState<string>('');
  const [intDosage, setIntDosage] = useState<string>('');
  const [intTime, setIntTime] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [intPrePain, setIntPrePain] = useState<number>(7);
  const [intPostPain, setIntPostPain] = useState<number | undefined>(undefined);
  const [intElapsed, setIntElapsed] = useState<number>(60);
  const [intRelief, setIntRelief] = useState<'none' | 'partial' | 'significant' | 'complete' | 'worsened'>('partial');
  const [intAdverse, setIntAdverse] = useState<string>('');

  const openNewForm = () => {
    setEditingEpisodeId(null);
    setDate(todayISO());
    setStartTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setEndTime('');
    setOngoing(true);
    setLocations([]);
    setInitialPain(6);
    setPeakPain(7);
    setFinalPain(undefined);
    setCharacter([]);
    setAssociatedSymptoms([]);
    setTriggers([]);
    setNotes('');
    setInterventions([]);
    setIsFormOpen(true);
  };

  const openEditForm = (ep: PainEpisode) => {
    setEditingEpisodeId(ep.id);
    setDate(ep.date);
    setStartTime(ep.startTime);
    setEndTime(ep.endTime || '');
    setOngoing(ep.ongoing);
    setLocations(ep.locations || []);
    setInitialPain(ep.initialPain);
    setPeakPain(ep.peakPain);
    setFinalPain(ep.finalPain);
    setCharacter(ep.character || []);
    setAssociatedSymptoms(ep.associatedSymptoms || []);
    setTriggers(ep.triggers || []);
    setNotes(ep.notes || '');
    setInterventions(ep.interventions || []);
    setIsFormOpen(true);
  };

  const handleToggleLocation = (loc: string) => {
    setLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const handleToggleCharacter = (char: string) => {
    setCharacter((prev) =>
      prev.includes(char) ? prev.filter((c) => c !== char) : [...prev, char]
    );
  };

  const handleToggleSymptom = (sym: string) => {
    setAssociatedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleToggleTrigger = (trig: string) => {
    setTriggers((prev) =>
      prev.includes(trig) ? prev.filter((t) => t !== trig) : [...prev, trig]
    );
  };

  const handleAddIntervention = () => {
    if (!intName.trim()) return;

    const newInt: InterventionResponse = {
      id: `int_${Date.now()}`,
      type: intType,
      name: intName.trim(),
      dosage: intType === 'pharmacological' ? intDosage.trim() : undefined,
      timeApplied: intTime,
      prePainIntensity: intPrePain,
      postPainIntensity: intPostPain,
      timeElapsedMinutes: intElapsed,
      perceivedRelief: intRelief,
      adverseEvents: intAdverse.trim() || undefined
    };

    setInterventions((prev) => [...prev, newInt]);
    setIntName('');
    setIntDosage('');
    setIntAdverse('');
    setIsAddingIntervention(false);
  };

  const handleRemoveIntervention = (id: string) => {
    setInterventions((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveEpisode = () => {
    const episodeData: PainEpisode = {
      id: editingEpisodeId || `ep_${Date.now()}`,
      date,
      startTime,
      endTime: ongoing ? undefined : endTime || undefined,
      ongoing,
      locations,
      initialPain,
      peakPain: Math.max(initialPain, peakPain),
      finalPain: ongoing ? undefined : (finalPain ?? initialPain),
      character: character.length ? character : undefined,
      associatedSymptoms: associatedSymptoms.length ? associatedSymptoms : undefined,
      triggers: triggers.length ? triggers : undefined,
      interventions: interventions.length ? interventions : undefined,
      notes: notes.trim() || undefined
    };

    onUpdateData((prev) => {
      const pData = prev.patientData[account.id];
      if (!pData) return;
      if (!pData.painEpisodes) pData.painEpisodes = [];

      if (editingEpisodeId) {
        const idx = pData.painEpisodes.findIndex((e) => e.id === editingEpisodeId);
        if (idx >= 0) pData.painEpisodes[idx] = episodeData;
        else pData.painEpisodes.unshift(episodeData);
      } else {
        pData.painEpisodes.unshift(episodeData);
      }
    });

    setIsFormOpen(false);
  };

  const handleDeleteEpisode = (id: string) => {
    if (!confirm('Deseja excluir este registro de crise?')) return;
    onUpdateData((prev) => {
      const pData = prev.patientData[account.id];
      if (!pData || !pData.painEpisodes) return;
      pData.painEpisodes = pData.painEpisodes.filter((e) => e.id !== id);
    });
    if (editingEpisodeId === id) setIsFormOpen(false);
  };

  const handleCloseEpisodeQuick = (epId: string, currentPain: number) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    onUpdateData((prev) => {
      const pData = prev.patientData[account.id];
      if (!pData || !pData.painEpisodes) return;
      const target = pData.painEpisodes.find((e) => e.id === epId);
      if (target) {
        target.ongoing = false;
        target.endTime = nowTime;
        target.finalPain = currentPain;
      }
    });
  };

  // Stats for the user
  const activeEpisodes = episodes.filter((e) => e.ongoing);
  const pastEpisodes = episodes.filter((e) => !e.ongoing);

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-poppins font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Episódios de Dor & Crises
              <InfoTooltip
                title="Crises e Episódios Agudos (Flares)"
                content="Permite registrar episódios agudos ao longo do dia com hora de início, pico de dor, sintomas associados (como náusea ou alodinia) e resposta a intervenções de alívio sem alterar a rotina do diário diário."
              />
            </h2>
            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-[10px] rounded-full uppercase tracking-wider">
              Múltiplos Registros por Dia
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Registre picos de dor repentinos, duração, resposta a remédios e medidas de alívio sem alterar seu diário habitual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Voltar
            </button>
          )}

          <Tooltip
            title="Nova Crise SOS"
            content="Registrar um novo pico agudo de dor ou espasmo ocorrido hoje."
            position="bottom"
          >
            <button
              type="button"
              onClick={openNewForm}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Iniciar Registro de Crise
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Ongoing Flares Alert Banner */}
      {activeEpisodes.length > 0 && (
        <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Crise em Andamento ({activeEpisodes.length})
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
              Registro aberto
            </span>
          </div>

          <div className="space-y-2">
            {activeEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="p-3 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <strong className="text-slate-800 dark:text-slate-100 font-extrabold">
                      Início às {ep.startTime} ({fmtDate(ep.date, 's')})
                    </strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Pico: {ep.peakPain}/10
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Regiões: {ep.locations.length ? ep.locations.join(', ') : 'Não especificadas'}
                  </div>
                  {ep.interventions && ep.interventions.length > 0 && (
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {ep.interventions.length} intervenção(ões) aplicada(s)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(ep)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Adicionar Detalhes
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCloseEpisodeQuick(ep.id, Math.max(0, ep.initialPain - 3))}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Encerrar Crise
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episodes List & History */}
      <div className="space-y-3">
        <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-teal-500" />
          Histórico Recente de Crises e Episódios ({episodes.length})
        </h3>

        {episodes.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <Flame className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Nenhuma crise registrada até o momento
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Quando tiver um pico de dor ou crise súbita, use este botão para acompanhar a duração e a resposta aos remédios ou repouso.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                      {fmtDate(ep.date, 's')} · {ep.startTime} {ep.endTime ? `às ${ep.endTime}` : '(em andamento)'}
                    </span>
                    {ep.ongoing ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse">
                        Em Andamento
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Finalizado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                      <span className="text-slate-400 text-[10px]">Início:</span>
                      <span className="text-rose-600 dark:text-rose-400">{ep.initialPain}/10</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-slate-400 text-[10px]">Pico:</span>
                      <span className="text-red-700 dark:text-red-400 font-extrabold">{ep.peakPain}/10</span>
                      {ep.finalPain !== undefined && (
                        <>
                          <span className="text-slate-300">→</span>
                          <span className="text-slate-400 text-[10px]">Final:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ep.finalPain}/10</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditForm(ep)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                      title="Editar crise"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEpisode(ep.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Localizações:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                      {ep.locations.length ? ep.locations.join(' · ') : 'Não especificadas'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Características:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                      {ep.character?.length ? ep.character.join(', ') : '—'}
                    </p>
                  </div>
                </div>

                {/* Interventions in this Episode */}
                {ep.interventions && ep.interventions.length > 0 && (
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-950/40 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Resposta a Intervenções Realizadas ({ep.interventions.length}):
                    </span>
                    <div className="space-y-1.5">
                      {ep.interventions.map((intv) => (
                        <div
                          key={intv.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] gap-1"
                        >
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {intv.type === 'pharmacological' ? '💊' : '🌿'} {intv.name}
                            </strong>
                            {intv.dosage && <span className="text-slate-400 ml-1">({intv.dosage})</span>}
                            <span className="text-slate-400 text-[10px] ml-1.5">às {intv.timeApplied}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                              {intv.prePainIntensity}/10 → {intv.postPainIntensity ?? '?'} /10
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              intv.perceivedRelief === 'complete' || intv.perceivedRelief === 'significant'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : intv.perceivedRelief === 'partial'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              Alívio: {intv.perceivedRelief === 'complete' ? 'Total' : intv.perceivedRelief === 'significant' ? 'Significativo' : intv.perceivedRelief === 'partial' ? 'Parcial' : 'Sem alívio'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ep.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg">
                    "{ep.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT EPISODE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-rose-700 to-rose-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Flame className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-poppins font-black text-base text-white">
                    {editingEpisodeId ? 'Editar Registro de Crise' : 'Novo Registro de Crise de Dor'}
                  </h3>
                  <p className="text-xs text-rose-200 font-medium">
                    Preencha o que for confortável. Todos os campos são opcionais.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Date & Time Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400">Data do Episódio</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400">Horário de Início</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400">Status do Episódio</label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOngoing(!ongoing)}
                      className={`px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer w-full ${
                        ongoing
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ongoing ? '🔥 Em Andamento' : '✓ Encerrado'}
                    </button>
                  </div>
                </div>

                {!ongoing && (
                  <div className="col-span-1 sm:col-span-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 dark:text-slate-400">Horário de Término</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 dark:text-slate-400">Intensidade Final (0-10)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={finalPain ?? ''}
                        onChange={(e) => setFinalPain(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Ex: 2"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Intensity Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Intensidade Inicial:</span>
                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{initialPain} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={initialPain}
                    onChange={(e) => setInitialPain(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Intensidade Máxima (Pico):</span>
                    <span className="font-black text-red-600 dark:text-red-400 text-sm">{peakPain} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={peakPain}
                    onChange={(e) => setPeakPain(Number(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Anatomical Locations */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block">
                  Regiões Afetadas nesta Crise:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_LOCATIONS.map((loc) => {
                    const isSelected = locations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleToggleLocation(loc)}
                        className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500 border-rose-500 text-white font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Characteristics */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block">
                  Como é a Dor desta Crise? (Características):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAIN_CHARACTERS.map((char) => {
                    const isSelected = character.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => handleToggleCharacter(char.id)}
                        className={`p-2.5 rounded-xl border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {char.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Associated Symptoms */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block">
                  Sintomas Associados Presentes:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ASSOCIATED_SYMPTOMS.map((sym) => {
                    const isSelected = associatedSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => handleToggleSymptom(sym)}
                        className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Possible Triggers */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block">
                  Possíveis Desencadeantes / Gatilhos Suspeitos:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TRIGGERS.map((trig) => {
                    const isSelected = triggers.includes(trig);
                    return (
                      <button
                        key={trig}
                        type="button"
                        onClick={() => handleToggleTrigger(trig)}
                        className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {trig}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interventions Section */}
              <div className="p-4 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-poppins font-black text-xs text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      Intervenções & Resposta Terapêutica
                    </h4>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400">
                      Medicamentos de resgate, repouso, calor local ou exercícios utilizados nesta crise.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingIntervention(true)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Intervenção
                  </button>
                </div>

                {/* Sub-form to Add Intervention */}
                {isAddingIntervention && (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl space-y-3 animate-fade-in">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIntType('pharmacological')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          intType === 'pharmacological' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        💊 Remédio de Resgate (S.O.S.)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntType('non_pharmacological')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          intType === 'non_pharmacological' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        🌿 Não Farmacológica (Calor, Repouso...)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-bold text-slate-500">
                          {intType === 'pharmacological' ? 'Nome do Medicamento' : 'Nome da Intervenção'}
                        </label>
                        <input
                          type="text"
                          value={intName}
                          onChange={(e) => setIntName(e.target.value)}
                          placeholder={intType === 'pharmacological' ? 'Ex: Dipirona 1g, Tramadol...' : 'Ex: Bolsa de água quente, Repouso...'}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      {intType === 'pharmacological' && (
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Dosagem</label>
                          <input
                            type="text"
                            value={intDosage}
                            onChange={(e) => setIntDosage(e.target.value)}
                            placeholder="Ex: 500mg, 1 comprimido"
                            className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {intType === 'non_pharmacological' && (
                      <div className="flex flex-wrap gap-1">
                        {NON_PHARMACOLOGICAL_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setIntName(opt)}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            + {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Horário</label>
                        <input
                          type="time"
                          value={intTime}
                          onChange={(e) => setIntTime(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Dor Antes (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={intPrePain}
                          onChange={(e) => setIntPrePain(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Dor Depois (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={intPostPain ?? ''}
                          onChange={(e) => setIntPostPain(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Ex: 3"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Alívio Percebido</label>
                        <select
                          value={intRelief}
                          onChange={(e) => setIntRelief(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <option value="complete">Alívio Total</option>
                          <option value="significant">Significativo</option>
                          <option value="partial">Parcial</option>
                          <option value="none">Nenhum</option>
                          <option value="worsened">Piorou</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Efeitos Adversos / Colaterais (se houver):</label>
                      <input
                        type="text"
                        value={intAdverse}
                        onChange={(e) => setIntAdverse(e.target.value)}
                        placeholder="Ex: Sonolência acentuada, azia, tontura, náusea..."
                        className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingIntervention(false)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddIntervention}
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Salvar Intervenção
                      </button>
                    </div>
                  </div>
                )}

                {/* List of interventions added to this episode */}
                {interventions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {interventions.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/30 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div>
                          <strong className="text-slate-800 dark:text-slate-100">
                            {item.type === 'pharmacological' ? '💊' : '🌿'} {item.name}
                          </strong>
                          {item.dosage && <span className="text-slate-400 ml-1">({item.dosage})</span>}
                          <span className="text-slate-400 text-[10px] ml-1.5">às {item.timeApplied}</span>
                          <span className="text-[10px] text-teal-600 font-bold ml-2">
                            {item.prePainIntensity}/10 → {item.postPainIntensity ?? '?'} /10
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIntervention(item.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Observações ou Detalhes Livres:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva o que estava fazendo, sentimentos ou detalhes adicionais desta crise..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              {editingEpisodeId ? (
                <button
                  type="button"
                  onClick={() => handleDeleteEpisode(editingEpisodeId)}
                  className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
                >
                  Excluir este episódio
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEpisode}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingEpisodeId ? 'Salvar Alterações' : 'Salvar Crise de Dor'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
