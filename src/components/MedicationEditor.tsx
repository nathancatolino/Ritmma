import React, { useState } from 'react';
import { MedicationConfig, ScheduledEventConfig } from '../types';
import { Plus, Trash2, Bell, BellRing, Clock, Pill, Zap, AlertTriangle, Check, Volume2, ShieldAlert, Edit2, Calendar, CalendarDays, Activity, Package } from 'lucide-react';

interface MedicationEditorProps {
  medications: MedicationConfig[];
  weight?: number;
  scheduledEvents?: ScheduledEventConfig[];
  onUpdate?: (weight: number, medications: MedicationConfig[], scheduledEvents: ScheduledEventConfig[]) => void;
  setMedicationsState: React.Dispatch<React.SetStateAction<MedicationConfig[]>>;
  setScheduledEventsState?: React.Dispatch<React.SetStateAction<ScheduledEventConfig[]>>;
  standaloneTab?: boolean; // When rendered as full sidebar tab in PatientView
}

export const MedicationEditor: React.FC<MedicationEditorProps> = ({
  medications,
  weight = 70,
  scheduledEvents = [],
  onUpdate,
  setMedicationsState,
  setScheduledEventsState,
  standaloneTab = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'continuous' | 'rescue' | 'alarms' | 'therapies'>('continuous');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [category, setCategory] = useState<'continuous' | 'rescue'>('continuous');
  const [frequency, setFrequency] = useState('1x ao dia');
  const [time1, setTime1] = useState('08:00');
  const [time2, setTime2] = useState('20:00');
  const [reminderActive, setReminderActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [stockCount, setStockCount] = useState<string>('30');
  const [stockAlertDaysBefore, setStockAlertDaysBefore] = useState<string>('5');
  const [maxDailyDose, setMaxDailyDose] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  // Therapies and Scheduled Events State
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<
    'psychotherapy' | 'physiotherapy' | 'massage' | 'mindfulness' | 'acupuncture' | 'reumatologista' | 'other'
  >('physiotherapy');
  const [eventRecurrence, setEventRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [eventDayOfWeek, setEventDayOfWeek] = useState<number>(2); // Terça-feira
  const [eventDate, setEventDate] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) return;

    let times: string[] = [time1];
    if (frequency === '2x ao dia' || frequency === 'A cada 12h') {
      times = [time1, time2];
    }

    const medData: MedicationConfig = {
      id: editingId || Math.random().toString(36).substring(2),
      name: name.trim(),
      dosage: dosage.trim() || '1 dose',
      frequency,
      category,
      scheduleTime: time1,
      scheduleTimes: category === 'continuous' ? times : undefined,
      reminderActive: category === 'continuous' ? reminderActive : false,
      notes: notes.trim() || undefined,
      stockCount: stockCount !== '' ? parseInt(stockCount, 10) : undefined,
      stockAlertDaysBefore: stockAlertDaysBefore !== '' ? parseInt(stockAlertDaysBefore, 10) : 5,
      maxDailyDose: category === 'rescue' ? maxDailyDose.trim() || undefined : undefined,
    };

    let updated: MedicationConfig[];
    if (editingId) {
      updated = medications.map((m) => (m.id === editingId ? medData : m));
    } else {
      updated = [...medications, medData];
    }

    setMedicationsState(updated);
    if (onUpdate) {
      onUpdate(weight, updated, scheduledEvents);
    }

    // Reset form
    setName('');
    setDosage('');
    setNotes('');
    setStockCount('30');
    setStockAlertDaysBefore('5');
    setMaxDailyDose('');
    setEditingId(null);
  };

  const handleEdit = (med: MedicationConfig) => {
    setEditingId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setCategory(med.category || 'continuous');
    setFrequency(med.frequency);
    setTime1(med.scheduleTimes?.[0] || med.scheduleTime || '08:00');
    setTime2(med.scheduleTimes?.[1] || '20:00');
    setReminderActive(med.reminderActive ?? true);
    setNotes(med.notes || '');
    setStockCount(med.stockCount !== undefined ? String(med.stockCount) : '30');
    setStockAlertDaysBefore(med.stockAlertDaysBefore !== undefined ? String(med.stockAlertDaysBefore) : '5');
    setMaxDailyDose(med.maxDailyDose || '');
  };

  const handleDelete = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedicationsState(updated);
    if (onUpdate) {
      onUpdate(weight, updated, scheduledEvents);
    }
  };

  const toggleMedReminder = (id: string) => {
    const updated = medications.map((m) => {
      if (m.id === id) {
        return { ...m, reminderActive: !m.reminderActive };
      }
      return m;
    });
    setMedicationsState(updated);
    if (onUpdate) {
      onUpdate(weight, updated, scheduledEvents);
    }
  };

  const playTestSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio not supported
    }
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) return;
    const newEvent: ScheduledEventConfig = {
      id: editingEventId || Math.random().toString(36).substring(2),
      title: eventTitle.trim(),
      type: eventType,
      recurrence: eventRecurrence,
      dayOfWeek: eventRecurrence === 'weekly' ? eventDayOfWeek : undefined,
      date: eventRecurrence === 'none' ? eventDate : undefined,
      active: true,
    };

    let updated: ScheduledEventConfig[];
    if (editingEventId) {
      updated = scheduledEvents.map((e) => (e.id === editingEventId ? newEvent : e));
    } else {
      updated = [...scheduledEvents, newEvent];
    }

    if (setScheduledEventsState) {
      setScheduledEventsState(updated);
    }
    if (onUpdate) {
      onUpdate(weight, medications, updated);
    }

    setEventTitle('');
    setEventDate('');
    setEditingEventId(null);
  };

  const handleEditEvent = (evt: ScheduledEventConfig) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventType(evt.type || 'physiotherapy');
    setEventRecurrence(evt.recurrence || 'weekly');
    setEventDayOfWeek(evt.dayOfWeek ?? 2);
    setEventDate(evt.date || '');
  };

  const handleDeleteEvent = (id: string) => {
    const updated = scheduledEvents.filter((e) => e.id !== id);
    if (setScheduledEventsState) {
      setScheduledEventsState(updated);
    }
    if (onUpdate) {
      onUpdate(weight, medications, updated);
    }
  };

  const getDayLabel = (dayNum: number) => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[dayNum] || '';
  };

  const getTypeLabel = (t: string) => {
    const types: Record<string, string> = {
      physiotherapy: 'Fisioterapia',
      psychotherapy: 'Psicoterapia',
      massage: 'Massagem / Quiropraxia',
      mindfulness: 'Mindfulness / Yoga',
      acupuncture: 'Acupuntura',
      reumatologista: 'Consulta Médica',
      other: 'Outros',
    };
    return types[t] || t;
  };

  const getDosesPerDay = (freq: string) => {
    if (freq === '2x ao dia' || freq === 'A cada 12h') return 2;
    if (freq === '3x ao dia' || freq === 'A cada 8h') return 3;
    if (freq === 'Semanal') return 1 / 7;
    if (freq === 'Quinzenal') return 1 / 15;
    if (freq === 'Mensal') return 1 / 30;
    return 1;
  };

  const renderStockBadge = (med: MedicationConfig) => {
    if (med.stockCount === undefined || med.stockCount === null) return null;
    const stockNum = med.stockCount;
    const alertDays = med.stockAlertDaysBefore ?? 5;
    const dosesPerDay = getDosesPerDay(med.frequency);
    const daysRemaining = med.category === 'rescue' ? null : (dosesPerDay > 0 ? Math.floor(stockNum / dosesPerDay) : stockNum);
    const isOut = stockNum <= 0;
    const isLowStock = !isOut && daysRemaining !== null && daysRemaining <= alertDays;

    return (
      <div className={`mt-2.5 p-2.5 rounded-xl text-[11px] flex flex-wrap items-center justify-between gap-2 border ${
        isOut
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 font-bold'
          : isLowStock
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
      }`}>
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
          <span>
            Estoque hoje: <strong>{stockNum} {stockNum === 1 ? 'unidade' : 'unidades'}</strong>
            {daysRemaining !== null && ` (~${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} de uso restante)`}
          </span>
        </div>
        {isOut ? (
          <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
            ⚠️ Estoque Esgotado
          </span>
        ) : isLowStock ? (
          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Repor em breve (Restam {daysRemaining}d)
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Alerta em: {alertDays}d de antecedência
          </span>
        )}
      </div>
    );
  };

  const continuousMeds = medications.filter((m) => m.category !== 'rescue');
  const rescueMeds = medications.filter((m) => m.category === 'rescue');

  return (
    <div className={`space-y-6 ${standaloneTab ? 'p-1' : 'text-xs'}`}>
      {/* Header section when standalone */}
      {standaloneTab && (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-6 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-teal-100">
            <Pill className="w-4 h-4" /> Gestão Completa de Tratamento
          </div>
          <h2 className="text-2xl font-black font-poppins">Minhas Medicações & Agenda de Terapias</h2>
          <p className="text-teal-100 text-xs max-w-2xl leading-relaxed">
            Cadastre seus medicamentos de uso contínuo com horários e alarmes despertadores, suas medicações de crise (SOS) e organize sua agenda de terapias multidisciplinares (fisioterapia, psicoterapia, consultas e procedimentos).
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('continuous')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'continuous'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Pill className="w-4 h-4 text-teal-500" /> Uso Contínuo ({continuousMeds.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('rescue')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'rescue'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Zap className="w-4 h-4 text-rose-500" /> Crise / Resgate SOS ({rescueMeds.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('alarms')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'alarms'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <BellRing className="w-4 h-4 text-amber-500" /> Despertadores & Horários
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('therapies')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'therapies'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-500" /> Terapias & Agenda ({scheduledEvents.length})
        </button>
      </div>

      {/* Tab 1: Continuous Medications */}
      {activeSubTab === 'continuous' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-500" /> Remédios de Uso Diário Cadastrados:
              </h3>

              {continuousMeds.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center space-y-2">
                  <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Nenhuma medicação contínua cadastrada.</p>
                  <p className="text-[11px] text-slate-400">Preencha o formulário ao lado para adicionar seus remédios diários.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {continuousMeds.map((med) => {
                    const timesStr = med.scheduleTimes?.join(', ') || med.scheduleTime || 'Sem horário';
                    return (
                      <div
                        key={med.id}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">{med.name}</span>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                              {med.dosage} · {med.frequency}
                            </span>
                            {med.notes && (
                              <p className="text-[10px] text-slate-400 italic mt-1">📝 {med.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEdit(med)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg transition-all"
                              title="Editar medicamento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(med.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                              title="Excluir medicamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <span className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Horários: {timesStr}
                          </span>
                          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer select-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300">
                            <input
                              type="checkbox"
                              checked={med.reminderActive ?? true}
                              onChange={() => toggleMedReminder(med.id)}
                              className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                            />
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              {med.reminderActive ? (
                                <>
                                  <BellRing className="w-3 h-3 text-amber-500 animate-bounce" /> Alarme Ativo
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3 h-3 text-slate-400" /> Alarme Desativado
                                </>
                              )}
                            </span>
                          </label>
                        </div>

                        {renderStockBadge(med)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3.5 text-xs">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-500" />
                  {editingId ? 'Editar Medicamento Contínuo' : 'Cadastrar Novo Uso Contínuo'}
                </span>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setDosage('');
                    }}
                    className="text-[10px] text-rose-500 underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </h3>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Nome da Medicação *</label>
                <input
                  type="text"
                  placeholder="Ex: Metotrexato, Pregabalina, Duloxetina..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="inp"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Dosagem</label>
                  <input
                    type="text"
                    placeholder="Ex: 15mg, 75mg, 1 comprimido"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="inp"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Frequência</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="inp"
                  >
                    <option value="1x ao dia">1x ao dia</option>
                    <option value="2x ao dia">2x ao dia (a cada 12h)</option>
                    <option value="3x ao dia">3x ao dia (a cada 8h)</option>
                    <option value="À noite">À noite ao deitar</option>
                    <option value="Pela manhã">Pela manhã em jejum</option>
                    <option value="Semanal">Semanal (1x por semana)</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Mensal">Mensal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">1º Horário do Alarme</label>
                  <input
                    type="time"
                    value={time1}
                    onChange={(e) => setTime1(e.target.value)}
                    className="inp font-bold"
                  />
                </div>
                {(frequency === '2x ao dia' || frequency === 'A cada 12h') && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-300">2º Horário do Alarme</label>
                    <input
                      type="time"
                      value={time2}
                      onChange={(e) => setTime2(e.target.value)}
                      className="inp font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Controle de Estoque Atual e Antecedência de Alerta */}
              <div className="bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-teal-500" /> Controle de Estoque & Alerta de Término
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                      Quantos tem hoje?
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex: 30"
                        value={stockCount}
                        onChange={(e) => setStockCount(e.target.value)}
                        className="inp font-bold pr-10"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold select-none">
                        unid.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                      Avisar antecedência (dias):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 5"
                        value={stockAlertDaysBefore}
                        onChange={(e) => setStockAlertDaysBefore(e.target.value)}
                        className="inp font-bold pr-10"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold select-none">
                        dias
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Instruções / Notas ao Paciente</label>
                <input
                  type="text"
                  placeholder="Ex: Tomar acompanhado de refeição / Tomar com água"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="inp"
                />
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="reminderActive"
                  checked={reminderActive}
                  onChange={(e) => setReminderActive(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700 cursor-pointer"
                />
                <label htmlFor="reminderActive" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none space-y-0.5">
                  <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-extrabold">
                    <BellRing className="w-3.5 h-3.5 text-amber-500" /> Ativar Alarme Despertador
                  </span>
                  <p className="text-[10px] font-normal text-slate-600 dark:text-slate-400 leading-snug">
                    Vem marcado por padrão para despertar no horário cadastrado. Se preferir não receber alarmes sonoros para este remédio, desmarque esta caixa.
                  </p>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {editingId ? 'Salvar Alterações' : 'Cadastrar Medicamento Contínuo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rescue / SOS Medications */}
      {activeSubTab === 'rescue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-rose-500" /> Medicações de Crise Cadastradas (S.O.S):
              </h3>

              {rescueMeds.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center space-y-2">
                  <Zap className="w-8 h-8 text-rose-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Nenhum medicamento de crise cadastrado.</p>
                  <p className="text-[11px] text-slate-400">Cadastre remédios SOS (ex: Dipirona, Tramadol, Prednisona de resgate) para registrar no diário apenas quando precisar.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rescueMeds.map((med) => (
                    <div
                      key={med.id}
                      className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 p-3.5 rounded-2xl shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-rose-500" /> {med.name}
                          </span>
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">
                            {med.dosage} · Em caso de dor/crise intensa
                          </span>
                          {med.maxDailyDose && (
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-1">
                              ⚠️ Doses máximas / Regra: {med.maxDailyDose}
                            </span>
                          )}
                          {med.notes && (
                            <p className="text-[10px] text-slate-400 italic mt-1">📝 {med.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(med)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg transition-all"
                            title="Editar medicação"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(med.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                            title="Excluir medicação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {renderStockBadge(med)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl space-y-3.5 text-xs">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-500" /> Cadastrar Medicação de Crise / SOS
                </span>
              </h3>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Nome da Medicação de Crise *</label>
                <input
                  type="text"
                  placeholder="Ex: Tramadol, Dipirona 1g, Ibuprofeno..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="inp"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Dosagem por Tomada</label>
                <input
                  type="text"
                  placeholder="Ex: 50mg, 1 comprimido, 40 gotas"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="inp"
                />
              </div>

              {/* Controle de Estoque Atual e Antecedência de Alerta para SOS */}
              <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40 space-y-2">
                <span className="font-bold text-rose-900 dark:text-rose-200 text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-500" /> Estoque de Embalagem & Alerta
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                      Quantas tem hoje?
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex: 10"
                        value={stockCount}
                        onChange={(e) => setStockCount(e.target.value)}
                        className="inp font-bold pr-10"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold select-none">
                        unid.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                      Avisar se restar menos de:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 3"
                        value={stockAlertDaysBefore}
                        onChange={(e) => setStockAlertDaysBefore(e.target.value)}
                        className="inp font-bold pr-10"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold select-none">
                        unid.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Dose Máxima ou Intervalo Mínimo Recom. Médica</label>
                <input
                  type="text"
                  placeholder="Ex: Máximo 3x ao dia / Espaçar no mínimo 6h"
                  value={maxDailyDose}
                  onChange={(e) => setMaxDailyDose(e.target.value)}
                  className="inp"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Gatilhos ou Quando Usar</label>
                <input
                  type="text"
                  placeholder="Ex: Usar quando a dor pélvica/lombar for maior que 6/10"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="inp"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCategory('rescue');
                  handleSave();
                }}
                disabled={!name.trim()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Salvar Medicação de Crise (SOS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Alarms & Notifications */}
      {activeSubTab === 'alarms' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-500" /> Alarmes Sonoros e Teste de Som
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Os alarmes tocam alertas no navegador e enviam lembretes na hora exata cadastrada para cada medicação.
              </p>
            </div>
            <button
              type="button"
              onClick={playTestSound}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-bold rounded-xl text-xs hover:bg-amber-100 flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4" /> Testar Som do Alarme
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Gerenciar Ativação de Alarmes para Cada Medicação:
            </h4>
            <div className="space-y-2">
              {continuousMeds.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhum medicamento de uso contínuo cadastrado.</p>
              ) : (
                continuousMeds.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={m.reminderActive ?? true}
                          onChange={() => toggleMedReminder(m.id)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {m.name} <span className="text-[10px] text-slate-400 font-normal">({m.dosage})</span>
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                            {m.reminderActive ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <BellRing className="w-3 h-3 text-amber-500 animate-bounce" /> Alarme Habilitado (Checked)
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Bell className="w-3 h-3" /> Alarme Desabilitado
                              </span>
                            )}
                          </span>
                        </div>
                      </label>
                    </div>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/30 px-3 py-1 rounded-xl self-start sm:self-auto shrink-0">
                      ⏰ {m.scheduleTimes?.join(', ') || m.scheduleTime || 'Sem horário'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Therapies & Scheduled Events */}
      {activeSubTab === 'therapies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-500" /> Agenda de Terapias e Consultas Cadastradas:
              </h3>

              {scheduledEvents.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center space-y-2">
                  <Calendar className="w-8 h-8 text-purple-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Nenhuma terapia ou consulta cadastrada.</p>
                  <p className="text-[11px] text-slate-400">Cadastre sessões de fisioterapia, psicoterapia, acupuntura, pilates ou consultas médicas recorrentes.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {scheduledEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-950/40 p-3.5 rounded-2xl shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-purple-500" /> {evt.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md uppercase">
                              {getTypeLabel(evt.type)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {evt.recurrence === 'weekly'
                                ? `Semanal (${getDayLabel(evt.dayOfWeek ?? 0)})`
                                : evt.recurrence === 'biweekly'
                                ? `Quinzenal (${getDayLabel(evt.dayOfWeek ?? 0)})`
                                : evt.recurrence === 'monthly'
                                ? `Mensal`
                                : `Evento Único (${evt.date || 'Sem data'})`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditEvent(evt)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 p-4 rounded-2xl space-y-3.5 text-xs">
              <h3 className="font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-500" />
                  {editingEventId ? 'Editar Terapia/Consulta' : 'Cadastrar Nova Terapia / Atendimento'}
                </span>
                {editingEventId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEventId(null);
                      setEventTitle('');
                      setEventDate('');
                    }}
                    className="text-[10px] text-rose-500 underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </h3>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Nome da Atividade / Consulta *</label>
                <input
                  type="text"
                  placeholder="Ex: Fisioterapia Aquática, Acupuntura, Psicoterapia, Consulta Reumatologia..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="inp"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Tipo de Atendimento</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="inp"
                  >
                    <option value="physiotherapy">Fisioterapia</option>
                    <option value="psychotherapy">Psicoterapia</option>
                    <option value="massage">Massagem / Quiropraxia</option>
                    <option value="mindfulness">Mindfulness / Yoga</option>
                    <option value="acupuncture">Acupuntura</option>
                    <option value="reumatologista">Consulta Médica</option>
                    <option value="other">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Recorrência</label>
                  <select
                    value={eventRecurrence}
                    onChange={(e) => setEventRecurrence(e.target.value as any)}
                    className="inp"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                    <option value="none">Evento Único</option>
                  </select>
                </div>
              </div>

              {eventRecurrence === 'weekly' || eventRecurrence === 'biweekly' ? (
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Dia da Semana</label>
                  <select
                    value={eventDayOfWeek}
                    onChange={(e) => setEventDayOfWeek(Number(e.target.value))}
                    className="inp"
                  >
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Data do Evento</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="inp"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={!eventTitle.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {editingEventId ? 'Salvar Alterações' : 'Salvar Terapia / Consulta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


