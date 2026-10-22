import React, { useState } from 'react';
import { MedicationConfig, ScheduledEventConfig } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface ScheduledEventsEditorProps {
  scheduledEvents: ScheduledEventConfig[];
  weight: number;
  medications: MedicationConfig[];
  onUpdate?: (weight: number, medications: MedicationConfig[], scheduledEvents: ScheduledEventConfig[]) => void;
  setScheduledEventsState: React.Dispatch<React.SetStateAction<ScheduledEventConfig[]>>;
}

export const ScheduledEventsEditor: React.FC<ScheduledEventsEditorProps> = ({
  scheduledEvents,
  weight,
  medications,
  onUpdate,
  setScheduledEventsState,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<
    'psychotherapy' | 'physiotherapy' | 'massage' | 'mindfulness' | 'acupuncture' | 'reumatologista' | 'other'
  >('physiotherapy');
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(2); // Default Terça
  const [date, setDate] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    const newEvent: ScheduledEventConfig = {
      id: Math.random().toString(36).substring(2),
      title: title.trim(),
      type,
      recurrence,
      dayOfWeek: recurrence === 'weekly' ? dayOfWeek : undefined,
      date: recurrence === 'none' ? date : undefined,
      active: true,
    };
    const updated = [...scheduledEvents, newEvent];
    setScheduledEventsState(updated);
    if (onUpdate) {
      onUpdate(weight, medications, updated);
    }
    setTitle('');
    setDate('');
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = scheduledEvents.filter((e) => e.id !== id);
    setScheduledEventsState(updated);
    if (onUpdate) {
      onUpdate(weight, medications, updated);
    }
  };

  const getDayLabel = (dayNum: number) => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[dayNum] || '';
  };

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 flex items-center gap-1 select-none"
      >
        <Plus className="w-3.5 h-3.5" /> {isOpen ? 'Fechar agenda' : 'Configurar agenda e recorrência de terapias'}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-3">
          <h4 className="font-bold text-slate-700 dark:text-slate-300">Sua agenda de terapias / atividades:</h4>

          {scheduledEvents.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {scheduledEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-lg"
                >
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{e.title}</span>
                    <span className="text-[10px] text-slate-400 block">
                      Recorrência:{' '}
                      {e.recurrence === 'weekly'
                        ? `Semanal (${getDayLabel(e.dayOfWeek ?? 0)})`
                        : e.recurrence === 'none'
                          ? `Data: ${e.date}`
                          : e.recurrence}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
            <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Nova Atividade/Consulta:</h5>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Nome da Atividade</label>
              <input
                type="text"
                placeholder="Ex: Fisioterapia Aquática"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Tipo de Atendimento</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
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
                <label className="font-semibold text-slate-500">Recorrência</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="weekly">Semanal</option>
                  <option value="none">Evento Único</option>
                </select>
              </div>
            </div>
            {recurrence === 'weekly' ? (
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Dia da Semana</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
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
                <label className="font-semibold text-slate-500">Data do Evento</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!title.trim()}
              className="w-full py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-[11px] mt-1"
            >
              ✓ Adicionar na Agenda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
