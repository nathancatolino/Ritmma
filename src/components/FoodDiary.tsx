/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component FoodDiary: Comprehensive nutritional logging and clinical trigger correlation.
 * Allows patients to record meals, specify potential triggers, and view computed pain correlations.
 */

import React, { useState, useMemo } from 'react';
import { DailyLog, FoodMeal } from '../types';
import { todayISO, fmtDate } from '../utils';
import { 
  Apple, 
  Plus, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  Check, 
  Utensils, 
  AlertTriangle,
  Flame,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';

interface FoodDiaryProps {
  logs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
}

interface TriggerMeta {
  key: string;
  label: string;
  description: string;
  color: string;
}

export const FoodDiary: React.FC<FoodDiaryProps> = ({ logs, onSaveLog }) => {
  // Date state
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  // Meal Form States
  const [mealType, setMealType] = useState<FoodMeal['mealType']>('cafe_manha');
  const [foods, setFoods] = useState<string>('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Suggested common foods for quick logging depending on meal type
  const suggestions: Record<FoodMeal['mealType'], string[]> = {
    cafe_manha: ['Pão com manteiga', 'Café com leite', 'Ovo mexido', 'Mamão com aveia', 'Tapioca', 'Iogurte natural'],
    almoco: ['Arroz, feijão, frango grelhado e salada', 'Macarrão à bolonhesa', 'Purê de batata com carne moída', 'Salada de folhas verdes', 'Peixe assado com legumes'],
    lanche: ['Banana com mel', 'Mix de castanhas', 'Torradas com geleia', 'Bolo de cenoura', 'Chá de camomila', 'Maçã'],
    jantar: ['Sopa de legumes', 'Omelete de espinafre', 'Arroz integral com salmão', 'Salada caprese', 'Canja de galinha'],
    outro: ['Chocolate amargo', 'Suco de laranja', 'Bolacha de água e sal', 'Açaí completo', 'Whey protein']
  };

  // Pre-defined list of foods commonly monitored for individual sensitivities and clinical triggers
  const triggerList: TriggerMeta[] = [
    { key: 'gluten', label: 'Glúten', description: 'Pão, massas, cerveja, biscoitos e derivados do trigo', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
    { key: 'lactose', label: 'Lactose & Laticínios', description: 'Leite de vaca, queijos, manteiga, iogurte e derivados', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' },
    { key: 'sugar', label: 'Açúcar Refinado & Doces', description: 'Sobremesas, refrigerantes, sucos adoçados e doces industriais', color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' },
    { key: 'nightshades', label: 'Solanáceas', description: 'Alimentos como tomate, batata, berinjela e pimentão', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400' },
    { key: 'caffeine', label: 'Cafeína', description: 'Café, chá preto, bebidas energéticas e refrigerantes de cola', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400' },
    { key: 'red_meat', label: 'Carne Vermelha / Embutidos', description: 'Carne bovina, suína e embutidos processados (salame, bacon)', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400' },
    { key: 'ultraprocessed', label: 'Ultraprocessados', description: 'Alimentos prontos industrializados com aditivos químicos', color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-400' },
    { key: 'sweeteners', label: 'Adoçantes Artificiais', description: 'Aspartame, sucralose ou sacarina em produtos light/zero', color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400' }
  ];

  // Fetch the log for selected date
  const currentLog = useMemo(() => {
    return logs.find((l) => l.date === selectedDate) || null;
  }, [logs, selectedDate]);

  const currentMeals = useMemo(() => {
    return currentLog?.foodMeals || [];
  }, [currentLog]);

  // Handle adding a new meal
  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foods.trim()) return;

    const newMeal: FoodMeal = {
      id: Math.random().toString(36).substring(2, 9),
      mealType,
      foods: foods.trim(),
      suspectedTriggers: selectedTriggers.length > 0 ? [...selectedTriggers] : undefined
    };

    const updatedMeals = [...currentMeals, newMeal];

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

    // Propagate triggering tags to standard daily log triggers for cross-tab compatibility
    const allUniqueLogTriggers = new Set(baseLog.triggers || []);
    selectedTriggers.forEach(t => allUniqueLogTriggers.add(`alimentar_${t}`));

    onSaveLog({
      ...baseLog,
      foodMeals: updatedMeals,
      triggers: Array.from(allUniqueLogTriggers)
    });

    // Reset Form
    setFoods('');
    setSelectedTriggers([]);
    setShowAddForm(false);
  };

  // Handle deleting a meal
  const handleDeleteMeal = (mealId: string) => {
    if (!currentLog) return;
    const updatedMeals = currentMeals.filter((m) => m.id !== mealId);
    
    onSaveLog({
      ...currentLog,
      foodMeals: updatedMeals
    });
  };

  // Helper mapping meal types to PT-BR labels
  const getMealTypeLabel = (type: FoodMeal['mealType']) => {
    switch (type) {
      case 'cafe_manha': return 'Café da Manhã';
      case 'almoco': return 'Almoço';
      case 'lanche': return 'Lanche';
      case 'jantar': return 'Jantar';
      default: return 'Outro / Petisco';
    }
  };

  // Helper mapping meal types to clean background accents
  const getMealBadgeClass = (type: FoodMeal['mealType']) => {
    switch (type) {
      case 'cafe_manha': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      case 'almoco': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'lanche': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
      case 'jantar': return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400';
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Multi-day dynamic statistical correlation calculation (Inflammatory Triggers vs. Daily Pain Score)
  const triggerCorrelations = useMemo(() => {
    // Collect stats for each trigger type over the last 30 days
    const stats: Record<string, { daysWith: string[]; painWithSum: number; daysWithout: string[]; painWithoutSum: number }> = {};
    
    // Initialize stats
    triggerList.forEach((t) => {
      stats[t.key] = {
        daysWith: [],
        painWithSum: 0,
        daysWithout: [],
        painWithoutSum: 0
      };
    });

    // Consider the last 30 daily logs
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

    sortedLogs.forEach((log) => {
      const dailyPain = log.pain;
      if (dailyPain === null || dailyPain === undefined || isNaN(dailyPain)) {
        return; // Skip days with no pain score to avoid muddying correlation averages
      }

      // Check which food triggers were logged on this day
      const loggedTriggersToday = new Set<string>();
      log.foodMeals?.forEach((meal) => {
        meal.suspectedTriggers?.forEach((trigger) => {
          loggedTriggersToday.add(trigger);
        });
      });

      // Update trigger stats
      triggerList.forEach((t) => {
        if (loggedTriggersToday.has(t.key)) {
          stats[t.key].daysWith.push(log.date);
          stats[t.key].painWithSum += dailyPain;
        } else {
          stats[t.key].daysWithout.push(log.date);
          stats[t.key].painWithoutSum += dailyPain;
        }
      });
    });

    // Compile statistics and rank triggers by calculated Pain Delta
    return triggerList.map((t) => {
      const data = stats[t.key];
      const countWith = data.daysWith.length;
      const countWithout = data.daysWithout.length;

      const avgPainWith = countWith > 0 ? Number((data.painWithSum / countWith).toFixed(1)) : null;
      const avgPainWithout = countWithout > 0 ? Number((data.painWithoutSum / countWithout).toFixed(1)) : null;

      const delta = (avgPainWith !== null && avgPainWithout !== null) 
        ? Number((avgPainWith - avgPainWithout).toFixed(1)) 
        : 0;

      // Classify level of inflammatory impact
      let impactLevel: 'high' | 'moderate' | 'neutral' | 'insufficient' = 'insufficient';
      if (countWith >= 2 && countWithout >= 2) {
        if (delta >= 1.5) impactLevel = 'high';
        else if (delta >= 0.5) impactLevel = 'moderate';
        else impactLevel = 'neutral';
      }

      return {
        ...t,
        countWith,
        countWithout,
        avgPainWith,
        avgPainWithout,
        delta,
        impactLevel
      };
    }).sort((a, b) => b.delta - a.delta); // Sort by highest pain delta impact
  }, [logs]);

  // Toggle selected triggers inside the add form
  const toggleTriggerSelection = (key: string) => {
    setSelectedTriggers(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Date Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Apple className="w-5 h-5 text-teal-500" />
          <div>
            <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">
              Diário Alimentar & Rastreio de Gatilhos
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Registre suas refeições diárias e cruze automaticamente com sua intensidade de dor.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 rounded-lg text-slate-500 cursor-pointer transition-colors"
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
            className="p-1.5 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg focus:outline-none focus:border-teal-500 cursor-pointer"
          />

          <button
            type="button"
            disabled={selectedDate === todayISO()}
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 rounded-lg text-slate-500 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Próximo Dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left logs meals, Right shows automatic analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: MEAL LOGGING & LIST - 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Meal logger controller */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Refeições de {fmtDate(selectedDate, 's')}
              </span>
              
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="text-xs px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Refeição
                </button>
              )}
            </div>

            {/* MEAL ADDITION FORM */}
            {showAddForm && (
              <form onSubmit={handleAddMeal} className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Meal Type selection */}
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Refeição</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as any)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
                    >
                      <option value="cafe_manha">☕ Café da Manhã</option>
                      <option value="almoco">🍲 Almoço</option>
                      <option value="lanche">🍎 Lanche</option>
                      <option value="jantar">🍜 Jantar</option>
                      <option value="outro">🍿 Outro / Petisco</option>
                    </select>
                  </div>

                  {/* Foods Input */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">O que você consumiu?</label>
                    <input
                      type="text"
                      placeholder="Ex: Pão integral com queijo branco e café"
                      value={foods}
                      onChange={(e) => setFoods(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Intelligent Suggestions for the chosen meal type */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sugestões Rápidas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions[mealType].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setFoods(prev => prev ? `${prev}, ${sug}` : sug)}
                        className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850 rounded-lg cursor-pointer transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suspicious Clinical Sensitivity Triggers Checkbox List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contém algum alimento sob investigação para sensibilidade ou intolerância?</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {triggerList.map((t) => {
                      const isSelected = selectedTriggers.includes(t.key);
                      return (
                        <button
                          key={`form-trigger-${t.key}`}
                          type="button"
                          onClick={() => toggleTriggerSelection(t.key)}
                          className={`p-2 rounded-lg border text-left transition-all flex items-start gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50/50 border-teal-300 text-teal-800 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50 font-bold'
                              : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 mt-0.5 text-teal-500 flex-shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 mt-0.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                          )}
                          <div className="text-[10px] leading-tight">
                            <span className="block">{t.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFoods('');
                      setSelectedTriggers([]);
                    }}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm"
                  >
                    Salvar Refeição
                  </button>
                </div>
              </form>
            )}

            {/* LIST OF RECORDED MEALS FOR CURRENT DATE */}
            {currentMeals.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-950/10 rounded-xl border border-dashed border-slate-100 dark:border-slate-850">
                <Utensils className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-semibold">Nenhuma refeição registrada para este dia.</p>
                <p className="text-[10px] mt-0.5">Toque em "Adicionar Refeição" para começar a rastrear.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentMeals.map((meal) => (
                  <div 
                    key={meal.id} 
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl flex items-start justify-between gap-3 shadow-sm hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${getMealBadgeClass(meal.mealType)}`}>
                          {getMealTypeLabel(meal.mealType)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                        {meal.foods}
                      </p>

                      {/* Associated suspected triggers tags */}
                      {meal.suspectedTriggers && meal.suspectedTriggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {meal.suspectedTriggers.map((tKey) => {
                            const meta = triggerList.find(tm => tm.key === tKey);
                            if (!meta) return null;
                            return (
                              <span 
                                key={`badge-${meal.id}-${tKey}`}
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${meta.color}`}
                                title={meta.description}
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Refeição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Clinical Disclaimer info */}
          <div className="p-4 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/30 rounded-2xl flex gap-3 text-xs text-teal-800 dark:text-teal-400 leading-relaxed font-medium">
            <Info className="w-5 h-5 flex-shrink-0 text-teal-500 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-bold">Por que registrar os alimentos?</strong>
              <span>
                A relação entre nutrição e sintomas de dor ou doenças musculoesqueléticas é altamente individualizada. Algumas sensibilidades, intolerâncias e hábitos dietéticos podem coincidir com flutuações clínicas. Este diário é uma ferramenta de auto-observação para identificar padrões individuais e subsidiar a discussão com seu médico ou nutricionista.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CLINICAL PAIN IMPACT & CORRELATION ANALYSIS - 5 cols */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            
            <div className="border-b border-slate-50 dark:border-slate-850 pb-2 flex items-center justify-between">
              <h4 className="font-poppins font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                Impacto de Gatilhos na Dor (Histórico)
              </h4>
              <span className="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded">
                Últimos 30 dias
              </span>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              O sistema computa a média de intensidade de dor diária nos dias em que o ingrediente foi ingerido versus nos dias em que foi evitado.
            </p>

            {/* List of triggers with their delta scores */}
            <div className="space-y-3">
              {triggerCorrelations.map((cor) => {
                const totalDaysLogged = cor.countWith + cor.countWithout;
                
                return (
                  <div 
                    key={`correlation-${cor.key}`} 
                    className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/60 dark:border-slate-850/60 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">
                          {cor.label}
                        </span>
                        <span className="text-[9px] text-slate-400 block max-w-[210px] leading-snug">
                          {cor.description}
                        </span>
                      </div>

                      {/* Delta status badge */}
                      {cor.impactLevel === 'insufficient' ? (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          Sem dados
                        </span>
                      ) : cor.impactLevel === 'high' ? (
                        <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/30 flex items-center gap-0.5 animate-pulse">
                          ⚠️ Alto Risco
                        </span>
                      ) : cor.impactLevel === 'moderate' ? (
                        <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                          ⚡ Risco Moderado
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                          ✓ Seguro / Neutro
                        </span>
                      )}
                    </div>

                    {/* Numerical detail row */}
                    {cor.impactLevel === 'insufficient' ? (
                      <p className="text-[10px] text-slate-400 font-medium italic">
                        Registre pelo menos 2 dias contendo este gatilho e 2 dias sem ele para calcular a correlação.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {/* Comparison bars */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">Nos dias COM {cor.label}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                                <div 
                                  className="h-full bg-rose-500 rounded-full" 
                                  style={{ width: `${(cor.avgPainWith || 0) * 10}%` }}
                                />
                              </div>
                              <strong className="font-mono text-slate-700 dark:text-slate-200">
                                {cor.avgPainWith}/10
                              </strong>
                            </div>
                            <span className="text-[9px] text-slate-400 block font-mono mt-0.5">({cor.countWith} registros)</span>
                          </div>

                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">Nos dias SEM {cor.label}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full" 
                                  style={{ width: `${(cor.avgPainWithout || 0) * 10}%` }}
                                />
                              </div>
                              <strong className="font-mono text-slate-700 dark:text-slate-200">
                                {cor.avgPainWithout}/10
                              </strong>
                            </div>
                            <span className="text-[9px] text-slate-400 block font-mono mt-0.5">({cor.countWithout} registros)</span>
                          </div>
                        </div>

                        {/* Impact score description */}
                        {cor.delta > 0 ? (
                          <div className="p-1.5 rounded-lg bg-rose-50/20 dark:bg-rose-950/10 text-[9.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            O consumo deste item está associado a uma elevação de <strong className="text-rose-600 dark:text-rose-400 font-black">+{cor.delta} pontos</strong> na sua média de dor diária.
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-emerald-50/20 dark:bg-emerald-950/10 text-[9.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            O consumo deste item não parece agravar seus sintomas de dor de forma significativa (diferença nula ou favorável).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
