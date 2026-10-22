/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component FilterLogs: Allows patients to filter their history of symptom diaries
 * by date range, specific triggers, and textual search in notes.
 */

import React, { useState, useMemo } from 'react';
import { DailyLog } from '../types';
import { fmtDate } from '../utils';
import { 
  Calendar, 
  Filter, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  FileText, 
  SlidersHorizontal, 
  RefreshCw, 
  X, 
  Activity, 
  Heart, 
  Moon, 
  Smile, 
  Coffee, 
  Thermometer, 
  Wind, 
  CloudRain, 
  Sun, 
  Clock, 
  BrainCircuit, 
  ShieldAlert, 
  TrendingUp 
} from 'lucide-react';

interface FilterLogsProps {
  logs: DailyLog[];
}

export const FilterLogs: React.FC<FilterLogsProps> = ({ logs }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [expandedLogDate, setExpandedLogDate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'desc' | 'asc'>('desc');

  // Dynamically extract all triggers present in logs to offer as filters
  const availableTriggers = useMemo(() => {
    const triggersSet = new Set<string>();
    // Pre-populate with standard triggers so they always appear as options
    const presets = [
      'Frio', 'Calor', 'Chuva', 'Umidade', 'Estresse ocupacional', 
      'Sobrecarga mental', 'Alimentação inadequada', 'Excesso de cafeína', 
      'Dificuldade para pegar no sono', 'Sono agitado / pesadelos',
      'Ar-condicionado', 'Mudança de medicação recente', 'Consumo de álcool'
    ];
    presets.forEach(p => triggersSet.add(p));
    
    logs.forEach(l => {
      if (l.triggers && Array.isArray(l.triggers)) {
        l.triggers.forEach(t => {
          if (t && t.trim()) triggersSet.add(t);
        });
      }
    });
    return Array.from(triggersSet).sort();
  }, [logs]);

  // Handle trigger selection
  const handleToggleTriggerFilter = (trigger: string) => {
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter(t => t !== trigger));
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSelectedTriggers([]);
  };

  // Filter & sort logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by date range
    if (startDate) {
      result = result.filter(l => l.date >= startDate);
    }
    if (endDate) {
      result = result.filter(l => l.date <= endDate);
    }

    // Filter by presence of specific triggers
    if (selectedTriggers.length > 0) {
      result = result.filter(l => {
        const logTriggers = l.triggers || [];
        // Must contain all selected triggers
        return selectedTriggers.every(t => logTriggers.includes(t));
      });
    }

    // Filter by search query (notes, stressContext, activityLoad)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(l => {
        const notesMatch = l.notes?.toLowerCase().includes(q);
        const contextMatch = l.stressContext?.toLowerCase().includes(q);
        const loadMatch = l.activityLoad?.toLowerCase().includes(q);
        const rescueMatch = l.rescueMed?.toLowerCase().includes(q);
        return !!(notesMatch || contextMatch || loadMatch || rescueMatch);
      });
    }

    // Sort logs
    result.sort((a, b) => {
      if (sortBy === 'desc') {
        return b.date.localeCompare(a.date);
      } else {
        return a.date.localeCompare(b.date);
      }
    });

    return result;
  }, [logs, startDate, endDate, selectedTriggers, searchQuery, sortBy]);

  const toggleExpandLog = (date: string) => {
    if (expandedLogDate === date) {
      setExpandedLogDate(null);
    } else {
      setExpandedLogDate(date);
    }
  };

  // Get mood emoji and labels
  const getMoodEmoji = (moodValue?: number | null) => {
    if (moodValue === undefined || moodValue === null) return '😐';
    const moodsMap: Record<number, { emoji: string; text: string }> = {
      1: { emoji: '😫', text: 'Muito Ruim' },
      2: { emoji: '🙁', text: 'Ruim' },
      3: { emoji: '😐', text: 'Razoável' },
      4: { emoji: '🙂', text: 'Bom' },
      5: { emoji: '😄', text: 'Excelente' }
    };
    return moodsMap[moodValue]?.emoji || '😐';
  };

  // Get color class based on score
  const getScoreColor = (score: number | null | undefined, type: 'pain' | 'fatigue' | 'sleep' | 'function') => {
    if (score === null || score === undefined) return 'bg-slate-100 text-slate-400 dark:bg-slate-800';
    
    if (type === 'pain' || type === 'fatigue') {
      if (score <= 3) return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      if (score <= 6) return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
      return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
    } else { // sleep or function (higher is better)
      if (score >= 7) return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      if (score >= 4) return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
      return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
        <div className="space-y-1">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-500" />
            Histórico Avançado de Diários (Logs)
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
            Consulte diários passados por data, busque palavras-chave e filtre por gatilhos biológicos ou climáticos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {sortBy === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
          </button>
          {(startDate || endDate || searchQuery || selectedTriggers.length > 0) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer hover:bg-rose-100"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filter Control Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-950/25 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
        
        {/* Date Inputs */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-teal-500" /> Intervalo de Datas
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
            />
            <span className="text-slate-400 text-xs">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Text Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3 text-teal-500" /> Palavra-Chave / Busca
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar notas, medicações, contextos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Gatilhos Filter Trigger */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-teal-500" /> Presença de Gatilhos
          </label>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) handleToggleTriggerFilter(e.target.value);
            }}
            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">+ Adicionar filtro de gatilho...</option>
            {availableTriggers.map((t) => (
              <option 
                key={t} 
                value={t}
                disabled={selectedTriggers.includes(t)}
                className={selectedTriggers.includes(t) ? 'text-slate-300 dark:text-slate-700' : ''}
              >
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected triggers tags area */}
      {selectedTriggers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100/30 dark:border-slate-850">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 mr-1">
            Gatilhos Filtros:
          </span>
          {selectedTriggers.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 text-teal-700 dark:text-teal-400 text-[10px] font-bold rounded-full"
            >
              {t}
              <button
                type="button"
                onClick={() => handleToggleTriggerFilter(t)}
                className="hover:text-teal-900 dark:hover:text-teal-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results Header */}
      <div className="flex justify-between items-center px-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-semibold">
          Mostrando <strong className="text-slate-700 dark:text-slate-200">{filteredLogs.length}</strong> de <strong className="text-slate-600 dark:text-slate-400">{logs.length}</strong> diários registrados
        </span>
      </div>

      {/* Logs Accordion list */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-xs text-slate-400 font-semibold">Nenhum diário encontrado com os filtros atuais.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tente limpar os filtros ou buscar por outro termo.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogDate === log.date;
            const triggerCount = log.triggers?.length || 0;
            const hasNotes = !!log.notes?.trim();

            return (
              <div 
                key={log.date}
                className={`border rounded-xl transition-all duration-200 ${
                  isExpanded 
                    ? 'border-teal-200 dark:border-teal-900 bg-teal-50/5 dark:bg-teal-950/5 shadow-3xs' 
                    : 'border-slate-100 dark:border-slate-850 bg-slate-50/30 hover:bg-slate-50 dark:bg-slate-950/10 dark:hover:bg-slate-950/30'
                }`}
              >
                {/* Header of Item */}
                <div 
                  onClick={() => toggleExpandLog(log.date)}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* Mood indicator */}
                    <span className="text-lg bg-white dark:bg-slate-900 w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-3xs flex-shrink-0">
                      {getMoodEmoji(log.mood)}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                          {fmtDate(log.date, 'dt')}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({fmtDate(log.date).split(',')[0]})
                        </span>
                      </div>
                      
                      {/* Short summary tags */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {triggerCount > 0 && (
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" />
                            {triggerCount} {triggerCount === 1 ? 'gatilho' : 'gatilhos'}
                          </span>
                        )}
                        {hasNotes && (
                          <span className="text-[9px] bg-teal-100/50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <FileText className="w-2.5 h-2.5" />
                            Anotado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="grid grid-cols-4 gap-1">
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-lg ${getScoreColor(log.pain, 'pain')}`} title="Dor">
                          {log.pain ?? '-'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">DOR</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-lg ${getScoreColor(log.fatigue, 'fatigue')}`} title="Fadiga">
                          {log.fatigue ?? '-'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">FAD</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-lg ${getScoreColor(log.sleep, 'sleep')}`} title="Qualidade de Sono">
                          {log.sleep ?? '-'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">SON</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-lg ${getScoreColor(log.function, 'function')}`} title="Capacidade Funcional">
                          {log.function ?? '-'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">FUN</span>
                      </div>
                    </div>

                    <div className="ml-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-3.5 animate-fade-in text-xs text-slate-600 dark:text-slate-350">
                    
                    {/* Primary Grid details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Triggers and notes */}
                      <div className="space-y-3">
                        {/* Notes */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observações do Paciente:</span>
                          {hasNotes ? (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-lg text-[11px] leading-relaxed italic text-slate-600 dark:text-slate-300 font-medium">
                              "{log.notes}"
                            </div>
                          ) : (
                            <span className="text-slate-400 italic block">Nenhuma nota escrita.</span>
                          )}
                        </div>

                        {/* Triggers list */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gatilhos Registrados no Dia:</span>
                          {log.triggers && log.triggers.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {log.triggers.map((t) => (
                                <span 
                                  key={t}
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 text-[10px] font-bold rounded text-slate-700 dark:text-slate-300 flex items-center gap-1"
                                >
                                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic block">Nenhum gatilho observado ou relatado.</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Work context & Other variables */}
                      <div className="space-y-3 bg-slate-50/30 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1">Contexto Clínico & Variáveis</span>
                        
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                          {log.worstPain !== undefined && log.worstPain !== null && (
                            <div>
                              <span className="text-slate-400">Pico de Dor:</span>{' '}
                              <strong className="text-slate-700 dark:text-slate-200">{log.worstPain}/10</strong>
                            </div>
                          )}
                          {log.stiffness !== undefined && log.stiffness !== null && (
                            <div>
                              <span className="text-slate-400">Rigidez Matinal:</span>{' '}
                              <strong className="text-slate-700 dark:text-slate-200">{log.stiffness}/10</strong>
                            </div>
                          )}
                          {log.activityLoad && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Carga Física:</span>{' '}
                              <strong className="text-slate-700 dark:text-slate-200">{log.activityLoad}</strong>
                            </div>
                          )}
                          {log.workStatus && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Trabalho:</span>{' '}
                              <strong className="text-slate-700 dark:text-slate-200">{log.workStatus}</strong>
                            </div>
                          )}
                          {log.stressContext && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Foco de Estresse:</span>{' '}
                              <strong className="text-slate-700 dark:text-slate-200">{log.stressContext}</strong>
                            </div>
                          )}
                          {log.rescueMed && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Medicação de Resgate:</span>{' '}
                              <strong className="text-rose-600 dark:text-rose-400 font-bold">{log.rescueMed}</strong>
                              {log.rescueResponse && (
                                <span className="text-slate-400 font-normal"> ({log.rescueResponse})</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Wearable Sync block */}
                        {log.wearableSync && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
                            {log.wearableSync.steps !== undefined && (
                              <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 block">Passos</span>
                                <strong className="text-slate-700 dark:text-slate-200 text-[11px]">{log.wearableSync.steps}</strong>
                              </div>
                            )}
                            {log.wearableSync.sleepHours !== undefined && (
                              <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 block">Duração de Sono</span>
                                <strong className="text-slate-700 dark:text-slate-200 text-[11px]">{log.wearableSync.sleepHours}h</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* GI / SII Section if present */}
                        {(log.abdominalPain !== undefined || log.bloating !== undefined) && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sintomas GI/SII:</span>
                            <div className="flex gap-3">
                              {log.abdominalPain !== undefined && log.abdominalPain !== null && (
                                <div><span className="text-slate-400">Dor Abdominal:</span> <strong className="text-slate-700 dark:text-slate-200">{log.abdominalPain}/10</strong></div>
                              )}
                              {log.bloating !== undefined && log.bloating !== null && (
                                <div><span className="text-slate-400">Estufamento:</span> <strong className="text-slate-700 dark:text-slate-200">{log.bloating}/10</strong></div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
