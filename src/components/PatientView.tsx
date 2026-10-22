/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Account, ChronosData, DailyLog, PeriodicMetric, MedicationConfig, ScheduledEventConfig } from '../types';
import {
  DX,
  REFERENCES,
  QS
} from '../data';
import {
  todayISO,
  fmtDate,
  calcRisk,
  adherence,
  genInsights,
  olderThan,
  initials,
  triggerDelta,
  calcBaseline,
  pearsonCorr,
  painClass,
  getCouncilLabel,
  generateAITip
} from '../utils';
import {
  LineChart,
  MultiLineChart,
  BarChart,
  DonutChart,
  ProgressRing,
  ScatterPlot,
  CalendarHeatmap,
  Legend
} from './Charts';
import { RechartsDashboard } from './RechartsDashboard';
import {
  ResponsiveContainer,
  ComposedChart,
  Line as RechartsLine,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  Area
} from 'recharts';
import { PatientDiary } from './PatientDiary';
import { MedicationEditor } from './MedicationEditor';
import { PatientMetrics } from './PatientMetrics';
import { MentalHealthSupport } from './MentalHealthSupport';
import { Achievements } from './Achievements';
import { GeminiAnalyses } from './GeminiAnalyses';
import { ThemeToggle } from './ThemeToggle';
import { RitmaLogo } from './RitmaLogo';
import { FilterLogs } from './FilterLogs';
import { CorrelationViewer } from './CorrelationViewer';
import { BodyPainMap } from './BodyPainMap';
import { FoodDiary } from './FoodDiary';
import { TipOfTheDay } from './TipOfTheDay';
import { SettingsPanel } from './SettingsPanel';
import { Onboarding, OnboardingCompletedData } from './Onboarding';
import {
  Home,
  BookOpen,
  LineChart as ChartIcon,
  ShieldAlert,
  BrainCircuit,
  UserCheck,
  Bell,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  Check,
  Smartphone,
  Info,
  Printer,
  Copy,
  ClipboardCheck,
  ClipboardList,
  Watch,
  Heart,
  Moon,
  Calendar,
  RefreshCw,
  Droplet,
  Apple,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Scale,
  Pill,
  Stethoscope,
  Activity,
  Trees,
  Brain,
  User,
  BellRing,
  Volume2,
  Trophy,
  Sparkles,
  Sliders,
  Award,
  BarChart2
} from 'lucide-react';
import { DevicesHub } from './DevicesHub';

interface PatientViewProps {
  data: ChronosData;
  account: Account;
  onLogout: () => void;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  onManualCloudSync?: () => Promise<boolean>;
}

type TabType = 'home' | 'diary' | 'medications' | 'bodymap' | 'fooddiary' | 'metrics' | 'charts' | 'alert' | 'mood' | 'doctor' | 'notif' | 'report' | 'settings' | 'devices' | 'hydration' | 'achievements' | 'geminianalysis' | 'news';

let audioCtx: AudioContext | null = null;
const playAlarmSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    // Beat 1
    const osc1 = audioCtx.createOscillator();
    const gainNode1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5 note
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc1.connect(gainNode1);
    gainNode1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Beat 2
    const osc2 = audioCtx.createOscillator();
    const gainNode2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.2); // C6 note
    gainNode2.gain.setValueAtTime(0, now + 0.2);
    gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.25);
    gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gainNode2);
    gainNode2.connect(audioCtx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.error("Failed to play alarm sound:", err);
  }
};

