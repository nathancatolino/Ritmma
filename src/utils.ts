/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyLog, PatientData, ChronosData, Baseline, FlareAlert, Account } from './types';
import { DX, QS, REFERENCES } from './data';

export function uid(): string {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  }
}

export function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

export function fmtDate(ds: string, f?: 's' | 'dt' | 'long'): string {
  try {
    // Force local timezone parse instead of UTC
    const d = new Date(ds + 'T00:00:00');
    if (f === 's') {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
    if (f === 'dt') {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch (e) {
    return ds;
  }
}

export function olderThan(ds: string, days: number): boolean {
  const diffTime = Math.abs(new Date().getTime() - new Date(ds + 'T00:00:00').getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays > days;
}

export function painClass(v: number | null | undefined): string {
  if (v == null) return 'text-slate-400';
  return v <= 3 ? 'text-emerald-500 font-semibold' : v <= 6 ? 'text-amber-500 font-semibold' : 'text-rose-500 font-semibold';
}

export function calcBaseline(logs: DailyLog[]): Baseline {
  const fields = ['pain', 'fatigue', 'sleep', 'function'];
  const out: Baseline = {};

  fields.forEach((f) => {
    const vs = logs
      .map((l) => Number(l[f as keyof DailyLog]))
      .filter((v) => v != null && !isNaN(v));

    if (!vs.length) return;

    const mean = vs.reduce((a, b) => a + b, 0) / vs.length;
    const variance = vs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vs.length;
    const sd = Math.sqrt(variance) || 1.0;

    out[f] = { mean, sd };
  });

  return out;
}

export function pearsonCorr(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;

  const num = x.reduce((acc, xi, i) => acc + (xi - mx) * (y[i] - my), 0);
  const denX = x.reduce((a, xi) => a + (xi - mx) * (xi - mx), 0);
  const denY = y.reduce((a, yi) => a + (yi - my) * (yi - my), 0);

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export interface RiskDimension {
  key: string;
  label: string;
  z: number;
  cur: string;
}

export interface FlareRiskResult {
  score: number;
  level: 'LOW' | 'MODERATE' | 'HIGH';
  dims: RiskDimension[];
  patterns: string[];
  rec: string;
  enough: boolean;
}

export function calcRisk(pd: PatientData): FlareRiskResult {
  const logs = pd.dailyLogs || [];
  if (logs.length < 3) {
    return {
      score: 0,
      level: 'LOW',
      dims: [],
      patterns: [],
      rec: 'Histórico insuficiente. Continue preenchendo o diário.',
      enough: false
    };
  }

  const recent = logs.slice(-5);
  const base = pd.baseline || calcBaseline(logs);

  const config = [
    { key: 'pain', label: 'Dor' },
    { key: 'fatigue', label: 'Fadiga' },
    { key: 'sleep', label: 'Sono', invert: true },
    { key: 'function', label: 'Função', invert: true }
  ];

  const dims: RiskDimension[] = config.map((d) => {
    const vs = recent
      .map((l) => Number(l[d.key as keyof DailyLog]))
      .filter((v) => v != null && !isNaN(v));

    if (!vs.length || !base[d.key]) {
      return { key: d.key, label: d.label, z: 0, cur: '-' };
    }

    const avg = vs.reduce((a, b) => a + b, 0) / vs.length;
    let z = (avg - base[d.key].mean) / (base[d.key].sd || 1.0);
    if (d.invert) z = -z;

    return {
      key: d.key,
      label: d.label,
      z: Math.max(0, z),
      cur: avg.toFixed(1)
    };
  });

  const trgAvg = recent.reduce((acc, l) => acc + (l.triggers ? l.triggers.length : 0), 0) / recent.length;
  const alertDims = dims.filter((d) => d.z > 1.0).length;

  const score = Math.min(5.0, Math.max(0, alertDims + trgAvg * 0.5));
  const level = score < 1.5 ? 'LOW' : score < 3.0 ? 'MODERATE' : 'HIGH';

  const active = Object.keys(pd.diagnoses).filter((k) => pd.diagnoses[k]);
  const patterns: string[] = [];

  if (active.includes('sii') && active.includes('fibromialgia')) {
    patterns.push('SII + Fibromialgia: exacerbações de dor visceral podem amplificar os sintomas de fibromialgia em 1 a 3 dias [Ref 55].');
  }

  const sleepDim = dims.find((d) => d.key === 'sleep');
  if (sleepDim && sleepDim.z > 1.5) {
    patterns.push('Sono significativamente prejudicado: forte preditor clínico de exacerbação de dor persistente [Ref 14].');
  }

  if (active.includes('migrainea') && active.includes('fibromialgia')) {
    patterns.push('Enxaqueca + Fibromialgia: o pródromo de enxaqueca (fadiga, alteração de humor) dobra o risco de crise generalizada [Refs 11, 12].');
  }

  const rec =
    level === 'LOW'
      ? 'Seus sintomas estão dentro da variação normal esperada. Mantenha os registros diários.'
      : level === 'MODERATE'
      ? 'Atenção: oscilação moderada em relação ao seu padrão habitual de sintomas. Monitore as variações de perto e evite sobrecargas ou estressores nos próximos 3 dias.'
      : 'Sinal de Alerta: alteração significativa e severa comparada ao seu padrão habitual de sintomas. Recomendamos entrar em contato com seu profissional de saúde e focar em repouso e estratégias de alívio.';

  return {
    score,
    level,
    dims,
    patterns,
    rec,
    enough: true
  };
}

export function recordRisk(D: ChronosData, pid: string): FlareRiskResult {
  const pd = D.patientData[pid];
  if (!pd) {
    return {
      score: 0,
      level: 'LOW',
      dims: [],
      patterns: [],
      rec: 'Sem registro clínico.',
      enough: false
    };
  }

  const result = calcRisk(pd);
  if (!result.enough || result.level === 'LOW') return result;

  const todayStr = todayISO();
  const lastAlert = pd.flareAlerts[pd.flareAlerts.length - 1];

  if (!lastAlert || lastAlert.date !== todayStr) {
    pd.flareAlerts.push({
      date: todayStr,
      score: result.score,
      level: result.level
    });
  }

  return result;
}

export function adherence(pd: PatientData, days = 14): { filled: number; days: number; pct: number } {
  const logs = pd.dailyLogs || [];
  const have: Record<string, boolean> = {};
  logs.forEach((l) => {
    have[l.date] = true;
  });

  let filled = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().split('T')[0];
    if (have[d]) filled++;
  }

  return {
    filled,
    days,
    pct: Math.round((filled / days) * 100)
  };
}

export interface InsightItem {
  ic: string;
  text: string;
  audience: 'patient' | 'professional';
  refIds?: number[];
}

export function genInsights(pd: PatientData, audience: 'patient' | 'professional' | 'all' = 'patient'): InsightItem[] {
  const logs = pd.dailyLogs || [];
  const out: InsightItem[] = [];

  if (logs.length < 4) return out;

  // Tendency by simple linear regression
  const reg = linregSlope(logs.map((l) => (l.pain != null ? l.pain : null)));
  if (reg.slope > 0.08) {
    out.push({
      ic: '📈',
      text: 'Seus registros sugerem uma tendência de discreta oscilação para cima nos níveis de dor recente. Lembre-se de que pequenas flutuações são comuns e fazem parte da dinâmica habitual. Que tal focar em atividades relaxantes e gentis hoje?',
      audience: 'patient'
    });
  } else if (reg.slope < -0.08) {
    out.push({
      ic: '📉',
      text: 'Ótima evolução! Seus registros recentes sugerem uma tendência de melhora gradual nos seus níveis de dor.',
      audience: 'patient'
    });
  }

  // Poor sleep vs Pain impact
  const badSleep = logs.filter((l) => l.sleep != null && l.sleep <= 4 && l.pain != null);
  const okSleep = logs.filter((l) => l.sleep != null && l.sleep > 4 && l.pain != null);

  if (badSleep.length >= 3 && okSleep.length >= 3) {
    const avgBad = badSleep.reduce((acc, l) => acc + (l.pain || 0), 0) / badSleep.length;
    const avgOk = okSleep.reduce((acc, l) => acc + (l.pain || 0), 0) / okSleep.length;
    const delta = avgBad - avgOk;

    if (delta > 0.8) {
      out.push({
        ic: '💤',
        text: `Notamos que noites com sono menos reparador coincidiram com dias de maior sensibilidade corporal. Priorizar pequenos rituais de relaxamento antes de dormir pode ajudar a confortar seu corpo de forma simples.`,
        audience: 'patient'
      });
    }
  }

  // Heavy triggers impact
  const td = triggerDelta(logs, 3);
  if (td.length && td[0].value > 0.8) {
    const label = td[0].label;
    if (label === 'Estresse ocupacional') {
      out.push({
        ic: '💼',
        text: 'Em dias de maior exigência profissional, seu bem-estar físico tendeu a oscilar levemente. Dedicar alguns minutos para respirações calmas e alongamentos suaves pode ajudar seu corpo a aliviar a tensão de modo seguro.',
        audience: 'patient'
      });
    } else if (label === 'Trabalho intenso / hora extra') {
      out.push({
        ic: '⏳',
        text: 'Em dias de rotina de trabalho mais puxada, notamos uma variação sutil no seu conforto físico. Pequenas pausas para alongar e hidratação constante ao longo da jornada são formas gentis de cuidar de si.',
        audience: 'patient'
      });
    } else {
      out.push({
        ic: '⚡',
        text: `Notamos uma relação sutil entre o registro do fator "${label}" e uma flutuação temporária na sua sensibilidade física corporal.`,
        audience: 'patient'
      });
    }
  }

  // Adherence nudge
  const adh = adherence(pd, 14);
  if (adh.pct < 50) {
    out.push({
      ic: '📅',
      text: `Que tal tentar registrar seu diário com um pouco mais de frequência? Cada registro nos ajuda a construir um retrato mais fiel e seguro da sua rotina de bem-estar.`,
      audience: 'patient'
    });
  }

  // Real-time Static Profile Insights
  const heightM = pd.height ? pd.height / 100 : 0;
  const imc = (heightM > 0 && pd.weight) ? pd.weight / (heightM * heightM) : 0;

  if (imc >= 30) {
    out.push({
      ic: '⚖️',
      text: `Seu IMC estimado de ${imc.toFixed(1)} kg/m² indica Obesidade. O tecido adiposo inflamado age como órgão endócrino ativo, liberando adipocinas que amplificam a dor difusa e a fadiga.`,
      audience: 'professional',
      refIds: [17, 19, 51]
    });
  } else if (imc >= 24 && imc < 30) {
    out.push({
      ic: '⚖️',
      text: `Seu IMC estimado de ${imc.toFixed(1)} kg/m² indica sobrepeso. A literatura demonstra que a partir de 24 kg/m² o excesso de tecido adiposo reduz o limiar doloroso e compromete a inibição endógena da dor.`,
      audience: 'professional',
      refIds: [17, 19, 51]
    });
  }

  const continuousMedsList = pd.continuousMeds || [];
  if (imc >= 30 && (continuousMedsList.includes('adalimumabe') || continuousMedsList.includes('etanercepte'))) {
    out.push({
      ic: '🔌',
      text: `Alerta Farmacocinético: O uso de anti-TNF de dose fixa com IMC elevado (≥30) pode sofrer com clearance acelerado, induzindo subexposição ao biológico e aparente falha terapêutica.`,
      audience: 'professional',
      refIds: [17, 19]
    });
  }

  // TODO: reativar só quando "gota" existir em DX
  /*
  if (pd.diagnoses?.gota && (imc >= 30 || pd.cardiovascularRisk)) {
    out.push({
      ic: '🥩',
      text: `Eixo Metabólico da Gota: A resistência à insulina pela adiposidade visceral ou risco cardiovascular reduz a excreção renal de urato. A perda de peso é tão terapêutica quanto as medicações.`,
      audience: 'professional',
      refIds: [17, 19]
    });
  }
  */

  if (pd.diagnoses?.psoriasica && imc >= 30) {
    out.push({
      ic: '🔴',
      text: `Artrite Psoriásica & Peso: Pacientes com obesidade possuem 1.7x mais chance de falha a múltiplos biológicos. A perda de peso age diretamente modificando o curso da doença.`,
      audience: 'professional',
      refIds: [45, 46]
    });
  }

  if (pd.diagnoses?.fibromialgia && imc >= 24) {
    out.push({
      ic: '🧠',
      text: `Eixo Neuro-Adiposo: O sobrepeso/obesidade reduz a eficácia de neuromoduladores na Fibromialgia, agravando a sensibilização central e o sono não reparador.`,
      audience: 'professional',
      refIds: [17, 19, 51, 52]
    });
  }

  if (pd.gastricSensitivity) {
    const hasIrritantLogs = logs.slice(-7).some((l) => l.alcoholLog || l.caffeineSimple === 'muito' || l.greasyMeal || l.gasBeverage);
    if (hasIrritantLogs) {
      out.push({
        ic: '🩺',
        text: `Sensibilidade Gástrica: Detetado consumo de substâncias irritativas na última semana. Recomenda-se extrema cautela com uso recorrente de anti-inflamatórios (AINEs) de resgate.`,
        audience: 'professional'
      });
    }
  }

  // Infecções, Vacinas & Confundidores (Last 5 Days)
  const recentInfectionLogs = logs.slice(-5).filter(l => l.infectionOrVaccineStatus && l.infectionOrVaccineStatus !== 'nao');
  if (recentInfectionLogs.length > 0) {
    const latestInfLog = recentInfectionLogs[recentInfectionLogs.length - 1];
    const status = latestInfLog.infectionOrVaccineStatus;

    if (status === 'vacina') {
      out.push({
        ic: '💉',
        text: 'Efeito Vacinal Recente: Registro de imunização nos últimos dias. Reações normais como febrícula, mialgia difusa e fadiga costumam cessar em até 72 horas. Fique tranquilo e evite suspender tratamentos sem aval médico.',
        audience: 'professional'
      });
    } else if (status === 'pausa_infeccao') {
      out.push({
        ic: '⏸️',
        text: 'Pausa Terapêutica por Infecção: A suspensão temporária de agentes imunobiológicos ajuda a combater o patógeno. Mantenha repouso absoluto e acompanhe para detectar possíveis rebotes inflamatórios após a melhora clínica.',
        audience: 'professional'
      });
    } else {
      out.push({
        ic: '🦠',
        text: 'Confundidor de Sintoma (Infecção): Infecções recentes (ex: respiratórias ou urinárias) inflamam o organismo e reduzem a tolerância à dor. Isso pode simular um "flare" articular/fibromiálgico sem representar falha terapêutica real.',
        audience: 'professional'
      });
    }

    // Specific disease associations with infection sites
    if (pd.diagnoses?.psoriasica && recentInfectionLogs.some(l => l.infectionSite === 'respiratorio')) {
      out.push({
        ic: '🔴',
        text: 'Gatilho Estrepto-Psoríase: Infecções estreptocócicas de via aérea superior costumam desencadear exacerbações agudas da psoríase de pele (como psoríase gutata) ou artrite. Atenção a novas placas ou pápulas cutâneas.',
        audience: 'professional'
      });
    }

    if (pd.diagnoses?.les && recentInfectionLogs.some(l => l.infectionSite === 'urinario')) {
      out.push({
        ic: '🐺',
        text: 'Alerta Lúpus & ITU: Infecções de trato urinário persistentes estimulam complexos imunes bacterianos que agem como gatilho imunológico para flares de LES. Investigue prontamente urina tipo I.',
        audience: 'professional'
      });
    }
  }

  const filtered = out.filter(item => {
    if (audience === 'all') return true;
    return item.audience === audience;
  });

  return filtered.slice(0, 8);
}

export interface TriggerDeltaItem {
  label: string;
  value: number;
  n: number;
}

export function triggerDelta(logs: DailyLog[], minN = 3): TriggerDeltaItem[] {
  const trigSet = new Set<string>();
  logs.forEach((l) => {
    if (l.triggers) l.triggers.forEach((t) => trigSet.add(t));
  });

  const items: TriggerDeltaItem[] = [];

  trigSet.forEach((t) => {
    const withP: number[] = [];
    const withoutP: number[] = [];

    logs.forEach((l) => {
      if (l.pain == null) return;
      if (l.triggers && l.triggers.includes(t)) {
        withP.push(l.pain);
      } else {
        withoutP.push(l.pain);
      }
    });

    if (withP.length >= minN && withoutP.length >= 1) {
      const avgWith = withP.reduce((a, b) => a + b, 0) / withP.length;
      const avgWithout = withoutP.reduce((a, b) => a + b, 0) / withoutP.length;
      items.push({
        label: t,
        value: avgWith - avgWithout,
        n: withP.length
      });
    }
  });

  items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return items.slice(0, 8);
}

export function linregSlope(values: (number | null)[]): { slope: number; intercept: number } {
  const pts: [number, number][] = [];
  values.forEach((v, i) => {
    if (v != null && !isNaN(v)) {
      pts.push([i, v]);
    }
  });

  const n = pts.length;
  if (n < 2) {
    return { slope: 0, intercept: n ? pts[0][1] : 0 };
  }

  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  pts.forEach((p) => {
    sx += p[0];
    sy += p[1];
    sxy += p[0] * p[1];
    sxx += p[0] * p[0];
  });

  const d = n * sxx - sx * sx;
  if (d === 0) {
    return { slope: 0, intercept: sy / n };
  }

  const slope = (n * sxy - sx * sy) / d;
  const intercept = (sy - slope * sx) / n;

  return { slope, intercept };
}

export function initials(name: string): string {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

import { Band } from './data';

export function scoreQuestionnaire(type: string, answers: Record<number, number>): number {
  const q = QS[type];
  if (!q) return 0;
  
  const numericList: number[] = [];
  q.items.forEach((it, idx) => {
    const scaleIdx = answers[idx] ?? 0;
    let val = scaleIdx;
    
    // Check if the overall questionnaire has custom values
    if (q.vals && q.vals[scaleIdx] !== undefined) {
      val = q.vals[scaleIdx];
    }
    
    // Check if the item itself has specific custom values
    if (typeof it !== 'string' && it.vals && it.vals[scaleIdx] !== undefined) {
      val = it.vals[scaleIdx];
    }
    
    numericList.push(val);
  });
  
  const score = q.compute(numericList);
  return parseFloat(score.toFixed(q.dec));
}

export function interpretBand(type: string, score: number): Band | null {
  const q = QS[type];
  if (!q || !q.bands) return null;
  for (const b of q.bands) {
    if (score <= b.upTo) return b;
  }
  return q.bands[q.bands.length - 1] || null;
}

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function findByEmail(data: ChronosData, email: string): Account | null {
  return data.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findByDoctorCode(data: ChronosData, code: string): Account | null {
  const cleanCode = code.trim().toUpperCase();
  return data.accounts.find((a) => a.doctorCode === cleanCode) || null;
}

export function requestLink(data: ChronosData, patientId: string, doctorCode: string): boolean {
  const doc = findByDoctorCode(data, doctorCode);
  if (!doc) return false;
  
  // Remove existing links (Chronos allows 1 doctor link for simple flow)
  data.links = data.links.filter((l) => l.patientId !== patientId);
  
  data.links.push({
    patientId,
    doctorId: doc.id,
    status: 'pending',
    initiatedBy: 'patient',
    createdAt: todayISO()
  });
  
  data.notifications.push({
    id: uid(),
    status: 'unread',
    createdAt: new Date().toISOString(),
    toUserId: doc.id,
    fromUserId: patientId,
    type: 'link_request',
    message: 'Nova solicitação de vínculo clínico recebida.'
  });
  
  return true;
}

export function createAccount(
  data: ChronosData,
  params: {
    role: 'doctor' | 'patient';
    name: string;
    email: string;
    specialty?: string;
    crm?: string;
    uf?: string;
    lgpd: boolean;
    gender?: string | null;
    discountApplied?: boolean;
  }
): Account {
  const newId = uid();
  const acc: Account = {
    id: newId,
    role: params.role,
    name: params.name,
    email: params.email,
    lgpd: { accepted: params.lgpd, at: new Date().toISOString() },
    subscription: {
      plan: 'pro',
      status: 'active',
      discountApplied: false
    }
  };

  if (params.role === 'doctor') {
    const letters = params.name.substring(0, 4).toUpperCase();
    const rNum = Math.floor(1000 + Math.random() * 9000);
    acc.doctorCode = `${letters}-${rNum}`;
    acc.specialty = params.specialty || 'Profissional da Saúde';
    acc.contact = { whatsapp: '', label: 'Secretaria' };
    acc.crm = {
      number: params.crm || '',
      uf: params.uf || '',
      name: params.name,
      status: 'verified',
      verified: true
    };
  } else {
    acc.gender = params.gender || null;
    acc.onboardingDone = false;
    acc.reminderOptIn = false;
  }

  data.accounts.push(acc);
  
  // Initialize default patientData container if they are a patient
  if (params.role === 'patient') {
    data.patientData[newId] = {
      diagnoses: {},
      gender: params.gender || null,
      hormoneRelevant: false,
      baseline: null,
      periodicMetrics: [],
      flareAlerts: [],
      dailyLogs: []
    };
  }

  return acc;
}

export function getCouncilLabel(specialty: string | undefined): string {
  if (!specialty) return 'CRM';
  const spec = specialty.toLowerCase();
  if (spec.includes('fisioterapeuta') || spec.includes('terapeuta ocupacional') || spec.includes('crefito')) return 'CREFITO';
  if (spec.includes('psicó') || spec.includes('psicolog') || spec.includes('psicologia') || spec.includes('crp')) return 'CRP';
  if (spec.includes('educador') || spec.includes('personal') || spec.includes('cref')) return 'CREF';
  if (spec.includes('nutri') || spec.includes('crn')) return 'CRN';
  if (spec.includes('enferme') || spec.includes('coren')) return 'COREN';
  if (spec.includes('farma') || spec.includes('crf')) return 'CRF';
  if (spec.includes('social') || spec.includes('cress')) return 'CRESS';
  if (spec.includes('fono') || spec.includes('crfa')) return 'CRFa';
  return 'CRM';
}

export function verifyCrmMock(acc: Account): { ok: boolean; msg: string } {
  if (acc.crm) {
    const council = getCouncilLabel(acc.specialty);
    if (!acc.crm.number || acc.crm.number.trim().length < 4) {
      return { ok: false, msg: `Registro do conselho (${council}) inválido. Digite pelo menos 4 caracteres.` };
    }
    if (!acc.crm.uf) {
      return { ok: false, msg: `Informe a Unidade Federativa (UF) do conselho (${council}).` };
    }
  }
  return { ok: true, msg: 'Registro profissional verificado com sucesso.' };
}

export function saveData(data: ChronosData) {
  try {
    localStorage.setItem('chronos_app_data', JSON.stringify(data));
  } catch (e) {
    console.error('Error saving chronos data', e);
  }
}

export function generateAITip(pd: PatientData): { title: string; text: string; category: string } {
  const logs = pd.dailyLogs || [];
  const recent3 = logs.slice(-3);
  
  // Calculate average pain and fatigue
  const avgPain = recent3.length ? recent3.reduce((acc, l) => acc + (l.pain ?? 0), 0) / recent3.length : 0;
  const avgFatigue = recent3.length ? recent3.reduce((acc, l) => acc + (l.fatigue ?? 0), 0) / recent3.length : 0;
  
  // Find GAD7 score
  const recentGads = (pd.periodicMetrics || []).filter(m => m.type === 'GAD7');
  const latestGad = recentGads[recentGads.length - 1]?.score ?? 0;
  
  // 1. Water Intake focus
  const avgWater = recent3.length ? recent3.reduce((acc, l) => acc + (l.waterIntake ?? 0), 0) / recent3.length : 0;
  const targetWater = pd.weight ? pd.weight * 35 : 2200;
  if (logs.length > 0 && avgWater > 0 && avgWater < targetWater * 0.7) {
    return {
      title: "Hidratação e Sensibilidade Neurológica",
      text: `Sua ingestão média recente de água (${Math.round(avgWater)}ml) está significativamente abaixo da sua meta recomendada de ${Math.round(targetWater)}ml. Estudos clínicos comprovam que a desidratação leve reduz o limiar de dor e aumenta a ativação cerebral de dor crônica. Que tal tomar um copo grande de água agora mesmo para reidratar suas células e regular seu sistema de dor de forma natural?`,
      category: "hydration"
    };
  }
  
  // 2. High Screen Time / Mental Stress focus
  const avgScreenSocial = recent3.length ? recent3.reduce((acc, l) => acc + (l.screenTimeSocial ?? 0), 0) / recent3.length : 0;
  const avgScreenTotal = recent3.length ? recent3.reduce((acc, l) => acc + (l.screenTimeTotal ?? 0), 0) / recent3.length : 0;
  if (avgScreenTotal > 5 || avgScreenSocial > 90 || latestGad > 9) {
    return {
      title: "Programar um Descanso Mental",
      text: "Seu cérebro tem processado uma sobrecarga alta de estímulos digitais e estresse recentemente. Que tal programar um descanso mental intencional de 20 minutos agora? Desconecte as telas, deite-se confortavelmente, feche os olhos e respire lentamente. Isso sinaliza segurança para as vias neurais superativadas pela dor.",
      category: "mind"
    };
  }
  
  // 3. Nature Contact & Hobbies
  const natureFreq = recent3.filter(l => l.natureContact).length;
  const hobbyFreq = recent3.filter(l => l.hobbies).length;
  if (logs.length >= 3 && natureFreq === 0 && hobbyFreq === 0) {
    return {
      title: "Conexão com o Presente e Auto-cuidado",
      text: "Seus últimos diários indicam pouca atividade de lazer e contato com a natureza. Reservar apenas 15 minutos hoje para um hobby ou passar alguns momentos sob o sol ou em contato com plantas ajuda a desacelerar o sistema nervoso simpático, diminuindo a sensibilidade dolorosa e aumentando o bem-estar.",
      category: "self_care"
    };
  }
  
  // 4. Exercise and pacing
  const lowExercise = recent3.filter(l => l.exercise?.done === 'Sim').length === 0;
  if (lowExercise && avgPain < 6 && logs.length >= 3) {
    return {
      title: "Ritmo Seguro de Atividade (Pacing)",
      text: "Hoje, seu nível geral de dor está moderado. Esta é a oportunidade perfeita para planejar um movimento seguro e suave, como alongamentos leves ou uma caminhada curta. Lembre-se: o movimento ensina seu cérebro que mover-se é seguro, modulando gradualmente a dor.",
      category: "movement"
    };
  }
  
  // 5. Default high quality tips
  const tips = [
    {
      title: "A Importância do Vínculo Social",
      text: "Estar perto de pessoas queridas e conversar com amigos aciona vias de ocitocina e endorfina. Esses neurotransmissores são analgésicos naturais poderosos, modulando as vias de dor no cérebro. Tente enviar uma mensagem ou fazer uma ligação curta para alguém especial hoje!",
      category: "connection"
    },
    {
      title: "Evitando o Ciclo de Excesso e Queda",
      text: "Não tente compensar o tempo perdido nos dias bons fazendo esforço excessivo. Divida suas tarefas em blocos menores com pausas agendadas por tempo, e não pelo aparecimento da dor. Essa modulação de ritmo protege seu corpo contra novas crises.",
      category: "pacing"
    },
    {
      title: "Preparando sua Higiene do Sono",
      text: "Noites de sono não reparador reduzem consideravelmente o limiar de dor e aumentam a fadiga. Tente desligar as telas e diminuir as luzes de casa uma hora antes de ir deitar, preparando sua mente para um descanso profundo e reparador.",
      category: "sleep"
    }
  ];
  
  // Pick one deterministically based on date so it changes daily!
  const index = new Date().getDate() % tips.length;
  return tips[index];
}

export function validateClinicalData(customData?: ChronosData | PatientData): string[] {
  // Only execute in development/non-production environments
  if (process.env.NODE_ENV === 'production') return [];

  console.log('[Chronos Validation] Executing clinical integrity checks...');
  const integrityAlerts: string[] = [];

  // 1. Static Configuration Checks
  // (a) DX.q points to nonexistent QS key
  Object.entries(DX).forEach(([key, config]) => {
    if (config.q && !QS[config.q]) {
      const msg = `[ValidationError] DX key "${key}" has questionnaire q="${config.q}" which does not exist in QS.`;
      console.error(msg);
      integrityAlerts.push(msg);
    }
  });

  // (b) diagnoses keys used in the code must exist in DX
  const diagnosesUsedInCode = [
    'fibromialgia',
    'osteoartrite',
    'ar',
    'espondiloartrite',
    'psoriasica',
    'les',
    'sjogren',
    'miofascial',
    'migrainea',
    'endometriose',
    'sii'
  ];
  diagnosesUsedInCode.forEach((key) => {
    if (!DX[key]) {
      const msg = `[ValidationError] Diagnoses key "${key}" used in code does not exist in DX.`;
      console.error(msg);
      integrityAlerts.push(msg);
    }
  });

  // (c) any refId cited in InsightItem must exist in REFERENCES
  const mockPatient: PatientData = {
    gender: 'F',
    birthDate: '1980-01-01',
    weight: 95, // high BMI to trigger obesity/overweight insights
    height: 160,
    diagnoses: {
      fibromialgia: true,
      osteoartrite: true,
      ar: true,
      espondiloartrite: true,
      psoriasica: true,
      les: true,
      sjogren: true,
      miofascial: true,
      migrainea: false,
      endometriose: false,
      sii: false
    },
    continuousMeds: ['adalimumabe', 'etanercepte'], // triggers anti-TNF alert
    dailyLogs: Array.from({ length: 15 }, (_, i) => ({
      date: `2026-06-${10 + i}`,
      pain: 8,
      fatigue: 7,
      sleep: 2, // low sleep to trigger sleep insights
      function: 5,
      triggers: ['Estresse ocupacional', 'Trabalho intenso / hora extra'],
      infectionOrVaccineStatus: 'vacina',
      infectionSite: 'respiratorio' // triggers estrepto-psoríase alert
    })),
    baseline: null,
    periodicMetrics: [],
    flareAlerts: [],
    hormoneRelevant: false
  };

  const allInsights = genInsights(mockPatient, 'all');
  const validRefIds = new Set(REFERENCES.map(([id]) => id));

  allInsights.forEach((insight) => {
    if (insight.refIds) {
      insight.refIds.forEach((refId) => {
        if (!validRefIds.has(refId)) {
          const msg = `[ValidationError] Insight cites refId ${refId} which does not exist in REFERENCES.`;
          console.error(msg);
          integrityAlerts.push(msg);
        }
      });
    }
  });

  // 2. Dynamic Deep Integrity and Consistency Checks
  let dataToCheck: ChronosData | null = null;
  if (!customData) {
    try {
      const saved = localStorage.getItem('chronos_app_data');
      if (saved) {
        dataToCheck = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading data for clinical validation', e);
    }
  } else if ('accounts' in customData && 'patientData' in customData) {
    dataToCheck = customData as ChronosData;
  }

  let patientsToCheck: { id: string; name: string; pd: PatientData }[] = [];
  if (dataToCheck) {
    Object.entries(dataToCheck.patientData).forEach(([pid, pd]) => {
      const acc = dataToCheck?.accounts.find(a => a.id === pid);
      patientsToCheck.push({
        id: pid,
        name: acc ? acc.name : `Paciente ${pid.substring(0, 4)}`,
        pd
      });
    });
  } else if (customData && !('accounts' in customData)) {
    patientsToCheck.push({
      id: 'current',
      name: 'Paciente Atual',
      pd: customData as PatientData
    });
  }

  patientsToCheck.forEach(({ name, pd }) => {
    const metrics = pd.periodicMetrics || [];
    const logs = pd.dailyLogs || [];

    metrics.forEach((pm) => {
      const qDate = pm.date;
      const qType = pm.type;
      const qScore = pm.score;

      // Filter daily logs in the 3-day window [qDate - 2, qDate]
      const qDateTime = new Date(qDate + 'T00:00:00').getTime();
      const logsInWindow = logs.filter((l) => {
        const lTime = new Date(l.date + 'T00:00:00').getTime();
        const diffDays = (qDateTime - lTime) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 2;
      });

      if (logsInWindow.length === 0) return;

      const validPains = logsInWindow.map(l => l.pain).filter(v => v != null && !isNaN(v)) as number[];
      const validFatigues = logsInWindow.map(l => l.fatigue).filter(v => v != null && !isNaN(v)) as number[];
      const validSleeps = logsInWindow.map(l => l.sleep).filter(v => v != null && !isNaN(v)) as number[];
      const validMoods = logsInWindow.map(l => l.mood).filter(v => v != null && !isNaN(v)) as number[];

      const avgPain = validPains.length ? validPains.reduce((a, b) => a + b, 0) / validPains.length : null;
      const avgFatigue = validFatigues.length ? validFatigues.reduce((a, b) => a + b, 0) / validFatigues.length : null;
      const avgSleep = validSleeps.length ? validSleeps.reduce((a, b) => a + b, 0) / validSleeps.length : null;
      const avgMood = validMoods.length ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length : null;

      const band = interpretBand(qType, qScore);
      const bandLabel = band ? band.label : '';

      // (a) Pain Discrepancy Checks
      const isPainQuestionnaire = ['fibromialgia', 'ar', 'espondiloartrite', 'sjogren', 'psoriasica', 'les', 'osteoartrite', 'miofascial'].includes(qType);
      if (isPainQuestionnaire && avgPain !== null) {
        const isSevereBand = ['Grave', 'Alta', 'Intensa', 'Ativa'].some(label => bandLabel.includes(label));
        const isMildBand = ['Leve', 'Baixa', 'Remissão', 'Sob controle', 'Aceitável'].some(label => bandLabel.includes(label));

        if (isSevereBand && avgPain <= 2.5) {
          const alertMsg = `[Inconsistência de Dor] O questionário '${QS[qType]?.name || qType}' para ${name} em ${fmtDate(qDate, 's')} indica impacto grave/alto (${bandLabel}, score ${qScore}), mas os diários diários recentes registram dor média muito baixa (${avgPain.toFixed(1)}/10).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        } else if (isMildBand && avgPain >= 7.5) {
          const alertMsg = `[Inconsistência de Dor] O questionário '${QS[qType]?.name || qType}' para ${name} em ${fmtDate(qDate, 's')} indica remissão ou impacto leve (${bandLabel}, score ${qScore}), mas os diários diários recentes registram dor média grave (${avgPain.toFixed(1)}/10).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      }

      // (b) Fatigue Discrepancy Checks
      const isFatigueQuestionnaire = ['fibromialgia', 'sjogren', 'psoriasica', 'les'].includes(qType);
      if (isFatigueQuestionnaire && avgFatigue !== null) {
        const isSevereBand = ['Grave', 'Alta', 'Alto'].some(label => bandLabel.includes(label));
        const isMildBand = ['Leve', 'Baixa', 'Aceitável', 'Baixo'].some(label => bandLabel.includes(label));

        if (isSevereBand && avgFatigue <= 2.5) {
          const alertMsg = `[Inconsistência de Fadiga] O questionário '${QS[qType]?.name || qType}' para ${name} em ${fmtDate(qDate, 's')} indica fadiga grave/alta (${bandLabel}, score ${qScore}), mas os diários diários recentes registram fadiga média muito baixa (${avgFatigue.toFixed(1)}/10).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        } else if (isMildBand && avgFatigue >= 7.5) {
          const alertMsg = `[Inconsistência de Fadiga] O questionário '${QS[qType]?.name || qType}' para ${name} em ${fmtDate(qDate, 's')} indica fadiga leve ou estável (${bandLabel}, score ${qScore}), mas os diários diários recentes registram fadiga média grave (${avgFatigue.toFixed(1)}/10).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      }

      // (c) Sleep Discrepancy Checks
      const isSleepQuestionnaire = ['fibromialgia', 'psoriasica', 'les'].includes(qType);
      if (isSleepQuestionnaire && avgSleep !== null) {
        const isSevereBand = ['Grave', 'Alta', 'Alto'].some(label => bandLabel.includes(label));
        if (isSevereBand && avgSleep >= 8.0) {
          const alertMsg = `[Inconsistência de Sono] O questionário '${QS[qType]?.name || qType}' para ${name} em ${fmtDate(qDate, 's')} indica sono gravemente prejudicado (${bandLabel}, score ${qScore}), mas os diários diários recentes registram qualidade de sono excelente (${avgSleep.toFixed(1)}/10).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      }

      // (d) Anxiety/Depression Mood State Discrepancy Checks
      if (avgMood !== null) {
        if (qType === 'GAD7' && qScore >= 15 && avgMood >= 4.5) {
          const alertMsg = `[Inconsistência Psicossocial] O questionário de Ansiedade (GAD-7) de ${name} em ${fmtDate(qDate, 's')} indica ansiedade severa (score ${qScore}), mas os registros diários concomitantes acusam humor excelente (${avgMood.toFixed(1)}/5).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        } else if (qType === 'PHQ9' && qScore >= 15 && avgMood >= 4.5) {
          const alertMsg = `[Inconsistência Psicossocial] O questionário de Depressão (PHQ-9) de ${name} em ${fmtDate(qDate, 's')} indica sintomas depressivos graves (score ${qScore}), mas os registros diários concomitantes acusam humor excelente (${avgMood.toFixed(1)}/5).`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      }
    });

    // (e) Inflammatory Arthritis Stiffness vs Pain Check
    const hasInflammatory = pd.diagnoses?.ar || pd.diagnoses?.espondiloartrite || pd.diagnoses?.psoriasica;
    if (hasInflammatory) {
      logs.forEach((l) => {
        if (l.stiffness != null && l.stiffness >= 7 && l.pain != null && l.pain <= 2) {
          const alertMsg = `[Inconsistência Reumatológica] No diário de ${fmtDate(l.date, 's')}, ${name} registrou rigidez matinal severa (${l.stiffness}/10) com dor reportada quase nula (${l.pain}/10), o que é altamente atípico para artrite inflamatória ativa.`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      });
    }

    // (f) Infection-Medication Suspension Conflict
    logs.forEach((l) => {
      if (l.infectionOrVaccineStatus === 'pausa_infeccao') {
        const adherenceMap = l.medicationAdherence || {};
        const takenMeds = Object.entries(adherenceMap)
          .filter(([_, status]) => status === 'taken')
          .map(([med]) => med);

        const dangerousTaken = takenMeds.filter(med => {
          const mLower = med.toLowerCase();
          return mLower.includes('adalimumabe') || 
                 mLower.includes('etanercepte') || 
                 mLower.includes('infliximabe') || 
                 mLower.includes('humira') || 
                 mLower.includes('enbrel') ||
                 mLower.includes('remicade') ||
                 mLower.includes('stelara') ||
                 mLower.includes('secukinumabe') ||
                 mLower.includes('cosentyx') ||
                 mLower.includes('metotrexato') ||
                 mLower.includes('leflunomida') ||
                 mLower.includes('rituximabe');
        });

        if (dangerousTaken.length > 0) {
          const alertMsg = `[Incongruência de Conduta Clínica] O diário de ${fmtDate(l.date, 's')} de ${name} registra pausa terapêutica por infecção, mas acusa a tomada concomitante de imunossupressor/biológico (${dangerousTaken.join(', ')}). Isso expõe o paciente a risco clínico severo.`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      }
    });

    // (g) Gastrointestinal/IBS Symptoms Conflict with Pain
    if (pd.diagnoses?.sii) {
      logs.forEach((l) => {
        if ((l.stoolBlood || l.stoolMucus) && l.abdominalPain != null && l.abdominalPain <= 1) {
          const alertMsg = `[Inconsistência Gastrointestinal] No diário de ${fmtDate(l.date, 's')} de ${name}, foi relatada a presença de sangramento ou muco nas fezes sem qualquer dor abdominal significativa (${l.abdominalPain}/10), exigindo atenção quanto à precisão do relato.`;
          console.warn(alertMsg);
          integrityAlerts.push(alertMsg);
        }
      });
    }
  });

  console.log(`[Chronos Validation] Verification completed with ${integrityAlerts.length} alert(s) found.`);
  return integrityAlerts;
}

export interface CyclePrediction {
  cycleType: 'regular' | 'irregular' | 'amenorrhea' | 'menopause' | 'continuous_hormone';
  cycleDay: number;
  predictedPhase: string;
  daysToNextPeriod: number;
  nextPeriodDateISO: string;
  nextLutealStartISO: string;
  nextOvulationISO: string;
  isHighSymptomWindow: boolean;
  recommendationNote: string;
}

export function calculateCyclePrediction(
  cycleType: 'regular' | 'irregular' | 'amenorrhea' | 'menopause' | 'continuous_hormone' = 'regular',
  cycleLength: number = 28,
  lastPeriodDate: string = '',
  targetDateStr: string = todayISO()
): CyclePrediction {
  if (cycleType !== 'regular' || !lastPeriodDate) {
    return {
      cycleType,
      cycleDay: 1,
      predictedPhase: cycleType === 'irregular' ? 'Ciclo Irregular' : cycleType === 'menopause' ? 'Menopausa / Climatério' : 'Uso de Hormônio Contínuo',
      daysToNextPeriod: 0,
      nextPeriodDateISO: '',
      nextLutealStartISO: '',
      nextOvulationISO: '',
      isHighSymptomWindow: true,
      recommendationNote: cycleType === 'irregular' 
        ? 'Para ciclos irregulares, o diário registra os sintomas de forma aberta conforme a percepção do paciente.'
        : 'Em uso contínuo ou menopausa, acompanhe ondas de calor e alterações hormonais contínuas.'
    };
  }

  const targetDate = new Date(targetDateStr + 'T12:00:00');
  const lastPeriod = new Date(lastPeriodDate + 'T12:00:00');
  
  const diffTime = targetDate.getTime() - lastPeriod.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  
  const safeCycleLength = cycleLength > 15 ? cycleLength : 28;
  const cycleDay = diffDays >= 0 ? (diffDays % safeCycleLength) + 1 : 1;

  let predictedPhase = 'Folicular';
  let isHighSymptomWindow = false;
  let recommendationNote = '';

  if (cycleDay >= 1 && cycleDay <= 5) {
    predictedPhase = 'Menstruação';
    isHighSymptomWindow = true;
    recommendationNote = 'Fase Menstrual Prevista: Atenção reforçada para cólicas pélvicas, enxaqueca catamenial e sensibilidade lombar.';
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    predictedPhase = 'Folicular';
    isHighSymptomWindow = false;
    recommendationNote = 'Fase Folicular Prevista: Período tipicamente com maior estabilidade hormonal e menor incidência de dores cíclicas.';
  } else if (cycleDay >= 14 && cycleDay <= 16) {
    predictedPhase = 'Ovulação provável';
    isHighSymptomWindow = true;
    recommendationNote = 'Fase Ovulatória Prevista: Possível ocorrência de dor pélvica intermenstrual e pico metabólico.';
  } else {
    predictedPhase = 'Lútea / TPM';
    isHighSymptomWindow = true;
    recommendationNote = 'Janela Pré-Menstrual (TPM / Fase Lútea) Prevista: Maior suscetibilidade a retenção hídrica, oscilações de humor e dores musculares.';
  }

  const periodsPassed = Math.floor(diffDays / safeCycleLength);
  const nextPeriodTime = lastPeriod.getTime() + (periodsPassed + 1) * safeCycleLength * 24 * 3600 * 1000;
  const nextPeriodObj = new Date(nextPeriodTime);
  const nextPeriodDateISO = nextPeriodObj.toISOString().split('T')[0];

  const daysToNextPeriod = Math.ceil((nextPeriodTime - targetDate.getTime()) / (1000 * 3600 * 24));

  const nextOvulationObj = new Date(nextPeriodTime - 14 * 24 * 3600 * 1000);
  const nextOvulationISO = nextOvulationObj.toISOString().split('T')[0];

  const nextLutealObj = new Date(nextPeriodTime - 12 * 24 * 3600 * 1000);
  const nextLutealStartISO = nextLutealObj.toISOString().split('T')[0];

  return {
    cycleType: 'regular',
    cycleDay,
    predictedPhase,
    daysToNextPeriod: Math.max(0, daysToNextPeriod),
    nextPeriodDateISO,
    nextLutealStartISO,
    nextOvulationISO,
    isHighSymptomWindow,
    recommendationNote
  };
}

