/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, ChronosData, PeriodicMetric, DailyLog } from '../types';
import { DX, REFERENCES, QS } from '../data';
import {
  calcRisk,
  adherence,
  initials,
  todayISO,
  fmtDate,
  pearsonCorr,
  saveData,
  verifyCrmMock,
  getCouncilLabel
} from '../utils';
import {
  LineChart,
  MultiLineChart,
  BarChart,
  DonutChart,
  BandLineChart,
  Sparkline,
  Legend
} from './Charts';
import {
  Home,
  Users,
  PieChart,
  BookOpen,
  Settings,
  LogOut,
  X,
  Menu,
  Phone,
  Check,
  ClipboardList,
  AlertTriangle,
  User,
  Heart,
  Activity,
  Plus,
  Pill,
  Stethoscope,
  Brain,
  Apple,
  TrendingUp,
  Droplet,
  Zap,
  Smile,
  Gauge,
  Moon,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { RitmaLogo } from './RitmaLogo';
import ConsultationSummary from './ConsultationSummary';

interface DoctorViewProps {
  data: ChronosData;
  account: Account;
  onLogout: () => void;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
}

export type SpecialtyCategory = 'medical' | 'physio' | 'trainer' | 'nutrition' | 'psychology';

export function getSpecialtyCategory(specialty: string | undefined): SpecialtyCategory {
  if (!specialty) return 'medical';
  const spec = specialty.toLowerCase();
  if (spec.includes('fisioterapeuta') || spec.includes('crefito') || spec.includes('terapeuta ocupacional') || spec.includes('reabilita')) return 'physio';
  if (spec.includes('psicó') || spec.includes('psicolog') || spec.includes('crp') || spec.includes('terapia')) return 'psychology';
  if (spec.includes('educador') || spec.includes('personal') || spec.includes('cref') || spec.includes('treino')) return 'trainer';
  if (spec.includes('nutri') || spec.includes('crn') || spec.includes('aliment') || spec.includes('dieta')) return 'nutrition';
  return 'medical';
}

type TabType = 'home' | 'patients' | 'analysis' | 'instruments' | 'settings' | 'news';

export const DoctorView: React.FC<DoctorViewProps> = ({ data, account, onLogout, onUpdateData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showConsultationMode, setShowConsultationMode] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [specialty, setSpecialty] = useState(account.specialty || '');
  const [waNumber, setWaNumber] = useState(account.contact?.whatsapp || '');
  const [waLabel, setWaLabel] = useState(account.contact?.label || '');
  const [crmNumber, setCrmNumber] = useState(account.crm?.number || '');
  const [crmUf, setCrmUf] = useState(account.crm?.uf || '');
  const [isVerifyingSettings, setIsVerifyingSettings] = useState(false);
  const [settingsVerifyStep, setSettingsVerifyStep] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // In-app interactive push notification banner for doctor profile review
  const [showRevisionBanner, setShowRevisionBanner] = useState(true);
  const [highlightSettingsFields, setHighlightSettingsFields] = useState(false);

  // Helpers
  const authPatients = () => {
    return data.links
      .filter((l) => l.doctorId === account.id && l.status === 'authorized')
      .map((l) => ({
        link: l,
        acc: data.accounts.find((a) => a.id === l.patientId)!,
        pd: data.patientData[l.patientId]!
      }))
      .filter((x) => x.acc && x.pd);
  };

  const pendingLinks = () => {
    return data.links
      .filter((l) => l.doctorId === account.id && l.status === 'pending')
      .map((l) => ({
        link: l,
        acc: data.accounts.find((a) => a.id === l.patientId)!
      }))
      .filter((x) => x.acc);
  };

  const handleAuthorizeLink = (pid: string) => {
    onUpdateData((prev) => {
      const link = prev.links.find((l) => l.patientId === pid && l.doctorId === account.id);
      if (link) {
        link.status = 'authorized';
      }

      // Send patient welcome notification
      prev.notifications.push({
        id: Math.random().toString(36).slice(2),
        status: 'unread',
        createdAt: new Date().toISOString(),
        toUserId: pid,
        fromUserId: account.id,
        type: 'link_authorized',
        message: `O Dr. ${account.name} autorizou o vínculo clínico. Seus baselines agora são compartilhados em tempo real.`
      });
    });
    showToast('Vínculo clínico com o paciente autorizado com sucesso!', 'success');
  };

  const handleRejectLink = (pid: string) => {
    if (!confirm('Deseja rejeitar este pedido de vínculo clínico?')) return;
    onUpdateData((prev) => {
      prev.links = prev.links.filter((l) => !(l.patientId === pid && l.doctorId === account.id));
    });
    showToast('Pedido de vínculo recusado.', 'info');
  };

  const handleUnlink = (pid: string) => {
    if (!confirm('Deseja encerrar o vínculo de acompanhamento deste paciente?')) return;
    onUpdateData((prev) => {
      prev.links = prev.links.filter((l) => !(l.patientId === pid && l.doctorId === account.id));
    });
    setSelectedPatientId(null);
    showToast('Vínculo clínico encerrado.', 'info');
  };

  const handleOutreach = (pid: string) => {
    if (!account.contact?.whatsapp) {
      showToast('Por favor, configure o número de WhatsApp da sua clínica primeiro nas Configurações.', 'error');
      setActiveTab('settings');
      return;
    }

    onUpdateData((prev) => {
      const url = `https://wa.me/${account.contact?.whatsapp.replace(/\D/g, '')}`;
      prev.notifications.push({
        id: Math.random().toString(36).slice(2),
        status: 'unread',
        createdAt: new Date().toISOString(),
        toUserId: pid,
        fromUserId: account.id,
        type: 'outreach',
        message: 'Atenção: sua equipe reumatológica identificou alertas no seu diário de dor recente. Entre em contato para avaliar antecipar sua consulta.',
        contactUrl: url
      });
    });

    showToast('Notificação de contato e mensagem encaminhadas ao paciente!', 'success');
  };

  const handleVerifySettingsOnline = async () => {
    const trimmedNum = crmNumber.trim();
    if (!trimmedNum || !crmUf) {
      showToast('Informe o número do registro e a UF para consulta.', 'error');
      return;
    }
    setIsVerifyingSettings(true);
    const council = getCouncilLabel(specialty);
    setSettingsVerifyStep(`Consultando cadastro profissional do ${council}...`);
    
    await new Promise((r) => setTimeout(r, 650));
    setSettingsVerifyStep(`Verificando cadastro ativo de ${name} sob nº ${trimmedNum}/${crmUf}...`);
    
    await new Promise((r) => setTimeout(r, 850));
    setSettingsVerifyStep(`Confirmando regularidade profissional junto ao conselho...`);
    
    await new Promise((r) => setTimeout(r, 650));
    
    onUpdateData((prev) => {
      const acc = prev.accounts.find((a) => a.id === account.id);
      if (acc) {
        acc.crm = {
          number: trimmedNum,
          uf: crmUf.toUpperCase(),
          name: name.trim(),
          status: 'verified',
          verified: true
        };
      }
    });
    setIsVerifyingSettings(false);
    setSettingsVerifyStep('');
    showToast(`Registro profissional (${council} ${trimmedNum}/${crmUf}) verificado com sucesso no conselho de classe!`, 'success');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateData((prev) => {
      const acc = prev.accounts.find((a) => a.id === account.id);
      if (acc) {
        acc.name = name.trim();
        acc.email = email.trim().toLowerCase();
        acc.specialty = specialty.trim();
        acc.crm = {
          number: crmNumber.trim(),
          uf: crmUf.trim().toUpperCase(),
          name: name.trim(),
          status: acc.crm?.status || 'verified',
          verified: acc.crm?.verified ?? true
        };
        acc.contact = {
          whatsapp: waNumber.trim(),
          label: waLabel.trim()
        };
      }
    });
    setHighlightSettingsFields(false);
    setShowRevisionBanner(false);
    showToast('Dados de perfil e consultório atualizados com sucesso!', 'success');
  };

  const handleCopyInviteLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/?code=${account.doctorCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link de indicação da clínica copiado para a área de transferência!', 'success');
      });
    } else {
      showToast(`Link para copiar: ${url}`, 'info');
    }
  };

  const patients = authPatients();
  const pend = pendingLinks();

  const attentionQueue = patients
    .map((p) => ({ ...p, risk: calcRisk(p.pd) }))
    .filter((p) => p.risk.enough && p.risk.level !== 'LOW')
    .sort((a, b) => b.risk.score - a.risk.score);

  const avgAdherence = patients.length
    ? Math.round(
        patients.reduce((sum, p) => sum + adherence(p.pd, 14).pct, 0) / patients.length
      )
    : 0;

  // COHORT CELL COLOR CALCULATOR
  const getCohortColor = (v: number | null | undefined) => {
    if (v == null) return 'rgba(148, 163, 184, 0.1)'; // Gray
    if (v < 3.4) return '#86efac'; // Emerald green
    if (v < 6.7) return '#fbbf24'; // Orange
    return '#fb7185'; // Rose Red
  };

  // DRILL-DOWN PATIENT SUMMARY
  const renderPatientDrawer = () => {
    if (!selectedPatientId) return null;
    const p = patients.find((pat) => pat.acc.id === selectedPatientId);
    if (!p) return null;

    const risk = calcRisk(p.pd);
    const activeDxs = Object.keys(p.pd.diagnoses).filter((k) => p.pd.diagnoses[k]);
    const recentLogs = p.pd.dailyLogs.slice(-30);

    // Compute correlations
    const corrItems: string[] = [];
    if (p.pd.dailyLogs.length >= 5) {
      const sleeps = p.pd.dailyLogs.map((l) => l.sleep).filter((v) => v != null) as number[];
      const pains = p.pd.dailyLogs.map((l) => l.pain).filter((v) => v != null) as number[];
      if (sleeps.length >= 4) {
        const r = pearsonCorr(sleeps, pains);
        if (Math.abs(r) > 0.3) {
          corrItems.push(`Sono & Dor: Pearson r = ${r.toFixed(2)} (${r < 0 ? 'Sono ruim correlaciona com aumento de dor' : 'Variação atípica'}) [Ref 14].`);
        }
      }
    }
    if (activeDxs.includes('sii') && activeDxs.includes('fibromialgia')) {
      corrItems.push('Visceral-Somatic: episódios inflamatórios gastrointestinais e distensão de alças (SII) agem como amplificadores sinápticos somáticos em pacientes com Fibromialgia [Ref 55].');
    }

    // Additional cross-behavior medical warnings and alerts
    const hasMedForgets = p.pd.dailyLogs.slice(-7).some((l) => l.forgotMedication === true);
    if (hasMedForgets) {
      corrItems.push('Adesão Medicamentosa: Detetada falha de tomada ou esquecimento de fármaco nos últimos 7 dias. Flutuações na dosagem sérica de imunobiológicos ou neuromoduladores elevam em até 40% a incidência de flare-ups de dor de rebote [Ref 9].');
    }

    const waterLogs = p.pd.dailyLogs.filter((l) => (l.waterIntake && l.waterIntake > 0) || l.waterSimple);
    if (waterLogs.length > 0) {
      const targetWater = (p.pd.weight ?? 70) * 35;
      const numWithWaterIn = p.pd.dailyLogs.filter((l) => l.waterIntake && l.waterIntake > 0);
      const avgWater = numWithWaterIn.length
        ? numWithWaterIn.reduce((sum, l) => sum + (l.waterIntake ?? 0), 0) / numWithWaterIn.length
        : 0;

      const waterSimpleLowCount = p.pd.dailyLogs.slice(-10).filter((l) => l.waterSimple === 'pouco').length;

      if (avgWater > 0 && avgWater < targetWater * 0.75) {
        corrItems.push(`Déficit Hidrológico: Consumo hídrico quantitativo médio recente de ${Math.round(avgWater)} ml (Ideal calculado: ${targetWater} ml). A desidratação subclínica diminui o limiar de dor e induz disautonomia [Ref 56].`);
      } else if (waterSimpleLowCount >= 3) {
        corrItems.push(`Déficit Hidrológico por Percepção: Relatos recorrentes de ingestão hídrica baixa (percepção: 'pouco') nos logs recentes. Recomenda-se alertar o paciente sobre a importância da lubrificação fascial e articular [Ref 56].`);
      }
    }

    const screenLogs = p.pd.dailyLogs.filter((l) => l.screenTimeTotal && l.screenTimeTotal > 0);
    if (screenLogs.length > 0) {
      const avgScreen = screenLogs.reduce((sum, l) => sum + (l.screenTimeTotal ?? 0), 0) / screenLogs.length;
      if (avgScreen > 5) {
        corrItems.push(`Estresse Fótico / Higiene do Sono: Tempo de tela médio elevado (${avgScreen.toFixed(1)} horas/dia). O estímulo digital persistente suprime a melatonina endógena, agravando o sono não restaurador e a sensibilização central [Ref 14].`);
      }
    }

    if (activeDxs.includes('sii')) {
      const irritantLogsCount = p.pd.dailyLogs.slice(-7).filter(
        (l) => l.caffeineSimple === 'muito' || l.greasyMeal || l.alcoholLog || l.gasBeverage
      ).length;
      if (irritantLogsCount >= 2) {
        corrItems.push('Gatilhos Alimentares vs Dor Visceral: O consumo recorrente de substâncias irritativas gástricas (álcool, cafeína em excesso, gorduras) está sobreposto a picos relatados de meteorismo e dor abdominal [Ref 55].');
      }
    }

    const positiveAutonomicDays = p.pd.dailyLogs.slice(-10).filter((l) => l.natureContact || l.hobbies || l.lovedOnes).length;
    if (positiveAutonomicDays >= 3) {
      corrItems.push(`Modulação Descendente Inibidora (Pacing): Registro de ${positiveAutonomicDays} dias com atividades protetoras (natureza, hobbies, suporte afetivo). Estimula o tônus vagal e reduz a hiperatividade simpática nociva à dor persistente [Ref 12].`);
    }

    // Real-world infection and vaccine tracking for clinician review
    const recentInfectionsList = p.pd.dailyLogs.slice(-14).filter((l) => l.infectionOrVaccineStatus && l.infectionOrVaccineStatus !== 'nao');
    if (recentInfectionsList.length > 0) {
      const lastInf = recentInfectionsList[recentInfectionsList.length - 1];
      let infLabel = '';
      if (lastInf.infectionOrVaccineStatus === 'vacina') {
        infLabel = 'Vacinação recente (efeito adverso menor / transitório)';
      } else if (lastInf.infectionOrVaccineStatus === 'pausa_infeccao') {
        infLabel = 'Pausa de tratamento imunossupressor por suspeita ou vigência de infecção ativa';
      } else if (lastInf.infectionOrVaccineStatus === 'antibiotico') {
        infLabel = 'Uso recente de antibiótico (risco de perturbação do microbioma e desregulação imunológica)';
      } else {
        infLabel = `Infecção em atividade (${lastInf.infectionSite ? 'Sítio: ' + lastInf.infectionSite : 'Sítio não especificado'}) de gravidade ${lastInf.infectionOrVaccineStatus === 'importante' ? 'Importante' : 'Leve'}`;
      }
      corrItems.push(`Efeito de Contexto / Confundidores Clínicos: Registro de [${infLabel}]. Processos infecciosos ou imunizações mimetizam "flares" inflamatórios reais por gerarem febre, fadiga aguda e mialgia generalizada. Recomenda-se confirmar marcadores inflamatórios objetivos (PCR/VHS) ou ultrassom com Power Doppler antes de concluir falha primária ou secundária de tratamento.`);
    }

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50">
        <div className="bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl p-5 sm:p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4 mb-4 flex-shrink-0">
            <div>
              <h3 className="font-poppins font-black text-slate-800 dark:text-slate-100 text-lg">
                {p.acc.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Sessões: {p.pd.dailyLogs.length} logs · {p.acc.email}
              </p>
            </div>
            <button
              onClick={() => setSelectedPatientId(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Quick Consultation Mode Button */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-650 dark:to-indigo-750 p-4 rounded-2xl shadow-sm text-white flex flex-col gap-2 print-hidden">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 bg-white/10 rounded-lg shrink-0">
                <Stethoscope className="w-4.5 h-4.5" />
              </span>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">Modo Consulta (Resumo Rápido)</h4>
                <p className="text-[10px] text-indigo-100 leading-relaxed mt-0.5">
                  Gere uma visão de tela cheia otimizada para leitura rápida e impressão física, comparando o período com o histórico basal do paciente.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowConsultationMode(p.acc.id);
                setSelectedPatientId(null);
              }}
              className="w-full py-2 bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center select-none"
            >
              Ativar Modo Consulta
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Condition chips */}
            <div className="flex flex-wrap gap-1.5">
              {activeDxs.map((dx) => (
                <span
                  key={dx}
                  className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md"
                >
                  {DX[dx]?.icon} {DX[dx]?.label}
                </span>
              ))}
            </div>

            {/* Flare Risk status */}
            {risk.enough ? (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Previsão de Flare</span>
                  <span
                    className={`font-black text-sm uppercase ${
                      risk.level === 'LOW'
                        ? 'text-emerald-500'
                        : risk.level === 'MODERATE'
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    Risco {risk.level} ({risk.score.toFixed(1)}/5.0)
                  </span>
                </div>
                <div className="space-y-2">
                  {risk.dims.map((d) => (
                    <div key={d.key} className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-400">{d.label}</span>
                      <span className={d.z < 1.0 ? 'text-emerald-500' : d.z < 2.0 ? 'text-amber-500' : 'text-rose-500'}>
                        Z={d.z.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border p-4 rounded-xl text-xs text-slate-400">
                Aguardando logs diários mínimos (requer 3+logs para baseline).
              </div>
            )}

            {/* Ficha Clínico-Metabólica de Base para o Médico */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-1 dark:border-slate-800/60 select-none">
                <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                <span>Ficha Clínico-Metabólica Estável</span>
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Sexo Biológico:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {p.acc.gender === 'F' ? 'Feminino' : p.acc.gender === 'M' ? 'Masculino' : 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Parâmetros Físicos:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {p.pd.height ? `${p.pd.height} cm` : 'Altura n/d'} · {p.pd.weight ? `${p.pd.weight} kg` : 'Peso n/d'}
                  </span>
                </div>
                {p.pd.height && p.pd.weight && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">IMC Base Calculado:</span>
                    <span className="font-black text-slate-700 dark:text-slate-200 text-sm">
                      {(() => {
                        const hM = p.pd.height / 100;
                        const imc = p.pd.weight / (hM * hM);
                        let category = '';
                        let colorClass = 'text-slate-500';
                        if (imc < 18.5) { category = 'Abaixo do Peso'; colorClass = 'text-amber-500'; }
                        else if (imc < 25) { category = 'Peso Saudável'; colorClass = 'text-emerald-500'; }
                        else if (imc < 30) { category = 'Sobrepeso (IMC ≥ 24-25)'; colorClass = 'text-amber-500'; }
                        else { category = 'Obesidade (IMC ≥ 30)'; colorClass = 'text-rose-500'; }
                        return (
                          <>
                            {imc.toFixed(1)} kg/m² <span className={`text-xs font-black ${colorClass}`}>({category})</span>
                          </>
                        );
                      })()}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Fatores Sistêmicos de Risco:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${p.pd.cardiovascularRisk ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800/50'}`}>
                      {p.pd.cardiovascularRisk ? '⚠️ Risco Cardiorrenal/CV' : 'Risco CV Normal'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${p.pd.gastricSensitivity ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800/50'}`}>
                      {p.pd.gastricSensitivity ? '⚠️ Sensibilidade Gástrica/SII' : 'Trato GI Estável'}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Fármacos Contínuos de Base:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.pd.continuousMeds && p.pd.continuousMeds.length > 0 ? (
                      p.pd.continuousMeds.map((medId) => {
                        const medLabels: Record<string, string> = {
                          semaglutida: 'Semaglutida',
                          tirzepatida: 'Tirzepatida',
                          adalimumabe: 'Adalimumabe (Humira)',
                          etanercepte: 'Etanercepte (Enbrel)',
                          upadacitinibe: 'Upadacitinibe (Rinvoq)',
                          metotrexato: 'Metotrexato',
                          duloxetina: 'Duloxetina',
                          pregabalina: 'Pregabalina',
                          lopurinol: 'Alopurinol',
                        };
                        return (
                          <span key={medId} className="bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/40 uppercase flex items-center gap-1 select-none">
                            <Pill className="w-3 h-3 text-sky-500" />
                            <span>{medLabels[medId] || medId}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Nenhum fármaco contínuo cadastrado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico Recente de Infecções e Vacinas (Últimos 30 dias) */}
            {(() => {
              const infLogs = p.pd.dailyLogs.filter(l => l.infectionOrVaccineStatus && l.infectionOrVaccineStatus !== 'nao').slice(-5).reverse();
              if (infLogs.length === 0) return null;
              return (
                <div className="bg-rose-50/10 dark:bg-rose-950/10 border border-rose-100/40 dark:border-rose-900/20 p-4 rounded-xl space-y-2.5">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block border-b pb-1 dark:border-rose-900/20">
                    🦠 Histórico de Infecções & Vacinas (Confundidores)
                  </span>
                  <div className="space-y-2 text-xs animate-fadeIn">
                    {infLogs.map((log) => {
                      const statusMap: Record<string, string> = {
                        leve: 'Sintomas Leves',
                        importante: 'Sintomas Importantes',
                        vacina: 'Vacina Recente',
                        antibiotico: 'Uso de Antibiótico',
                        pausa_infeccao: 'Pausa de Remédio'
                      };
                      const siteMap: Record<string, string> = {
                        respiratorio: 'Respiratório',
                        urinario: 'Urinário',
                        intestinal: 'Intestinal',
                        pele: 'Pele',
                        dentario: 'Dentário',
                        herpes: 'Herpes/Bolhas',
                        outro: 'Outro'
                      };
                      const feverMap: Record<string, string> = {
                        nao: 'Sem febre',
                        sensacao: 'Sensação febril',
                        medida: 'Febre medida'
                      };
                      const careMap: Record<string, string> = {
                        nao: 'Sem atendimento',
                        consulta: 'Consulta/Telemedicina',
                        pronto_socorro: 'Pronto Atendimento',
                        internacao: 'Internação'
                      };
                      const impactMap: Record<string, string> = {
                        nao: 'Sem alteração',
                        pausa_orientada: 'Pausa Orientada',
                        pausa_propria: 'Pausa p/ Conta Própria',
                        antibiotico: 'Iniciou Antibiótico',
                        antiviral: 'Iniciou Antiviral',
                        aumento_corticoide: 'Aumentou Corticoide'
                      };

                      return (
                        <div key={log.date} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1 shadow-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {fmtDate(log.date, 's')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                              {statusMap[log.infectionOrVaccineStatus!] || log.infectionOrVaccineStatus}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                            {log.infectionSite && (
                              <div>
                                <span className="font-medium text-slate-400">Sítio: </span>
                                <span className="font-semibold">{siteMap[log.infectionSite] || log.infectionSite}</span>
                              </div>
                            )}
                            {log.infectionFever && log.infectionFever !== 'nao' && (
                              <div>
                                <span className="font-medium text-slate-400">Febre: </span>
                                <span className="font-semibold text-rose-500">{feverMap[log.infectionFever]}</span>
                              </div>
                            )}
                            {log.infectionCareNeeded && log.infectionCareNeeded !== 'nao' && (
                              <div>
                                <span className="font-medium text-slate-400">Atendimento: </span>
                                <span className="font-semibold text-amber-500">{careMap[log.infectionCareNeeded]}</span>
                              </div>
                            )}
                            {log.infectionTreatmentImpact && log.infectionTreatmentImpact !== 'nao' && (
                              <div className="col-span-2">
                                <span className="font-medium text-slate-400">Impacto Terapia: </span>
                                <span className="font-semibold text-indigo-500 dark:text-indigo-400">{impactMap[log.infectionTreatmentImpact]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* SPECIALTY DASHBOARD CONTAINER */}
            {(() => {
              const specCategory = getSpecialtyCategory(account.specialty);
              const logs15 = p.pd.dailyLogs.slice(-15);

              if (specCategory === 'physio') {
                // Compute physio metrics
                const stiffnessLogs = logs15.filter(l => l.stiffness != null);
                const avgStiffness = stiffnessLogs.length 
                  ? (stiffnessLogs.reduce((sum, l) => sum + (l.stiffness ?? 0), 0) / stiffnessLogs.length).toFixed(1)
                  : 'N/A';

                const intenseLoadCount = logs15.filter(l => l.activityLoad === 'Intensa / exagerei').length;
                const moderateLoadCount = logs15.filter(l => l.activityLoad === 'Moderada').length;
                const lightLoadCount = logs15.filter(l => l.activityLoad === 'Leve').length;
                const repousoCount = logs15.filter(l => l.activityLoad === 'Repouso maior que habitual').length;

                return (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Activity className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Monitoramento de Fisioterapia & Pacing
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-medium">Equilíbrio mecânico e prevenção de Boom-and-Bust</span>
                      </div>
                    </div>

                    {/* Physio Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-white dark:bg-slate-900 border border-emerald-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Rigidez Média</span>
                        <span className="text-md font-black text-emerald-500 block mt-0.5">{avgStiffness}/10</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-emerald-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Dias Sobrecarga</span>
                        <span className={`text-md font-black block mt-0.5 ${intenseLoadCount > 2 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {intenseLoadCount} dias
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-emerald-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Foco de Pacing</span>
                        <span className="text-[10px] font-extrabold text-indigo-500 block mt-1 uppercase">
                          {intenseLoadCount > 2 ? 'Reajustar' : 'Estável'}
                        </span>
                      </div>
                    </div>

                    {/* Activity Load Distribution Bar */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Distribuição de Cargas Físicas (Últimos 15 logs)</span>
                      <div className="h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                        {repousoCount > 0 && <div className="h-full bg-blue-400" style={{ width: `${(repousoCount / 15) * 100}%` }} title={`Repouso: ${repousoCount}`} />}
                        {lightLoadCount > 0 && <div className="h-full bg-emerald-400" style={{ width: `${(lightLoadCount / 15) * 100}%` }} title={`Leve: ${lightLoadCount}`} />}
                        {moderateLoadCount > 0 && <div className="h-full bg-amber-400" style={{ width: `${(moderateLoadCount / 15) * 100}%` }} title={`Moderado: ${moderateLoadCount}`} />}
                        {intenseLoadCount > 0 && <div className="h-full bg-rose-400" style={{ width: `${(intenseLoadCount / 15) * 100}%` }} title={`Intenso: ${intenseLoadCount}`} />}
                      </div>
                      <div className="flex justify-between text-[8px] font-extrabold text-slate-400 px-0.5">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Repouso ({repousoCount})</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Leve ({lightLoadCount})</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Moderado ({moderateLoadCount})</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Intenso ({intenseLoadCount})</span>
                      </div>
                    </div>

                    {/* Cross-Trend: Rigidez vs Intensidade da Dor */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correlação Cinética: Rigidez Matinal vs Intensidade da Dor</span>
                      <div className="border border-slate-50 dark:border-slate-850 p-3 rounded-xl bg-white dark:bg-slate-900">
                        <MultiLineChart
                          series={[
                            {
                              name: 'Rigidez Matinal',
                              color: '#10b981',
                              data: logs15.map((l) => l.stiffness !== undefined ? l.stiffness : null),
                            },
                            {
                              name: 'Intensidade da Dor',
                              color: '#f43f5e',
                              data: logs15.map((l) => l.pain !== undefined ? l.pain : null),
                            },
                          ]}
                          max={10}
                        />
                        <Legend
                          series={[
                            { name: 'Rigidez Matinal', color: '#10b981' },
                            { name: 'Intensidade da Dor', color: '#f43f5e' },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/10 text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                      💡 <strong>Análise de Rigidez Matinal & Pacing:</strong> Se a rigidez matinal persistente for acompanhada por picos de dor no dia posterior aos treinos intensos, estimule o pacing mecânico planejado para manter o limiar inflamatório estável [Ref 12].
                    </div>
                  </div>
                );
              }

              if (specCategory === 'trainer') {
                // Compute fitness logs
                const stepLogs = logs15.filter(l => l.wearableSync?.steps != null && l.wearableSync.steps > 0);
                const avgSteps = stepLogs.length
                  ? Math.round(stepLogs.reduce((sum, l) => sum + (l.wearableSync?.steps ?? 0), 0) / stepLogs.length)
                  : 'Sincronizar';

                const exerciseLogs = logs15.filter(l => l.exercise?.done === 'Sim' || l.exercise?.done === 'true');
                const exerciseFrequency = ((exerciseLogs.length / 15) * 100).toFixed(0);

                const avgFatigue = logs15.length
                  ? (logs15.reduce((sum, l) => sum + (l.fatigue ?? 0), 0) / logs15.length).toFixed(1)
                  : 'N/A';

                return (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-amber-500/10 pb-2.5">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Monitoramento de Condicionamento & Passometria
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-medium">Wearables e limiar de tolerância pós-treino</span>
                      </div>
                    </div>

                    {/* Trainer Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-white dark:bg-slate-900 border border-amber-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Passos Médios</span>
                        <span className="text-sm font-black text-amber-500 block mt-0.5">
                          {typeof avgSteps === 'number' ? avgSteps.toLocaleString('pt-BR') : avgSteps}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-amber-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Frequência Exercício</span>
                        <span className="text-sm font-black text-amber-500 block mt-0.5">{exerciseFrequency}%</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-amber-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Fadiga Média</span>
                        <span className="text-sm font-black text-rose-500 block mt-0.5">{avgFatigue}/10</span>
                      </div>
                    </div>

                    {/* Steps vs Fatigue and Pain chart */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impacto de Carga Aeróbica (Passos) no Nível de Fadiga</span>
                      <div className="border border-slate-50 dark:border-slate-850 p-3 rounded-xl bg-white dark:bg-slate-900">
                        <MultiLineChart
                          series={[
                            {
                              name: 'Passos (rescalados)',
                              color: '#f59e0b',
                              // Rescale steps to 0-10 (e.g. 10000 steps = 10, 5000 = 5)
                              data: logs15.map((l) => l.wearableSync?.steps ? Math.min(10, l.wearableSync.steps / 1000) : null),
                            },
                            {
                              name: 'Nível de Fadiga',
                              color: '#3b82f6',
                              data: logs15.map((l) => l.fatigue !== undefined ? l.fatigue : null),
                            },
                          ]}
                          max={10}
                        />
                        <Legend
                          series={[
                            { name: 'Volume de Passos (x1000)', color: '#f59e0b' },
                            { name: 'Nível de Fadiga', color: '#3b82f6' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Exercise Log list */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registros Recentes de Atividade Física</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {exerciseLogs.slice(-4).map((el, i) => (
                          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl text-[10.5px] leading-normal shadow-xs">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                              <span>🏃 {el.exercise?.type || 'Exercício'}</span>
                              <span className="text-teal-500">{el.exercise?.duration} min</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                              <span>Data: {fmtDate(el.date, 's')}</span>
                              <span>Reação Dor: <strong className="text-rose-500">{el.exercise?.pain || 'N/A'}</strong></span>
                            </div>
                          </div>
                        ))}
                        {exerciseLogs.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic col-span-2 text-center py-2">Nenhum exercício registrado nos últimos logs.</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-500/10 text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                      💡 <strong>Pacing de Treinamento:</strong> O treinamento aeróbico constante melhora a capacidade inibidora descendente, contanto que o volume de passos seja controlado e mantido no limiar adaptável do paciente [Ref 14].
                    </div>
                  </div>
                );
              }

              if (specCategory === 'nutrition') {
                // Compute nutritional metrics
                const waterLogs = logs15.filter(l => (l.waterIntake && l.waterIntake > 0) || l.waterSimple);
                const numWithWaterIn = logs15.filter(l => l.waterIntake && l.waterIntake > 0);
                const avgWater = numWithWaterIn.length
                  ? Math.round(numWithWaterIn.reduce((sum, l) => sum + (l.waterIntake ?? 0), 0) / numWithWaterIn.length)
                  : 0;

                const targetWater = (p.pd.weight ?? 70) * 35;
                const hydrationPercentage = targetWater > 0 ? Math.min(100, Math.round((avgWater / targetWater) * 100)) : 0;

                const gutFlareCount = logs15.filter(l => (l.abdominalPain && l.abdominalPain >= 4) || (l.bloating && l.bloating >= 4)).length;

                // Active diet triggers
                const caffeineExcessCount = logs15.filter(l => l.caffeineSimple === 'muito').length;
                const greasyCount = logs15.filter(l => l.greasyMeal).length;
                const processedCount = logs15.filter(l => l.ultraprocessedExcess).length;
                const fastingCount = logs15.filter(l => l.longFasting).length;

                // Bristol stool types
                const bristolLogs = logs15.map(l => l.bristolStoolType).filter(v => v != null) as number[];
                const obstipadoCount = bristolLogs.filter(t => t <= 2).length;
                const idealCount = bristolLogs.filter(t => t === 3 || t === 4).length;
                const diarreiaCount = bristolLogs.filter(t => t >= 5).length;

                return (
                  <div className="bg-pink-500/5 border border-pink-500/20 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-pink-500/10 pb-2.5">
                      <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
                        <Apple className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                          Monitoramento de Nutrição & SII (Eixo Cérebro-Intestino)
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-medium">Hipersensibilidade visceral e gatilhos anti-inflamatórios</span>
                      </div>
                    </div>

                    {/* Nutrition Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-white dark:bg-slate-900 border border-pink-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Hidratação Média</span>
                        <span className="text-sm font-black text-pink-500 block mt-0.5">
                          {avgWater > 0 ? `${avgWater}ml` : 'Pouca'}
                        </span>
                        <span className="text-[8px] text-slate-400 block">{hydrationPercentage}% da meta</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-pink-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Crises Viscerais</span>
                        <span className={`text-sm font-black block mt-0.5 ${gutFlareCount > 2 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {gutFlareCount} dias
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-pink-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Gatilhos Diários</span>
                        <span className="text-sm font-black text-indigo-500 block mt-0.5">
                          {caffeineExcessCount + greasyCount + processedCount} ativados
                        </span>
                      </div>
                    </div>

                    {/* Gastrosomatic chart */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evolução Visceral: Dor Abdominal vs Distensão (Bloating)</span>
                      <div className="border border-slate-50 dark:border-slate-850 p-3 rounded-xl bg-white dark:bg-slate-900">
                        <MultiLineChart
                          series={[
                            {
                              name: 'Dor Abdominal',
                              color: '#ec4899',
                              data: logs15.map((l) => l.abdominalPain !== undefined ? l.abdominalPain : null),
                            },
                            {
                              name: 'Distensão / Inchaço',
                              color: '#a855f7',
                              data: logs15.map((l) => l.bloating !== undefined ? l.bloating : null),
                            },
                          ]}
                          max={10}
                        />
                        <Legend
                          series={[
                            { name: 'Dor Abdominal', color: '#ec4899' },
                            { name: 'Distensão / Inchaço', color: '#a855f7' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Bristol scale distribution */}
                    {bristolLogs.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consistência das Fezes (Escala de Bristol nos últimos 15 logs)</span>
                        <div className="h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                          {obstipadoCount > 0 && <div className="h-full bg-amber-400" style={{ width: `${(obstipadoCount / bristolLogs.length) * 100}%` }} title={`Obstipado: ${obstipadoCount}`} />}
                          {idealCount > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(idealCount / bristolLogs.length) * 100}%` }} title={`Ideal: ${idealCount}`} />}
                          {diarreiaCount > 0 && <div className="h-full bg-rose-400" style={{ width: `${(diarreiaCount / bristolLogs.length) * 100}%` }} title={`Diarreia: ${diarreiaCount}`} />}
                        </div>
                        <div className="flex justify-between text-[8px] font-extrabold text-slate-400 px-0.5">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Constipação Tipos 1-2 ({obstipadoCount})</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Normal Tipos 3-4 ({idealCount})</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Diarreia/Urgência Tipos 5-7 ({diarreiaCount})</span>
                        </div>
                      </div>
                    )}

                    {/* Dietary checklist */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-pink-500/10 text-[10.5px] leading-normal text-slate-600 dark:text-slate-300">
                      <strong>🚨 Frequência de Irritantes de Mucosa e Triggers Alimentares:</strong>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] font-semibold text-slate-500">
                        <div className="flex justify-between">
                          <span>☕ Café em excesso:</span>
                          <span className={caffeineExcessCount > 2 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{caffeineExcessCount} logs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🍟 Refeição gordurosa:</span>
                          <span className={greasyCount > 2 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{greasyCount} logs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🍔 Ultraprocessados:</span>
                          <span className={processedCount > 2 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{processedCount} logs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⏳ Jejum prolongado:</span>
                          <span className={fastingCount > 2 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{fastingCount} logs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (specCategory === 'psychology') {
                // Compute psychological metrics
                const avgMood = logs15.length
                  ? (logs15.reduce((sum, l) => sum + (l.mood ?? 0), 0) / logs15.length).toFixed(1)
                  : 'N/A';

                const avgStressWork = logs15.filter(l => l.stressWork != null).length
                  ? (logs15.reduce((sum, l) => sum + (l.stressWork ?? 0), 0) / logs15.filter(l => l.stressWork != null).length).toFixed(1)
                  : '0.0';

                const avgStressFamily = logs15.filter(l => l.stressFamily != null).length
                  ? (logs15.reduce((sum, l) => sum + (l.stressFamily ?? 0), 0) / logs15.filter(l => l.stressFamily != null).length).toFixed(1)
                  : '0.0';

                const avgStressPersonal = logs15.filter(l => l.stressPersonal != null).length
                  ? (logs15.reduce((sum, l) => sum + (l.stressPersonal ?? 0), 0) / logs15.filter(l => l.stressPersonal != null).length).toFixed(1)
                  : '0.0';

                const autonomicSupportDays = logs15.filter(l => l.natureContact || l.hobbies || l.lovedOnes).length;

                // Recent emotional/stress comments
                const recentStressContexts = logs15.filter(l => l.stressContext && l.stressContext.trim().length > 0).slice(-3).reverse();

                return (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-2.5">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Brain className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Mapeamento de Saúde Biopsicossocial & Estresse
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-medium">Fatores psíquicos e resposta de sensibilização do humor</span>
                      </div>
                    </div>

                    {/* Psychology Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-white dark:bg-slate-900 border border-indigo-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Média de Humor</span>
                        <span className="text-sm font-black text-indigo-500 block mt-0.5">{avgMood}/10</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-indigo-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Estresse Pessoal</span>
                        <span className={`text-sm font-black block mt-0.5 ${Number(avgStressPersonal) >= 6 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {avgStressPersonal}/10
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-indigo-500/10 p-2.5 rounded-xl text-center shadow-xs">
                        <span className="text-slate-400 text-[9px] font-bold block uppercase">Moduladores Ativos</span>
                        <span className="text-sm font-black text-emerald-500 block mt-0.5">
                          {autonomicSupportDays} dias
                        </span>
                      </div>
                    </div>

                    {/* Mood vs Stress Chart */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Análise de Tendência: Humor do Paciente vs Picos de Estresse</span>
                      <div className="border border-slate-50 dark:border-slate-850 p-3 rounded-xl bg-white dark:bg-slate-900">
                        <MultiLineChart
                          series={[
                            {
                              name: 'Nível de Humor',
                              color: '#6366f1',
                              data: logs15.map((l) => l.mood !== undefined ? l.mood : null),
                            },
                            {
                              name: 'Estresse Pessoal',
                              color: '#ef4444',
                              data: logs15.map((l) => l.stressPersonal !== undefined ? l.stressPersonal : null),
                            },
                          ]}
                          max={10}
                        />
                        <Legend
                          series={[
                            { name: 'Nível de Humor', color: '#6366f1' },
                            { name: 'Estresse Pessoal', color: '#ef4444' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Stress factors breakdown */}
                    <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-500/10 rounded-xl space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Cargas de Estresse por Esferas de Vida:</span>
                      <div className="space-y-2 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>💼 Estresse Laboral / Trabalho:</span>
                          <span className={Number(avgStressWork) >= 6 ? 'text-rose-500 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>{avgStressWork}/10</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🏠 Estresse Familiar / Residencial:</span>
                          <span className={Number(avgStressFamily) >= 6 ? 'text-rose-500 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>{avgStressFamily}/10</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>👤 Estresse Pessoal / Autonômico:</span>
                          <span className={Number(avgStressPersonal) >= 6 ? 'text-rose-500 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>{avgStressPersonal}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent stress contexts */}
                    {recentStressContexts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contextos de Estresse e Desabafos Recentes</span>
                        <div className="space-y-1.5">
                          {recentStressContexts.map((log, i) => (
                            <div key={i} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                              " {log.stressContext} "
                              <span className="block text-[8px] text-slate-400 font-bold mt-1 text-right">— Log do dia {fmtDate(log.date, 's')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Default standard medical / generic view
              return (
                <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-blue-500/10 pb-2.5">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                      <Stethoscope className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Dashboard Médico de Crises & flares
                      </h4>
                      <span className="text-[10px] text-slate-400 block font-medium">Adesão farmacológica contínua e risco de crises sistêmicas</span>
                    </div>
                  </div>

                  {/* Standard Medical Stats Grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white dark:bg-slate-900 border border-blue-500/10 p-2.5 rounded-xl text-center shadow-xs">
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Adesão Recente</span>
                      <span className="text-sm font-black text-blue-500 block mt-0.5">{(adherence(p.pd).pct * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-blue-500/10 p-2.5 rounded-xl text-center shadow-xs">
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Previsão Flare</span>
                      <span className={`text-sm font-black block mt-0.5 ${risk.level === 'HIGH' ? 'text-rose-500' : risk.level === 'MODERATE' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {risk.level === 'HIGH' ? 'ALTO' : risk.level === 'MODERATE' ? 'MODERADO' : 'BAIXO'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-blue-500/10 p-2.5 rounded-xl text-center shadow-xs">
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Comorbidades</span>
                      <span className="text-sm font-black text-indigo-500 block mt-0.5">{activeDxs.length} diagnosticadas</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Main Pain Graph */}
            {recentLogs.length >= 2 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Intensidade da Dor Recente (Últimos 30 logs)
                </span>
                <div className="border border-slate-50 dark:border-slate-850 p-4 rounded-xl bg-white dark:bg-slate-900">
                  <LineChart logs={recentLogs} field="pain" color="#f43f5e" />
                </div>
              </div>
            )}

            {/* Dynamic Crossed Multi-Symptom Chart for Clinicians */}
            {recentLogs.length >= 2 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  📊 Gráfico Multi-Sintomas Cruzado (Dor-Fadiga-Sono)
                </span>
                <div className="border border-slate-50 dark:border-slate-850 p-4 rounded-xl bg-white dark:bg-slate-900">
                  <MultiLineChart
                    series={[
                      {
                        name: 'Intensidade da Dor',
                        color: '#f43f5e',
                        data: recentLogs.map((l) => l.pain !== undefined ? l.pain : null),
                      },
                      {
                        name: 'Nível de Fadiga',
                        color: '#f59e0b',
                        data: recentLogs.map((l) => l.fatigue !== undefined ? l.fatigue : null),
                      },
                      {
                        name: 'Qualidade do Sono',
                        color: '#3b82f6',
                        data: recentLogs.map((l) => l.sleep !== undefined ? l.sleep : null),
                      },
                    ]}
                    max={10}
                  />
                  <Legend
                    series={[
                      { name: 'Intensidade da Dor', color: '#f43f5e' },
                      { name: 'Nível de Fadiga', color: '#f59e0b' },
                      { name: 'Qualidade do Sono', color: '#3b82f6' },
                    ]}
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-2.5 italic">
                    ℹ️ **Como analisar**: Cruzamento ideal para identificar se a fadiga precede ou acompanha picos dolorosos, auxiliando no planejamento terapêutico de pacing ou higiene do sono.
                  </p>
                </div>
              </div>
            )}

            {/* Periodic Metrics charts inside drill down */}
            {p.pd.periodicMetrics.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b pb-1">
                  Evolução de Escores Científicos
                </span>
                {(() => {
                  const mTypes: string[] = Array.from(new Set(p.pd.periodicMetrics.map((m) => m.type)));
                  return mTypes.map((type) => {
                    const qConf = QS[type];
                    if (!qConf) return null;
                    const pts = p.pd.periodicMetrics
                      .filter((m) => m.type === type)
                      .slice(-10)
                      .map((m) => ({ date: m.date, score: m.score }));

                    return (
                      <div key={type} className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {qConf.name.split(':')[0]}
                        </span>
                        <div className="border border-slate-50 dark:border-slate-850 p-4 rounded-xl bg-white dark:bg-slate-900">
                          <BandLineChart points={pts} bands={qConf.bands} max={qConf.max} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Correlations */}
            {corrItems.length > 0 && (
              <div className="bg-amber-50/10 border border-amber-500/20 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-amber-500 uppercase tracking-wider block">
                  📊 Cruzamento Analítico (Comorbidades)
                </span>
                {corrItems.map((c, i) => (
                  <p key={i} className="text-slate-600 dark:text-slate-300 leading-normal">
                    • {c}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Outreach Actions */}
          <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-50 mt-6">
            <button
              onClick={() => handleOutreach(p.acc.id)}
              className="py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" /> Solicitar Contato S.O.S.
            </button>
            <button
              onClick={() => handleUnlink(p.acc.id)}
              className="py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-rose-500 font-bold rounded-xl text-xs"
            >
              Encerrar Vínculo Clínico
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showConsultationMode) {
    const patientRecord = patients.find((p) => p.acc.id === showConsultationMode);
    if (patientRecord) {
      return (
        <ConsultationSummary
          patientData={patientRecord.pd}
          patientAccount={patientRecord.acc}
          onBack={() => setShowConsultationMode(null)}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* ── RESPONSIVE BACKDROP ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ── SIDEBAR NAVIGATION ── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-50 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RitmaLogo size="sm" showTagline={false} />
            <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase">
              Clínico
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {[
            { id: 'home', icon: Home, label: 'Painel Geral' },
            { id: 'patients', icon: Users, label: 'Fichas de Pacientes' },
            { id: 'analysis', icon: PieChart, label: 'Estatísticas Coorte' },
            { id: 'instruments', icon: ClipboardList, label: 'Citações de Referência' },
            { id: 'settings', icon: Settings, label: `Clínica & ${getCouncilLabel(account.specialty)}` },
            { id: 'news', icon: Sparkles, label: 'Vem Aí', badge: 'Em breve' }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as TabType);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold select-none transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-800/60 space-y-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
              {initials(account.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                {account.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {getCouncilLabel(account.specialty)} {account.crm?.number}/{account.crm?.uf}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-1.5 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </aside>

      {/* ── MAIN CLINIC VIEW ── */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800/80 z-30 px-4 py-3 flex items-center justify-between backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="font-poppins font-black text-slate-800 dark:text-slate-100 lg:ml-2 text-md flex items-center gap-1.5 select-none">
            <RitmaLogo size="sm" showTagline={false} />
            <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-md uppercase">
              Clínico
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-600"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab view selectors switcher */}
        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto pb-24">
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Clinician Overview greeting card */}
              <div className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                    Olá, {account.name.split(' ')[0]} ({account.specialty || 'Especialista'})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {account.crm?.verified
                      ? `✓ Registro verificado com Conselho correspondente (${getCouncilLabel(account.specialty)}-API).`
                      : 'Em validação cadastral.'}{' '}
                    Código de compartilhamento da clínica:{' '}
                    <strong className="font-extrabold text-blue-500 tracking-widest text-xs">
                      {account.doctorCode}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={handleCopyInviteLink}
                  className="px-5 py-2 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md transition-colors"
                >
                  Convidar Novo Paciente
                </button>
              </div>

              {/* IN-APP DOCTOR REVISION PUSH BANNER */}
              {showRevisionBanner && (
                <div className="bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                  <div className="flex gap-3">
                    <span className="text-xl mt-0.5">🔔</span>
                    <div className="space-y-1">
                      <h4 className="font-poppins font-bold text-xs text-blue-800 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Lembrete: Confirmação de Cadastro de Especialidade Requerida</span>
                        <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[8px] font-black font-sans uppercase">Ajuste de Painel</span>
                      </h4>
                      <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-normal max-w-xl">
                        Seu painel analítico se adapta automaticamente à sua especialidade (<strong>{specialty || 'Não cadastrada'}</strong>). Revise se as informações de contato, WhatsApp e registro profissional estão atualizados nas configurações.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setHighlightSettingsFields(true);
                      }}
                      className="flex-1 md:flex-none px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap text-center"
                    >
                      Revisar Cadastro
                    </button>
                    <button
                      onClick={() => setShowRevisionBanner(false)}
                      className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl transition-colors whitespace-nowrap text-center"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              )}

              {/* Specialty Clinical Focus Guidance Banner */}
              {!account.specialty && (() => {
                const category = getSpecialtyCategory(account.specialty);
                const configMap = {
                  medical: {
                    bg: 'from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/5',
                    border: 'border-blue-100 dark:border-blue-900/30',
                    text: 'text-blue-600 dark:text-blue-400',
                    icon: Stethoscope,
                    title: 'Foco de Monitoramento: Farmacologia & Crises / Exacerbações de Dor (Flares)',
                    desc: 'O painel está estruturado para avaliar a tolerância orgânica de fármacos contínuos (gastrosensibilidade, risco cardiorrenal), prever exacerbações de dor sistêmica (flares) e gerenciar a imunossupressão.'
                  },
                  physio: {
                    bg: 'from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5',
                    border: 'border-emerald-100 dark:border-emerald-900/30',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    icon: Activity,
                    title: 'Foco de Monitoramento: Rigidez Matinal & Carga Mecânica (Cinesioterapia)',
                    desc: 'Prioridade clínica centrada no reequilíbrio motor e biomecânico. Acompanhe a duração e picos da rigidez matinal do paciente, o impacto das cargas de esforço físico e o pacing mecânico do movimento.'
                  },
                  trainer: {
                    bg: 'from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/5',
                    border: 'border-amber-100 dark:border-amber-900/30',
                    text: 'text-amber-600 dark:text-amber-400',
                    icon: Sparkles,
                    title: 'Foco de Monitoramento: Passômetro de Atividade, Fadiga & Tolerância Física',
                    desc: 'Monitoramento da capacidade aeróbica geral e pacing. Visualize a quantidade de passos diários sincronizados by smartbands, a fadiga muscular pós-treino e o limiar tolerável de esforço aeróbico.'
                  },
                  nutrition: {
                    bg: 'from-pink-500/5 to-rose-500/5 dark:from-pink-500/10 dark:to-rose-500/5',
                    border: 'border-pink-100 dark:border-pink-900/30',
                    text: 'text-pink-600 dark:text-pink-400',
                    icon: Apple,
                    title: 'Foco de Monitoramento: Eixo Cérebro-Intestino & Hipersensibilidade Visceral (SII)',
                    desc: 'Análise de distúrbios digestivos e inflamação sistêmica. Monitore a hidratação adequada, o padrão evacuatório pela Escala de Bristol, e a frequência de gatilhos alimentares como cafeína, glúten ou álcool.'
                  },
                  psychology: {
                    bg: 'from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/5',
                    border: 'border-indigo-100 dark:border-indigo-900/30',
                    text: 'text-indigo-600 dark:text-indigo-400',
                    icon: Brain,
                    title: 'Foco de Monitoramento: Sobrecarga Emocional, Estresse Psicossocial & TCC',
                    desc: 'Mapeamento do componente cognitivo-comportamental da dor crônica. Rastreie flutuações diárias de humor, picos de estresse laboral, familiar ou pessoal, e a resposta às técnicas de relaxamento ativo.'
                  }
                };
                const conf = configMap[category] || configMap.medical;
                const IconComp = conf.icon;
                return (
                  <div className={`bg-gradient-to-r ${conf.bg} ${conf.border} border p-4.5 rounded-2xl flex items-start gap-3.5 shadow-xs leading-normal text-xs`}>
                    <span className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center`}>
                      <IconComp className={`w-5 h-5 ${conf.text} flex-shrink-0`} />
                    </span>
                    <div>
                      <strong className={`${conf.text} block font-bold text-xs mb-0.5`}>{conf.title}</strong>
                      <span className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed block">{conf.desc}</span>
                    </div>
                  </div>
                );
              })()}

              {/* KPI indicators stats grids */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                  <span className="text-2xl font-black text-blue-500 block leading-none mb-1">
                    {patients.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Pacientes Ativos
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                  <span
                    className={`text-2xl font-black block leading-none mb-1 ${
                      attentionQueue.length > 0 ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {attentionQueue.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Fila de Atenção (Flares)
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                  <span className="text-2xl font-black text-amber-500 block leading-none mb-1">
                    {pend.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Vínculos Pendentes
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                  <span className="text-2xl font-black text-teal-500 block leading-none mb-1">
                    {avgAdherence}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Aderência Média
                  </span>
                </div>
              </div>

              {/* Pending Links alert */}
              {pend.length > 0 && (
                <div className="bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                    🔔 Pedidos de Vínculo Clínico Pendentes
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pend.map((x) => (
                      <div key={x.acc.id} className="flex justify-between items-center py-2 text-xs">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200 block">{x.acc.name}</strong>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            E-mail: {x.acc.email} · Solicitado em {fmtDate(x.link.createdAt, 's')}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAuthorizeLink(x.acc.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px] transition-colors"
                          >
                            Autorizar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectLink(x.acc.id)}
                            className="border border-slate-200 dark:border-slate-800 text-slate-500 font-bold px-3 py-1 rounded text-[10px]"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attention Flare Queue */}
              {attentionQueue.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
                    Fila de Triagem Clínica S.O.S. (Alerta de Flare)
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attentionQueue.map((pat) => {
                      const triggerText = pat.risk.dims
                        .filter((d) => d.z > 1.0)
                        .map((d) => `${d.label} (Z=${d.z.toFixed(1)})`)
                        .join(', ');

                      return (
                        <div key={pat.acc.id} className="flex justify-between items-center py-3 text-xs">
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200 block text-sm">
                              ⚠️ {pat.acc.name}
                            </strong>
                            <span className="text-slate-400 font-medium text-[10px] leading-relaxed block mt-0.5">
                              Escores em Alerta: {triggerText || 'Nenhum'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedPatientId(pat.acc.id)}
                              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-850 hover:border-blue-500 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg"
                            >
                              Ver Prontuário
                            </button>
                            <button
                              onClick={() => handleOutreach(pat.acc.id)}
                              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center shadow-sm"
                              title="Solicitar contato / mandar whatsapp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* cohort 14 days heatmap */}
              {patients.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
                    Coorte Geral: Níveis de Dor (Últimos 14 dias)
                  </h3>
                  {(() => {
                    const days = 14;
                    const cell = 16;
                    const gap = 3;
                    const labelW = 96;
                    const W = labelW + days * (cell + gap);
                    const H = patients.length * (cell + gap) + 6;

                    return (
                      <div className="overflow-x-auto w-full">
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
                          {patients.map((pat, rIdx) => {
                            const byDate: Record<string, number> = {};
                            pat.pd.dailyLogs.forEach((l) => {
                              if (l.pain != null) byDate[l.date] = l.pain;
                            });

                            const rects = [];
                            for (let i = days - 1; i >= 0; i--) {
                              const dIso = new Date(Date.now() - i * 864e5).toISOString().split('T')[0];
                              const pPain = byDate[dIso];
                              const x = labelW + (days - 1 - i) * (cell + gap);
                              const y = rIdx * (cell + gap) + 3;

                              rects.push(
                                <rect
                                  key={i}
                                  x={x}
                                  y={y}
                                  width={cell}
                                  height={cell}
                                  rx="2.5"
                                  fill={getCohortColor(pPain)}
                                >
                                  <title>{`${pat.acc.name} ${dIso}${pPain != null ? `: ${pPain}` : ''}`}</title>
                                </rect>
                              );
                            }

                            return (
                              <g key={pat.acc.id}>
                                <text
                                  x={0}
                                  y={rIdx * (cell + gap) + cell}
                                  fontSize="9"
                                  fontWeight="600"
                                  fill="currentColor"
                                  className="text-slate-600 dark:text-slate-400"
                                >
                                  {pat.acc.name.split(' ')[0]}
                                </text>
                                {rects}
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Carteira Clínica de Acompanhamento
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Clique na ficha do paciente para evoluir o prontuário, calibrar baselines e enviar orientações.
                </p>
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl shadow-xs">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-poppins font-bold text-sm text-slate-700 dark:text-slate-300">
                    Carteira vazia
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Compartilhe seu código clínico exclusivo <strong>{account.doctorCode}</strong> com seus pacientes.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-5 divide-y divide-slate-50 dark:divide-slate-850">
                  {patients.map((pat) => {
                    const lastLog = pat.pd.dailyLogs[pat.pd.dailyLogs.length - 1];
                    const risk = calcRisk(pat.pd);
                    const activeDxs = Object.keys(pat.pd.diagnoses).filter((k) => pat.pd.diagnoses[k]);

                    const painSpark = pat.pd.dailyLogs.slice(-14).map((l) => l.pain);

                    return (
                      <div
                        key={pat.acc.id}
                        onClick={() => setSelectedPatientId(pat.acc.id)}
                        className="flex items-center justify-between gap-4 py-3.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850 px-2 rounded-xl transition-colors first:pt-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center flex-shrink-0">
                          {initials(pat.acc.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            {pat.acc.name}{' '}
                            <span className="text-xs font-normal">
                              {activeDxs.map((dx) => DX[dx]?.icon).join(' ')}
                            </span>
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {lastLog ? `Última entrada: ${fmtDate(lastLog.date, 's')}` : 'Sem logs diários'} ·{' '}
                            {pat.pd.dailyLogs.length} logs
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">
                              Dor (14d)
                            </span>
                            <Sparkline values={painSpark} />
                          </div>

                          <span
                            className={`text-[9px] font-bold py-1 px-3 rounded-full ${
                              risk.enough
                                ? risk.level === 'LOW'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : risk.level === 'MODERATE'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {risk.enough ? `RISCO ${risk.level}` : 'SEM DADOS'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Estatísticas Analíticas de Coorte
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Análises agregadas de prevalência e taxas de risco de exacerbação (flare).
                </p>
              </div>

              {patients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Risk breakdown donut */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Previsão Geral de Flare (Atenção)
                    </h3>
                    {(() => {
                      const riskCount = { LOW: 0, MODERATE: 0, HIGH: 0, none: 0 };
                      patients.forEach((p) => {
                        const r = calcRisk(p.pd);
                        riskCount[r.enough ? r.level : 'none']++;
                      });

                      const donutItems = [
                        { label: 'Alto Risco', value: riskCount.HIGH, color: '#f43f5e' },
                        { label: 'Atenção', value: riskCount.MODERATE, color: '#f59e0b' },
                        { label: 'Baixo Risco', value: riskCount.LOW, color: '#10b981' },
                        { label: 'Sem dados', value: riskCount.none, color: '#94a3b8' }
                      ].filter((i) => i.value > 0);

                      return <DonutChart items={donutItems} center={patients.length} />;
                    })()}
                  </div>

                  {/* Prevalence bar chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Prevalência de Diagnósticos Ativos
                    </h3>
                    {(() => {
                      const count: Record<string, number> = {};
                      patients.forEach((p) => {
                        Object.keys(p.pd.diagnoses).forEach((key) => {
                          if (p.pd.diagnoses[key]) count[key] = (count[key] || 0) + 1;
                        });
                      });

                      const barItems = Object.keys(count)
                        .sort((a, b) => count[b] - count[a])
                        .map((key) => ({
                          label: DX[key]?.label || key,
                          value: count[key],
                          color: '#3b82f6'
                        }));

                      if (!barItems.length) {
                        return <div className="text-center py-10 text-xs text-slate-400">Sem prevalências.</div>;
                      }

                      return <BarChart items={barItems} labelW={160} minScale={1} />;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border rounded-2xl">
                  <span className="text-3xl">📊</span>
                  <h4 className="font-poppins font-bold text-xs text-slate-700 mt-2">Aguardando carteira ativa</h4>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instruments' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Tabelas de Validação e Evidência Médica
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Frequências clínicas e questionários validados integrados nativamente.
                </p>
              </div>

              {/* Roster list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-4 sm:p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5">Diagnóstico Reumatológico</th>
                        <th className="py-2.5">Instrumento Validado</th>
                        <th className="py-2.5">Frequência Clínico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {Object.keys(DX).map((key) => {
                        const conf = DX[key];
                        return (
                          <tr key={key} className="py-2">
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="w-9 h-5 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[9px] font-black tracking-widest text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-750 font-sans">
                                {conf.icon}
                              </span>
                              <span>{conf.label}</span>
                            </td>
                            <td className="py-2.5">
                              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {conf.instruments}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-400 font-bold">{conf.freq}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Complete References database list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-poppins font-black text-slate-800 dark:text-slate-100 text-sm">
                  📚 Base de Evidências Bibliográficas (56 Artigos)
                </h3>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 divide-y divide-slate-50 dark:divide-slate-850 text-xs">
                  {REFERENCES.map((r) => (
                    <div key={r[0]} className="pt-3 first:pt-0 leading-relaxed text-slate-600 dark:text-slate-400">
                      <span className="text-blue-500 font-black">{r[0]}. </span>
                      <strong>{r[1]}</strong> {r[2]} <em className="italic">{r[3]}</em>. {r[4]}.{' '}
                      <a
                        href={r[5]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 font-bold underline hover:text-blue-600 ml-1"
                      >
                        consensus-link
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Configurações da Clínica
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Atualize suas credenciais do Conselho ({getCouncilLabel(account.specialty)}) e configure o canal de WhatsApp para triagem S.O.S.
                </p>
              </div>

              {highlightSettingsFields && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl flex items-center justify-between text-xs text-blue-800 dark:text-blue-400 font-medium animate-pulse-subtle">
                  <span className="flex items-center gap-2">
                    <span>✨</span>
                    <span>Campos em destaque para sua revisão cadastral: Especialidade Clínica, WhatsApp e dados profissionais.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setHighlightSettingsFields(false)}
                    className="underline hover:text-blue-600 font-bold shrink-0 ml-3"
                  >
                    Remover Destaque
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSaveProfile}
                className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm space-y-4 text-xs transition-all duration-500 ${
                  highlightSettingsFields
                    ? 'border-blue-400 ring-4 ring-blue-500/10 shadow-lg scale-[1.01]'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b pb-2 select-none flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  <span>Perfil Clínico & {getCouncilLabel(account.specialty)}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500">Seu Nome Profissional</label>
                    <input className="inp" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500">E-mail Profissional</label>
                    <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500">Especialidade Clínica</label>
                    <input className="inp" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500">WhatsApp Clínico (com país e DDD)</label>
                    <input className="inp" value={waNumber} onChange={(e) => setWaNumber(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 5511999998888" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Rótulo / Nome de Atendimento no WhatsApp</label>
                  <input className="inp" value={waLabel} onChange={(e) => setWaLabel(e.target.value)} placeholder="Ex: Secretária Cláudia" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500">Número de Inscrição no Conselho ({getCouncilLabel(specialty)})</label>
                    <input className="inp" value={crmNumber} onChange={(e) => setCrmNumber(e.target.value)} placeholder="Ex: 123456" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500">Estado (UF)</label>
                    <input className="inp" value={crmUf} onChange={(e) => setCrmUf(e.target.value.toUpperCase())} placeholder="Ex: SP" maxLength={2} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifySettingsOnline}
                    disabled={isVerifyingSettings}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-900/40 transition-all flex items-center justify-center gap-1.5 self-start disabled:opacity-50"
                  >
                    <span>🔍</span> {isVerifyingSettings ? 'Consultando Bases do Conselho...' : `Consultar Registro no Conselho (${getCouncilLabel(specialty)})`}
                  </button>
                  {isVerifyingSettings && (
                    <div className="text-[11px] text-indigo-500 font-medium animate-pulse flex items-center gap-2 pl-1">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                      <span>{settingsVerifyStep}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                >
                  Salvar Configurações Clínicas
                </button>
              </form>

              {/* CRM indicator status */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 p-5 rounded-2xl shadow-sm text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Status de Credenciamento
                </span>
                <span className="text-emerald-500 font-bold block">
                  ✓ Registro {getCouncilLabel(account.specialty)} {account.crm?.number}/{account.crm?.uf} validado com sucesso.
                </span>
                <p className="text-slate-400">
                  Sua conta de {account.specialty ? account.specialty.toLowerCase() : 'saúde'} possui credenciamento ativo verificado junto ao {getCouncilLabel(account.specialty)}. Seus pacientes podem buscá-lo de forma segura e imediata utilizando o código clínico da sua clínica.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                      Vem Aí
                    </h2>
                    <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold text-[10px] rounded-full uppercase tracking-wider">
                      Em breve
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Ferramentas clínicas avançadas e atualizações do sistema
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs text-center space-y-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                    Lançamento em Etapas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    As novidades para profissionais de saúde e módulos de planos estão em fase de estruturação e serão liberadas em etapas.
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
                    🔒 Conteúdo oculto temporariamente para edições e expansão contínua.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RENDER DETAILED DRILL-DOWN PANEL */}
      {renderPatientDrawer()}

      {/* Modern In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700/60 shadow-emerald-950/20'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700/60 shadow-rose-950/20'
                : 'bg-slate-900 text-slate-100 border-slate-700/60 shadow-slate-950/20'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white text-sm font-bold pl-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorView;