export const PatientView: React.FC<PatientViewProps> = ({
  data,
  account,
  onLogout,
  onUpdateData,
  cloudSyncStatus = 'synced',
  onManualCloudSync
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showSiiOverride, setShowSiiOverride] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRefsModal, setShowRefsModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [chartsSubTab, setChartsSubTab] = useState<'recharts' | 'classic' | 'sensibilidade' | 'logs'>('recharts');

  const handleOnboardingModalComplete = (
    diagnoses: Record<string, boolean>,
    hormone: boolean,
    fullData?: OnboardingCompletedData
  ) => {
    onUpdateData((prev) => {
      const acc = prev.accounts.find((a) => a.id === account.id);
      if (acc) {
        if (fullData?.name) acc.name = fullData.name;
        if (fullData?.gender) acc.gender = fullData.gender;
        if (fullData?.reminderOptIn !== undefined) acc.reminderOptIn = fullData.reminderOptIn;
      }

      const pData = prev.patientData[account.id];
      if (pData) {
        pData.diagnoses = diagnoses;
        pData.hormoneRelevant = hormone;
        if (fullData) {
          pData.gender = fullData.gender;
          pData.birthDate = fullData.birthDate;
          pData.height = fullData.height;
          pData.weight = fullData.weight;
          pData.painBaseline = fullData.painBaseline;
          pData.sleepBaselineHours = fullData.sleepBaselineHours;
          pData.fatigueBaseline = fullData.fatigueBaseline;
          pData.continuousMeds = fullData.continuousMeds;
          pData.cardiovascularRisk = fullData.cardiovascularRisk;
          pData.gastricSensitivity = fullData.gastricSensitivity;
        }
      }
    });

    setShowOnboardingModal(false);
  };
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [hoveredLog, setHoveredLog] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [pinnedCoverParams, setPinnedCoverParams] = useState<string[]>(['pain', 'fatigue', 'sleep', 'function']);
  const [coverTimeRange, setCoverTimeRange] = useState<number>(30);

  const toggleCoverParam = (paramKey: string) => {
    setPinnedCoverParams((prev) =>
      prev.includes(paramKey)
        ? prev.filter((p) => p !== paramKey)
        : [...prev, paramKey]
    );
  };

  const [showScientificMetrics, setShowScientificMetrics] = useState(() => {
    try {
      const stored = localStorage.getItem('chronos_show_scientific');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const handleToggleScientificMetrics = (val: boolean) => {
    setShowScientificMetrics(val);
    try {
      localStorage.setItem('chronos_show_scientific', String(val));
    } catch (e) {}
  };

  const pd = data.patientData[account.id];

  const [medicationReminderPush, setMedicationReminderPush] = useState(account.medicationReminderPush ?? true);

  // Alarms / Despertador System
  const [activeAlarm, setActiveAlarm] = useState<MedicationConfig | null>(null);
  const [dismissedAlarms, setDismissedAlarms] = useState<Record<string, string>>({}); // id -> date string (YYYY-MM-DD)
  const [snoozedAlarms, setSnoozedAlarms] = useState<Record<string, number>>({}); // id -> timestamp when snooze expires

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const timeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
      const nowTimestamp = now.getTime();

      const meds = pd?.medications ?? [];
      
      if (!medicationReminderPush) return;

      for (const med of meds) {
        if (!med.reminderActive || !med.scheduleTime) continue;

        // Check if snoozed
        const snoozeUntil = snoozedAlarms[med.id];
        if (snoozeUntil && nowTimestamp < snoozeUntil) {
          continue; // Still snoozed
        }

        // Check if already dismissed today
        const dismissedDate = dismissedAlarms[med.id];
        if (dismissedDate === todayStr && !snoozeUntil) {
          continue; // Already dismissed today and not snoozed
        }

        // Check if time matches or if snooze expired
        const isTimeMatch = med.scheduleTime === timeStr;
        const isSnoozeExpired = snoozeUntil && nowTimestamp >= snoozeUntil;

        if ((isTimeMatch && dismissedDate !== todayStr) || isSnoozeExpired) {
          setActiveAlarm(med);
          break; // Show one alarm at a time
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pd?.medications, dismissedAlarms, snoozedAlarms, medicationReminderPush]);

  useEffect(() => {
    let soundInterval: NodeJS.Timeout | null = null;
    if (activeAlarm) {
      playAlarmSound();
      soundInterval = setInterval(() => {
        playAlarmSound();
      }, 2000);
    }
    return () => {
      if (soundInterval) clearInterval(soundInterval);
    };
  }, [activeAlarm]);

  const handleSnooze = (medId: string) => {
    const fiveMinutesLater = Date.now() + 5 * 60 * 1000;
    setSnoozedAlarms(prev => ({ ...prev, [medId]: fiveMinutesLater }));
    setActiveAlarm(null);
  };

  const handleDismiss = (medId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDismissedAlarms(prev => ({ ...prev, [medId]: todayStr }));
    setSnoozedAlarms(prev => {
      const copy = { ...prev };
      delete copy[medId];
      return copy;
    });
    setActiveAlarm(null);
  };

  const handleTakeMedicationNow = (med: MedicationConfig) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        const todayStr = new Date().toISOString().split('T')[0];
        let todayLog = profile.dailyLogs.find((l) => l.date === todayStr);
        if (!todayLog) {
          todayLog = {
            date: todayStr,
            pain: null,
            fatigue: null,
            sleep: null,
            function: null,
            mood: null,
            medicationAdherence: {},
            forgotMedication: false,
          };
          profile.dailyLogs.push(todayLog);
        }
        if (!todayLog.medicationAdherence) {
          todayLog.medicationAdherence = {};
        }
        todayLog.medicationAdherence[med.name] = 'taken';
        todayLog.forgotMedication = Object.values(todayLog.medicationAdherence).includes('forgotten');
      }
    });
    handleDismiss(med.id);
  };

  // Form Fields
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [gender, setGender] = useState(account.gender || '');
  const [hormoneRelevant, setHormoneRelevant] = useState(data.patientData[account.id]?.hormoneRelevant ?? false);
  const [reminderOptIn, setReminderOptIn] = useState(account.reminderOptIn ?? false);

  // In-app interactive push notification banner for data review
  const [showRevisionBanner, setShowRevisionBanner] = useState(true);
  const [highlightSettingsFields, setHighlightSettingsFields] = useState(false);

  // Static/Fixed profile states
  const [height, setHeight] = useState<number | ''>(data.patientData[account.id]?.height ?? '');
  const [profileWeight, setProfileWeight] = useState<number | ''>(data.patientData[account.id]?.weight ?? 70);
  const [birthDate, setBirthDate] = useState<string>(data.patientData[account.id]?.birthDate ?? '');
  const [cardiovascularRisk, setCardiovascularRisk] = useState<boolean>(data.patientData[account.id]?.cardiovascularRisk ?? false);
  const [gastricSensitivity, setGastricSensitivity] = useState<boolean>(data.patientData[account.id]?.gastricSensitivity ?? false);
  const [continuousMeds, setContinuousMeds] = useState<string[]>(data.patientData[account.id]?.continuousMeds ?? []);
  const [painBaseline, setPainBaseline] = useState<number>(data.patientData[account.id]?.painBaseline ?? 3);
  const [sleepBaselineHours, setSleepBaselineHours] = useState<number>(data.patientData[account.id]?.sleepBaselineHours ?? 7);
  const [fatigueBaseline, setFatigueBaseline] = useState<number>(data.patientData[account.id]?.fatigueBaseline ?? 4);

  // Wearables Integration States
  const [connectedDevices, setConnectedDevices] = useState<string[]>(['Apple Health']);
  const [syncingState, setSyncingState] = useState<'idle' | 'connecting' | 'fetching' | 'processing' | 'done'>('idle');
  const [syncProgress, setSyncProgress] = useState('');
  const [activeWearableSubTab, setActiveWearableSubTab] = useState<'dashboard' | 'connect'>('dashboard');
  const [connectingDeviceName, setConnectingDeviceName] = useState<string | null>(null);
  const [selectedCorrelation, setSelectedCorrelation] = useState<'hrv-pain' | 'sleep-fatigue' | 'steps-pain'>('hrv-pain');
  const [importingState, setImportingState] = useState<'idle' | 'dragging' | 'loading' | 'success'>('idle');
  const [importedFileName, setImportedFileName] = useState('');
  const [waterAppConnected, setWaterAppConnected] = useState<boolean>(false);
  const [syncingWater, setSyncingWater] = useState<boolean>(false);
  const [showBristolExplanation, setShowBristolExplanation] = useState<boolean>(false);

  const handleSyncWearables = () => {
    setSyncingState('connecting');
    setSyncProgress('Estabelecendo conexão segura de saúde com o hub de sensores...');
    
    setTimeout(() => {
      setSyncingState('fetching');
      setSyncProgress('Fazendo download da telemetria de passos, frequência cardíaca e estágios de sono...');
      
      setTimeout(() => {
        setSyncingState('processing');
        setSyncProgress('Calculando Variabilidade da Frequência Cardíaca (HRV), cruzando dados de estresse biológico e calibrando padrões...');
        
        setTimeout(() => {
          onUpdateData((prev) => {
            const patientId = prev.session.currentUserId!;
            const profile = prev.patientData[patientId];
            if (!profile) return;

            // Generate/update 7 days of historical logs
            const dates: string[] = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              dates.push(d.toISOString().split('T')[0]);
            }

            dates.forEach((dateStr, index) => {
              let log = profile.dailyLogs.find((l) => l.date === dateStr);
              const isNew = !log;
              if (isNew) {
                // If it's a completely new log, we back-fill some reasonable symptoms
                const randomPain = Math.floor(Math.random() * 4) + 2; // 2 to 5
                log = {
                  date: dateStr,
                  pain: randomPain,
                  fatigue: Math.floor(Math.random() * 4) + 3, // 3 to 6
                  sleep: Math.floor(Math.random() * 3) + 6, // 6 to 8
                  function: Math.floor(Math.random() * 4) + 5, // 5 to 8
                  mood: Math.floor(Math.random() * 4) + 6, // 6 to 9
                };
              }

              // Base the telemetry values on pain levels to establish high-fidelity, medically realistic correlations
              const painLevel = log.pain ?? 4;
              
              // Low pain -> Higher steps, higher HRV, lower resting HR, better sleep
              // High pain -> Lower steps, lower HRV, higher resting HR, worse sleep
              let targetSteps = 9200 - (painLevel * 900) + Math.floor(Math.random() * 1200);
              if (targetSteps < 1200) targetSteps = 1200;

              let targetHrv = 70 - (painLevel * 6) + Math.floor(Math.random() * 8);
              if (targetHrv < 18) targetHrv = 18;

              let targetRestingHr = 58 + (painLevel * 3) + Math.floor(Math.random() * 5);
              let targetSleepHours = 8.4 - (painLevel * 0.4) + (Math.random() * 0.8);
              let targetSleepQuality = 90 - (painLevel * 6) + Math.floor(Math.random() * 10);
              if (targetSleepQuality > 100) targetSleepQuality = 100;
              if (targetSleepQuality < 30) targetSleepQuality = 30;

              log.wearableSync = {
                steps: Math.round(targetSteps),
                sleepHours: Number(targetSleepHours.toFixed(1)),
                sleepQuality: Math.round(targetSleepQuality),
                hrv: Math.round(targetHrv),
                restingHeartRate: Math.round(targetRestingHr),
                device: connectedDevices[0] || 'Apple Watch',
                syncedAt: new Date().toISOString()
              };

              // Map sleep quality directly back into standard Chronos sleep field (0-10) to update standard charts
              log.sleep = Math.round((targetSleepQuality / 100) * 10);

              if (isNew) {
                profile.dailyLogs.push(log);
              }
            });

            // Recompute rolling baseline
            profile.dailyLogs.sort((a, b) => a.date.localeCompare(b.date));
            if (profile.dailyLogs.length >= 3) {
              profile.baseline = calcBaseline(profile.dailyLogs);
            }
          });

          setSyncingState('done');
          setSyncProgress('Todos os dados de passos, sono e variabilidade de FC dos últimos 7 dias sincronizados!');
          setTimeout(() => {
            setSyncingState('idle');
          }, 1500);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Link Form
  const [docCodeInput, setDocCodeInput] = useState('');

  const logs = pd?.dailyLogs || [];
  const riskResult = calcRisk(pd);
  const todayLogged = logs.some((l) => l.date === todayISO());
  const unreadCount = (!todayLogged ? 1 : 0) + (riskResult.level !== 'LOW' ? 1 : 0);

  const activeDxs = Object.keys(pd?.diagnoses || {}).filter((k) => pd.diagnoses[k]);

  // SAVE LOG HANDLER
  const handleSaveLog = (newLog: DailyLog) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (!profile) return;

      const idx = profile.dailyLogs.findIndex((l) => l.date === newLog.date);
      if (idx >= 0) {
        profile.dailyLogs[idx] = newLog;
      } else {
        profile.dailyLogs.push(newLog);
      }

      // Sort logs YYYY-MM-DD
      profile.dailyLogs.sort((a, b) => a.date.localeCompare(b.date));

      // Recompute rolling baseline
      if (profile.dailyLogs.length >= 3) {
        profile.baseline = calcBaseline(profile.dailyLogs);

        // Record risk in history (max 1x/day, only if level is not LOW)
        const risk = calcRisk(profile);
        if (risk.enough && risk.level !== 'LOW') {
          const lastAlert = profile.flareAlerts[profile.flareAlerts.length - 1];
          if (!lastAlert || lastAlert.date !== newLog.date) {
            profile.flareAlerts.push({
              date: newLog.date,
              score: risk.score,
              level: risk.level
            });
          }
        }
      }
    });

    setActiveTab('home');
  };

  // SAVE CLINICAL METRIC HANDLER
  const handleSaveMetric = (newMetric: PeriodicMetric) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        profile.periodicMetrics.push(newMetric);
      }
    });
  };

  // UPDATE PATIENT PROFILE (WEIGHT, MEDICATIONS, SCHEDULED EVENTS)
  const handleUpdatePatientProfile = (
    weight: number,
    medications: MedicationConfig[],
    scheduledEvents: ScheduledEventConfig[]
  ) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        profile.weight = weight;
        profile.medications = medications;
        profile.scheduledEvents = scheduledEvents;
      }
    });
  };

  // UPDATE GENERIC DAILY LOG FIELD
  const handleUpdateDailyLogField = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        const todayStr = new Date().toISOString().split('T')[0];
        let todayLog = profile.dailyLogs.find((l) => l.date === todayStr);
        if (!todayLog) {
          todayLog = {
            date: todayStr,
            pain: null,
            fatigue: null,
            sleep: null,
            function: null,
            mood: null,
            triggers: [],
            waterIntake: 0,
            medicationAdherence: {}
          };
          profile.dailyLogs.push(todayLog);
        }
        todayLog[key] = value;
      }
    });
  };

  // TOGGLE TRIGGER IN TODAY LOG
  const handleToggleTriggerToday = (trigger: string) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        const todayStr = new Date().toISOString().split('T')[0];
        let todayLog = profile.dailyLogs.find((l) => l.date === todayStr);
        if (!todayLog) {
          todayLog = {
            date: todayStr,
            pain: null,
            fatigue: null,
            sleep: null,
            function: null,
            mood: null,
            triggers: [],
            waterIntake: 0,
            medicationAdherence: {}
          };
          profile.dailyLogs.push(todayLog);
        }
        const currentTriggers = todayLog.triggers || [];
        if (currentTriggers.includes(trigger)) {
          todayLog.triggers = currentTriggers.filter((t) => t !== trigger);
        } else {
          todayLog.triggers = [...currentTriggers, trigger];
        }
      }
    });
  };

  // UPDATE WATER INTAKE FOR TODAY
  const handleUpdateWaterIntake = (amount: number, isDirect: boolean = false) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        const todayStr = new Date().toISOString().split('T')[0];
        let todayLog = profile.dailyLogs.find((l) => l.date === todayStr);
        if (!todayLog) {
          todayLog = {
            date: todayStr,
            pain: null,
            fatigue: null,
            sleep: null,
            function: null,
            mood: null,
            triggers: [],
            waterIntake: 0,
            medicationAdherence: {}
          };
          profile.dailyLogs.push(todayLog);
        }
        if (isDirect) {
          todayLog.waterIntake = amount;
        } else {
          todayLog.waterIntake = Math.max(0, todayLog.waterIntake + amount);
        }
      }
    });
  };

  // UPDATE WEIGHT DIRECTLY
  const handleUpdateWeight = (weight: number) => {
    onUpdateData((prev) => {
      const patientId = prev.session.currentUserId!;
      const profile = prev.patientData[patientId];
      if (profile) {
        profile.weight = weight;
      }
    });
  };

  // VINCULAR MÉDICO HANDLER
  const handleLinkDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    const code = docCodeInput.trim().toUpperCase();
    if (!code) return;

    onUpdateData((prev) => {
      const doc = prev.accounts.find((a) => a.role === 'doctor' && a.doctorCode === code);
      if (!doc) {
        alert('Código de profissional de saúde não encontrado.');
        return;
      }

      const existing = prev.links.find(
        (l) => l.patientId === account.id && l.doctorId === doc.id
      );
      if (existing) {
        alert(`Você já possui uma solicitação ou vínculo com este profissional: status ${existing.status === 'authorized' ? 'Autorizado' : 'Aguardando'}`);
        return;
      }

      prev.links.push({
        patientId: account.id,
        doctorId: doc.id,
        status: 'pending',
        initiatedBy: 'patient',
        createdAt: todayISO()
      });

      // Send provider notification
      prev.notifications.push({
        id: Math.random().toString(36).slice(2),
        status: 'unread',
        createdAt: new Date().toISOString(),
        toUserId: doc.id,
        fromUserId: account.id,
        type: 'link_request',
        message: `${account.name} deseja se vincular à sua carteira clínica.`
      });

      alert(`Solicitação de vínculo enviada com sucesso para Dr(a). ${doc.name}!`);
      setDocCodeInput('');
    });
  };

  const handleRevokeLink = (docId: string) => {
    if (!confirm('Deseja encerrar o vínculo de acompanhamento clínico? O profissional deixará de acompanhar seu diário e a evolução de seus sintomas.')) return;
    onUpdateData((prev) => {
      prev.links = prev.links.filter((l) => !(l.patientId === account.id && l.doctorId === docId));
    });
  };

  // NOTIFICATION READ HANDLER
  const handleNotificationRead = (id: string, contactUrl?: string) => {
    onUpdateData((prev) => {
      const notif = prev.notifications.find((n) => n.id === id);
      if (notif) {
        notif.status = 'read';
      }
    });

    if (contactUrl) {
      window.open(contactUrl, '_blank');
    }
  };

  // EXPORT METADATA
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify({ account, patientData: pd }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_diario_${account.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Dor', 'Fadiga', 'Sono', 'Função', 'Pico de dor', 'Rigidez matinal', 'Condição predominante', 'Gatilhos', 'Notas'];
    const rows = logs.map((l) => [
      l.date,
      l.pain ?? '',
      l.fatigue ?? '',
      l.sleep ?? '',
      l.function ?? '',
      l.worstPain ?? '',
      l.stiffness ?? '',
      l.predominant ?? '',
      l.triggers ? l.triggers.join('|') : '',
      l.notes ? l.notes.replace(/[\r\n]+/g, ' ') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((val) => `"${val}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_pain_logs.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('A importação irá carregar seu histórico e atualizar seus diários. Deseja prosseguir?')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.patientData || !Array.isArray(parsed.patientData.dailyLogs)) {
          alert('Arquivo de histórico não reconhecido. Por favor, envie um backup válido gerado pelo RITMA.');
          return;
        }

        onUpdateData((prev) => {
          prev.patientData[account.id] = parsed.patientData;
        });
        alert('Seus registros e histórico de saúde foram importados com sucesso!');
        setActiveTab('home');
      } catch (err) {
        alert('Não foi possível ler este arquivo de histórico.');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeData = () => {
    if (!confirm('Deseja apagar permanentemente todas as suas anotações e diários de saúde deste dispositivo? Esta ação é definitiva.')) return;
    onUpdateData((prev) => {
      prev.patientData[account.id] = {
        diagnoses: {},
        gender: null,
        hormoneRelevant: false,
        baseline: null,
        periodicMetrics: [],
        flareAlerts: [],
        dailyLogs: []
      };
    });
    alert('Seus dados foram apagados com sucesso deste dispositivo.');
    onLogout();
  };

  // PROFILE SAVE HANDLER
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateData((prev) => {
      const acc = prev.accounts.find((a) => a.id === account.id);
      if (acc) {
        acc.name = name.trim();
        acc.email = email.trim().toLowerCase();
        acc.gender = gender || null;
        acc.reminderOptIn = reminderOptIn;
        acc.medicationReminderPush = medicationReminderPush;
      }
      const profile = prev.patientData[account.id];
      if (profile) {
        profile.gender = gender || null;
        profile.hormoneRelevant = hormoneRelevant;
        profile.height = height !== '' ? Number(height) : undefined;
        profile.weight = profileWeight !== '' ? Number(profileWeight) : undefined;
        profile.birthDate = birthDate || undefined;
        profile.cardiovascularRisk = cardiovascularRisk;
        profile.gastricSensitivity = gastricSensitivity;
        profile.continuousMeds = continuousMeds;
        profile.painBaseline = painBaseline;
        profile.sleepBaselineHours = sleepBaselineHours;
        profile.fatigueBaseline = fatigueBaseline;
      }
    });
    setHighlightSettingsFields(false);
    setShowRevisionBanner(false);
    alert('Dados de perfil atualizados com sucesso!');
  };

  const handleToggleDxSettings = (dxKey: string) => {
    if (DX[dxKey]?.comingSoon) return;
    onUpdateData((prev) => {
      const profile = prev.patientData[account.id];
      if (profile) {
        profile.diagnoses[dxKey] = !profile.diagnoses[dxKey];
      }
    });
  };

  const patientLinks = data.links.filter((l) => l.patientId === account.id);

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
          <RitmaLogo size="sm" showTagline={false} />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Tabs list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {[
            {
              group: null,
              items: [{ id: 'home', icon: Home, label: 'Painel Principal' }]
            },
            {
              group: 'Registro Diário',
              items: [
                { id: 'diary', icon: BookOpen, label: 'Meu Diário' },
                { id: 'medications', icon: Pill, label: 'Minhas Medicações' },
                { id: 'bodymap', icon: Activity, label: 'Mapa Corporal de Dor' },
                { id: 'devices', icon: Watch, label: 'Relógios & Sensores' }
              ]
            },
            {
              group: 'Análise & Evolução',
              items: [
                { id: 'charts', icon: ChartIcon, label: 'Gráficos & Análise' }
              ]
            },
            {
              group: 'Relatórios & Conta',
              items: [
                { id: 'report', icon: FileText, label: 'Relatórios' },
                {
                  id: 'notif',
                  icon: Bell,
                  label: 'Avisos',
                  badge: unreadCount > 0 ? unreadCount : undefined
                },
                { id: 'settings', icon: Settings, label: 'Configurações' },
                { id: 'news', icon: Sparkles, label: 'Vem Aí', badge: 'Em breve' }
              ]
            }
          ].map((sec, idx) => (
            <div key={sec.group || `sec-${idx}`} className="space-y-1">
              {sec.group && (
                <div className="px-3 pb-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                  {sec.group}
                </div>
              )}
              {sec.items.map((t) => {
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
                        ? 'bg-[#1FBCC4]/10 dark:bg-[#1FBCC4]/20 text-[#062B63] dark:text-[#24C4D1] font-bold border-l-2 border-[#1FBCC4]'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{t.label}</span>
                    {t.badge && (
                      <span className="bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-800/60 space-y-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
              {initials(account.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                {account.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {account.email || 'Registro local'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-1.5 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800/80 z-30 px-4 py-3 flex items-center justify-between backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:ml-2">
            <RitmaLogo size="sm" showTagline={false} />
          </div>

          <div className="flex items-center gap-2">
            {/* Cloud Sync Status Pill */}
            <button
              type="button"
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                cloudSyncStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
              }`}
              title="Sincronização em Nuvem Ativa. Toque para ver Dispositivos & Sensores"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'syncing' ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="hidden sm:inline">{cloudSyncStatus === 'syncing' ? 'Sincronizando...' : 'Nuvem Conectada'}</span>
            </button>
            <ThemeToggle />
            <button
              onClick={() => setActiveTab('notif')}
              className="p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl relative text-slate-400 hover:text-slate-600"
              aria-label="Ver caixa de avisos"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-600"
              aria-label="Configurações do perfil"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab views layout switcher */}
        <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto pb-24">
          {activeTab === 'home' && (
            <div className="space-y-5">
              {/* 1. WELCOME & TODAY STATUS BANNER */}
              <div className="bg-gradient-to-r from-teal-500/10 via-teal-50/50 to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 border border-teal-500/20 dark:border-teal-800/30 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500 text-white">
                      Painel do Paciente
                    </span>
                    {logs.find((l) => l.date === todayISO()) ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ✓ Hoje Preenchido
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                        ⏳ Diário Pendente
                      </span>
                    )}
                    {riskResult.enough && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        riskResult.level === 'HIGH'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : riskResult.level === 'MODERATE'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                      }`}>
                        {riskResult.level === 'HIGH' ? '⚠️ Risco de Crise' : riskResult.level === 'MODERATE' ? '⚡ Oscilação de Sintomas' : '🛡️ Estável'}
                      </span>
                    )}
                  </div>
                  <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                    Olá, {account.name.split(' ')[0]}!
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {logs.find((l) => l.date === todayISO())
                      ? 'Seus dados de hoje já estão registrados. Acompanhe a evolução das suas métricas abaixo.'
                      : 'Registre como você está se sentindo hoje para manter o RITMMA MAP atualizado.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('diary')}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    {logs.find((l) => l.date === todayISO()) ? 'Atualizar Diário' : 'Registrar Hoje'}
                  </button>
                </div>
              </div>

              {/* ALERT BANNER ONLY WHEN ATTENTION IS NEEDED */}
              {riskResult.level !== 'LOW' && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                  riskResult.level === 'HIGH'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}>
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <strong className="font-bold block">
                      {riskResult.level === 'HIGH' ? 'Alerta de Risco Elevado de Crise' : 'Aviso: Tendência de Oscilação de Sintomas'}
                    </strong>
                    <p className="opacity-90 text-[11px] leading-relaxed">
                      {riskResult.level === 'HIGH'
                        ? 'Variações acentuadas identificadas em dor e fadiga recentemente. Priorize descanso, hidratação e evite esforço físico acentuado.'
                        : 'Identificamos pequenas oscilações de sintomas nos últimos dias. Fique atento aos sinais do seu corpo e mantenha a rotina de descanso.'}
                    </p>
                  </div>
                </div>
              )}

              {/* DICA DO DIA (BASEADA EM EVIDÊNCIAS CLÍNICAS & SINTOMAS RECENTES) */}
              <TipOfTheDay
                patientData={pd}
                onOpenEvidenceModal={() => setShowRefsModal(true)}
              />

              {/* 2. RITMMA MAP (GRÁFICO HERO PRINCIPAL) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#1FBCC4] via-[#3975E3] to-[#9251E5] inline-block animate-pulse" />
                      <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        RITMMA MAP
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-900/60 uppercase tracking-wider">
                          Evolução Multidimensional
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Visão integrada da relação entre sintomas, hábitos e fatores modulares.
                    </p>
                  </div>

                  {/* Time range selector & customize button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[
                        { label: '7d', val: 7 },
                        { label: '14d', val: 14 },
                        { label: '30d', val: 30 },
                        { label: '60d', val: 60 }
                      ].map((t) => (
                        <button
                          key={t.val}
                          onClick={() => setCoverTimeRange(t.val)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            coverTimeRange === t.val
                              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-[#1FBCC4] shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('charts');
                        setTimeout(() => {
                          document.getElementById('sec-360-customizer')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-teal-100" />
                      Personalizar Indicadores
                    </button>
                  </div>
                </div>

                {logs.length >= 2 ? (
                  (() => {
                    const activeLogs = logs.slice(-coverTimeRange);
                    const paramDefs: Record<string, { key: string; name: string; color: string; getValue: (l: DailyLog) => number | null }> = {
                      pain: { key: 'pain', name: 'Dor', color: '#f43f5e', getValue: (l) => l.pain ?? null },
                      fatigue: { key: 'fatigue', name: 'Fadiga', color: '#f59e0b', getValue: (l) => l.fatigue ?? null },
                      sleep: { key: 'sleep', name: 'Sono', color: '#3b82f6', getValue: (l) => l.sleep ?? null },
                      function: { key: 'function', name: 'Capacidade Funcional', color: '#10b981', getValue: (l) => l.function ?? null },
                      weather: { key: 'weather', name: 'Temperatura (°C)', color: '#06b6d4', getValue: (l) => l.weather?.temp ?? null },
                      stress: { key: 'stress', name: 'Estresse', color: '#8b5cf6', getValue: (l) => l.stressWork ?? (l.triggers?.includes('Estresse') ? 7 : 3) },
                      activity: { key: 'activity', name: 'Atividade Física', color: '#6366f1', getValue: (l) => l.exercise?.duration ? 7 : 4 },
                      mood: { key: 'mood', name: 'Humor', color: '#ec4899', getValue: (l) => l.mood ?? 3 },
                    };

                    const activeSeriesKeys = pinnedCoverParams.filter((k) => paramDefs[k]);

                    const chartData = activeLogs.map((l) => {
                      const entry: any = {
                        date: l.date ? l.date.split('-').slice(1).join('/') : '',
                        rawDate: l.date
                      };
                      activeSeriesKeys.forEach((key) => {
                        entry[key] = paramDefs[key].getValue(l);
                      });
                      return entry;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="h-64 sm:h-72 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                {activeSeriesKeys.map((key) => (
                                  <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={paramDefs[key].color} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={paramDefs[key].color} stopOpacity={0.0} />
                                  </linearGradient>
                                ))}
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={{ stroke: '#cbd5e1' }}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 10]}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                  borderColor: '#334155',
                                  borderRadius: '0.75rem',
                                  color: '#f8fafc',
                                  fontSize: '0.75rem',
                                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                                }}
                                formatter={(val: any, name: any) => {
                                  const param = paramDefs[name] || Object.values(paramDefs).find(p => p.name === name);
                                  return [val != null ? `${val}` : '-', param ? param.name : name];
                                }}
                                labelFormatter={(lbl: string) => `Data: ${lbl}`}
                              />
                              {activeSeriesKeys.map((key, index) => (
                                <React.Fragment key={key}>
                                  {index === 0 && (
                                    <Area
                                      type="monotone"
                                      dataKey={key}
                                      stroke="none"
                                      fill={`url(#grad-${key})`}
                                    />
                                  )}
                                  <RechartsLine
                                    type="monotone"
                                    dataKey={key}
                                    name={paramDefs[key].name}
                                    stroke={paramDefs[key].color}
                                    strokeWidth={2.8}
                                    dot={{ r: 3, fill: '#ffffff', stroke: paramDefs[key].color, strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: paramDefs[key].color, stroke: '#ffffff', strokeWidth: 2 }}
                                    connectNulls
                                  />
                                </React.Fragment>
                              ))}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend Tags */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                          {activeSeriesKeys.map((key) => {
                            const p = paramDefs[key];
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                              >
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">{p.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-850/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-3xl block mb-2">📊</span>
                    <h4 className="font-poppins font-bold text-xs text-slate-700 dark:text-slate-300">
                      RITMMA MAP em Calibração
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                      Preencha o diário por pelo menos 2 dias para visualizar suas curvas no RITMMA MAP.
                    </p>
                    <button
                      onClick={() => setActiveTab('diary')}
                      className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Preencher Diário Agora
                    </button>
                  </div>
                )}
              </div>

              {/* 3. PAINEL DE SÍNTESE EM 3 CARDS INTEGRADOS */}
              {(() => {
                const recentLogs = logs.slice(-10);
                const sleepValues = recentLogs.map((l) => l.sleep ?? 0);
                const avgSleep = sleepValues.length
                  ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1)
                  : '5.6';

                const recent7Pain = logs.slice(-7).map((l) => l.pain).filter((p) => p != null) as number[];
                const avgPain7 = recent7Pain.length
                  ? (recent7Pain.reduce((a, b) => a + b, 0) / recent7Pain.length).toFixed(1)
                  : '-';

                const recent7Fatigue = logs.slice(-7).map((l) => l.fatigue).filter((f) => f != null) as number[];
                const avgFatigue7 = recent7Fatigue.length
                  ? (recent7Fatigue.reduce((a, b) => a + b, 0) / recent7Fatigue.length).toFixed(1)
                  : '-';

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* CARD 1: QUALIDADE DO SONO */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-sky-500" /> Qualidade do Sono
                        </span>
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                          Média Recente
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <strong className="text-2xl font-black text-slate-800 dark:text-slate-100">{avgSleep} h</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">horas por noite</span>
                        </div>
                        {/* Sparkline Bar Chart */}
                        <div className="flex items-end gap-1 h-8">
                          {sleepValues.slice(-7).map((val, idx) => {
                            const heightPct = Math.min(100, Math.max(15, (val / 10) * 100));
                            return (
                              <div
                                key={idx}
                                style={{ height: `${heightPct}%` }}
                                className="w-2 bg-sky-400 dark:bg-sky-500 rounded-t-xs transition-all"
                                title={`Sono: ${val}h`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: FREQUÊNCIA DE REGISTROS (HEATMAP CLEAN) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1FBCC4]" /> Frequência de Diário
                        </span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                          30 dias
                        </span>
                      </div>
                      <div className="pt-0.5">
                        <CalendarHeatmap logs={logs.slice(-30)} field="pain" />
                      </div>
                    </div>

                    {/* CARD 3: SÍNTESE DE DOR E FADIGA */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-rose-500" /> Dor & Fadiga (7d)
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Médias</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-rose-500">Média Dor: {avgPain7} / 10</div>
                          <div className="text-xs font-bold text-amber-500">Média Fadiga: {avgFatigue7} / 10</div>
                        </div>
                        {/* Sparkline dual line */}
                        <div className="w-16 h-8 relative shrink-0">
                          <svg className="w-16 h-8" viewBox="0 0 60 30">
                            {recentLogs.length >= 2 && (
                              <polyline
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={recentLogs
                                  .slice(-7)
                                  .map((l, idx) => {
                                    const x = (idx / 6) * 60;
                                    const y = 30 - ((l.pain ?? 0) / 10) * 26 - 2;
                                    return `${x},${y}`;
                                  })
                                  .join(' ')}
                              />
                            )}
                            {recentLogs.length >= 2 && (
                              <polyline
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="3,2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={recentLogs
                                  .slice(-7)
                                  .map((l, idx) => {
                                    const x = (idx / 6) * 60;
                                    const y = 30 - ((l.fatigue ?? 0) / 10) * 26 - 2;
                                    return `${x},${y}`;
                                  })
                                  .join(' ')}
                              />
                            )}
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

               {/* 4. SILHUETA ANATÔMICA & REGISTRO VISUAL DE DOR (INTEGRADO NA TELA PRINCIPAL) */}
               <div className="pt-1">
                 <BodyPainMap
                   logs={logs}
                   onSaveLog={handleSaveLog}
                   patientData={pd}
                   onUpdatePatientData={(updater) => {
                     onUpdateData((prev) => {
                       const profile = prev.patientData[account.id];
                       if (profile) {
                         updater(profile);
                       }
                     });
                   }}
                   isEmbedded={true}
                 />
               </div>

               {/* 5. ATALHOS RÁPIDOS DE NAVEGAÇÃO */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <button
                   onClick={() => setActiveTab('diary')}
                   className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-teal-400 dark:border-slate-800 dark:hover:border-teal-600 p-4 rounded-2xl shadow-2xs text-left transition-all group flex flex-col justify-between cursor-pointer"
                 >
                   <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                     <Calendar className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100 block group-hover:text-teal-600 dark:group-hover:text-teal-400">
                       Diário de Sintomas
                     </span>
                     <span className="text-[10px] text-slate-400 block mt-0.5">
                       {logs.find((l) => l.date === todayISO()) ? '✓ Atualizar hoje' : 'Registrar dia'}
                     </span>
                   </div>
                 </button>

                 <button
                   onClick={() => setActiveTab('medications')}
                   className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-blue-400 dark:border-slate-800 dark:hover:border-blue-600 p-4 rounded-2xl shadow-2xs text-left transition-all group flex flex-col justify-between cursor-pointer"
                 >
                   <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                     <Pill className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100 block group-hover:text-blue-600 dark:group-hover:text-blue-400">
                       Medicamentos
                     </span>
                     <span className="text-[10px] text-slate-400 block mt-0.5">
                       Horários & Doses
                     </span>
                   </div>
                 </button>

                 <button
                   onClick={() => {
                     const el = document.getElementById('pain-history-silhouette');
                     if (el) {
                       el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     } else {
                       setActiveTab('bodymap');
                     }
                   }}
                   className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-rose-400 dark:border-slate-800 dark:hover:border-rose-600 p-4 rounded-2xl shadow-2xs text-left transition-all group flex flex-col justify-between cursor-pointer"
                 >
                   <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                     <Activity className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100 block group-hover:text-rose-600 dark:group-hover:text-rose-400">
                       Mapa Corporal
                     </span>
                     <span className="text-[10px] text-slate-400 block mt-0.5">
                       Pontos de dor no corpo
                     </span>
                   </div>
                 </button>

                 <button
                   onClick={() => setActiveTab('achievements')}
                   className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-amber-400 dark:border-slate-800 dark:hover:border-amber-600 p-4 rounded-2xl shadow-2xs text-left transition-all group flex flex-col justify-between cursor-pointer"
                 >
                   <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                     <Trophy className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100 block group-hover:text-amber-600 dark:group-hover:text-amber-400">
                       Conquistas
                     </span>
                     <span className="text-[10px] text-slate-400 block mt-0.5">
                       Medalhas de hábito
                     </span>
                   </div>
                 </button>
               </div>
             </div>
           )}

          {activeTab === 'diary' && (
            <PatientDiary
              patientData={pd}
              patientId={account.id}
              onSaveLog={handleSaveLog}
              onUpdatePatientProfile={handleUpdatePatientProfile}
              onBack={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'medications' && (
            <MedicationEditor
              medications={pd.medications || []}
              weight={pd.weight || 70}
              scheduledEvents={pd.scheduledEvents || []}
              onUpdate={handleUpdatePatientProfile}
              setMedicationsState={(action) => {
                onUpdateData((prev) => {
                  const patientId = prev.session.currentUserId!;
                  const profile = prev.patientData[patientId];
                  if (profile) {
                    const currentMeds = profile.medications || [];
                    if (typeof action === 'function') {
                      profile.medications = action(currentMeds);
                    } else {
                      profile.medications = action;
                    }
                  }
                });
              }}
              setScheduledEventsState={(action) => {
                onUpdateData((prev) => {
                  const patientId = prev.session.currentUserId!;
                  const profile = prev.patientData[patientId];
                  if (profile) {
                    const currentEvents = profile.scheduledEvents || [];
                    if (typeof action === 'function') {
                      profile.scheduledEvents = action(currentEvents);
                    } else {
                      profile.scheduledEvents = action;
                    }
                  }
                });
              }}
              standaloneTab={true}
            />
          )}

          {activeTab === 'bodymap' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 animate-fade-in">
                  <Activity className="w-5 h-5 text-teal-500" /> Mapa Anatômico de Dor Localizada
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Selecione e classifique as áreas com dor para gerar o seu mapa de sensibilidade clínica e tender points.
                </p>
              </div>

              <BodyPainMap
                logs={logs}
                onSaveLog={handleSaveLog}
                patientData={pd}
                onUpdatePatientData={(updater) => {
                  onUpdateData((prev) => {
                    const profile = prev.patientData[account.id];
                    if (profile) {
                      updater(profile);
                    }
                  });
                }}
              />
            </div>
          )}

          {activeTab === 'fooddiary' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 animate-fade-in">
                  <Apple className="w-5 h-5 text-teal-500" /> Diário Alimentar & Rastreio de Gatilhos Nutricionais
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Gerencie seu consumo alimentar e mapeie gatilhos que possam estar agravando suas crises de dor crônica.
                </p>
              </div>

              <FoodDiary
                logs={logs}
                onSaveLog={handleSaveLog}
              />
            </div>
          )}

          {activeTab === 'hydration' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 animate-fade-in">
                  <Apple className="font-bold w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/20" /> Alimentação, Hidratação & Saúde Intestinal
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Rastreie seus hábitos alimentares, ingestão hídrica e parâmetros de saúde intestinal para identificar correlações clínicas baseadas em evidências.
                </p>
              </div>

              {(() => {
                const weightVal = pd?.weight ?? 70;
                const dailyTarget = Math.round(weightVal * 35);
                const todayStr = new Date().toISOString().split('T')[0];
                const todayLog = pd?.dailyLogs?.find((l) => l.date === todayStr);
                const curIntake = todayLog?.waterIntake ?? 0;
                const percent = dailyTarget > 0 ? Math.round((curIntake / dailyTarget) * 100) : 0;
                const diagnoses = pd?.diagnoses || {};
                const hasSii = !!diagnoses.sii || !!pd?.gastricSensitivity || showSiiOverride;

                // Simple states for universal trackers
                const waterSimple = todayLog?.waterSimple;
                const caffeineSimple = todayLog?.caffeineSimple;

                // IBS states
                const abdominalPain = todayLog?.abdominalPain ?? 0;
                const bloating = todayLog?.bloating ?? 0;
                const gasSeverity = todayLog?.gasSeverity ?? 0;
                const urgency = todayLog?.evacuationUrgency ?? 'nao';
                const evacuated = !!todayLog?.evacuatedToday;
                const bristol = todayLog?.bristolStoolType ?? null;
                const incomplete = !!todayLog?.incompleteEvacuation;
                const mucus = !!todayLog?.stoolMucus;
                const blood = !!todayLog?.stoolBlood;
                const currentTriggers = todayLog?.triggers || [];

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left/Main Column - Forms */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* 1. MODO SIMPLES UNIVERSAL */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
                        <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">🥦 Registro Geral de Hábitos (Universal)</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                            Baixo Atrito
                          </span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {/* Ingestão Hídrica Perceptiva */}
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">Sua percepção de consumo de água hoje:</span>
                            <div className="flex gap-1.5">
                              {(['pouco', 'adequado', 'bastante'] as const).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => handleUpdateDailyLogField('waterSimple', v)}
                                  className={`flex-1 py-2 font-bold rounded-lg border text-center transition-all capitalize ${
                                    waterSimple === v
                                      ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50'
                                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Café e Energéticos */}
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">Bebidas com cafeína hoje (Café, chá mate/preto, energéticos):</span>
                            <div className="flex gap-1.5">
                              {(['nenhum', 'pouco', 'muito'] as const).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => handleUpdateDailyLogField('caffeineSimple', v)}
                                  className={`flex-1 py-2 font-bold rounded-lg border text-center transition-all capitalize ${
                                    caffeineSimple === v
                                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Checklist of binary triggers/habits */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-50 dark:border-slate-800/60 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Marque as situações ocorridas hoje:</span>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { key: 'alcoholLog', label: '🍷 Álcool / Bebida Alcoólica' },
                              { key: 'gasBeverage', label: '🥤 Bebida com Gás (Refrigerante/Água)' },
                              { key: 'greasyMeal', label: '🍔 Refeição muito gordurosa/pesada' },
                              { key: 'unusualFood', label: '🍕 Comi algo fora do habitual' },
                              { key: 'longFasting', label: '⏳ Jejum prolongado' },
                              { key: 'ultraprocessedExcess', label: '🍩 Ultraprocessados / Doces em excesso' }
                            ].map((item) => {
                              const isChecked = todayLog ? !!todayLog[item.key as keyof DailyLog] : false;
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => handleUpdateDailyLogField(item.key as keyof DailyLog, !isChecked)}
                                  className={`py-2.5 px-3.5 rounded-xl border font-semibold text-left transition-all flex items-center gap-2 ${
                                    isChecked
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 font-bold dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600 dark:bg-slate-800/40 dark:hover:bg-slate-850 dark:text-slate-400'
                                  }`}
                                >
                                  <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                                  </div>
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 2. INTEGRAÇÃO COM APPS DE MONITORAMENTO DE HIDRATAÇÃO */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
                        <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">🔌 Integração com Smartwatches & Apps</span>
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20 px-2 py-0.5 rounded">
                            Hidratação Externa
                          </span>
                        </h3>

                        {!waterAppConnected ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-sky-50 dark:bg-sky-950/30 text-sky-500 rounded-lg mt-0.5">
                                  <Watch className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Sincronização Externa</h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                                    Conecte o RITMA com Apple Health, Google Fit, Garmin, Fitbit ou garrafas inteligentes para importar ml consumidos automaticamente.
                                  </p>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                ℹ️ Sem conexão ativa, o RITMA assume o controle simplificado por **percepção** (pouco/adequado/bastante) registrado no painel superior.
                              </p>
                            </div>

                            {/* Adendo de recomendação baseada no peso */}
                            <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100/60 dark:border-sky-950/30 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block font-poppins">Adendo de Recomendação</span>
                                <span className="text-[10px] font-bold text-sky-600 bg-sky-100/50 dark:bg-sky-950/50 dark:text-sky-400 px-2 py-0.5 rounded-md">
                                  Meta Clínica Padrão
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                Para modular o limiar doloroso e lubrificar articulações de pacientes reumatológicos, a meta de hidratação recomendada para o seu peso de <strong className="text-slate-800 dark:text-white">{weightVal} kg</strong> é de exatamente <strong className="text-sky-600 dark:text-sky-400 font-bold">{dailyTarget} ml</strong> por dia (35ml por kg) [17, 19].
                              </p>

                              {/* Weight Input */}
                              <div className="flex items-center justify-between pt-2 border-t border-sky-100/30 dark:border-sky-950/20 text-xs">
                                <label htmlFor="weight-input-1" className="text-slate-500 dark:text-slate-400 font-semibold cursor-pointer">Atualizar seu peso corporal:</label>
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                                  <input
                                    id="weight-input-1"
                                    type="number"
                                    value={weightVal}
                                    onChange={(e) => handleUpdateWeight(Number(e.target.value))}
                                    className="w-10 text-center p-0 border-0 focus:ring-0 font-bold text-slate-800 dark:text-white text-xs bg-transparent"
                                    min="20"
                                    max="300"
                                  />
                                  <span className="text-slate-400 font-semibold">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Button simulating sync */}
                            <button
                              type="button"
                              onClick={() => {
                                setSyncingWater(true);
                                setTimeout(() => {
                                  setSyncingWater(false);
                                  setWaterAppConnected(true);
                                  // Update waterIntake to a random realistic amount near target
                                  const targetAmt = Math.round(weightVal * 35);
                                  const simulatedAmt = Math.round(targetAmt * 0.88); // ~88% of target
                                  handleUpdateWaterIntake(simulatedAmt);
                                  handleUpdateDailyLogField('waterSimple', 'adequado');
                                }, 1500);
                              }}
                              disabled={syncingWater}
                              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100/80 active:bg-sky-100 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400 dark:hover:bg-sky-950/40 font-bold rounded-xl border border-sky-100 dark:border-sky-900/40 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {syncingWater ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Buscando dados em Apple Health / MyWater...</span>
                                </>
                              ) : (
                                <>
                                  <span>🔌 Sincronizar com Apps de Saúde</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-fade-in">
                            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl space-y-2.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronização Ativa
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded">
                                  Apple Health / Garmin
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                Sincronizado automaticamente hoje às <strong className="text-slate-800 dark:text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
                              </p>
                              
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl flex justify-between items-center mt-1">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-poppins font-bold uppercase">Volume Importado</span>
                                  <span className="text-xl font-black text-slate-800 dark:text-white font-poppins mt-0.5">
                                    {curIntake} ml <span className="text-slate-400 font-normal text-xs">/ {dailyTarget} ml</span>
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                                  {percent}% Atingido
                                </span>
                              </div>
                            </div>

                            {/* Adendo de recomendação baseada no peso */}
                            <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100/60 dark:border-sky-950/30 rounded-xl space-y-2">
                              <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block font-poppins">Adendo de Recomendação</span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                Sua meta hídrica clínica ideal é de <strong className="text-sky-600 dark:text-sky-400 font-bold">{dailyTarget} ml</strong> por dia (baseado em seu peso de <strong className="text-slate-800 dark:text-white">{weightVal} kg</strong>).
                              </p>

                              {/* Weight Input */}
                              <div className="flex items-center justify-between pt-1 text-xs">
                                <label htmlFor="weight-input-2" className="text-slate-500 dark:text-slate-400 font-semibold cursor-pointer">Peso atual:</label>
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                                  <input
                                    id="weight-input-2"
                                    type="number"
                                    value={weightVal}
                                    onChange={(e) => handleUpdateWeight(Number(e.target.value))}
                                    className="w-10 text-center p-0 border-0 focus:ring-0 font-bold text-slate-800 dark:text-white text-xs bg-transparent"
                                    min="20"
                                    max="300"
                                  />
                                  <span className="text-slate-400 font-semibold">kg</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setWaterAppConnected(false);
                                // Clear simulated ml
                                handleUpdateWaterIntake(-curIntake);
                              }}
                              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-950/40 dark:hover:bg-slate-850 dark:text-slate-400 font-bold rounded-xl border border-transparent text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>🔌 Desconectar e voltar para Percepção Manual</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. MONITOR INTEGRADO DE SAÚDE INTESTINAL (SII) */}
                      {hasSii ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">💩 Monitor Avançado de Saúde Intestinal (SII)</span>
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded">
                              Ativo
                            </span>
                          </h3>

                          {/* Sliders para dor, distensão e gases */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1.5">
                              <label htmlFor="sii-abdominal-pain" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                                Dor Abdominal:
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${abdominalPain > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
                                  {abdominalPain}/10
                                </span>
                              </label>
                              <input
                                id="sii-abdominal-pain"
                                type="range"
                                min="0"
                                max="10"
                                value={abdominalPain}
                                onChange={(e) => handleUpdateDailyLogField('abdominalPain', Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                role="slider"
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={abdominalPain}
                                aria-label="Dor Abdominal da Síndrome do Intestino Irritável de 0 a 10"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="sii-bloating" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                                Estufamento / Distensão:
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${bloating > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
                                  {bloating}/10
                                </span>
                              </label>
                              <input
                                id="sii-bloating"
                                type="range"
                                min="0"
                                max="10"
                                value={bloating}
                                onChange={(e) => handleUpdateDailyLogField('bloating', Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                role="slider"
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={bloating}
                                aria-label="Estufamento ou Distensão de 0 a 10"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="sii-gas-severity" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                                Gravidade de Gases:
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${gasSeverity > 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
                                  {gasSeverity}/10
                                </span>
                              </label>
                              <input
                                id="sii-gas-severity"
                                type="range"
                                min="0"
                                max="10"
                                value={gasSeverity}
                                onChange={(e) => handleUpdateDailyLogField('gasSeverity', Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                role="slider"
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={gasSeverity}
                                aria-label="Gravidade de Gases de 0 a 10"
                              />
                            </div>
                          </div>

                          {/* Urgência Evacuatória */}
                          <div className="space-y-2 text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">Urgência para evacuar hoje:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {([
                                { key: 'nao', label: 'Não senti urgência' },
                                { key: 'leve', label: 'Leve' },
                                { key: 'moderada', label: 'Moderada' },
                                { key: 'intensa', label: 'Intensa / Súbita' }
                              ] as const).map((o) => (
                                <button
                                  key={o.key}
                                  type="button"
                                  onClick={() => handleUpdateDailyLogField('evacuationUrgency', o.key)}
                                  className={`py-1.5 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                                    urgency === o.key
                                      ? 'bg-teal-500 text-white border-teal-500 font-bold dark:bg-teal-600'
                                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Evacuou hoje? */}
                          <div className="p-4 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-4 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Você conseguiu evacuar hoje?</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDailyLogField('evacuatedToday', !evacuated)}
                                className={`px-4 py-1.5 rounded-lg border font-bold transition-all text-xs ${
                                  evacuated
                                    ? 'bg-teal-500 text-white border-teal-500'
                                    : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {evacuated ? 'Sim, evacuei' : 'Não evacuei hoje'}
                              </button>
                            </div>

                            {evacuated && (
                              <div className="space-y-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/50 animate-fade-in">
                                {/* Escala de Bristol */}
                                <div className="space-y-2">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                                    Escala de Bristol (Selecione a consistência das fezes):
                                    <button
                                      type="button"
                                      onClick={() => setShowBristolExplanation(!showBristolExplanation)}
                                      className="text-slate-400 hover:text-teal-500 transition-colors"
                                      title="Ver explicação clínica"
                                      aria-label="Ver explicação clínica da Escala de Bristol"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </span>

                                  {showBristolExplanation && (
                                    <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium animate-fade-in">
                                      <strong>O que é a Escala de Bristol?</strong> É um instrumento médico validado para classificar o formato e consistência das fezes em 7 tipos distintos, ajudando no diagnóstico e acompanhamento clínico de diarreia, constipação e Síndrome do Intestino Irritável.
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                                    {[
                                      { type: 1, label: 'Tipo 1', desc: 'Caroços duros separados (nozes)', hint: 'Constipação severa 🪵' },
                                      { type: 2, label: 'Tipo 2', desc: 'Formato de salsicha segmentada', hint: 'Constipação leve 🌭' },
                                      { type: 3, label: 'Tipo 3', desc: 'Salsicha com rachaduras', hint: 'Normal / Ideal 🥖' },
                                      { type: 4, label: 'Tipo 4', desc: 'Salsicha lisa e macia', hint: 'Normal (perfeito) 🍌' },
                                      { type: 5, label: 'Tipo 5', desc: 'Pedaços moles contorno nítido', hint: 'Falta de fibra ☁️' },
                                      { type: 6, label: 'Tipo 6', desc: 'Pedaços pastosos e esfarelados', hint: 'Diarreia leve 🥣' },
                                      { type: 7, label: 'Tipo 7', desc: 'Totalmente líquido (sem sólidos)', hint: 'Diarreia severa 💧' }
                                    ].map((b) => (
                                      <button
                                        key={b.type}
                                        type="button"
                                        onClick={() => handleUpdateDailyLogField('bristolStoolType', b.type)}
                                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                          bristol === b.type
                                            ? 'bg-teal-50 border-teal-400 text-teal-800 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300 font-bold shadow-xs'
                                            : 'bg-white hover:bg-slate-100 border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850'
                                        }`}
                                      >
                                        <div>
                                          <div className="font-bold text-xs">{b.label}</div>
                                          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{b.desc}</div>
                                        </div>
                                        <div className="text-[9px] font-bold text-teal-600 dark:text-teal-400 mt-2 self-start">{b.hint}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Características adicionais */}
                                <div className="space-y-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/50">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Outros sintomas intestinais notados hoje:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { key: 'incompleteEvacuation', label: '🚽 Sensação de evacuação incompleta' },
                                      { key: 'stoolMucus', label: '🧼 Presença de Muco nas fezes' },
                                      { key: 'stoolBlood', label: '🚨 Sangue vivo nas fezes' }
                                    ].map((item) => {
                                      const isVal = todayLog ? !!todayLog[item.key as keyof DailyLog] : false;
                                      return (
                                        <button
                                          key={item.key}
                                          type="button"
                                          onClick={() => handleUpdateDailyLogField(item.key as keyof DailyLog, !isVal)}
                                          className={`py-2 px-3 rounded-lg border font-semibold transition-all ${
                                            isVal
                                              ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400 font-bold'
                                              : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                                          }`}
                                        >
                                          {item.label}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {blood && (
                                    <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 rounded-xl leading-relaxed space-y-1 mt-2 font-medium animate-pulse">
                                      <p className="font-bold text-[11px]">⚠️ ALERTA DE SINAL DE ALERTA (RED FLAG):</p>
                                      <p className="text-[10px]">A presença de sangue vivo nas fezes requer investigação diagnóstica diferencial em consulta médica convencional com clínico ou coloproctologista para exclusão de patologias intestinais inflamatórias ou sangramentos hemorroidários.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Gatilhos alimentares e FODMAPs */}
                          <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">Exposição a alimentos / Gatilhos intestinais nas últimas 24h:</span>
                              <p className="text-[10px] text-slate-400 font-medium">Marque se você consumiu algum destes grupos alimentares para correlacionarmos com suas crises.</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { key: 'Leite', label: '🥛 Leite / Lactose (Queijo, iogurte)' },
                                { key: 'Trigo', label: '🍞 Trigo / Glúten (Pão, massas)' },
                                { key: 'Alho', label: '🧄 Alho ou Cebola' },
                                { key: 'Feijao', label: '🫘 Feijão / Lentilhas / Grão-de-bico' },
                                { key: 'Frutas', label: '🍎 Frutas Doces (Maçã, pêra, manga)' },
                                { key: 'Adocante', label: '🍬 Adoçante / Polióis (Xilitol, chiclete)' },
                                { key: 'Fritura', label: '🍟 Fritura / Comida Gordurosa' },
                                { key: 'Cafe', label: '☕ Café / Bebidas de cafeína' },
                                { key: 'Alcool', label: '🍺 Álcool / Cerveja / Destilados' },
                                { key: 'Gas', label: '🥤 Bebida com Gás' }
                              ].map((item) => {
                                const isSelected = currentTriggers.includes(item.key);
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleToggleTriggerToday(item.key)}
                                    className={`text-[11px] font-semibold py-1.5 px-3 rounded-full border transition-all ${
                                      isSelected
                                        ? 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900/50 dark:text-teal-400 font-bold shadow-xs'
                                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Placeholder para ativar monitor de SII */
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-3">
                          <div className="text-3xl">💩</div>
                          <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">Rastreamento de Saúde Intestinal (SII)</h4>
                          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
                            Se você sofre de Síndrome do Intestino Irritável, dores abdominais recorrentes ou queixas de gases, ative este módulo para registrar Bristol, sintomas GI e gatilhos FODMAPs.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSiiOverride(true)}
                            className="px-4 py-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/50 rounded-xl transition-all border border-transparent hover:border-teal-200/60"
                          >
                            Ativar Monitoramento Intestinal
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Clinical Insights & History */}
                    <div className="space-y-4">
                      
                      {/* Clinical Insights based on Evidences */}
                      <div className="bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-2xl shadow-sm space-y-3 text-xs">
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-emerald-500" /> Matriz de Evidência Médica
                        </h4>
                        <div className="space-y-2.5 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          <p>
                            <strong className="text-emerald-700 dark:text-emerald-400">Low-FODMAPs & SII:</strong> Reduzir carboidratos fermentáveis (FODMAPs) é a intervenção dietética com maior evidência científica para diminuir a dor abdominal e estufamento em pacientes de SII [23, 24].
                          </p>
                          <p>
                            <strong className="text-emerald-700 dark:text-emerald-400">Hidratação na Dor Crônica:</strong> A desidratação subclínica altera o processamento de dor central, aumentando a hipersensibilidade. Consumir água na meta correta protege as cartilagens e articulações [17, 19].
                          </p>
                          <p>
                            <strong className="text-emerald-700 dark:text-emerald-400">Causalidade:</strong> O RITMA correlaciona seus hábitos de 24-48h, mas lembre-se de que correlações sugerem associações e não comprovam causa definitiva. Sempre discuta mudanças dietéticas com seu médico ou nutricionista.
                          </p>
                        </div>
                      </div>

                      {/* Recente History */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                        <h4 className="font-poppins font-bold text-xs text-slate-500 uppercase tracking-widest block border-b border-slate-50 dark:border-slate-800 pb-1.5">
                          Histórico Recente
                        </h4>
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
                          {(() => {
                            const recentLogs = logs.filter(l => 
                              l.waterSimple || 
                              l.caffeineSimple || 
                              (l.waterIntake !== undefined && l.waterIntake > 0) ||
                              l.alcoholLog || 
                              l.greasyMeal || 
                              l.evacuatedToday
                            );
                            if (recentLogs.length === 0) {
                              return <span className="text-[11px] text-slate-400 block italic font-semibold py-4 text-center">Nenhum registro de hábito recente.</span>;
                            }
                            return recentLogs.slice(-5).reverse().map(l => {
                              const calculatedTarget = Math.round((pd?.weight ?? 70) * 35);
                              const isSynced = l.waterIntake !== undefined && l.waterIntake > 0;
                              const isSuccess = isSynced && l.waterIntake >= calculatedTarget;
                              return (
                                <div
                                  key={l.date}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredLog(l);
                                    setTooltipPos({
                                      x: rect.left + rect.width / 2,
                                      y: rect.top
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredLog(null)}
                                  className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/50 rounded-xl space-y-1.5 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700 cursor-help"
                                >
                                  <div className="flex justify-between items-center font-bold">
                                    <span className="text-slate-600 dark:text-slate-400">
                                      {l.date.split('-').reverse().slice(0, 2).join('/')}
                                    </span>
                                    {isSynced ? (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white'}`}>
                                        🔌 {l.waterIntake} ml ({isSuccess ? 'Meta Ok' : `${Math.round((l.waterIntake / calculatedTarget) * 100)}%`})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                                        💧 Percepção: {l.waterSimple || 'Não registrada'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Habitos resumos */}
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1">
                                    {l.caffeineSimple && <span>· Café: {l.caffeineSimple}</span>}
                                    {l.alcoholLog && <span className="text-rose-600 dark:text-rose-400 font-semibold">· 🍷 Álcool</span>}
                                    {l.gasBeverage && <span>· 🥤 Gás</span>}
                                    {l.greasyMeal && <span>· 🍔 Gordura</span>}
                                    {l.evacuatedToday && (
                                      <span className="text-teal-600 dark:text-teal-400 font-bold">
                                        · 💩 Evacuou {l.bristolStoolType ? `(Bristol ${l.bristolStoolType})` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'metrics' && (
            <PatientMetrics patientData={pd} onSaveMetric={handleSaveMetric} />
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              {/* HEADER BANNER */}
              <div className="bg-gradient-to-r from-teal-500/10 via-teal-50/30 to-white dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 border border-teal-500/20 dark:border-teal-800/30 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                      Gráficos & Análise Integrada
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Visualização centralizada de tendências sintomáticas, correlações bioclínicas e histórico.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-teal-700 dark:text-teal-300 shadow-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    {logs.length} dias analisados
                  </span>
                </div>
              </div>

              {/* SEGMENTED TAB NAVIGATION */}
              <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-1.5 shadow-inner">
                {[
                  { id: 'recharts', label: 'Mapa 360°', icon: Sparkles },
                  { id: 'classic', label: 'Tendências Clássicas', icon: TrendingUp },
                  { id: 'sensibilidade', label: 'Matriz de Correlação', icon: Sliders },
                  { id: 'logs', label: 'Histórico & Filtros', icon: ClipboardList }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = chartsSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChartsSubTab(tab.id as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT 1: VISÃO 360° */}
              {chartsSubTab === 'recharts' && (
                <div className="space-y-5">
                  {/* Main Recharts Dashboard First */}
                  <RechartsDashboard logs={logs} />

                  {/* Toggle Indicator Customizer Box (Seleção / Análise de Variantes) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h3 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Análise de Variantes & Indicadores da Curva (360°)
                        </h3>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                          {pinnedCoverParams.length} selecionados
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomizer(!showCustomizer)}
                        className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showCustomizer ? 'Ocultar Seleção' : 'Personalizar Indicadores ⚙️'}
                      </button>
                    </div>

                    {showCustomizer && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                        {[
                          { id: 'pain', label: 'Dor', color: '#f43f5e', icon: Activity },
                          { id: 'fatigue', label: 'Fadiga', color: '#f59e0b', icon: Zap },
                          { id: 'sleep', label: 'Sono', color: '#3b82f6', icon: Moon },
                          { id: 'function', label: 'Capacidade Funcional', color: '#10b981', icon: Award },
                          { id: 'weather', label: 'Clima / Temp', color: '#06b6d4', icon: Droplet },
                          { id: 'stress', label: 'Nível de Estresse', color: '#8b5cf6', icon: BrainCircuit },
                          { id: 'activity', label: 'Atividade Física', color: '#6366f1', icon: Scale },
                          { id: 'mood', label: 'Estado de Humor', color: '#ec4899', icon: Heart }
                        ].map((param) => {
                          const isPinned = pinnedCoverParams.includes(param.id);
                          const IconComp = param.icon;
                          return (
                            <button
                              key={param.id}
                              type="button"
                              onClick={() => toggleCoverParam(param.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isPinned
                                  ? 'bg-teal-50/80 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 border-teal-400 dark:border-teal-800 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: param.color }} />
                                <span className="text-xs truncate">{param.label}</span>
                              </div>
                              <span className="text-[10px] font-bold">
                                {isPinned ? '✓' : '+'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: TENDÊNCIAS CLÁSSICAS */}
              {chartsSubTab === 'classic' && (
                <div className="space-y-5">
                  {/* General trends multi line */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                    <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
                      Curvas Sintomáticas Gerais (Até 60 dias)
                    </h3>
                    {(() => {
                      const logs60 = logs.slice(-60);
                      const series = [
                        { name: 'Dor', color: '#f43f5e', data: logs60.map((l) => l.pain) },
                        { name: 'Fadiga', color: '#f59e0b', data: logs60.map((l) => l.fatigue) },
                        { name: 'Sono', color: '#3b82f6', data: logs60.map((l) => l.sleep) },
                        { name: 'Função', color: '#10b981', data: logs60.map((l) => l.function) }
                      ];
                      return (
                        <>
                          <MultiLineChart series={series} />
                          <Legend series={series} />
                        </>
                      );
                    })()}
                  </div>

                  {/* Correlations Scatter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sleep vs pain */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                        Qualidade do Sono × Dor do dia seguinte
                      </h4>
                      {(() => {
                        const pts: { x: number; y: number }[] = [];
                        for (let i = 1; i < logs.length; i++) {
                          const prevS = logs[i - 1].sleep;
                          const curP = logs[i].pain;
                          if (prevS != null && curP != null) {
                            pts.push({ x: prevS, y: curP });
                          }
                        }

                        return (
                          <>
                            <ScatterPlot points={pts} color="#0d9488" xmin={0} xmax={10} />
                            <p className="text-[10px] text-slate-400 font-medium leading-normal mt-2">
                              Eixo X: Nota do Sono (Noite anterior). Eixo Y: Intensidade da dor (Dia seguinte). Uma tendência descendente sugere que o sono melhor reduz dores.
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Trigger impact bars */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                        Gatilhos Registrados × Impacto na Dor
                      </h4>
                      {(() => {
                        const td = triggerDelta(logs, 3);
                        if (!td.length) {
                          return (
                            <div className="text-center py-10 text-xs text-slate-400">
                              Gatilhos insuficientes. Ative gatilhos no diário diário.
                            </div>
                          );
                        }
                        return (
                          <>
                            <BarChart items={td} signed={true} labelW={135} />
                            <p className="text-[10px] text-slate-400 font-medium leading-normal mt-2">
                              Diferença de dor nos dias com gatilho vs. dias sem gatilho.
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Day of the week bar chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                    <h3 className="font-poppins font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Intensidade da Dor Média por Dia da Semana
                    </h3>
                    {(() => {
                      const daysNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                      const sums: number[][] = [[], [], [], [], [], [], []];
                      logs.forEach((l) => {
                        if (l.pain != null) {
                          const dow = new Date(l.date + 'T00:00:00').getDay();
                          sums[dow].push(l.pain);
                        }
                      });

                      const barItems = daysNames.map((n, i) => ({
                        label: n,
                        value: sums[i].length ? sums[i].reduce((a, b) => a + b, 0) / sums[i].length : 0,
                        color: '#f43f5e'
                      })).filter((it) => it.value > 0);

                      if (!barItems.length) {
                        return <div className="text-center py-6 text-xs text-slate-400">Sem dados.</div>;
                      }

                      return <BarChart items={barItems} labelW={100} minScale={10} />;
                    })()}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: CORRELAÇÕES CUSTOMIZADAS */}
              {chartsSubTab === 'sensibilidade' && (
                <CorrelationViewer logs={logs} />
              )}

              {/* TAB CONTENT 4: HISTÓRICO & FILTROS */}
              {chartsSubTab === 'logs' && (
                <FilterLogs logs={logs} />
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <Achievements
              patientData={pd}
              logs={logs}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'geminianalysis' && (
            <GeminiAnalyses
              patientData={pd}
              logs={logs}
            />
          )}

          {activeTab === 'alert' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Alerta Multidimensional de Crise (Flares)
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Alertas calculados de forma personalizada com base em desvios relevantes do seu próprio padrão de sintomas habitual.
                </p>
              </div>

              {riskResult.enough ? (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-4">
                    <div
                      className={`text-5xl font-black ${
                        riskResult.level === 'LOW'
                          ? 'text-emerald-500'
                          : riskResult.level === 'MODERATE'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {riskResult.score.toFixed(1)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Score de Risco (0,0 a 5,0)
                    </span>

                    <span
                      className={`inline-block font-bold text-xs uppercase px-4 py-1.5 rounded-full ${
                        riskResult.level === 'LOW'
                          ? 'bg-emerald-50 text-emerald-600'
                          : riskResult.level === 'MODERATE'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      RISCO {riskResult.level === 'LOW' ? 'BAIXO' : riskResult.level === 'MODERATE' ? 'ATENÇÃO' : 'ALTO'}
                    </span>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed border-t border-slate-50 dark:border-slate-800/60 pt-4">
                      {riskResult.rec}
                    </p>
                  </div>

                  {/* Dimensions Breakdown */}
                  {showScientificMetrics ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                      <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
                        Breakdown de Desvios (Z-Score)
                      </h3>
                      <div className="space-y-3.5">
                        {riskResult.dims.map((d) => {
                          return (
                            <div key={d.key} className="flex items-center gap-3">
                              <span className="w-16 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {d.label}
                              </span>
                              <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    d.z < 1.0
                                      ? 'bg-emerald-500'
                                      : d.z < 2.0
                                      ? 'bg-amber-400'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (d.z / 3.0) * 100)}%` }}
                                />
                              </div>
                              <span
                                className={`w-12 text-right text-[11px] font-black ${
                                  d.z < 1.0
                                    ? 'text-emerald-500'
                                    : d.z < 2.0
                                    ? 'text-amber-500'
                                    : 'text-rose-500'
                                }`}
                              >
                                Z={d.z.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center py-6 space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Os desvios matemáticos detalhados (Z-scores de sensibilização) estão ocultos por padrão para manter sua experiência de acompanhamento mais leve e sem estresse clínico.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleScientificMetrics(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" /> Ver Desvios Clínicos (Z-Score)
                      </button>
                    </div>
                  )}

                  {/* Patterns */}
                  {riskResult.patterns.length > 0 && (
                    <div className="bg-amber-50/10 border border-amber-500/30 p-5 rounded-2xl space-y-3">
                      <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                        ⚠️ Padrões Cíclicos e Comorbidades Cruzados
                      </h4>
                      <div className="space-y-2">
                        {riskResult.patterns.map((pat, idx) => (
                          <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            • {pat}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <h3 className="font-poppins font-bold text-sm text-slate-700 dark:text-slate-300 mt-2">Mapeamento em calibração</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                    Precisamos de pelo menos 3 diários de sintomas no seu histórico para traçar seu padrão habitual de saúde e variações. Atualmente você tem {logs.length} registro(s).
                  </p>
                </div>
              )}

              {/* Specialist Referral Alerts Section */}
              {(() => {
                const diagnoses = pd.diagnoses || {};
                const lastPHQ9 = (pd.metrics || []).filter((m) => m.type === 'PHQ9').sort((a, b) => b.date.localeCompare(a.date))[0];
                const lastGAD7 = (pd.metrics || []).filter((m) => m.type === 'GAD7').sort((a, b) => b.date.localeCompare(a.date))[0];
                const lastCSI7 = (pd.metrics || []).filter((m) => m.type === 'CSI7').sort((a, b) => b.date.localeCompare(a.date))[0];

                const scorePHQ9 = lastPHQ9?.score ?? 0;
                const scoreGAD7 = lastGAD7?.score ?? 0;

                const allPossibleSpecs: any[] = [];

                // 0. REUMATOLOGISTA
                if (diagnoses.fibromialgia || diagnoses.osteoartrite || diagnoses.ar || diagnoses.espondiloartrite || diagnoses.psoriasica || diagnoses.les || diagnoses.sjogren) {
                  allPossibleSpecs.push({
                    role: 'Reumatologista',
                    isRheum: true,
                    urgency: 'Principal de Cuidado',
                    color: 'text-teal-800 bg-teal-50/70 border-teal-200 dark:bg-teal-950/25 dark:text-teal-300 dark:border-teal-900/40',
                    desc: 'Médico especialista central para o diagnóstico, controle clínico e acompanhamento de condições reumáticas, inflamatórias e síndromes de dor crônica amplificada. Essencial para ajustar medicamentos e coordenar sua jornada de tratamento.'
                  });
                }

                // 1. Ginecologista Especializado
                if (diagnoses.endometriose) {
                  allPossibleSpecs.push({
                    role: 'Ginecologista Especializado',
                    isGyn: true,
                    urgency: 'Principal de Cuidado',
                    color: 'text-rose-800 bg-rose-50/70 border-rose-200 dark:bg-rose-950/25 dark:text-rose-300 dark:border-rose-900/40',
                    desc: 'Indispensável para o cuidado integrado da endometriose. Apoia na regulação hormonal, controle do ciclo menstrual, avaliação de sintomas pélvicos e prevenção de dores cíclicas.'
                  });
                }

                // 2. Neurologista
                if (diagnoses.migrainea) {
                  allPossibleSpecs.push({
                    role: 'Neurologista de Cefaleias',
                    isNeuro: true,
                    urgency: 'Especialista Recomendado',
                    color: 'text-purple-800 bg-purple-50/70 border-purple-200 dark:bg-purple-950/25 dark:text-purple-300 dark:border-purple-900/40',
                    desc: 'Auxilia no tratamento preventivo da enxaqueca (migrânea) para acalmar as vias neurais cefálicas, evitando que o sistema nervoso fique hipersensível a outros estímulos (sensibilização central).'
                  });
                }

                // 3. Gastroenterologista
                if (diagnoses.sii) {
                  allPossibleSpecs.push({
                    role: 'Gastroenterologista',
                    isGastro: true,
                    urgency: 'Especialista Recomendado',
                    color: 'text-amber-800 bg-amber-50/70 border-amber-200 dark:bg-amber-950/25 dark:text-amber-300 dark:border-amber-900/40',
                    desc: 'Importante no manejo da Síndrome do Intestino Irritável (SII), atuando para acalmar a hipersensibilidade visceral e equilibrar a comunicação entre o cérebro e o sistema digestivo.'
                  });
                }

                // 4. Fisiatra (Médico de Reabilitação)
                if (diagnoses.miofascial || diagnoses.fibromialgia) {
                  allPossibleSpecs.push({
                    role: 'Fisiatra (Medicina Física)',
                    isPhysiatrist: true,
                    urgency: 'Recomendado',
                    color: 'text-indigo-800 bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/25 dark:text-indigo-300 dark:border-indigo-900/40',
                    desc: 'Médico especialista em reabilitação corporal e tratamento clínico de dores crônicas musculares. Coordena terapias físicas e pode realizar procedimentos de agulhamento para desativar nós de tensão muscular (pontos-gatilho).'
                  });
                }

                // 5. Fisioterapeuta Especializado
                allPossibleSpecs.push({
                  role: 'Fisioterapeuta de Dor',
                  isPhysio: true,
                  urgency: 'Recomendado',
                  color: 'text-emerald-800 bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900/40',
                  desc: 'Ajuda seu corpo a recuperar a segurança e o prazer no movimento por meio de terapias manuais e exercícios graduais, reduzindo a hipersensibilidade corporal e ajudando a perder o medo de se mover (cinesiofobia).'
                });

                // 6. Educador Físico / Personal Trainer
                allPossibleSpecs.push({
                  role: 'Educador Físico / Treinador',
                  isPersonal: true,
                  urgency: 'Apoio de Rotina',
                  color: 'text-lime-800 bg-lime-50/70 border-lime-200 dark:bg-lime-950/25 dark:text-lime-300 dark:border-lime-900/40',
                  desc: 'Orienta a prática de atividades físicas de forma segura, regular e sem picos de esforço. Ensina como manter a regularidade dos exercícios sem desencadear crises de dor (respeitando o controle de ritmo ativo).'
                });

                // 7. Terapeuta Ocupacional
                if (diagnoses.fibromialgia || diagnoses.ar || diagnoses.miofascial || diagnoses.les || diagnoses.psoriasica) {
                  allPossibleSpecs.push({
                    role: 'Terapeuta Ocupacional',
                    isOT: true,
                    urgency: 'Apoio de Rotina',
                    color: 'text-cyan-800 bg-cyan-50/70 border-cyan-200 dark:bg-cyan-950/25 dark:text-cyan-300 dark:border-cyan-900/40',
                    desc: 'Ensina adaptações práticas para suas atividades domésticas e de trabalho, ajudando você a economizar energia nas tarefas diárias e organizar sua rotina para evitar fadiga extrema.'
                  });
                }

                // 8. Psicólogo Clínico
                allPossibleSpecs.push({
                  role: 'Psicólogo(a) Clínico (TCC)',
                  isPsych: true,
                  urgency: (scorePHQ9 > 4 || scoreGAD7 > 4) ? 'Altamente Recomendado' : 'Recomendado',
                  color: 'text-blue-800 bg-blue-50/70 border-blue-200 dark:bg-blue-950/25 dark:text-blue-300 dark:border-blue-900/40',
                  desc: 'Oferece suporte terapêutico cognitivo-comportamental especializado para dores de longa duração. Ensina técnicas práticas para gerenciar o estresse, lidar com preocupações e acalmar o sistema nervoso.'
                });

                // 9. Psiquiatra de Apoio
                if (scorePHQ9 >= 10 || scoreGAD7 >= 10) {
                  allPossibleSpecs.push({
                    role: 'Psiquiatra de Apoio',
                    isPsychiatrist: true,
                    urgency: 'Sugerido',
                    color: 'text-pink-800 bg-pink-50/70 border-pink-200 dark:bg-pink-950/25 dark:text-pink-300 dark:border-pink-900/40',
                    desc: 'Oferece avaliação médica se as oscilações de humor ou ansiedade estiverem muito acentuadas. Auxilia com medicações seguras que têm dupla ação: ajudam a equilibrar o sono e acalmam os caminhos da dor física.'
                  });
                }

                // Prioritization: we select exactly 1 to 2 preferential specialties
                const preferentials: any[] = [];
                const secondaries: any[] = [];

                // 1st Priority: Reumatologista if there are rheumatic conditions
                const rheumSpec = allPossibleSpecs.find(s => s.isRheum);
                if (rheumSpec) {
                  preferentials.push({ ...rheumSpec, urgency: 'Preferencial Principal' });
                }

                // 2nd Priority: Endometriose/Ginecologista or Migrânea/Neurologista
                const gynSpec = allPossibleSpecs.find(s => s.isGyn);
                if (gynSpec && preferentials.length < 2) {
                  preferentials.push({ ...gynSpec, urgency: 'Preferencial Principal' });
                }
                const neuroSpec = allPossibleSpecs.find(s => s.isNeuro);
                if (neuroSpec && preferentials.length < 2) {
                  preferentials.push({ ...neuroSpec, urgency: 'Preferencial Principal' });
                }

                // 3rd Priority: Psicólogo if high stress/mood score
                const psychSpec = allPossibleSpecs.find(s => s.isPsych);
                if (psychSpec && (scorePHQ9 >= 10 || scoreGAD7 >= 10) && preferentials.length < 2) {
                  preferentials.push({ ...psychSpec, urgency: 'Preferencial Principal' });
                }

                // Fallbacks to fill up to 1-2 preferentials
                allPossibleSpecs.forEach(spec => {
                  if (preferentials.length < 2 && !preferentials.find(p => p.role === spec.role)) {
                    if (spec.isRheum || spec.isPhysio || spec.isPsych) {
                      preferentials.push({ ...spec, urgency: 'Preferencial Principal' });
                    }
                  }
                });

                // Anything not selected as preferential is a secondary
                allPossibleSpecs.forEach(spec => {
                  if (!preferentials.find(p => p.role === spec.role)) {
                    secondaries.push(spec);
                  }
                });

                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-6">
                    {/* TITLE */}
                    <div>
                      <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
                        Direcionamento de Apoio & Especialidades Recomendadas
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                        Com base nos seus sintomas, variações emocionais e diagnósticos cadastrados, o aplicativo organiza e prioriza as especialidades recomendadas para o seu cuidado integral.
                      </p>
                    </div>

                    {/* PREFERENTIALS (HIGHLIGHTED) */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                        <svg className="w-3 h-3 text-teal-500 fill-teal-500" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span>Parcerias Preferenciais sugeridas (Principais de Cuidado)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {preferentials.map((sp, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 text-xs transition-all ring-1 ring-black/5 dark:ring-white/5 ${sp.color}`}>
                            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-1.5">
                              <span className="font-bold text-[13px]">{sp.role}</span>
                              <span className="text-[8px] font-black uppercase tracking-wider bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-200 font-sans">
                                {sp.urgency}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-95">{sp.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECONDARIES (COLLAPSED OR CLEANLY LISTED BELOW) */}
                    {secondaries.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-slate-850">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                          <span>Outras Especialidades que também podem ajudar</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {secondaries.slice(0, 3).map((sp, idx) => ( // limit list to avoid overload, as requested by user
                            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-300 space-y-2 text-xs">
                              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                <span className="font-semibold text-[12px] text-slate-800 dark:text-slate-200">{sp.role}</span>
                                <span className="text-[8px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-md">
                                  Auxiliar
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                <strong>Como ajuda:</strong> {sp.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'mood' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Brain className="w-5 h-5 text-teal-500" /> Saúde Mental & Estratégias de Autorregulação
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Gerencie seu estresse, aprenda técnicas cognitivas (TCC), realize sessões de respiração coerente e preencha questionários de avaliação clínica.
                </p>
              </div>

              <MentalHealthSupport
                patientData={pd}
                logs={logs}
                onSaveLog={handleSaveLog}
                onSaveMetric={handleSaveMetric}
              />
            </div>
          )}

          {activeTab === 'doctor' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  Meus Profissionais de Saúde
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Cadastre múltiplos profissionais para compartilhar seus registros diários, desvios clínicos e métricas em tempo real de forma integrada.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* FORM COLUMN */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">
                    Sincronizar Novo Profissional
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Se seu médico de confiança, fisioterapeuta ou psicólogo possui cadastro na rede RITMA, solicite a ele seu código alfanumérico exclusivo para sincronizar seus dados.
                  </p>
                  <form onSubmit={handleLinkDoctor} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label htmlFor="doc-code-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block cursor-pointer">
                        Código do Profissional
                      </label>
                      <input
                        id="doc-code-input"
                        className="inp uppercase text-center text-md font-bold tracking-widest shadow-sm"
                        placeholder="Ex: ROBE-9843"
                        value={docCodeInput}
                        onChange={(e) => setDocCodeInput(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-teal-500/10"
                    >
                      Enviar Solicitação de Vínculo
                    </button>
                  </form>
                </div>

                {/* LIST COLUMN */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Profissionais Vinculados</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-sans font-semibold">
                      {patientLinks.length}
                    </span>
                  </h4>

                  {patientLinks.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-400">
                        Nenhum profissional cadastrado ou compartilhado ainda. Use o painel ao lado para cadastrar seu primeiro profissional.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientLinks.map((link) => {
                        const docAcc = data.accounts.find((a) => a.id === link.doctorId);
                        if (!docAcc) return null;

                        return (
                          <div
                            key={link.doctorId}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">
                                  Dr(a). {docAcc.name}
                                </h3>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                  {docName(docAcc.specialty)} · {getCouncilLabel(docAcc.specialty)}{' '}
                                  {docAcc.crm?.number}/{docAcc.crm?.uf}
                                </p>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                  link.status === 'authorized'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                }`}
                              >
                                {link.status === 'authorized' ? '✓ Ativo e Compartilhado' : '⏰ Aguardando Autorização'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 leading-normal leading-relaxed">
                              {link.status === 'authorized'
                                ? 'Seu profissional de saúde tem acesso seguro a todos os seus diários de dor crônica, médias, análises de evolução de sintomas e métricas de acompanhamento em tempo real diretamente na tela dele.'
                                : 'A solicitação de vínculo clínico foi enviada. O profissional precisa aceitar e validar na fila de prontuários pendentes do consultório dele.'}
                            </p>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-850">
                              <span className="text-[10px] text-slate-400 font-medium">
                                Adicionado em: {fmtDate(link.createdAt, 's')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRevokeLink(link.doctorId)}
                                className="px-3 py-1.5 border border-slate-100 hover:border-rose-100 hover:bg-rose-50/50 dark:border-slate-800 dark:hover:border-rose-950/50 text-[10px] font-bold text-rose-500 rounded-lg transition-colors cursor-pointer"
                              >
                                Encerrar Vínculo
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                    Relógios & Dispositivos Inteligentes
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Sincronize passos, sono e biomarcadores de estresse (HRV) do seu wearable para mapear flutuações e prever crises.
                  </p>
                </div>

                {connectedDevices.length > 0 && syncingState === 'idle' && (
                  <button
                    onClick={handleSyncWearables}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/10 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    Sincronizar Relógio
                  </button>
                )}
              </div>

              {/* SYNC PROGRESS DISPLAY */}
              {syncingState !== 'idle' && (
                <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-6 rounded-2xl shadow-lg border border-teal-500/30 space-y-4 animate-pulse-slow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center">
                        {syncingState === 'done' ? (
                          <Check className="w-4 h-4 text-teal-400" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">
                          {syncingState === 'connecting' && 'Iniciando Conexão...'}
                          {syncingState === 'fetching' && 'Transferindo Telemetria...'}
                          {syncingState === 'processing' && 'Analisando Sinais Biológicos...'}
                          {syncingState === 'done' && 'Sincronização Concluída!'}
                        </h3>
                        <p className="text-[11px] text-teal-300 font-medium">
                          {syncProgress}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-teal-900/50 px-2 py-1 rounded text-teal-300 border border-teal-500/20">
                      {syncingState === 'connecting' && '20%'}
                      {syncingState === 'fetching' && '50%'}
                      {syncingState === 'processing' && '85%'}
                      {syncingState === 'done' && '100%'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-400 h-full transition-all duration-500"
                      style={{
                        width:
                          syncingState === 'connecting'
                            ? '20%'
                            : syncingState === 'fetching'
                            ? '50%'
                            : syncingState === 'processing'
                            ? '85%'
                            : '100%'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* SUB TABS NAVIGATION */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 pb-px">
                <button
                  onClick={() => setActiveWearableSubTab('dashboard')}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
                    activeWearableSubTab === 'dashboard'
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📊 Biomarcadores Sincronizados
                </button>
                <button
                  onClick={() => setActiveWearableSubTab('connect')}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
                    activeWearableSubTab === 'connect'
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🔌 Aplicativos & Relógios ({connectedDevices.length})
                </button>
              </div>

              {/* TAB 1: BIOMARKERS DASHBOARD */}
              {activeWearableSubTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* If no devices are connected */}
                  {connectedDevices.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                      <span className="text-4xl block">🔌</span>
                      <h3 className="font-poppins font-bold text-sm text-slate-700 dark:text-slate-200">
                        Nenhum relógio conectado
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Conecte seu Apple Watch, Google Fit ou Garmin na aba "Aplicativos & Relógios" para habilitar a coleta automática de sinais vitais.
                      </p>
                      <button
                        onClick={() => setActiveWearableSubTab('connect')}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                      >
                        Ver Dispositivos Disponíveis
                      </button>
                    </div>
                  ) : !logs.some((l) => l.wearableSync) ? (
                    /* Connected but not yet synced */
                    <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-500 text-xl font-bold animate-pulse">
                        <Watch className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-poppins font-bold text-sm text-slate-700 dark:text-slate-200">
                          {connectedDevices[0]} Vinculado com Sucesso!
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                          Sua conta está integrada de forma segura. Agora precisamos realizar a primeira sincronização para baixar suas métricas dos últimos 7 dias.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncWearables}
                        className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/10 transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        Sincronizar Dados de Saúde
                      </button>
                    </div>
                  ) : (
                    /* Connected and synced */
                    <div className="space-y-6">
                      {/* STATS WIDGETS GRID */}
                      {(() => {
                        const syncedLogs = logs.filter((l) => l.wearableSync);
                        const latestLog = syncedLogs[syncedLogs.length - 1];
                        const latestTelemetry = latestLog?.wearableSync || {};
                        
                        // Compute averages of last 7 days
                        const avgSteps = Math.round(syncedLogs.reduce((acc, curr) => acc + (curr.wearableSync?.steps || 0), 0) / syncedLogs.length);
                        const avgSleep = (syncedLogs.reduce((acc, curr) => acc + (curr.wearableSync?.sleepHours || 0), 0) / syncedLogs.length).toFixed(1);
                        const avgHrv = Math.round(syncedLogs.reduce((acc, curr) => acc + (curr.wearableSync?.hrv || 0), 0) / syncedLogs.length);
                        
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* STEPS WIDGET */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Passos & Pacing Ativo
                                    </span>
                                    <h4 className="font-poppins font-black text-2xl text-slate-800 dark:text-slate-100">
                                      {latestTelemetry.steps?.toLocaleString('pt-BR') || 0}{' '}
                                      <span className="text-xs font-semibold text-slate-400">hoje</span>
                                    </h4>
                                  </div>
                                  <span className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl text-lg">
                                    🏃‍♂️
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>Meta Diária: 10k</span>
                                    <span>Média: {avgSteps.toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full transition-all"
                                      style={{ width: `${Math.min(((latestTelemetry.steps || 0) / 10000) * 100, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded mr-1.5 inline-block select-none">Fisiológico</span> <strong>Regra de Pacing:</strong> Evite picos abruptos de passos (ex: fazer 15k após dias de repouso). Manter regularidade protege contra rebotes de dor.
                                </p>
                              </div>

                              {/* SLEEP WIDGET */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Qualidade do Sono
                                    </span>
                                    <h4 className="font-poppins font-black text-2xl text-blue-500 dark:text-blue-400">
                                      {latestTelemetry.sleepHours || 0}h{' '}
                                      <span className="text-xs font-semibold text-slate-400">
                                        ({latestTelemetry.sleepQuality}% qual.)
                                      </span>
                                    </h4>
                                  </div>
                                  <span className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl text-lg">
                                    <Moon className="w-5 h-5" />
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>Estágios Profundo/REM adequados</span>
                                    <span>Média Semanal: {avgSleep}h</span>
                                  </div>
                                  <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-300 dark:bg-blue-400 w-[20%]" title="Sono REM" />
                                    <div className="bg-blue-500 dark:bg-blue-600 w-[25%]" title="Sono Profundo" />
                                    <div className="bg-blue-200 dark:bg-blue-800 w-[45%]" title="Sono Leve" />
                                    <div className="bg-rose-200 dark:bg-rose-950/50 w-[10%]" title="Acordado" />
                                  </div>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 px-1.5 py-0.5 rounded mr-1.5 inline-block select-none">Fisiológico</span> <strong>Sono & Hiperalgesia:</strong> A privação crônica de sono REM diminui o limiar de dor física no dia seguinte devido à sobrecarga cortical.
                                </p>
                              </div>

                              {/* HRV & STRESS WIDGET */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Estresse Biológico (HRV)
                                    </span>
                                    <h4 className="font-poppins font-black text-2xl text-purple-500 dark:text-purple-400">
                                      {latestTelemetry.hrv || 0}{' '}
                                      <span className="text-xs font-semibold text-slate-400">ms rMSSD</span>
                                    </h4>
                                  </div>
                                  <span className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl text-lg">
                                    <Heart className="w-5 h-5 text-purple-500" />
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>Batimentos de repouso: {latestTelemetry.restingHeartRate} bpm</span>
                                    <span>Média HRV: {avgHrv} ms</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                    <div
                                      className="bg-purple-500 h-full rounded-full transition-all"
                                      style={{ width: `${Math.min(((latestTelemetry.hrv || 0) / 90) * 100, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/40 px-1.5 py-0.5 rounded mr-1.5 inline-block select-none">Fisiológico</span> <strong>Estresse do Nervo Vago:</strong> Um HRV em queda indica que seu corpo está lutando contra sobrecarga, mesmo antes de você sentir dor consciente.
                                </p>
                              </div>
                            </div>

                            {/* CORRELATION ANALYSIS SECTION */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800/80 pb-3">
                                <div>
                                  <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">
                                    Análise Dinâmica de Correlação (Clínica)
                                  </h3>
                                  <p className="text-[11px] text-slate-400">
                                    Entenda visualmente como as flutuações capturadas pelo relógio influenciam diretamente seus sintomas diários.
                                  </p>
                                </div>

                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-center">
                                  <button
                                    onClick={() => setSelectedCorrelation('hrv-pain')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                      selectedCorrelation === 'hrv-pain'
                                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    HRV vs Dor
                                  </button>
                                  <button
                                    onClick={() => setSelectedCorrelation('sleep-fatigue')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                      selectedCorrelation === 'sleep-fatigue'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    Sono vs Cansaço
                                  </button>
                                  <button
                                    onClick={() => setSelectedCorrelation('steps-pain')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                      selectedCorrelation === 'steps-pain'
                                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    Passos vs Dor
                                  </button>
                                </div>
                              </div>

                              {/* CHART VIEW */}
                              <div className="h-[280px] w-full text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart
                                    data={syncedLogs.map((l) => ({
                                      dataFmt: l.date.substring(8, 10) + '/' + l.date.substring(5, 7),
                                      Dor: l.pain ?? 0,
                                      Fadiga: l.fatigue ?? 0,
                                      HRV: l.wearableSync?.hrv ?? 0,
                                      SonoHoras: l.wearableSync?.sleepHours ?? 0,
                                      Passos: l.wearableSync?.steps ?? 0
                                    }))}
                                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="dataFmt" tickLine={false} axisLine={false} stroke="#94a3b8" />
                                    
                                    {/* Dual axis mapping */}
                                    <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#94a3b8" domain={[0, 'auto']} />
                                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#94a3b8" domain={[0, 10]} />
                                    
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '11px',
                                        border: 'none'
                                      }}
                                    />
                                    <RechartsLegend verticalAlign="top" height={36} iconType="circle" />

                                    {selectedCorrelation === 'hrv-pain' && (
                                      <>
                                        <Area yAxisId="right" type="monotone" dataKey="Dor" fill="#fda4af" stroke="#f43f5e" fillOpacity={0.15} name="Intensidade da Dor (0-10)" />
                                        <RechartsLine yAxisId="left" type="monotone" dataKey="HRV" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} name="Variabilidade Cardíaca (HRV ms)" />
                                      </>
                                    )}

                                    {selectedCorrelation === 'sleep-fatigue' && (
                                      <>
                                        <RechartsBar yAxisId="left" dataKey="SonoHoras" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Duração do Sono (Horas)" maxBarSize={30} />
                                        <RechartsLine yAxisId="right" type="monotone" dataKey="Fadiga" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Fadiga Clinica (0-10)" />
                                      </>
                                    )}

                                    {selectedCorrelation === 'steps-pain' && (
                                      <>
                                        <RechartsBar yAxisId="left" dataKey="Passos" fill="#10b981" radius={[4, 4, 0, 0]} name="Passos Diários" maxBarSize={30} />
                                        <RechartsLine yAxisId="right" type="monotone" dataKey="Dor" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} name="Nível de Dor (0-10)" />
                                      </>
                                    )}
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>

                              {/* CLINICAL CORRELATION FEEDBACK PANEL */}
                              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                                <h4 className="font-poppins font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <span>🔍</span> Interpretação Clínica da Tendência
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {selectedCorrelation === 'hrv-pain' && (
                                    "A correlação revela um acoplamento clássico: em dias onde o HRV caiu abaixo de 45ms, a dor reportada tendeu a aumentar nas 24-48 horas subsequentes. Isto comprova que o estresse do sistema nervoso autônomo (tonus simpático elevado) reduz os mecanismos naturais de supressão de dor, tornando os tecidos e sinapses mais sensíveis."
                                  )}
                                  {selectedCorrelation === 'sleep-fatigue' && (
                                    "Note como noites com menos de 7 horas de sono mapeadas pelo relógio desencadeiam episódios severos de fadiga no dia seguinte. O sono reparador é o principal regulador dos estoques de energia celular e do clareamento de citocinas inflamatórias centrais."
                                  )}
                                  {selectedCorrelation === 'steps-pain' && (
                                    "Analisar a consistência dos passos é essencial. O gráfico ideal deve ser plano e regular (pacing ativo). Picos repentinos de passos seguidos por vales de repouso forçado revelam o ciclo vicioso de 'boom-and-bust' (fazer esforço demais e depois sofrer recaída), que deve ser evitado."
                                  )}
                                </p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONNECT PROVIDERS LIST */}
              {activeWearableSubTab === 'connect' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        id: 'Apple Health',
                        name: 'Apple Health (Apple Watch)',
                        icon: '🍏',
                        desc: 'Sincroniza passos, frequência cardíaca em repouso, sono profundo e variabilidade de FC de forma automática via HealthKit.',
                        color: 'border-rose-100 dark:border-rose-950'
                      },
                      {
                        id: 'Google Fit',
                        name: 'Google Fit / Health Connect',
                        icon: '🤖',
                        desc: 'Sincronize as informações coletadas pelo seu relógio Android, WearOS, Samsung ou Pixel Watch através da API do Google.',
                        color: 'border-sky-100 dark:border-sky-950'
                      },
                      {
                        id: 'Fitbit',
                        name: 'Fitbit Integration',
                        icon: '💎',
                        desc: 'Baixe diretamente os dados de estresse diário, passos consolidados e pontuação de sono reparador da nuvem Fitbit.',
                        color: 'border-teal-100 dark:border-teal-950'
                      },
                      {
                        id: 'Garmin Connect',
                        name: 'Garmin Connect',
                        icon: '🧭',
                        desc: 'Para atletas e pacientes ativos, sincronize métricas refinadas de esforço físico, Body Battery e estresse do Garmin.',
                        color: 'border-blue-100 dark:border-blue-950'
                      },
                      {
                        id: 'Samsung Health',
                        name: 'Samsung Health',
                        icon: '📱',
                        desc: 'Integre os dados biológicos gravados nos relógios da linha Galaxy Watch de forma nativa e sem fricção.',
                        color: 'border-indigo-100 dark:border-indigo-950'
                      },
                      {
                        id: 'Oura Ring',
                        name: 'Oura Ring App',
                        icon: '⭕',
                        desc: 'Ideal para monitorar prontidão física, temperatura corporal da pele, HRV noturno de alta precisão e estágios de sono.',
                        color: 'border-amber-100 dark:border-amber-950'
                      },
                      {
                        id: 'Whoop',
                        name: 'Whoop Strap',
                        icon: '🔋',
                        desc: 'Monitore o estresse diário em tempo real, capacidade de recuperação do sistema cardiovascular e carga de sono profunda.',
                        color: 'border-slate-100 dark:border-slate-950'
                      },
                      {
                        id: 'Strava',
                        name: 'Strava Pacing',
                        icon: '🏃‍♂️',
                        desc: 'Ideal para correlacionar exercícios de caminhada e ciclismo com seus níveis de exaustão e controle de carga de esforço.',
                        color: 'border-orange-100 dark:border-orange-950'
                      }
                    ].map((dev) => {
                      const isConnected = connectedDevices.includes(dev.id);
                      return (
                        <div
                          key={dev.id}
                          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                            isConnected
                              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/5 dark:bg-emerald-950/5'
                              : dev.color
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl">{dev.icon}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isConnected
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isConnected ? '● Conectado' : 'Disponível'}
                              </span>
                            </div>

                            <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100">
                              {dev.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              {dev.desc}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {isConnected ? 'Sincronizado' : 'Não conectado'}
                            </span>
                            
                            <button
                              onClick={() => {
                                if (isConnected) {
                                  setConnectedDevices((prev) => prev.filter((id) => id !== dev.id));
                                } else {
                                  setConnectingDeviceName(dev.id);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isConnected
                                  ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200'
                              }`}
                            >
                              {isConnected ? 'Desconectar' : 'Conectar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* MANUAL FILES IMPORT ZONE */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                      <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">
                        📥 Importador Manual de Arquivos de Saúde (JSON, XML, ZIP)
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                        Prefere sincronizar de forma totalmente offline? Exporte os dados brutos de exportação (Google Takeout, Apple Health XML ou backup de outros apps clássicos) e arraste-os abaixo para processamento local imediato.
                      </p>
                    </div>

                    {importingState === 'idle' || importingState === 'dragging' ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setImportingState('dragging');
                        }}
                        onDragLeave={() => setImportingState('idle')}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            const name = files[0].name;
                            setImportedFileName(name);
                            setImportingState('loading');
                            
                            // Simulate processing health telemetry
                            setTimeout(() => {
                              setImportingState('success');
                              handleSyncWearables();
                            }, 1800);
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.json,.xml,.zip,.txt';
                          input.onchange = (e: any) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const name = files[0].name;
                              setImportedFileName(name);
                              setImportingState('loading');
                              
                              setTimeout(() => {
                                setImportingState('success');
                                handleSyncWearables();
                              }, 1800);
                            }
                          };
                          input.click();
                        }}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                          importingState === 'dragging'
                            ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 scale-[0.99]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50/50 dark:bg-slate-950/20'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Arraste e solte seu arquivo de saúde aqui
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          ou clique para selecionar do seu computador (Suporta .json, .xml, .zip de backups clássicos)
                        </p>
                      </div>
                    ) : importingState === 'loading' ? (
                      <div className="border border-teal-100 dark:border-teal-900 bg-teal-50/30 dark:bg-teal-950/10 rounded-2xl p-8 text-center space-y-3">
                        <RefreshCw className="w-7 h-7 text-teal-500 mx-auto animate-spin" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Analisando estrutura de arquivo: <span className="font-mono text-teal-600 dark:text-teal-400">{importedFileName}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Extraindo registros temporais de passos, estágios de sono e telemetria cardíaca...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-emerald-100 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-2xl p-6 text-center space-y-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Importação de <span className="font-mono text-emerald-600 dark:text-emerald-400">{importedFileName}</span> concluída!
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Sincronizamos com sucesso 7 dias de dados retrospectivos de sono e variabilidade cardíaca no seu diário.
                          </p>
                        </div>
                        <button
                          onClick={() => setImportingState('idle')}
                          className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-lg transition-all"
                        >
                          Importar Outro Arquivo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SIMULATED AUTHORIZATION MODAL SHEET */}
              {connectingDeviceName && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-scale-in">
                    <div className="text-center space-y-2">
                      <span className="text-4xl block">🔐</span>
                      <h3 className="font-poppins font-black text-slate-800 dark:text-slate-100 text-sm">
                        Autorizar Conexão Clínica
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        O aplicativo <strong>RITMA</strong> solicita acesso de leitura seguro à sua conta do <strong>{connectingDeviceName}</strong>.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1.5 select-none">
                        Dados Solicitados (Leitura):
                      </p>

                      <div className="space-y-2.5">
                        {[
                          { key: 'steps', label: 'Passos e Atividade Física', desc: 'Para pacing ativo de sintomas.' },
                          { key: 'sleep', label: 'Sono e Estágios (Profundo/REM)', desc: 'Para identificar hipersonia e insônias.' },
                          { key: 'hrv', label: 'Variabilidade Cardíaca (HRV)', desc: 'Para medir estresse autônomo e dor.' },
                          { key: 'restingHr', label: 'Frequência Cardíaca de Repouso', desc: 'Como sinalizador de inflamação.' }
                        ].map((perm) => (
                          <label key={perm.key} htmlFor={`device-perm-${perm.key}`} className="flex gap-3 items-start cursor-pointer select-none">
                            <input
                              id={`device-perm-${perm.key}`}
                              type="checkbox"
                              defaultChecked
                              className="accent-teal-500 h-4 w-4 mt-0.5 flex-shrink-0"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                {perm.label}
                              </span>
                              <span className="text-[10px] text-slate-400 block leading-none mt-0.5">
                                {perm.desc}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setConnectingDeviceName(null)}
                        className="flex-1 py-2 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => {
                          const devId = connectingDeviceName;
                          if (devId) {
                            setConnectedDevices((prev) => [...prev, devId]);
                          }
                          setConnectingDeviceName(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all"
                      >
                        Autorizar Acesso
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notif' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 mb-1 tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-teal-500" /> Avisos e Lembretes do Aplicativo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notificações automáticas do RITMA: lembretes de registros diários, acompanhamento de métricas e alteração de parâmetros basais
                </p>
              </div>

              {(() => {
                const todayDone = logs.some((l) => l.date === todayISO());
                const weightVal = pd?.weight || 70;
                const waterTarget = Math.round(weightVal * 35);
                const activeMedsCount = pd?.medications?.length || 0;

                const appNotifs = [
                  // 1. Daily Log Status
                  {
                    id: 'diary-status',
                    icon: Calendar,
                    category: 'REGISTRO DIÁRIO',
                    categoryColor: todayDone
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    title: todayDone ? 'Diário de Hoje Concluído' : 'Lembrete: Diário de Hoje Pendente',
                    description: todayDone
                      ? 'Seus registros de sintomas, dor e disposição do dia de hoje já foram computados com sucesso.'
                      : 'Você ainda não preencheu o diário de hoje. Mantenha seus dados atualizados para identificar variações do ritmo com precisão.',
                    buttonText: todayDone ? 'Ver / Editar Diário' : 'Preencher Diário de Hoje',
                    buttonAction: () => setActiveTab('diary'),
                    buttonColor: todayDone
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  },
                  // 2. Risk / Oscillation Alert (if applicable)
                  ...(riskResult.level !== 'LOW'
                    ? [
                        {
                          id: 'risk-alert',
                          icon: ShieldAlert,
                          category: 'INDICADORES RITMMA',
                          categoryColor:
                            riskResult.level === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                          title:
                            riskResult.level === 'HIGH'
                              ? 'Alerta de Risco Elevado de Crise'
                              : 'Aviso de Oscilação de Sintomas',
                          description:
                            riskResult.level === 'HIGH'
                              ? 'Análise RITMMA: Variação acentuada identificada nos seus parâmetros de dor e fadiga recentemente. Priorize o descanso e a hidratação.'
                              : 'Análise RITMMA: Identificamos pequenas oscilações de sintomas. Fique atento aos sinais do seu corpo e mantenha a rotina de recuperação.',
                          buttonText: 'Ver Painel de Ritmo 360°',
                          buttonAction: () => setActiveTab('home'),
                          buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white'
                        }
                      ]
                    : []),
                  // 3. Basal Parameters & Weight / Hydration Metric
                  {
                    id: 'basal-params',
                    icon: Settings,
                    category: 'PARÂMETROS BASAIS',
                    categoryColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    title: 'Verificação de Parâmetros Basais & Peso',
                    description: `Sua meta hídrica clínica está ajustada para ${waterTarget} ml/dia com base no peso de ${weightVal} kg. Lembre-se de atualizar seu perfil sempre que houver alteração de peso corporal ou parâmetros diagnósticos.`,
                    buttonText: 'Ajustar Dados Basais',
                    buttonAction: () => setActiveTab('settings'),
                    buttonColor: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
                  },
                  // 4. Medications & Routine
                  {
                    id: 'meds-routine',
                    icon: Trophy,
                    category: 'TRATAMENTO & PRESCRIÇÃO',
                    categoryColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                    title: 'Lembrete da Grade de Medicamentos',
                    description: activeMedsCount > 0
                      ? `Você possui ${activeMedsCount} medicamento(s) cadastrado(s) na sua rotina. Verifique se as doses e horários continuam em conformidade com sua prescrição atual.`
                      : 'Nenhum medicamento de uso contínuo cadastrado. Adicione suas medicações para acompanhar a aderência e horários.',
                    buttonText: 'Gerenciar Medicamentos',
                    buttonAction: () => setActiveTab('medications'),
                    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white'
                  },
                  // 5. Body Pain Map
                  {
                    id: 'body-map',
                    icon: Activity,
                    category: 'MAPA CORPORAL',
                    categoryColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
                    title: 'Lembrete de Mapeamento Anatômico',
                    description: 'Identificou novos pontos de dor muscular ou rigidez articular? Mantenha o Mapa Anatômico de Dor atualizado para acompanhamento no seu relatório clínico.',
                    buttonText: 'Mapear Pontos de Dor',
                    buttonAction: () => setActiveTab('bodymap'),
                    buttonColor: 'bg-violet-600 hover:bg-violet-700 text-white'
                  },
                  // 6. Hydration Metric
                  {
                    id: 'hydration-metric',
                    icon: Droplet,
                    category: 'HIDRATAÇÃO CLÍNICA',
                    categoryColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
                    title: 'Lembrete de Ingestão Hídrica Diária',
                    description: `Manter a hidratação adequada é essencial para o controle da rigidez matinal e fadiga. Meta recomendada no seu perfil: ${waterTarget} ml/dia.`,
                    buttonText: 'Ver Parâmetros & Perfil',
                    buttonAction: () => setActiveTab('settings'),
                    buttonColor: 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  }
                ];

                return (
                  <div className="space-y-3">
                    {appNotifs.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.categoryColor}`}>
                                  {item.category}
                                </span>
                                <h4 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">
                                  {item.title}
                                </h4>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium pl-0 sm:pl-10">
                            {item.description}
                          </p>

                          <div className="pt-1 pl-0 sm:pl-10 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={item.buttonAction}
                              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${item.buttonColor}`}
                            >
                              <span>{item.buttonText}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                    Relatório Médico de Evolução
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    Histórico médico consolidado e formatado para impressão rápida no consultório.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-teal-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 font-semibold text-sm"
                  >
                    <Printer className="w-4 h-4" /> Imprimir
                  </button>
                </div>
              </div>

              {/* Printable Medical Sheet */}
              <div
                id="rprt"
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 font-sans"
              >
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-poppins font-black text-teal-500 text-lg">RITMA CLINICAL SUMMARY</h3>
                    <p className="font-semibold text-slate-500 mt-0.5">Ficha de Evolução do Paciente</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                    <p>ID do Prontuário: {account.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Patient metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                      Nome do Paciente
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{account.name}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                      Contato / E-mail
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{account.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800/50 pt-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                      Diagnósticos Ativos
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activeDxs.map((dx) => (
                        <span
                          key={dx}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md"
                        >
                          {DX[dx]?.icon} {DX[dx]?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                      Risco Estimado de Crise
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block mt-1">
                      {riskResult.enough
                        ? `RISCO ${riskResult.level} (${riskResult.score.toFixed(1)}/5.0)`
                        : 'Não calculado por falta de logs'}
                    </span>
                  </div>
                </div>

                {/* KPI metrics last 7 logs */}
                {logs.length > 0 && (
                  <div className="border-t border-slate-50 dark:border-slate-800 pt-4 space-y-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider mb-2">
                      Métricas dos últimos 7 logs diários
                    </span>
                    {(() => {
                      const logs7 = logs.slice(-7);
                      const pains = logs7.map((l) => l.pain).filter((p) => p != null) as number[];
                      const fatigues = logs7.map((l) => l.fatigue).filter((p) => p != null) as number[];
                      const sleeps = logs7.map((l) => l.sleep).filter((p) => p != null) as number[];
                      const funs = logs7.map((l) => l.function).filter((p) => p != null) as number[];

                      const avg = (arr: number[]) =>
                        arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '-';

                      return (
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                            <span className="font-bold block text-sm text-rose-500">{avg(pains)}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase">Dor</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                            <span className="font-bold block text-sm text-amber-500">{avg(fatigues)}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase">Fadiga</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                            <span className="font-bold block text-sm text-blue-500">{avg(sleeps)}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase">Sono</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                            <span className="font-bold block text-sm text-emerald-500">{avg(funs)}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase">Função</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Periodic Metrics history list */}
                {pd?.periodicMetrics.length > 0 && (
                  <div className="border-t border-slate-50 dark:border-slate-800 pt-4 space-y-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                      Histórico Recente de Métricas Científicas
                    </span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {pd.periodicMetrics
                        .slice(-6)
                        .reverse()
                        .map((m, idx) => (
                          <div key={idx} className="flex justify-between py-2 text-sm">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {m.type === 'PHQ9'
                                ? 'PHQ-9: Depressão'
                                : m.type === 'GAD7'
                                ? 'GAD-7: Ansiedade'
                                : m.type === 'CSI7'
                                ? 'CSI-7: Sensibilização Central'
                                : `${DX[m.type]?.icon || '🩺'} ${QS[m.type]?.name.split(':')[0]}`}
                            </span>
                            <span className="font-semibold text-slate-600 dark:text-slate-400">
                              {m.score}/{m.maxScore} (em {fmtDate(m.date, 's')})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
                  Ficha gerada de forma automática pelo aplicativo RITMA. Os dados fornecidos pelo paciente foram coletados de forma direta por Diários de Sintomas em tempo real e escalas clínicas cientificamente validadas.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="text-center py-8">Carregando plano...</div>
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              data={data}
              account={account}
              onUpdateData={onUpdateData}
              cloudSyncStatus={cloudSyncStatus}
              onManualCloudSync={onManualCloudSync}
              onOpenOnboarding={() => setShowOnboardingModal(true)}
              onOpenEvidenceModal={() => setShowRefsModal(true)}
              onWipeData={handleWipeData}
              showScientificMetrics={showScientificMetrics}
              onToggleScientificMetrics={handleToggleScientificMetrics}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesHub
              data={data}
              account={account}
              onUpdateData={onUpdateData}
              cloudSyncStatus={cloudSyncStatus}
              onManualCloudSync={onManualCloudSync}
            />
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
                    Módulos em expansão e novidades do aplicativo
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs text-center space-y-4">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                    Lançamento em Etapas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Novos recursos, expansões e opções de planos estão sendo desenvolvidos e serão lançados gradualmente em etapas.
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
                    🔒 Todo o conteúdo detalhado desta seção está oculto no momento enquanto estruturamos as próximas edições e lançamentos.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button (FAB) shortcut for logging */}
      {activeTab !== 'diary' && (
        <button
          onClick={() => setActiveTab('diary')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-500 text-white hover:bg-teal-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl shadow-teal-500/30 transition-transform active:scale-95 z-40 select-none cursor-pointer"
          aria-label="Registrar sintomas diários"
        >
          📝
        </button>
      )}

      {/* ── REFERENCES MODAL ── */}
      {showRefsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
              <h3 className="font-poppins font-black text-slate-800 dark:text-slate-100">
                📚 Referências Científicas
              </h3>
              <button
                onClick={() => setShowRefsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {REFERENCES.map((r, i) => (
                <div key={i} className="pb-3 border-b border-slate-50 dark:border-slate-850 last:border-0 leading-relaxed">
                  <span className="text-teal-500 font-bold">{r[0]}. </span>
                  <strong>{r[1]}</strong> {r[2]} <em className="italic">{r[3]}</em>. {r[4]}.{' '}
                  <a
                    href={r[5]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-500 font-bold underline hover:text-teal-600"
                  >
                    consensus-link
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING & INTERACTIVE TUTORIAL MODAL ── */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <Onboarding
              account={account}
              patientData={pd}
              isModal={true}
              onComplete={handleOnboardingModalComplete}
              onFinish={() => setShowOnboardingModal(false)}
            />
          </div>
        </div>
      )}

      {/* ── DESPERTADOR ALARME OVERLAY MODAL ── */}
      {activeAlarm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-6 relative overflow-hidden animate-scale-up">
            
            {/* Visual Ringing & Pulse FX */}
            <div className="absolute inset-0 bg-teal-500/5 dark:bg-teal-500/10 animate-pulse pointer-events-none" />
            
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/20 animate-bounce">
                <BellRing className="w-10 h-10 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Alarme Despertador Ativo
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-3xl font-black font-mono text-slate-800 dark:text-slate-100 tracking-tight block">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <h3 className="font-poppins font-black text-xl text-slate-800 dark:text-slate-100 leading-tight">
                Hora de Tomar sua Medicação!
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Sincronizado automaticamente com o seu diário de dor e sintomas
              </p>
            </div>

            {/* Medication Card Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 text-left space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 block">Remédio Cadastrado</span>
              <strong className="text-lg text-slate-800 dark:text-slate-100 block font-poppins">{activeAlarm.name}</strong>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Dose: <strong>{activeAlarm.dosage}</strong></span>
                <span>Frequência: <strong>{activeAlarm.frequency}</strong></span>
              </div>
              {activeAlarm.scheduleTime && (
                <div className="text-[10px] font-bold text-slate-400 pt-1">
                  Horário programado: {activeAlarm.scheduleTime}
                </div>
              )}
            </div>

            {/* Interactive Alarm Actions */}
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleTakeMedicationNow(activeAlarm)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer border border-transparent"
              >
                ✓ MARCAR COMO TOMADO AGORA
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSnooze(activeAlarm.id)}
                  className="py-3 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/10 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  ⏰ ADIAR 5 MIN
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(activeAlarm.id)}
                  className="py-3 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
                >
                  ✕ IGNORAR HOJE
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hover-based daily log tooltip */}
      {hoveredLog && (
        <div
          className="fixed p-4 bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl shadow-xl z-[9999] text-xs font-medium leading-relaxed pointer-events-none border border-slate-800 w-72 animate-fade-in"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -105%)', // Center horizontally and place above
          }}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 font-bold">
              <span className="text-slate-300">Resumo de {hoveredLog.date.split('-').reverse().join('/')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 font-extrabold uppercase">DIÁRIO</span>
            </div>

            {/* Clinical scores */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
              <div className="flex justify-between">
                <span className="text-slate-400">Dor:</span>
                <span className="font-extrabold text-rose-400">{hoveredLog.pain != null ? `${hoveredLog.pain}/10` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fadiga:</span>
                <span className="font-extrabold text-amber-400">{hoveredLog.fatigue != null ? `${hoveredLog.fatigue}/10` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sono:</span>
                <span className="font-extrabold text-blue-400">{hoveredLog.sleep != null ? `${hoveredLog.sleep}/10` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Humor:</span>
                <span className="font-extrabold text-violet-400">{hoveredLog.mood != null ? `${hoveredLog.mood}/5` : '-'}</span>
              </div>
            </div>

            {/* Habits & Nutrition Details */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">🥦 Fatores Alimentares & Hábitos:</span>
              <div className="flex flex-wrap gap-1">
                {hoveredLog.waterIntake !== undefined && hoveredLog.waterIntake > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">💧 Água: {hoveredLog.waterIntake} ml</span>
                ) : hoveredLog.waterSimple ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">💧 Água: {hoveredLog.waterSimple}</span>
                ) : null}
                {hoveredLog.caffeineSimple && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">☕ Café: {hoveredLog.caffeineSimple}</span>
                )}
                {hoveredLog.alcoholLog && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">🍷 Álcool</span>
                )}
                {hoveredLog.gasBeverage && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 font-bold">🥤 Refri/Gás</span>
                )}
                {hoveredLog.greasyMeal && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold">🍔 Gordura</span>
                )}
                {hoveredLog.evacuatedToday && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                    💩 Bristol: {hoveredLog.bristolStoolType ?? 'Sim'}
                  </span>
                )}
              </div>
            </div>

            {/* Detailed Triggers */}
            <div className="border-t border-slate-800 pt-2 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">⚠️ Gatilhos Suspeitos Registrados:</span>
              {hoveredLog.triggers && hoveredLog.triggers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {hoveredLog.triggers.map((t: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-md font-bold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 italic block text-[10px]">Nenhum gatilho suspeito registrado para este dia.</span>
              )}
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-950/95" />
        </div>
      )}
    </div>
  );
};

// Specialty doctor description helper
const doc = (val: string) => val || 'Profissional da Saúde';
const docGenderLabel = (g: string | null) => (g === 'F' ? 'Profissional' : 'Profissional');
const docGenderSuffix = (g: string | null) => (g === 'F' ? 'a' : 'o');
const docName = (spec: string | undefined) => spec || 'Profissional da Saúde';
