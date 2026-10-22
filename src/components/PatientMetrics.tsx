/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PatientData, PeriodicMetric } from '../types';
import { QS, DX, QuestionnaireConfig } from '../data';
import { fmtDate, todayISO, scoreQuestionnaire, interpretBand } from '../utils';
import { BandLineChart } from './Charts';
import { Stethoscope, ClipboardCheck, ArrowRight, Play, RefreshCw, Info, Brain } from 'lucide-react';

interface PatientMetricsProps {
  patientData: PatientData;
  onSaveMetric: (metric: PeriodicMetric) => void;
}

export const PatientMetrics: React.FC<PatientMetricsProps> = ({ patientData, onSaveMetric }) => {
  const [activeQ, setActiveQ] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const activeDxs = Object.keys(patientData.diagnoses).filter((k) => patientData.diagnoses[k]);

  const handleStartQ = (type: string) => {
    setActiveQ(type);
    setAnswers({});
  };

  const handlePickAnswer = (questionIdx: number, scaleIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIdx]: scaleIdx
    }));
  };

  const handleSubmitQ = (type: string) => {
    const qConf = QS[type];
    if (!qConf) return;

    const numQuestions = qConf.items.length;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < numQuestions) {
      alert(`Por favor, responda todas as ${numQuestions} questões antes de finalizar.`);
      return;
    }

    const calculatedScore = scoreQuestionnaire(type, answers);

    const prevMetric = patientData.periodicMetrics
      .filter((m) => m.type === type)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;

    const newMetric: PeriodicMetric = {
      type,
      date: todayISO(),
      score: calculatedScore,
      maxScore: qConf.max,
      prev: prevMetric ? prevMetric.score : null
    };

    onSaveMetric(newMetric);
    setActiveQ(null);
  };

  const lastMetric = (type: string) => {
    return patientData.periodicMetrics
      .filter((m) => m.type === type)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  };

  const isDue = (dx: string) => {
    const last = lastMetric(dx);
    if (!last) return true;
    const def = DX[dx];
    if (!def) return false;
    const days = def.freq === 'Semanal' ? 7 : def.freq === 'Quinzenal' ? 14 : 30;
    const diffTime = Math.abs(new Date().getTime() - new Date(last.date + 'T00:00:00').getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > days;
  };

  const metricPoints = (type: string) => {
    return patientData.periodicMetrics
      .filter((m) => m.type === type)
      .slice(-10)
      .map((m) => ({ date: m.date, score: m.score }));
  };

  // QUESTION WIZARD RENDERER
  if (activeQ) {
    const qConf = QS[activeQ];
    const dxConf = DX[activeQ];
    const isGeneric = ['PHQ9', 'GAD7', 'CSI7'].includes(activeQ);

    return (
      <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 sm:p-7 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {dxConf?.label || 'Saúde Mental & Sensibilização'}
            </span>
            <h3 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100">
              {qConf.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveQ(null)}
            className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Cancelar
          </button>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {qConf.items.map((it, idx) => {
            let text = '';
            let itemScale = qConf.scale;

            if (typeof it === 'string') {
              text = it;
            } else {
              text = it.t;
              if (it.scale) itemScale = it.scale;
            }

            const currentSelected = answers[idx];

            return (
              <div key={idx} className="space-y-3 pb-4 border-b border-slate-50 dark:border-slate-800/40 last:border-b-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {idx + 1}. {text}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {itemScale.map((s, sIdx) => {
                    const isSelected = currentSelected === sIdx;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handlePickAnswer(idx, sIdx)}
                        className={`flex-1 min-w-[70px] text-center py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500 text-white shadow-sm shadow-teal-500/20'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
          <span>
            Este questionário é uma escala validada cientificamente. Referência bibliográfica original: <em className="italic">{qConf.ref}</em>
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSubmitQ(activeQ)}
          className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-1.5"
        >
          <ClipboardCheck className="w-5 h-5" /> Calcular Score & Arquivar Métricas
        </button>
      </div>
    );
  }

  // DEFAULT VIEW
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
          Métricas e Escores Validados
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
          Responda aos questionários médicos periodicamente para apoiar decisões de tratamento do seu profissional da saúde.
        </p>
      </div>

      {activeDxs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-poppins font-bold text-sm text-slate-700 dark:text-slate-300">
            Nenhum diagnóstico selecionado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Abra as Configurações ⚙️ para ativar suas condições e liberar os questionários clínicos de monitoramento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Diagnostic Questionnaires */}
          {activeDxs.map((dx) => {
            const q = QS[dx];
            if (!q) return null;

            const def = DX[dx];
            const last = lastMetric(dx);
            const due = isDue(dx);
            const points = metricPoints(dx);
            const bandInfo = last ? interpretBand(dx, last.score) : null;

            return (
              <div
                key={dx}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">
                  <div>
                    <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="text-lg">{def.icon}</span> {q.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                      Frequência recomendada: {def.freq} ·{' '}
                      {last
                        ? `Último: ${fmtDate(last.date, 's')} (${last.score}/${q.max}${
                            bandInfo ? ` - ${bandInfo.label}` : ''
                          })`
                        : 'Sem avaliações'}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full text-center ${
                      due
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                    }`}
                  >
                    {due ? '⏰ Pendente' : '✓ Em dia'}
                  </span>
                </div>

                {/* SVG Band Timeline */}
                {points.length > 0 && (
                  <div className="mb-4">
                    <BandLineChart points={points} bands={q.bands} max={q.max} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleStartQ(dx)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5"
                >
                  {last ? <RefreshCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {last ? 'Refazer Avaliação' : 'Iniciar Avaliação'}
                </button>
              </div>
            );
          })}

          {/* Mental Health Scales */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-poppins font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-1.5 select-none">
              <Brain className="w-3.5 h-3.5 text-slate-500" />
              <span>Saúde Mental & Sensibilização Central</span>
            </h3>

            {['PHQ9', 'GAD7', 'CSI7'].map((type) => {
              const q = QS[type];
              const last = lastMetric(type);
              const points = metricPoints(type);
              const bandInfo = last ? interpretBand(type, last.score) : null;
              const due = !last || isDue(type);

              return (
                <div
                  key={type}
                  className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{q.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {last
                          ? `Último: ${fmtDate(last.date, 's')} (${last.score}/${q.max}${
                              bandInfo ? ` - ${bandInfo.label}` : ''
                            })`
                          : 'Nunca realizado'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        due
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                      }`}
                    >
                      {due ? 'Pendente' : 'Em dia'}
                    </span>
                  </div>

                  {points.length > 0 && (
                    <div className="my-3">
                      <BandLineChart points={points} bands={q.bands} max={q.max} />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartQ(type)}
                    className="w-full mt-2 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-lg flex items-center justify-center gap-1.5"
                  >
                    {last ? <RefreshCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {last ? 'Refazer' : 'Iniciar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
