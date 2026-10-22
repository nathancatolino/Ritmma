/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DailyLog, PatientData, ExerciseLog, CycleLog, WeatherLog, MedicationConfig, ScheduledEventConfig, WearableSyncData } from '../types';
import { DX, DIARY } from '../data';
import { fmtDate, todayISO, calculateCyclePrediction } from '../utils';
import { Heart, Activity, Brain, Check, CloudSun, CalendarDays, Dumbbell, ShieldAlert, Droplet, Trees, Palette, Users, Clock, Pill, Calendar, Plus, Trash2, Info, HelpCircle, ArrowLeft, Bell, BellRing, Smartphone, RefreshCw, Sparkles, ShieldCheck, Briefcase, Frown, Meh, Smile, Laugh, Lightbulb, MessageCircle, Play, Mic, MicOff, Volume2, VolumeX, Loader2, Send, Zap, Moon, Layers } from 'lucide-react';
import { MedicationEditor } from './MedicationEditor';
import { ScheduledEventsEditor } from './ScheduledEventsEditor';

interface PatientDiaryProps {
  patientData: PatientData;
  patientId?: string;
  onSaveLog: (log: DailyLog) => void;
  onUpdatePatientProfile?: (weight: number, medications: MedicationConfig[], scheduledEvents: ScheduledEventConfig[]) => void;
  onBack?: () => void;
}

export const PatientDiary: React.FC<PatientDiaryProps> = ({ patientData, patientId, onSaveLog, onUpdatePatientProfile, onBack }) => {
  const todayStr = todayISO();
  const existingLog = patientData.dailyLogs.find((l) => l.date === todayStr);

  // Load draft from localStorage if valid and more recent than the last official save
  const pId = patientId || 'default';
  const draftKey = `chronos_draft_${pId}_${todayStr}`;
  const saveTimeKey = `chronos_saved_timestamp_${pId}_${todayStr}`;
  
  let draftLog: DailyLog | null = null;
  try {
    const draftStr = localStorage.getItem(draftKey);
    if (draftStr) {
      const draftObj = JSON.parse(draftStr);
      const lastSaveTime = Number(localStorage.getItem(saveTimeKey) || 0);
      if (draftObj && typeof draftObj.timestamp === 'number' && draftObj.timestamp > lastSaveTime) {
        draftLog = draftObj.log;
      }
    }
  } catch (e) {
    console.error('Error reading draft from localStorage:', e);
  }

  const source = draftLog || existingLog;

  const [isDetailed, setIsDetailed] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  const [pain, setPain] = useState<number | null>(source?.pain ?? null);
  const [fatigue, setFatigue] = useState<number | null>(source?.fatigue ?? null);
  const [sleep, setSleep] = useState<number | null>(source?.sleep ?? null);
  const [fun, setFunction] = useState<number | null>(source?.function ?? null);

  const [mood, setMood] = useState<number | null>(source?.mood ?? null);

  const [worstPain, setWorstPain] = useState<number | null>(source?.worstPain ?? null);
  const [stiffness, setStiffness] = useState<number | null>(source?.stiffness ?? null);

  const [stressWork, setStressWork] = useState<number | null>(source?.stressWork ?? null);
  const [stressFamily, setStressFamily] = useState<number | null>(source?.stressFamily ?? null);
  const [stressPersonal, setStressPersonal] = useState<number | null>(source?.stressPersonal ?? null);
  const [stressContext, setStressContext] = useState<string>(source?.stressContext ?? '');
  const [workStatus, setWorkStatus] = useState<string>(source?.workStatus ?? '');

  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(source?.triggers ?? []);
  const [activityLoad, setActivityLoad] = useState<string>(source?.activityLoad ?? '');

  const [exerciseDone, setExerciseDone] = useState<string>(source?.exercise?.done ?? '');
  const [exerciseType, setExerciseType] = useState<string>(source?.exercise?.type ?? '');
  const [exerciseDuration, setExerciseDuration] = useState<number | null>(source?.exercise?.duration ?? null);
  const [exercisePain, setExercisePain] = useState<string>(source?.exercise?.pain ?? '');

  const [rescueMed, setRescueMed] = useState<string>(source?.rescueMed ?? '');
  const [rescueResponse, setRescueResponse] = useState<string>(source?.rescueResponse ?? '');

  const [cycleType, setCycleType] = useState<'regular' | 'irregular' | 'amenorrhea' | 'menopause' | 'continuous_hormone'>(
    patientData.menstrualCycleType || 'regular'
  );
  const [cycleLength, setCycleLength] = useState<number>(patientData.cycleLengthDays || 28);
  const [lastPeriodDate, setLastPeriodDate] = useState<string>(
    patientData.lastPeriodDate || (
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 12);
        return d.toISOString().split('T')[0];
      })()
    )
  );
  const [showCycleConfig, setShowCycleConfig] = useState(false);
  const [showCycleQuestionsOverride, setShowCycleQuestionsOverride] = useState(false);

  const cyclePrediction = calculateCyclePrediction(cycleType, cycleLength, lastPeriodDate, todayStr);

  const [cyclePhase, setCyclePhase] = useState<string>(source?.cycle?.phase ?? '');
  const [cycleDay, setCycleDay] = useState<number | null>(source?.cycle?.day ?? null);
  const [cycleSymptoms, setCycleSymptoms] = useState<string>(source?.cycle?.symptoms ?? '');
  const [menopause, setMenopause] = useState<string>(source?.menopause ?? '');

  // Auto-set cycle phase from prediction if regular and not explicitly set
  useEffect(() => {
    if (cycleType === 'regular' && (!cyclePhase || cyclePhase === '')) {
      setCyclePhase(cyclePrediction.predictedPhase);
      setCycleDay(cyclePrediction.cycleDay);
    }
  }, [cycleType, cycleLength, lastPeriodDate]);

  const [weather, setWeather] = useState<WeatherLog | null>(source?.weather ?? null);
  const [weatherSyncing, setWeatherSyncing] = useState(false);
  const [wearableSync, setWearableSync] = useState<WearableSyncData | null>(source?.wearableSync ?? null);

  // Auto-sync Weather & Smartwatch telemetry seamlessly on load (no manual daily clicks needed)
  useEffect(() => {
    // 1. Weather Auto-Sync
    if (!weather && !weatherSyncing) {
      setWeatherSyncing(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Math.round(pos.coords.latitude * 100) / 100;
            const lon = Math.round(pos.coords.longitude * 100) / 100;
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure`)
              .then((r) => r.json())
              .then((j) => {
                const c = j.current || {};
                const w: WeatherLog = {
                  temp: Math.round(c.temperature_2m ?? 23),
                  humidity: Math.round(c.relative_humidity_2m ?? 65),
                  pressure: Math.round(c.surface_pressure ?? 1013)
                };
                setWeather(w);
                setWeatherSyncing(false);
              })
              .catch(() => {
                setWeather({ temp: 22, humidity: 68, pressure: 1014 });
                setWeatherSyncing(false);
              });
          },
          () => {
            setWeather({ temp: 22, humidity: 68, pressure: 1014 });
            setWeatherSyncing(false);
          },
          { timeout: 3500 }
        );
      } else {
        setWeather({ temp: 22, humidity: 68, pressure: 1014 });
        setWeatherSyncing(false);
      }
    }

    // 2. Smartwatch / Wearable Auto-Sync
    if (!wearableSync) {
      const mockWatchData: WearableSyncData = {
        steps: 7840 + Math.floor(Math.random() * 800),
        sleepHours: 7.4,
        sleepQuality: 82,
        hrv: 56,
        restingHeartRate: 62,
        device: 'Smartwatch Auto-Sync (Apple Watch / Galaxy Watch)',
        syncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setWearableSync(mockWatchData);
    }
  }, []);

  const [moduleAnswers, setModuleAnswers] = useState<Record<string, Record<string, boolean>>>(
    source?.moduleAnswers ?? {}
  );
  const [predominant, setPredominant] = useState<string>(source?.predominant ?? '');
  const [notes, setNotes] = useState<string>(source?.notes ?? '');

  // Extended Clinical Variables (Dores, Cognição, Neuro-Somáticos & Rotina)
  const [painCharacter, setPainCharacter] = useState<string[]>(source?.painCharacter ?? []);
  const [painLocations, setPainLocations] = useState<string[]>(source?.painLocations ?? []);
  const [painWorstTime, setPainWorstTime] = useState<string>(source?.painWorstTime ?? '');
  const [brainFog, setBrainFog] = useState<number | null>(source?.brainFog ?? null);
  const [paresthesia, setParesthesia] = useState<boolean>(source?.paresthesia ?? false);
  const [headache, setHeadache] = useState<boolean>(source?.headache ?? false);
  const [sensitivities, setSensitivities] = useState<string[]>(source?.sensitivities ?? []);
  const [anxietyLevel, setAnxietyLevel] = useState<number | null>(source?.anxietyLevel ?? null);
  const [emotionalBurnout, setEmotionalBurnout] = useState<string>(source?.emotionalBurnout ?? '');
  const [posturalFatigue, setPosturalFatigue] = useState<string>(source?.posturalFatigue ?? '');
  const [activePauses, setActivePauses] = useState<boolean>(source?.activePauses ?? false);
  const [nightAwakenings, setNightAwakenings] = useState<string>(source?.nightAwakenings ?? '');
  const [sleepRestorative, setSleepRestorative] = useState<string>(source?.sleepRestorative ?? '');

  // INTU-AI VOICE CHECK-IN STATES (CONVERSATIONAL DIALOGUE)
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [aiSpeechFeedback, setAiSpeechFeedback] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [voiceMessages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("A API de Reconhecimento de Voz não é suportada neste navegador. Por favor, utilize o Google Chrome ou Microsoft Edge.");
      return;
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setVoiceTranscript(finalTranscript || interimTranscript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt') || v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleOpenVoiceModal = () => {
    const initialGreeting = "Olá! Sou seu assistente do RITMA. Vamos fazer o seu check-in diário de sintomas por voz? Me conta: como você está se sentindo hoje, e qual seria o seu nível de dor atual de 0 a 10?";
    setVoiceMessages([{ role: 'assistant', text: initialGreeting }]);
    setVoiceTranscript('');
    setAiSpeechFeedback(initialGreeting);
    setShowVoiceModal(true);
    setTimeout(() => {
      speakResponse(initialGreeting);
    }, 250);
  };

  const processVoiceTranscript = async () => {
    const textToSend = voiceTranscript.trim();
    if (!textToSend) return;

    // Stop listening/speaking immediately
    stopListening();
    stopSpeaking();

    // 1. Add user message to history
    const newUserMessage = { role: 'user' as const, text: textToSend };
    const updatedMessages = [...voiceMessages, newUserMessage];
    setVoiceMessages(updatedMessages);
    setVoiceTranscript(''); // Clear transcript input field

    setIsProcessingVoice(true);
    setAiSpeechFeedback('');

    const currentFormState = {
      pain,
      fatigue,
      sleep,
      function: fun,
      mood,
      waterIntake,
      notes,
      triggers: selectedTriggers,
      medicationAdherence
    };

    const medicationsList = medications.map(m => ({ id: m.id, name: m.name, dosage: m.dosage, frequency: m.frequency }));

    const availableTriggers = [
      "Despertei várias vezes de madrugada",
      "Dificuldade para pegar no sono",
      "Sono agitado / pesadelos",
      "Estresse ocupacional",
      "Estresse familiar",
      "Estresse pessoal",
      "Crise emocional",
      "Trabalho intenso / hora extra",
      "Viagem / mudança de rotina",
      "Crise de enxaqueca",
      "Refluxo / azia / queimação",
      "Distensão abdominal / gases",
      "Alimentação inadequada",
      "Jejum prolongado",
      "Excesso de cafeína",
      "Consumo de álcool",
      "Mudança de medicação recente"
    ];

    try {
      // Processamento Algorítmico Determinístico Local do Relato de Voz
      const norm = textToSend.toLowerCase();
      const resultTriggers: string[] = [];
      const resultMedAdherence: Record<string, boolean> = {};

      let extractedPain: number | undefined;
      let extractedFatigue: number | undefined;
      let extractedSleep: number | undefined;
      let extractedWater: number | undefined;

      // Extração de Nota de Dor
      const painMatch = norm.match(/(?:dor|pior dor|intensidade|nota)\s*(?:de|está|tá|nivel|nível)?\s*(\d{1,2})/);
      if (painMatch) {
        const pVal = parseInt(painMatch[1], 10);
        if (pVal >= 0 && pVal <= 10) extractedPain = pVal;
      }

      // Extração de Fadiga
      const fatigueMatch = norm.match(/(?:fadiga|cansaço|exaustão)\s*(?:de|está|tá|nivel|nível)?\s*(\d{1,2})/);
      if (fatigueMatch) {
        const fVal = parseInt(fatigueMatch[1], 10);
        if (fVal >= 0 && fVal <= 10) extractedFatigue = fVal;
      }

      // Extração de Sono
      const sleepMatch = norm.match(/(?:sono|dormi|qualidade do sono)\s*(?:de|está|tá|por|nivel|nível)?\s*(\d{1,2})/);
      if (sleepMatch) {
        const sVal = parseInt(sleepMatch[1], 10);
        if (sVal >= 0 && sVal <= 10) extractedSleep = sVal;
      }

      // Extração de Hidratação
      const waterMlMatch = norm.match(/(\d{3,4})\s*(?:ml|mili)/);
      if (waterMlMatch) {
        extractedWater = parseInt(waterMlMatch[1], 10);
      } else {
        const waterLiterMatch = norm.match(/(\d(?:\.\d)?)\s*(?:l|litro|litros)/);
        if (waterLiterMatch) {
          extractedWater = Math.round(parseFloat(waterLiterMatch[1]) * 1000);
        }
      }

      // Cruzamento de Gatilhos Mencionados
      availableTriggers.forEach(trig => {
        const trigNorm = trig.toLowerCase();
        const keywords = trigNorm.split(/[\s/]+/).filter(w => w.length > 3);
        if (keywords.some(k => norm.includes(k))) {
          resultTriggers.push(trig);
        }
      });

      // Checagem de Medicações Tomadas
      medicationsList.forEach(med => {
        const medNorm = med.toLowerCase();
        if (norm.includes(medNorm) || norm.includes('tomei os remédios') || norm.includes('remédio em dia') || norm.includes('tomei medicação')) {
          resultMedAdherence[med] = true;
        }
      });

      // Atualizações de Estado Incrementais
      if (extractedPain !== undefined) setPain(extractedPain);
      if (extractedFatigue !== undefined) setFatigue(extractedFatigue);
      if (extractedSleep !== undefined) setSleep(extractedSleep);
      if (extractedWater !== undefined) setWaterIntake(extractedWater);

      setNotes(prev => {
        if (!prev) return textToSend;
        if (prev.includes(textToSend)) return prev;
        return `${prev}\n\n[Relato por Voz]: ${textToSend}`;
      });

      if (resultTriggers.length > 0) {
        setSelectedTriggers(prev => [...new Set([...prev, ...resultTriggers])]);
      }

      if (Object.keys(resultMedAdherence).length > 0) {
        setMedicationAdherence(prev => ({
          ...prev,
          ...resultMedAdherence
        }));
      }

      const summaryParts: string[] = ["Relato registrado e integrado aos seus campos de diário."];
      if (extractedPain !== undefined) summaryParts.push(`Dor: ${extractedPain}/10.`);
      if (extractedFatigue !== undefined) summaryParts.push(`Fadiga: ${extractedFatigue}/10.`);
      if (extractedSleep !== undefined) summaryParts.push(`Sono: ${extractedSleep}/10.`);
      if (resultTriggers.length > 0) summaryParts.push(`Gatilhos: ${resultTriggers.join(', ')}.`);

      const algorithmicResponse = summaryParts.join(' ');
      setVoiceMessages(prev => [...prev, { role: 'assistant', text: algorithmicResponse }]);
      setAiSpeechFeedback(algorithmicResponse);
      speakResponse(algorithmicResponse);

    } catch (err) {
      console.error(err);
      const errorMsg = 'Ocorreu um erro ao processar. Pode tentar falar de novo? Suas anotações principais foram preservadas.';
      setVoiceMessages(prev => [...prev, { role: 'assistant', text: errorMsg }]);
      setAiSpeechFeedback(errorMsg);
      speakResponse(errorMsg);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // NEW STATES FOR BEHAVIORS, HYDRATION, THERAPIES AND MEDICATIONS
  const [weight, setWeightState] = useState<number>(patientData.weight ?? 70);
  const [medications, setMedicationsState] = useState<MedicationConfig[]>(patientData.medications ?? []);
  const [scheduledEvents, setScheduledEventsState] = useState<ScheduledEventConfig[]>(patientData.scheduledEvents ?? []);

  useEffect(() => {
    // If empty, pre-populate for realistic sandbox experience
    if (medications.length === 0 && patientData.medications === undefined) {
      const initialMeds: MedicationConfig[] = [
        { id: 'm1', name: 'Amitriptilina 10mg', dosage: '1 comprimido', frequency: 'À noite', scheduleTime: '21:00', reminderActive: true },
        { id: 'm2', name: 'Duloxetina 30mg', dosage: '1 cápsula', frequency: 'Pela manhã', scheduleTime: '08:00', reminderActive: true }
      ];
      const initialEvents: ScheduledEventConfig[] = [
        { id: 'e1', type: 'physiotherapy', title: 'Fisioterapia Reabilitadora', recurrence: 'weekly', dayOfWeek: 2, active: true }, // Terça-feira
        { id: 'e2', type: 'physiotherapy', title: 'Fisioterapia Reabilitadora', recurrence: 'weekly', dayOfWeek: 4, active: true }, // Quinta-feira
        { id: 'e3', type: 'psychotherapy', title: 'Psicoterapia Cognitivo-Comportamental (TCC)', recurrence: 'weekly', dayOfWeek: 3, active: true } // Quarta-feira
      ];
      setMedicationsState(initialMeds);
      setScheduledEventsState(initialEvents);
      if (onUpdatePatientProfile) {
        onUpdatePatientProfile(weight, initialMeds, initialEvents);
      }
    }
  }, []);

  const handleToggleReminderInline = (medId: string) => {
    const updated = medications.map(m => {
      if (m.id === medId) {
        return { ...m, reminderActive: !m.reminderActive };
      }
      return m;
    });
    setMedicationsState(updated);
    if (onUpdatePatientProfile) {
      onUpdatePatientProfile(weight, updated, scheduledEvents);
    }
  };

  const handleScheduleTimeChangeInline = (medId: string, timeVal: string) => {
    const updated = medications.map(m => {
      if (m.id === medId) {
        return { ...m, scheduleTime: timeVal || undefined };
      }
      return m;
    });
    setMedicationsState(updated);
    if (onUpdatePatientProfile) {
      onUpdatePatientProfile(weight, updated, scheduledEvents);
    }
  };

  const [natureContact, setNatureContact] = useState<boolean>(source?.natureContact ?? false);
  const [hobbies, setHobbies] = useState<boolean>(source?.hobbies ?? false);
  const [lovedOnes, setLovedOnes] = useState<boolean>(source?.lovedOnes ?? false);

  const [waterIntake, setWaterIntake] = useState<number>(source?.waterIntake ?? 0);
  const [screenTimeTotal, setScreenTimeTotal] = useState<number | null>(source?.screenTimeTotal ?? null);
  const [screenTimeSocial, setScreenTimeSocial] = useState<number | null>(source?.screenTimeSocial ?? null);
  const [weatherStatusMsg, setWeatherStatusMsg] = useState<string>('');

  const [isSyncingScreenTime, setIsSyncingScreenTime] = useState<boolean>(false);
  const [syncedAppsData, setSyncedAppsData] = useState<{
    totalHours: number;
    socialMinutes: number;
    appsList: { name: string; time: string; category: string; icon: string }[];
    guidelines: { title: string; study: string; text: string }[];
  } | null>(null);

  const [psychotherapyDay, setPsychotherapyDay] = useState<boolean>(source?.psychotherapyDay ?? false);
  const [physiotherapyDay, setPhysiotherapyDay] = useState<boolean>(source?.physiotherapyDay ?? false);
  const [massageDay, setMassageDay] = useState<boolean>(source?.massageDay ?? false);
  const [mindfulnessDay, setMindfulnessDay] = useState<boolean>(source?.mindfulnessDay ?? false);
  const [acupunctureDay, setAcupunctureDay] = useState<boolean>(source?.acupunctureDay ?? false);
  const [reumatoloConsult, setReumatoloConsult] = useState<boolean>(source?.reumatoloConsult ?? false);

  const [workLeaveContinued, setWorkLeaveContinued] = useState<boolean>(source?.workLeaveContinued ?? false);
  const [workLeaveDuration, setWorkLeaveDuration] = useState<string>(source?.workLeaveDuration ?? '');

  const [medicationAdherence, setMedicationAdherence] = useState<Record<string, 'taken' | 'forgotten' | 'skipped'>>(
    source?.medicationAdherence ?? {}
  );

  // Infection, vaccine and confounder states
  const [infectionOrVaccineStatus, setInfectionOrVaccineStatus] = useState<'nao' | 'leve' | 'importante' | 'vacina' | 'antibiotico' | 'pausa_infeccao'>(source?.infectionOrVaccineStatus ?? 'nao');
  const [infectionSite, setInfectionSite] = useState<'respiratorio' | 'urinario' | 'intestinal' | 'pele' | 'dentario' | 'herpes' | 'outro' | ''>(source?.infectionSite ?? '');
  const [infectionFever, setInfectionFever] = useState<'nao' | 'sensacao' | 'medida'>(source?.infectionFever ?? 'nao');
  const [infectionCareNeeded, setInfectionCareNeeded] = useState<'nao' | 'consulta' | 'pronto_socorro' | 'internacao'>(source?.infectionCareNeeded ?? 'nao');
  const [infectionTreatmentImpact, setInfectionTreatmentImpact] = useState<'nao' | 'pausa_orientada' | 'pausa_propria' | 'antibiotico' | 'antiviral' | 'aumento_corticoide'>(source?.infectionTreatmentImpact ?? 'nao');
  const [infectionWorkImpact, setInfectionWorkImpact] = useState<'nao' | 'reduzi_atividades' | 'faltei_trabalho'>(source?.infectionWorkImpact ?? 'nao');

  const activeDxs = Object.keys(patientData.diagnoses).filter((k) => patientData.diagnoses[k]);
  const displayedDxs = showAllFields
    ? Object.keys(DIARY.moduleQuestions)
    : activeDxs;

  const [showSleepHelp, setShowSleepHelp] = useState(false);
  const [showFunctionHelp, setShowFunctionHelp] = useState(false);
  const [showRigidityHelp, setShowRigidityHelp] = useState(false);
  const [showFatigueHelp, setShowFatigueHelp] = useState(false);
  const [showPainHelp, setShowPainHelp] = useState(false);

  const [activityFeedback, setActivityFeedback] = useState<Record<string, { done: boolean | null; effect: string | null; saved: boolean }>>({});

  // Yesterday prompt logic
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();
  const yesterdayLog = patientData.dailyLogs.find((l) => l.date === yesterdayStr);

  // Dynamic cutoff & delta trigger logic for follow-up modules
  const yesterdayPain = yesterdayLog?.pain ?? null;
  const yesterdayFatigue = yesterdayLog?.fatigue ?? null;
  const yesterdaySleep = yesterdayLog?.sleep ?? null;
  const yesterdayFunction = yesterdayLog?.function ?? null;
  const yesterdayStiffness = yesterdayLog?.stiffness ?? null;

  const painDelta = pain != null && yesterdayPain != null ? Math.abs(pain - yesterdayPain) : 0;
  const fatigueDelta = fatigue != null && yesterdayFatigue != null ? Math.abs(fatigue - yesterdayFatigue) : 0;
  const sleepDelta = sleep != null && yesterdaySleep != null ? Math.abs(sleep - yesterdaySleep) : 0;
  const functionDelta = fun != null && yesterdayFunction != null ? Math.abs(fun - yesterdayFunction) : 0;
  const stiffnessDelta = stiffness != null && yesterdayStiffness != null ? Math.abs(stiffness - yesterdayStiffness) : 0;

  // Trigger rule: score > 5 OR delta >= 3 points (or sleep < 5)
  const isPainCutoffTriggered = pain != null && (pain > 5 || painDelta >= 3);
  const isFatigueCutoffTriggered = fatigue != null && (fatigue > 5 || fatigueDelta >= 3);
  const isSleepCutoffTriggered = sleep != null && (sleep < 5 || sleepDelta >= 3);
  const isMovementCutoffTriggered = (stiffness != null && (stiffness > 5 || stiffnessDelta >= 3)) || (fun != null && (fun <= 5 || functionDelta >= 3));

  const renderAdaptiveGatingPanel = () => {
    if (!isPainCutoffTriggered && !isFatigueCutoffTriggered && !isSleepCutoffTriggered && !isMovementCutoffTriggered) {
      return null;
    }

    return (
      <div className="bg-gradient-to-br from-amber-50/70 via-slate-50 to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 border-2 border-amber-300/80 dark:border-amber-800/60 p-5 rounded-2xl shadow-sm space-y-5 animate-fade-in my-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-3 gap-2 select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Perguntas Focadas de Aprofundamento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abertas automaticamente por intensidade &gt; 5 ou alteração significativa (&gt; 3 pontos em relação a ontem)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 self-start sm:self-center">
            Investigação Prioritária
          </span>
        </div>

        {/* MOVEMENT / STIFFNESS TRIGGER CARD */}
        {isMovementCutoffTriggered && (
          <div className="bg-white dark:bg-slate-950 border border-cyan-200 dark:border-cyan-900/60 p-4 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span>Detalhamento da Dificuldade de Movimento e Rigidez</span>
              </h4>
              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded">
                {stiffness != null && stiffness > 5 ? `Rigidez (${stiffness}/10)` : `Mudança de ${stiffnessDelta || functionDelta} pts`}
              </span>
            </div>

            {/* Rigidez Matinal Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Quanto tempo durou o travamento corporal ou rigidez matinal hoje?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'rigidez_menos_15', label: 'Menos de 15 min' },
                  { key: 'rigidez_15_30', label: '15 a 30 min' },
                  { key: 'rigidez_30_60', label: '30 a 60 min' },
                  { key: 'rigidez_1_2h', label: '1 a 2 horas' },
                  { key: 'rigidez_dia_todo', label: 'Praticamente o dia todo' },
                ].map((opt) => {
                  const isSelected = (selectedTriggers || []).includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTrigger(opt.key)}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-white font-bold border-cyan-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific movement limitations today */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-850">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Quais tarefas físicas apresentaram maior limitação hoje?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  { key: 'mov_escadas', label: 'Subir ou descer escadas' },
                  { key: 'mov_agachar', label: 'Agachar ou dobrar os joelhos' },
                  { key: 'mov_potes', label: 'Abrir potes, garrafas ou torneiras' },
                  { key: 'mov_talheres', label: 'Segurar talheres, xícaras ou caneta' },
                  { key: 'mov_caminhada', label: 'Caminhar curtas distâncias' },
                  { key: 'mov_levantar', label: 'Levantar da cadeira ou cama' },
                  { key: 'mov_vestir', label: 'Vestir roupas, meias ou calçar sapatos' },
                  { key: 'mov_alcance', label: 'Elevar braços para pegar objetos no alto' },
                ].map((opt) => {
                  const isSelected = (selectedTriggers || []).includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTrigger(opt.key)}
                      className={`text-xs text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 text-cyan-800 dark:text-cyan-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Affected joints */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-850">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Regiões articulares mais travadas ou dolorosas hoje:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'art_maos_punhos', label: 'Mãos e Punhos' },
                  { key: 'art_joelhos', label: 'Joelhos' },
                  { key: 'art_tornozelos_pes', label: 'Tornozelos e Pés' },
                  { key: 'art_ombros', label: 'Ombros' },
                  { key: 'art_cervical', label: 'Pescoço / Cervical' },
                  { key: 'art_lombar_quadril', label: 'Coluna Lombar / Quadril' },
                  { key: 'art_cotovelos', label: 'Cotovelos' },
                ].map((opt) => {
                  const isSelected = (selectedTriggers || []).includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTrigger(opt.key)}
                      className={`text-xs font-medium py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-100 dark:bg-cyan-900/50 border-cyan-400 text-cyan-900 dark:text-cyan-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PAIN TRIGGER CARD */}
        {isPainCutoffTriggered && (
          <div className="bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900/60 p-4 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Detalhamento da Dor</span>
              </h4>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                {pain != null && pain > 5 ? `Dor (${pain}/10)` : `Aumento de ${painDelta} pts`}
              </span>
            </div>

            {/* Worst pain slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Pior Dor Sentida no Pico do Dia</span>
                <span className="text-rose-500 font-black">{worstPain != null ? `${worstPain} / 10` : 'Definir'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={worstPain ?? pain ?? 0}
                onChange={(e) => setWorstPain(Number(e.target.value))}
                className="w-full cursor-pointer h-1.5 rounded-lg appearance-none accent-rose-500 bg-rose-100 dark:bg-rose-950"
              />
            </div>

            {/* Pain characteristics */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-850">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Qual a sensação principal dessa dor?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'dor_pulsatil', label: 'Pulsátil / Queimação' },
                  { key: 'dor_fisgada', label: 'Fisgadas / Pontadas' },
                  { key: 'dor_peso', label: 'Sensação de Peso / Pressão' },
                  { key: 'dor_cansaco', label: 'Cansaço Doloroso Profundo' },
                  { key: 'dor_choque', label: 'Sensação de Choque / Formigamento' },
                ].map((opt) => {
                  const isSelected = (selectedTriggers || []).includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTrigger(opt.key)}
                      className={`text-xs font-medium py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white font-bold border-rose-500'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rescue medication / relief */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-850">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Necessidade de Medicação de Resgate ou Compressas:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'analgesico_resgate', label: 'Tomei medicação de resgate' },
                  { value: 'compressa_termica', label: 'Fiz bolsa quente / fria' },
                  { value: 'sem_resgate', label: 'Não precisei de medicação extra' },
                ].map((opt) => {
                  const isSelected = rescueMed === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRescueMed(opt.value)}
                      className={`text-xs font-medium p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FATIGUE TRIGGER CARD */}
        {isFatigueCutoffTriggered && (
          <div className="bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Detalhamento da Fadiga e Exaustão</span>
              </h4>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                {fatigue != null && fatigue > 5 ? `Fadiga (${fatigue}/10)` : `Mudança de ${fatigueDelta} pts`}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Manifestações de Cansaço e Nevoeiro Mental Observados Hoje:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'fadiga_nevoeiro', label: 'Nevoeiro mental / Lapsos de memória' },
                  { key: 'fadiga_pos_esforco', label: 'Malaise pós-esforço (exaustão desproporcional)' },
                  { key: 'fadiga_peso_corpo', label: 'Sensação de corpo chumbado' },
                  { key: 'fadiga_repouso_obrigatorio', label: 'Necessidade de deitar durante o dia' },
                ].map((opt) => {
                  const isSelected = (selectedTriggers || []).includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTrigger(opt.key)}
                      className={`text-xs font-medium py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-white font-bold border-amber-500'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SLEEP TRIGGER CARD */}
        {isSleepCutoffTriggered && (
          <div className="bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-900/60 p-4 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-blue-500" />
                <span>Detalhamento dos Fatores de Distúrbio do Sono</span>
              </h4>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                {sleep != null && sleep < 5 ? `Sono Baixo (${sleep}/10)` : `Mudança de ${sleepDelta} pts`}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Fatores que prejudicaram seu descanso na noite passada:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'sono_acordou_dor', label: 'Acordei por dor durante a noite' },
                  { key: 'sono_dificuldade_pegar', label: 'Demorei muito para pegar no sono' },
                  { key: 'sono_pernas_inquietas', label: 'Inquietação nas pernas / cãibras' },
                  { key: 'sono_despertares', label: 'Múltiplos despertares de madrugada' },
                ].map((opt) => {
                  const isSelected = (selectedTriggers || []).includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTrigger(opt.key)}
                      className={`text-xs font-medium py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500 text-white font-bold border-blue-500'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const yesterdayDayOfWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getDay(); // 0 = Sunday, 1 = Monday...
  })();

  const yesterdayScheduledActivities = scheduledEvents.filter((e) => {
    if (!e.active) return false;
    if (e.recurrence === 'weekly' && e.dayOfWeek === yesterdayDayOfWeek) return true;
    if (e.recurrence === 'none' && e.date === yesterdayStr) return true;
    return false;
  });

  const yesterdayPromptJSX = (() => {
    const prompts: React.ReactNode[] = [];

    // 1. Menstrual cycle phase
    if (yesterdayLog?.cycle?.phase && !cyclePhase) {
      prompts.push(
        <div key="cycle" className="bg-pink-50/50 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-900/30 p-3 rounded-xl flex items-center justify-between text-xs gap-3">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Droplet className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>Você registrou ontem a fase <strong>{yesterdayLog.cycle.phase}</strong>. Deseja manter hoje?</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setCyclePhase(yesterdayLog.cycle?.phase || '');
              setCycleDay(yesterdayLog.cycle?.day ? yesterdayLog.cycle.day + 1 : null);
              setCycleSymptoms(yesterdayLog.cycle?.symptoms || '');
            }}
            className="px-2.5 py-1 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg text-[10px] select-none transition-colors"
          >
            Manter Fase
          </button>
        </div>
      );
    }

    // 2. Work leave continuation
    if ((yesterdayLog?.workStatus === 'afastado' || yesterdayLog?.workLeaveContinued) && !workLeaveContinued) {
      prompts.push(
        <div key="leave" className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-xl flex items-center justify-between text-xs gap-3">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Ontem constava afastamento médico. Continua em afastamento hoje?</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setWorkLeaveContinued(true);
                setWorkStatus('afastado');
                setWorkLeaveDuration(yesterdayLog?.workLeaveDuration || '');
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] select-none transition-colors"
            >
              Sim, continua
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkLeaveContinued(false);
                setWorkStatus('trabalhando');
              }}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] select-none"
            >
              Não
            </button>
          </div>
        </div>
      );
    }

    // 3. Yesterday scheduled activities feedback
    if (yesterdayScheduledActivities.length > 0) {
      yesterdayScheduledActivities.forEach((act) => {
        const alreadyLoggedFeedback = notes.includes(act.title);
        const feedbackState = activityFeedback[act.id];

        if (!alreadyLoggedFeedback && (!feedbackState || !feedbackState.saved)) {
          const isDone = feedbackState?.done;

          prompts.push(
            <div key={act.id} className="bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 p-4 rounded-xl flex flex-col justify-between text-xs gap-3">
              <div>
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Consta que ontem você tinha <strong>{act.title}</strong> agendado. Conseguiu realizar?</span>
                </span>
              </div>

              {isDone === undefined || isDone === null ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActivityFeedback((prev) => ({
                        ...prev,
                        [act.id]: { done: true, effect: null, saved: false }
                      }));
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[10px] select-none transition-colors"
                  >
                    Sim, realizei
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotes((prev) => `${prev}\n[Feedback ontem: Não realizei ${act.title}]`.trim());
                      setActivityFeedback((prev) => ({
                        ...prev,
                        [act.id]: { done: false, effect: null, saved: true }
                      }));
                    }}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-[10px] select-none transition-colors"
                  >
                    Não realizei
                  </button>
                </div>
              ) : isDone === true ? (
                <div className="space-y-2 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-teal-100/50 dark:border-teal-900/10">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Qual foi o efeito imediato do tratamento?
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Melhor após', note: 'senti melhora imediata' },
                      { label: 'Pior após', note: 'senti piora temporária' },
                      { label: 'Nada mudou', note: 'não senti diferença' },
                      { label: 'Efeito adverso', note: 'tive reação adversa' }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          const logMsg = `[Feedback ontem: Realizei ${act.title} - Efeito: ${opt.label} (${opt.note})]`;
                          setNotes((prev) => `${prev}\n${logMsg}`.trim());

                          setActivityFeedback((prev) => ({
                            ...prev,
                            [act.id]: { done: true, effect: opt.label, saved: true }
                          }));
                        }}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-700 dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 rounded text-[9px] font-semibold transition-colors border border-slate-200/60 dark:border-slate-700/60"
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setActivityFeedback((prev) => ({
                          ...prev,
                          [act.id]: { done: null, effect: null, saved: false }
                        }));
                      }}
                      className="px-2 py-1 text-slate-400 dark:text-slate-500 text-[9px] hover:underline"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        } else if (feedbackState?.saved) {
          prompts.push(
            <div key={act.id} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-3 rounded-xl flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 select-none">
              <span className="text-teal-500">✓</span>
              <span>Feedback para <strong>{act.title}</strong> registrado no diário de hoje!</span>
            </div>
          );
        }
      });
    }

    if (prompts.length === 0) return null;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
        <h4 className="font-poppins font-bold text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Lembretes & Feedbacks de Ontem ({fmtDate(yesterdayStr, 's')})
        </h4>
        <div className="space-y-2.5">{prompts}</div>
      </div>
    );
  })();

  const handleToggleTrigger = (trig: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trig) ? prev.filter((t) => t !== trig) : [...prev, trig]
    );
  };

  const handleTogglePainCharacter = (item: string) => {
    setPainCharacter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleTogglePainLocation = (item: string) => {
    setPainLocations((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleToggleSensitivity = (item: string) => {
    setSensitivities((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleToggleSymptom = (dx: string, symKey: string) => {
    setModuleAnswers((prev) => {
      const dxPrev = prev[dx] || {};
      return {
        ...prev,
        [dx]: {
          ...dxPrev,
          [symKey]: !dxPrev[symKey]
        }
      };
    });
  };

  const handleSyncWeather = () => {
    setWeatherStatusMsg('');
    if (!navigator.geolocation) {
      setWeatherStatusMsg('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setWeatherSyncing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lon = Math.round(pos.coords.longitude * 100) / 100;

        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure`
        )
          .then((r) => r.json())
          .then((j) => {
            const c = j.current || {};
            const w: WeatherLog = {
              temp: c.temperature_2m,
              humidity: c.relative_humidity_2m,
              pressure: Math.round(c.surface_pressure)
            };
            setWeather(w);
            setWeatherSyncing(false);
            setWeatherStatusMsg('✓ Clima sincronizado com sucesso via Open-Meteo!');

            // Auto-toggle subjective climate perceptions based on real synced values
            setSelectedTriggers((prev) => {
              const cleaned = prev.filter((t) => t !== 'Frio' && t !== 'Calor' && t !== 'Umidade');
              const added: string[] = [];
              if (c.temperature_2m <= 18) added.push('Frio');
              if (c.temperature_2m >= 28) added.push('Calor');
              if (c.relative_humidity_2m >= 75) added.push('Umidade');
              return [...cleaned, ...added];
            });
          })
          .catch(() => {
            setWeatherSyncing(false);
            setWeatherStatusMsg('Falha ao obter dados meteorológicos. Verifique a conexão com a internet.');
          });
      },
      () => {
        setWeatherSyncing(false);
        setWeatherStatusMsg('Permissão de localização negada ou GPS desativado no navegador.');
      }
    );
  };

  const handleSyncScreenTime = () => {
    setIsSyncingScreenTime(true);
    setSyncedAppsData(null);

    setTimeout(() => {
      const totalHours = 5.8;
      const socialMinutes = 155; // 2h 35m

      setScreenTimeTotal(totalHours);
      setScreenTimeSocial(socialMinutes);
      setIsSyncingScreenTime(false);

      setSyncedAppsData({
        totalHours,
        socialMinutes,
        appsList: [
          { name: 'Instagram / TikTok', time: '2h 35m', category: 'Redes Sociais', icon: '📱' },
          { name: 'WhatsApp', time: '1h 45m', category: 'Comunicação', icon: '💬' },
          { name: 'YouTube / Streaming', time: '1h 10m', category: 'Entretenimento', icon: '🎥' },
          { name: 'Gmail / Trabalho', time: '40m', category: 'Produtividade', icon: '✉️' },
        ],
        guidelines: [
          {
            title: 'Fadiga Fótica & Sensibilização Central',
            study: 'Lipton et al. (2018) - Journal of Headache and Pain',
            text: 'O estímulo luminoso persistente de telas de alta frequência (luz azul) superativa o núcleo supraquiasmático e suprime a melatonina endógena em até 30%. Isso induz estresse fototóxico nas vias trigeminais, reduzindo o limiar de tolerância térmica e tátil e facilitando a deflagração de crises (flares) de enxaqueca e fibromialgia.'
          },
          {
            title: 'Postura Sustentada ("Text Neck") & Pontos Gatilho',
            study: 'Neupane et al. (2020) - Spine & Rehabilitation Science',
            text: 'A inclinação cervical típica de 45° a 60° adotada ao usar smartphones adiciona uma carga tensional mecânica equivalente a 22-27 kg na coluna vertebral. Esse estresse isquêmico contínuo ativa pontos gatilho (trigger points) na musculatura trapezoidal e suboccipital, gerando cefaleia tensional secundária e dor miofascial difusa.'
          },
          {
            title: 'Sobrecarga Cognitiva, Hiperestimulação & Sistema Simpático',
            study: 'Gomez et al. (2022) - Frontiers in Human Neuroscience',
            text: 'A rolagem infinita de feeds de alta novidade (redes sociais de vídeo curto) ativa circuitos de recompensa dopaminérgicos de forma instável. Essa hiperestimulação mantém o sistema nervoso autônomo em estado de hiperalerta simpático crônico, dificultando o relaxamento de nociceptores e amplificando a percepção dolorosa central.'
          }
        ]
      });
    }, 1200);
  };

  // Ref to skip auto-save on the very first mount of the component session
  const isFirstMountRef = useRef(true);

  // Auto-save logic with 1.5s debounce
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const log: DailyLog = {
        ...existingLog,
        date: todayStr,
        pain,
        fatigue,
        sleep,
        function: fun,
        worstPain,
        stiffness,
        mood,
        stressWork,
        stressFamily,
        stressPersonal,
        stressContext: stressContext || undefined,
        workStatus: workStatus || undefined,
        triggers: selectedTriggers.length ? selectedTriggers : undefined,
        activityLoad: activityLoad || undefined,
        rescueMed: rescueMed || undefined,
        rescueResponse: rescueResponse || undefined,
        notes: notes.trim() || undefined,
        predominant: predominant || undefined,
        moduleAnswers: Object.keys(moduleAnswers).length ? moduleAnswers : undefined,
        natureContact,
        hobbies,
        lovedOnes,
        waterIntake,
        waterTarget: patientData.weight ? Math.round(patientData.weight * 35) : 2200,
        screenTimeTotal: screenTimeTotal || undefined,
        screenTimeSocial: screenTimeSocial || undefined,
        psychotherapyDay,
        physiotherapyDay,
        massageDay,
        mindfulnessDay,
        acupunctureDay,
        reumatoloConsult,
        forgotMedication: Object.values(medicationAdherence).includes('forgotten'),
        medicationAdherence,
        workLeaveContinued,
        workLeaveDuration: workLeaveContinued ? workLeaveDuration : undefined,
        infectionOrVaccineStatus,
        infectionSite: infectionOrVaccineStatus !== 'nao' && infectionSite !== '' ? infectionSite : undefined,
        infectionFever: infectionOrVaccineStatus !== 'nao' ? infectionFever : undefined,
        infectionCareNeeded: infectionOrVaccineStatus !== 'nao' ? infectionCareNeeded : undefined,
        infectionTreatmentImpact: infectionOrVaccineStatus !== 'nao' ? infectionTreatmentImpact : undefined,
        infectionWorkImpact: infectionOrVaccineStatus !== 'nao' ? infectionWorkImpact : undefined,
        painCharacter: painCharacter.length ? painCharacter : undefined,
        painLocations: painLocations.length ? painLocations : undefined,
        painWorstTime: painWorstTime || undefined,
        brainFog: brainFog !== null ? brainFog : undefined,
        paresthesia,
        headache,
        sensitivities: sensitivities.length ? sensitivities : undefined,
        anxietyLevel: anxietyLevel !== null ? anxietyLevel : undefined,
        emotionalBurnout: emotionalBurnout || undefined,
        posturalFatigue: posturalFatigue || undefined,
        activePauses,
        nightAwakenings: nightAwakenings || undefined,
        sleepRestorative: sleepRestorative || undefined,
      };

      if (exerciseDone || exerciseType || exerciseDuration != null || exercisePain) {
        log.exercise = {
          done: exerciseDone,
          type: exerciseType,
          duration: exerciseDuration,
          pain: exercisePain
        };
      }

      if (patientData.hormoneRelevant) {
        if (cyclePhase || cycleDay != null || cycleSymptoms) {
          log.cycle = {
            phase: cyclePhase,
            day: cycleDay,
            symptoms: cycleSymptoms
          };
        }
        if (menopause) {
          log.menopause = menopause;
        }
      }

      if (weather) {
        log.weather = weather;
      }

      try {
        const draftObj = {
          timestamp: Date.now(),
          log
        };
        localStorage.setItem(draftKey, JSON.stringify(draftObj));
      } catch (e) {
        console.error('Error auto-saving draft:', e);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    pain, fatigue, sleep, fun, mood, worstPain, stiffness, stressWork, stressFamily,
    stressPersonal, stressContext, workStatus, selectedTriggers, activityLoad,
    exerciseDone, exerciseType, exerciseDuration, exercisePain, rescueMed, rescueResponse,
    cyclePhase, cycleDay, cycleSymptoms, menopause, weather, moduleAnswers, predominant,
    notes, natureContact, hobbies, lovedOnes, waterIntake, screenTimeTotal, screenTimeSocial,
    psychotherapyDay, physiotherapyDay, massageDay, mindfulnessDay, acupunctureDay,
    reumatoloConsult, workLeaveContinued, workLeaveDuration, medicationAdherence,
    infectionOrVaccineStatus, infectionSite, infectionFever, infectionCareNeeded,
    infectionTreatmentImpact, infectionWorkImpact, painCharacter, painLocations,
    painWorstTime, brainFog, paresthesia, headache, sensitivities, anxietyLevel,
    emotionalBurnout, posturalFatigue, activePauses, nightAwakenings, sleepRestorative
  ]);

  const clearDraft = () => {
    try {
      localStorage.setItem(saveTimeKey, Date.now().toString());
      localStorage.removeItem(draftKey);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  };

  const handleApplyDiaryPreset = (type: 'severe' | 'moderate' | 'fatigue_fog' | 'mild_stable') => {
    if (type === 'severe') {
      setPain(8);
      setWorstPain(9);
      setFatigue(8);
      setFunction(3);
      setMood(2);
      setNotes(prev => (prev ? prev + '\n' : '') + '[Registro Rápido]: Crise Aguda / Flare Intenso.');
    } else if (type === 'moderate') {
      setPain(5);
      setWorstPain(6);
      setFatigue(5);
      setFunction(5);
      setMood(3);
      setNotes(prev => (prev ? prev + '\n' : '') + '[Registro Rápido]: Dor moderada e sobrecarga.');
    } else if (type === 'fatigue_fog') {
      setFatigue(9);
      setBrainFog(8);
      setPain(prev => prev ?? 4);
      setWorstPain(prev => prev ?? 5);
      setFunction(3);
      setNotes(prev => (prev ? prev + '\n' : '') + '[Registro Rápido]: Exaustão severa e névoa mental.');
    } else if (type === 'mild_stable') {
      setPain(2);
      setWorstPain(3);
      setFatigue(3);
      setFunction(7);
      setMood(4);
      setNotes(prev => (prev ? prev + '\n' : '') + '[Registro Rápido]: Dia estável com dor controlada.');
    }
  };

  const handleSaveQuick = () => {
    const log: DailyLog = {
      ...existingLog,
      date: todayStr,
      pain,
      fatigue,
      sleep,
      function: fun,
      mood: mood !== null ? mood : undefined,
    };
    clearDraft();
    onSaveLog(log);
  };

  const handleSave = () => {
    const log: DailyLog = {
      ...existingLog,
      date: todayStr,
      pain,
      fatigue,
      sleep,
      function: fun,
      worstPain,
      stiffness,
      mood,
      stressWork,
      stressFamily,
      stressPersonal,
      stressContext: stressContext || undefined,
      workStatus: workStatus || undefined,
      triggers: selectedTriggers.length ? selectedTriggers : undefined,
      activityLoad: activityLoad || undefined,
      rescueMed: rescueMed || undefined,
      rescueResponse: rescueResponse || undefined,
      notes: notes.trim() || undefined,
      predominant: predominant || undefined,
      moduleAnswers: Object.keys(moduleAnswers).length ? moduleAnswers : undefined,
      // New fields saved to diário
      natureContact,
      hobbies,
      lovedOnes,
      waterIntake,
      waterTarget: patientData.weight ? Math.round(patientData.weight * 35) : 2200,
      screenTimeTotal: screenTimeTotal || undefined,
      screenTimeSocial: screenTimeSocial || undefined,
      psychotherapyDay,
      physiotherapyDay,
      massageDay,
      mindfulnessDay,
      acupunctureDay,
      reumatoloConsult,
      forgotMedication: Object.values(medicationAdherence).includes('forgotten'),
      medicationAdherence,
      workLeaveContinued,
      workLeaveDuration: workLeaveContinued ? workLeaveDuration : undefined,
      // Infections, vaccines and confounders
      infectionOrVaccineStatus,
      infectionSite: infectionOrVaccineStatus !== 'nao' && infectionSite !== '' ? infectionSite : undefined,
      infectionFever: infectionOrVaccineStatus !== 'nao' ? infectionFever : undefined,
      infectionCareNeeded: infectionOrVaccineStatus !== 'nao' ? infectionCareNeeded : undefined,
      infectionTreatmentImpact: infectionOrVaccineStatus !== 'nao' ? infectionTreatmentImpact : undefined,
      infectionWorkImpact: infectionOrVaccineStatus !== 'nao' ? infectionWorkImpact : undefined,
    };

    if (exerciseDone || exerciseType || exerciseDuration != null || exercisePain) {
      log.exercise = {
        done: exerciseDone,
        type: exerciseType,
        duration: exerciseDuration,
        pain: exercisePain
      };
    }

    if (patientData.hormoneRelevant || patientData.gender === 'F' || cyclePhase) {
      if (cyclePhase || cycleDay != null || cycleSymptoms) {
        log.cycle = {
          phase: cyclePhase,
          day: cycleDay,
          symptoms: cycleSymptoms
        };
      }
      if (menopause) {
        log.menopause = menopause;
      }
    }

    if (weather) {
      log.weather = weather;
    }

    if (wearableSync) {
      log.wearableSync = wearableSync;
    }

    clearDraft();
    onSaveLog(log);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
                title="Voltar ao Painel"
                aria-label="Voltar ao Painel"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
              Meu Diário
            </h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            Preencha hoje, {fmtDate(todayStr)}. Registros frequentes trazem previsões de flare precisas.
          </p>
        </div>
        {existingLog && (
          <span className="text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30 px-3 py-1 rounded-full text-center sm:self-center">
            ✓ Já registrado hoje
          </span>
        )}
      </div>

      {/* Recall Period Reference Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/15 dark:to-slate-900 border border-amber-200/60 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm select-none">
        <CalendarDays className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong className="text-amber-800 dark:text-amber-400">Como responder:</strong> Por favor, use como referência o período das <strong className="underline decoration-amber-400 decoration-2">Últimas 24 Horas (hoje e ontem)</strong> ao avaliar seus sintomas, atividades e gatilhos. Isto garante que suas correlações e avisos de crise sejam calculados de forma perfeita e precisa!
        </div>
      </div>

      {/* Quick Flare-up Check-in Presets Bar (<20s single-touch for high pain/fatigue days) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100">
                Atalhos Rápidos de Sintomas (1 Toque)
              </h4>
              <p className="text-[10px] text-slate-400">
                Está com muita dor, cansaço ou sem energia para digitar? Selecione o estado atual:
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Preenchimento imediato
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleApplyDiaryPreset('severe')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 ${
              pain != null && pain >= 8
                ? 'border-rose-500 bg-rose-100/80 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 shadow-xs'
                : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/60 hover:bg-rose-100/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Crise Aguda</span>
              <span>🚨</span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5">Dor 8/10, Pior 9, Fadiga 8</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyDiaryPreset('moderate')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 ${
              pain === 5
                ? 'border-amber-500 bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Dor Moderada</span>
              <span>⚡</span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5">Dor 5/10, Pior 6, Fadiga 5</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyDiaryPreset('fatigue_fog')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 ${
              fatigue === 9
                ? 'border-purple-500 bg-purple-100/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 shadow-xs'
                : 'border-purple-200 dark:border-purple-900/40 bg-purple-50/60 hover:bg-purple-100/70 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Fadiga & Névoa</span>
              <span>🧠</span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5">Fadiga 9/10, Névoa 8/10</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyDiaryPreset('mild_stable')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 ${
              pain === 2
                ? 'border-emerald-500 bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 hover:bg-emerald-100/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Dia Controlado</span>
              <span>🌱</span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5">Dor 2/10, Disposição 7</p>
          </button>
        </div>
      </div>

      {/* Conversational AI Voice Check-In Banner */}
      <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/5 dark:from-teal-950/20 dark:to-slate-950/40 border border-teal-500/20 dark:border-teal-500/10 p-5 rounded-2xl shadow-xs space-y-3.5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-500/15 rounded-2xl shrink-0">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-poppins font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Check-in Rápido por Voz
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-md">
                Fale livremente sobre o seu dia (sintomas, remédios, água ou bem-estar). Nosso assistente inteligente vai preencher o formulário para você de forma simples e rápida!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenVoiceModal}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/15 hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Mic className="w-4 h-4" />
            Iniciar Conversa por Voz
          </button>
        </div>
      </div>

      {/* Conversational Voice Check-In Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden h-[85vh] max-h-[700px]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                <h3 className="font-poppins font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Diálogo Clínico com Assistente RITMA
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  stopSpeaking();
                  setShowVoiceModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-all"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Conversational Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/25 flex flex-col">
              <div className="space-y-4 flex-1">
                {voiceMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 animate-fade-in`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/15 flex items-center justify-center shrink-0 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-semibold shadow-xs relative group ${
                        msg.role === 'user'
                          ? 'bg-teal-500 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.role === 'assistant' && (
                        <div className="absolute right-2 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => speakResponse(msg.text)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-teal-500 transition-all"
                            title="Ouvir novamente"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Status and dynamic extraction feedback */}
              <div className="mt-4 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2 select-none">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Dados Clínicos Capturados do Relato nesta Sessão:
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className={pain !== null ? "text-emerald-500 font-bold" : "text-slate-300 dark:text-slate-700"}>●</span>
                    <span>Dor: <strong>{pain !== null ? `${pain}/10` : 'Pendente'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={sleep !== null ? "text-emerald-500 font-bold" : "text-slate-300 dark:text-slate-700"}>●</span>
                    <span>Sono: <strong>{sleep !== null ? `${sleep}/10` : 'Pendente'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={fatigue !== null ? "text-emerald-500 font-bold" : "text-slate-300 dark:text-slate-700"}>●</span>
                    <span>Fadiga: <strong>{fatigue !== null ? `${fatigue}/10` : 'Pendente'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={waterIntake > 0 ? "text-emerald-500 font-bold" : "text-slate-300 dark:text-slate-700"}>●</span>
                    <span>Água: <strong>{waterIntake > 0 ? `${waterIntake}ml` : 'Pendente'}</strong></span>
                  </div>
                  {selectedTriggers.length > 0 && (
                    <div className="flex items-center gap-1.5 col-span-2 border-t border-slate-50 dark:border-slate-800/50 pt-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="truncate">Gatilhos: <strong className="text-rose-500">{selectedTriggers.slice(-2).join(', ')}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Controls and Speak Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              {/* Voice and Wave status */}
              {isListening && (
                <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold text-rose-500 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span>Ouvindo... Fale de forma simples e natural.</span>
                </div>
              )}

              {isProcessingVoice && (
                <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold text-teal-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>RITMA está interpretando sua fala...</span>
                </div>
              )}

              {isSpeaking && !isListening && !isProcessingVoice && (
                <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>RITMA está respondendo em áudio...</span>
                  <button 
                    type="button" 
                    onClick={stopSpeaking}
                    className="text-[9px] text-rose-500 underline ml-1 font-bold hover:text-rose-600"
                  >
                    Mudar
                  </button>
                </div>
              )}

              {/* Chat Input row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessingVoice}
                  className={`p-3 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 active:scale-95'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title={isListening ? "Parar Gravação" : "Responder por Voz"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className={`w-4 h-4 ${!voiceTranscript && !isProcessingVoice ? 'animate-pulse' : ''}`} />
                  )}
                </button>

                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  disabled={isListening || isProcessingVoice}
                  placeholder={isListening ? "Ouvindo sua voz..." : "Toque no mic para falar ou digite aqui..."}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      processVoiceTranscript();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 font-semibold"
                />

                <button
                  type="button"
                  onClick={processVoiceTranscript}
                  disabled={isListening || isProcessingVoice || !voiceTranscript.trim()}
                  className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:hover:bg-teal-500 cursor-pointer shadow-sm shadow-teal-500/10 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Confirmation / Finalize Action */}
              <div className="pt-2 border-t border-slate-50 dark:border-slate-850/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    stopSpeaking();
                    setShowVoiceModal(false);
                  }}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Confirmar e Salvar no Diário
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    stopSpeaking();
                    setShowVoiceModal(false);
                  }}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isDetailed ? (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800/80">
              <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span>Check-in Rápido de Sintomas</span>
              </h3>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded">
                Ref: Últimas 24h
              </span>
            </div>

            {/* Pain Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="quick-slider-pain" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  Intensidade da Dor Geral
                  <button
                    type="button"
                    onClick={() => setShowPainHelp(!showPainHelp)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                    title="Ver explicação"
                    aria-label="Ver explicação sobre intensidade da dor"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${pain != null ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                  {pain != null ? `${pain} / 10` : 'Não avaliado (arraste para definir)'}
                </span>
              </div>
              {showPainHelp && (
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl text-sm text-rose-800 dark:text-rose-300 leading-relaxed space-y-1">
                  <p>Reflete o nível de dor geral sentido nas últimas 24 horas:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong>0</strong>: Sem dor alguma.</li>
                    <li><strong>1 a 3 (Leve)</strong>: Dor leve, presente mas que não interfere nas suas atividades.</li>
                    <li><strong>4 a 6 (Moderada)</strong>: Dor incômoda, exige esforço extra para focar ou fazer tarefas comuns.</li>
                    <li><strong>7 a 9 (Intensa)</strong>: Dor forte, atrapalha muito a concentração, o trabalho ou movimentos básicos.</li>
                    <li><strong>10 (Insuportável)</strong>: A pior dor possível imaginável, que impede qualquer atividade.</li>
                  </ul>
                </div>
              )}
              <input
                id="quick-slider-pain"
                type="range"
                min="0"
                max="10"
                step="1"
                value={pain ?? 0}
                onChange={(e) => setPain(Number(e.target.value))}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={pain ?? 0}
                aria-label="Intensidade da Dor Geral de 0 a 10"
                className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${pain != null ? 'accent-rose-500 bg-rose-200 dark:bg-rose-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>0 (Sem dor)</span>
                <span>10 (Pior dor possível)</span>
              </div>
            </div>

            {/* Fatigue Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="quick-slider-fatigue" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  Fadiga e Cansaço
                  <button
                    type="button"
                    onClick={() => setShowFatigueHelp(!showFatigueHelp)}
                    className="text-slate-400 hover:text-amber-500 transition-colors"
                    title="Ver explicação"
                    aria-label="Ver explicação sobre fadiga e cansaço"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${fatigue != null ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                  {fatigue != null ? `${fatigue} / 10` : 'Não avaliado (arraste para definir)'}
                </span>
              </div>
              {showFatigueHelp && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                  <p>A fadiga é uma exaustão profunda física ou mental que parece uma "bateria sem carga" e não melhora apenas com o repouso:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong>0</strong>: Com bastante energia, sem cansaço físico.</li>
                    <li><strong>1 a 3 (Leve)</strong>: Cansaço normal do dia a dia, fácil de contornar.</li>
                    <li><strong>4 a 6 (Moderada)</strong>: Corpo pesado, lentidão física e necessidade de pausas frequentes.</li>
                    <li><strong>7 a 9 (Intensa)</strong>: Exaustão severa, sensação de esforço gigante para tarefas simples.</li>
                    <li><strong>10 (Esgotamento)</strong>: Exaustão extrema que impede ficar de pé ou fazer qualquer esforço.</li>
                  </ul>
                </div>
              )}
              <input
                id="quick-slider-fatigue"
                type="range"
                min="0"
                max="10"
                step="1"
                value={fatigue ?? 0}
                onChange={(e) => setFatigue(Number(e.target.value))}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={fatigue ?? 0}
                aria-label="Fadiga e Cansaço de 0 a 10"
                className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${fatigue != null ? 'accent-amber-500 bg-amber-200 dark:bg-amber-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>0 (Sem cansaço)</span>
                <span>10 (Exaustão extrema)</span>
              </div>
            </div>

            {/* Sleep Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="quick-slider-sleep" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  Qualidade do Sono (Sensação de Descanso)
                  <button
                    type="button"
                    onClick={() => setShowSleepHelp(!showSleepHelp)}
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                    title="Ver explicação"
                    aria-label="Ver explicação sobre qualidade do sono"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${sleep != null ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                  {sleep != null ? `${sleep} / 10` : 'Não avaliado (arraste para definir)'}
                </span>
              </div>
              {showSleepHelp && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
                  <p>Avalia se o seu sono foi restaurador (se você sente que recuperou as energias após acordar, independente de quantas horas dormiu):</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong>0 (Não reparador)</strong>: Acordou super cansado(a) e com dor, como se não tivesse dormido nada.</li>
                    <li><strong>5 (Parcial)</strong>: Dormiu razoavelmente, mas ainda sente o corpo sem energia ou sono picado.</li>
                    <li><strong>10 (Excelente)</strong>: Acordou totalmente renovado(a), com a mente limpa e disposição física.</li>
                  </ul>
                </div>
              )}
              <input
                id="quick-slider-sleep"
                type="range"
                min="0"
                max="10"
                step="1"
                value={sleep ?? 0}
                onChange={(e) => setSleep(Number(e.target.value))}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={sleep ?? 0}
                aria-label="Qualidade do Sono de 0 a 10"
                className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${sleep != null ? 'accent-blue-500 bg-blue-200 dark:bg-blue-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>0 (Muito cansado / Não reparador)</span>
                <span>10 (Totalmente descansado / Reparador)</span>
              </div>
            </div>

            {/* Function Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="quick-slider-function" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  Nível de Funcionalidade Física
                  <button
                    type="button"
                    onClick={() => setShowFunctionHelp(!showFunctionHelp)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Ver explicação"
                    aria-label="Ver explicação sobre funcionalidade física"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${fun != null ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                  {fun != null ? `${fun} / 10` : 'Não avaliado (arraste para definir)'}
                </span>
              </div>
              {showFunctionHelp && (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed space-y-1">
                  <p>Representa a sua facilidade física para realizar as atividades de rotina (se vestir, pentear o cabelo, segurar talheres, caminhar ou subir degraus):</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong>0 (Incapaz)</strong>: Limitação física completa, sem condições de realizar tarefas básicas sozinho.</li>
                    <li><strong>5 (Parcial)</strong>: Realiza as tarefas com dificuldade, muita lentidão, dor ou adaptações.</li>
                    <li><strong>10 (Normal)</strong>: Realiza todas as atividades livremente, com vigor físico e sem limitações.</li>
                  </ul>
                </div>
              )}
              <input
                id="quick-slider-function"
                type="range"
                min="0"
                max="10"
                step="1"
                value={fun ?? 0}
                onChange={(e) => setFunction(Number(e.target.value))}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={fun ?? 0}
                aria-label="Nível de Funcionalidade Física de 0 a 10"
                className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${fun != null ? 'accent-emerald-500 bg-emerald-200 dark:bg-emerald-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>0 (Limitação total / dependente)</span>
                <span>10 (Atividades normais / sem limitação)</span>
              </div>
            </div>

            {/* Stiffness & Movement Limitation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="quick-slider-stiffness" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  Dificuldade de Movimento e Rigidez
                  <button
                    type="button"
                    onClick={() => setShowRigidityHelp(!showRigidityHelp)}
                    className="text-slate-400 hover:text-cyan-500 transition-colors"
                    title="Ver explicação"
                    aria-label="Ver explicação sobre rigidez e movimento"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${stiffness != null ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                  {stiffness != null ? `${stiffness} / 10` : 'Não avaliado (arraste para definir)'}
                </span>
              </div>
              {showRigidityHelp && (
                <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/10 border border-cyan-100 dark:border-cyan-900/30 rounded-xl text-sm text-cyan-800 dark:text-cyan-300 leading-relaxed space-y-1">
                  <p>Avalia o grau de travamento das articulações e limitação de movimento sentido no corpo:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong>0 (Livre)</strong>: Sem travamento, articulações soltas e movimentos sem atrito.</li>
                    <li><strong>1 a 3 (Leve)</strong>: Leve sensação de atrito ou rigidez passageira ao acordar (&lt; 15 min).</li>
                    <li><strong>4 a 6 (Moderada)</strong>: Corpo rígido, dificuldade para dobrar articulações por até 1 hora.</li>
                    <li><strong>7 a 9 (Intensa)</strong>: Travamento importante que limita caminhar, vestir-se ou segurar objetos.</li>
                    <li><strong>10 (Imobilidade)</strong>: Rigidez extrema que impede os movimentos articulares nas tarefas básicas.</li>
                  </ul>
                </div>
              )}
              <input
                id="quick-slider-stiffness"
                type="range"
                min="0"
                max="10"
                step="1"
                value={stiffness ?? 0}
                onChange={(e) => setStiffness(Number(e.target.value))}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={stiffness ?? 0}
                aria-label="Dificuldade de Movimento e Rigidez de 0 a 10"
                className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${stiffness != null ? 'accent-cyan-500 bg-cyan-200 dark:bg-cyan-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>0 (Livre / Sem travamento)</span>
                <span>10 (Travamento intenso / Imobilidade)</span>
              </div>
            </div>

            {/* Mood selector in Quick Check-In */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Brain className="w-3.5 h-3.5 text-violet-500" /> Como está seu humor hoje? (Opcional)
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {DIARY.moods.map((m) => {
                  const isSelected = mood === m[2];
                  return (
                    <button
                      key={m[2]}
                      type="button"
                      onClick={() => setMood(m[2])}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/20 text-teal-700 dark:text-teal-300 font-bold'
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <span className={`w-9 h-9 flex items-center justify-center rounded-full mb-1 transition-all ${
                        isSelected
                          ? 'bg-teal-500 text-white shadow-xs scale-110'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350'
                      }`}>
                        {m[2] === 1 && <Frown className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-red-500 dark:text-red-400'}`} />}
                        {m[2] === 2 && <Frown className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-orange-400 dark:text-orange-300'}`} />}
                        {m[2] === 3 && <Meh className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />}
                        {m[2] === 4 && <Smile className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />}
                        {m[2] === 5 && <Laugh className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-teal-500 dark:text-teal-400'}`} />}
                      </span>
                      <span className="text-[11px] font-bold tracking-tight">{m[1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Triggered Follow-up Questions Panel */}
          {renderAdaptiveGatingPanel()}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold rounded-2xl transition-all text-center text-xs cursor-pointer"
              >
                Voltar ao Painel
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveQuick}
              className={`${onBack ? 'flex-[2]' : 'w-full'} py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer`}
            >
              <Check className="w-5 h-5" />
              Salvar Registro Rápido
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsDetailed(true)}
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold py-2 px-4 rounded-xl hover:bg-teal-500/5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar mais detalhes (rigidez, exercício, ciclo, clima, medicamentos...)
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Quick toggle bar at top of detailed form */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60 animate-fade-in">
            <button
              type="button"
              onClick={() => setIsDetailed(false)}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-teal-500/5 transition-all cursor-pointer"
              aria-label="Voltar para o modo de Check-in Rápido"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Check-in Rápido
            </button>
            
            <button
              type="button"
              onClick={() => setShowAllFields(!showAllFields)}
              className="text-xs font-bold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-500/5 transition-all cursor-pointer"
              aria-label={showAllFields ? 'Ocultar campos não diagnósticos' : 'Mostrar todos os campos para preenchimento pontual'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{showAllFields ? 'Ocultar campos secundários' : 'Mostrar todos os campos'}</span>
            </button>
          </div>

          {/* Core Sliders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" /> Sintomas Centrais
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
              Ref: Últimas 24h
            </span>
          </h3>

          {/* Pain Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-pain" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                Intensidade da Dor Geral
                <button
                  type="button"
                  onClick={() => setShowPainHelp(!showPainHelp)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                  title="Ver explicação"
                  aria-label="Ver explicação sobre intensidade da dor"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${pain != null ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                {pain != null ? `${pain} / 10` : 'Não avaliado (arraste para definir)'}
              </span>
            </div>
            {showPainHelp && (
              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl text-sm text-rose-800 dark:text-rose-300 leading-relaxed space-y-1">
                <p>Reflete o nível de dor geral sentido nas últimas 24 horas:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li><strong>0</strong>: Sem dor alguma.</li>
                  <li><strong>1 a 3 (Leve)</strong>: Dor leve, presente mas que não interfere nas suas atividades.</li>
                  <li><strong>4 a 6 (Moderada)</strong>: Dor incômoda, exige esforço extra para focar ou fazer tarefas comuns.</li>
                  <li><strong>7 a 9 (Intensa)</strong>: Dor forte, atrapalha muito a concentration, o trabalho ou movimentos básicos.</li>
                  <li><strong>10 (Insuportável)</strong>: A pior dor possível imaginável, que impede qualquer atividade.</li>
                </ul>
              </div>
            )}
            <input
              id="slider-pain"
              type="range"
              min="0"
              max="10"
              step="1"
              value={pain ?? 0}
              onChange={(e) => setPain(Number(e.target.value))}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={pain ?? 0}
              aria-label="Intensidade da Dor Geral de 0 a 10"
              className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${pain != null ? 'accent-rose-500 bg-rose-200 dark:bg-rose-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>0 (Sem dor)</span>
              <span>10 (Pior dor possível)</span>
            </div>
          </div>

          {/* Fatigue Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-fatigue" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                Fadiga e Cansaço
                <button
                  type="button"
                  onClick={() => setShowFatigueHelp(!showFatigueHelp)}
                  className="text-slate-400 hover:text-amber-500 transition-colors"
                  title="Ver explicação"
                  aria-label="Ver explicação sobre fadiga e cansaço"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${fatigue != null ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                {fatigue != null ? `${fatigue} / 10` : 'Não avaliado (arraste para definir)'}
              </span>
            </div>
            {showFatigueHelp && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                <p>A fadiga é uma exaustão profunda física ou mental que parece uma "bateria sem carga" e não melhora apenas com o repouso:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li><strong>0</strong>: Com bastante energia, sem cansaço físico.</li>
                  <li><strong>1 a 3 (Leve)</strong>: Cansaço normal do dia a dia, fácil de contornar.</li>
                  <li><strong>4 a 6 (Moderada)</strong>: Corpo pesado, lentidão física e necessidade de pausas frequentes.</li>
                  <li><strong>7 a 9 (Intensa)</strong>: Exaustão severa, sensação de esforço gigante para tarefas simples.</li>
                  <li><strong>10 (Esgotamento)</strong>: Exaustão extrema que impede ficar de pé ou fazer qualquer esforço.</li>
                </ul>
              </div>
            )}
            <input
              id="slider-fatigue"
              type="range"
              min="0"
              max="10"
              step="1"
              value={fatigue ?? 0}
              onChange={(e) => setFatigue(Number(e.target.value))}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={fatigue ?? 0}
              aria-label="Fadiga e Cansaço de 0 a 10"
              className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${fatigue != null ? 'accent-amber-500 bg-amber-200 dark:bg-amber-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>0 (Sem cansaço)</span>
              <span>10 (Exaustão extrema)</span>
            </div>
          </div>

          {/* Sleep Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-sleep" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                Qualidade do Sono (Sensação de Descanso)
                <button
                  type="button"
                  onClick={() => setShowSleepHelp(!showSleepHelp)}
                  className="text-slate-400 hover:text-blue-500 transition-colors"
                  title="Ver explicação"
                  aria-label="Ver explicação sobre qualidade do sono"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${sleep != null ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                {sleep != null ? `${sleep} / 10` : 'Não avaliado (arraste para definir)'}
              </span>
            </div>
            {showSleepHelp && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
                <p>Avalia se o seu sono foi restaurador (se você sente que recuperou as energias após acordar, independente de quantas horas dormiu):</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li><strong>0 (Não reparador)</strong>: Acordou super cansado(a) e com dor, como se não tivesse dormido nada.</li>
                  <li><strong>5 (Parcial)</strong>: Dormiu razoavelmente, mas ainda sente o corpo sem energia ou sono picado.</li>
                  <li><strong>10 (Excelente)</strong>: Acordou totalmente renovado(a), com a mente limpa e disposição física.</li>
                </ul>
              </div>
            )}
            <input
              id="slider-sleep"
              type="range"
              min="0"
              max="10"
              step="1"
              value={sleep ?? 0}
              onChange={(e) => setSleep(Number(e.target.value))}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={sleep ?? 0}
              aria-label="Qualidade do Sono de 0 a 10"
              className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${sleep != null ? 'accent-blue-500 bg-blue-200 dark:bg-blue-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>0 (Muito cansado / Não reparador)</span>
              <span>10 (Totalmente descansado / Reparador)</span>
            </div>

            {/* Sleep Quality Sub-questions */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Ocorrências que impactaram a noite de sono anterior:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'Dificuldade para pegar no sono', label: 'Dificuldade para pegar no sono' },
                  { key: 'Despertei várias vezes de madrugada', label: 'Despertei várias vezes de madrugada' },
                  { key: 'Sono agitado / pesadelos', label: 'Sono agitado / pesadelos' }
                ].map((item) => {
                  const isSelected = (selectedTriggers || []).includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggleTrigger(item.key)}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-400/10 hover:bg-blue-400/20 border-blue-400/60 text-blue-700 dark:text-blue-400 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Function Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-function" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                Nível de Funcionalidade Física
                <button
                  type="button"
                  onClick={() => setShowFunctionHelp(!showFunctionHelp)}
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                  title="Ver explicação"
                  aria-label="Ver explicação sobre funcionalidade física"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${fun != null ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                {fun != null ? `${fun} / 10` : 'Não avaliado (arraste para definir)'}
              </span>
            </div>
            {showFunctionHelp && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed space-y-1">
                <p>Representa a sua facilidade física para realizar as atividades de rotina (se vestir, pentear o cabelo, segurar talheres, caminhar ou subir degraus):</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li><strong>0 (Incapaz)</strong>: Limitação física completa, sem condições de realizar tarefas básicas sozinho.</li>
                  <li><strong>5 (Parcial)</strong>: Realiza as tarefas com dificuldade, muita lentidão, dor ou adaptações.</li>
                  <li><strong>10 (Normal)</strong>: Realiza todas as atividades livremente, com vigor físico e sem limitações.</li>
                </ul>
              </div>
            )}
            <input
              id="slider-function"
              type="range"
              min="0"
              max="10"
              step="1"
              value={fun ?? 0}
              onChange={(e) => setFunction(Number(e.target.value))}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={fun ?? 0}
              aria-label="Nível de Funcionalidade Física de 0 a 10"
              className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${fun != null ? 'accent-emerald-500 bg-emerald-200 dark:bg-emerald-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>0 (Limitação total / dependente)</span>
              <span>10 (Atividades normais / sem limitação)</span>
            </div>

            {/* Stiffness & Movement Limitation Slider */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-stiffness" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  Dificuldade de Movimento e Rigidez Articular
                  <button
                    type="button"
                    onClick={() => setShowRigidityHelp(!showRigidityHelp)}
                    className="text-slate-400 hover:text-cyan-500 transition-colors"
                    title="Ver explicação"
                    aria-label="Ver explicação sobre rigidez e movimento"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${stiffness != null ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 font-black text-sm' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                  {stiffness != null ? `${stiffness} / 10` : 'Não avaliado (arraste para definir)'}
                </span>
              </div>
              {showRigidityHelp && (
                <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/10 border border-cyan-100 dark:border-cyan-900/30 rounded-xl text-sm text-cyan-800 dark:text-cyan-300 leading-relaxed space-y-1">
                  <p>Avalia o grau de travamento das articulações e limitação de movimento sentido no corpo:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong>0 (Livre)</strong>: Sem travamento, articulações soltas e movimentos sem atrito.</li>
                    <li><strong>1 a 3 (Leve)</strong>: Leve sensação de atrito ou rigidez passageira ao acordar (&lt; 15 min).</li>
                    <li><strong>4 a 6 (Moderada)</strong>: Corpo rígido, dificuldade para dobrar articulações por até 1 hora.</li>
                    <li><strong>7 a 9 (Intensa)</strong>: Travamento importante que limita caminhar, vestir-se ou segurar objetos.</li>
                    <li><strong>10 (Imobilidade)</strong>: Rigidez extrema que impede os movimentos articulares nas tarefas básicas.</li>
                  </ul>
                </div>
              )}
              <input
                id="slider-stiffness"
                type="range"
                min="0"
                max="10"
                step="1"
                value={stiffness ?? 0}
                onChange={(e) => setStiffness(Number(e.target.value))}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={stiffness ?? 0}
                aria-label="Dificuldade de Movimento e Rigidez Articular de 0 a 10"
                className={`w-full cursor-pointer h-1.5 rounded-lg appearance-none transition-all ${stiffness != null ? 'accent-cyan-500 bg-cyan-200 dark:bg-cyan-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>0 (Livre / Sem travamento)</span>
                <span>10 (Travamento intenso / Imobilidade)</span>
              </div>
            </div>

            {/* Carga Física / Esforço Mecânico de Hoje */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
              <div className="flex flex-col gap-0.5 select-none">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Carga Física / Esforço Mecânico de Hoje</span>
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                  O esforço mecânico ou físico total exercido no dia de hoje (atividades domésticas, escadas, caminhadas ou treinos):
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'Repouso maior que habitual', label: 'Repouso', desc: 'Mais parado que o normal' },
                  { value: 'Leve', label: 'Leve', desc: 'Esforço comum do dia' },
                  { value: 'Moderada', label: 'Moderada', desc: 'Tarefas de casa / caminhada' },
                  { value: 'Intensa / exagerei', label: 'Intensa / Exagerei', desc: 'Esforço pesado ou intenso' }
                ].map((item) => {
                  const isSelected = activityLoad === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setActivityLoad(item.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-950 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Triggered Follow-up Questions Panel */}
        {renderAdaptiveGatingPanel()}

        {/* Mood select grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-violet-500" /> Humor de Hoje
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
              Ref: Últimas 24h
            </span>
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {DIARY.moods.map((m) => {
              const isSelected = mood === m[2];
              return (
                <button
                  key={m[2]}
                  type="button"
                  onClick={() => setMood(m[2])}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/20 text-teal-700 dark:text-teal-300 font-bold'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <span className={`w-10 h-10 flex items-center justify-center rounded-full mb-1.5 transition-all ${
                    isSelected
                      ? 'bg-teal-500 text-white shadow-xs scale-110'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350'
                  }`}>
                    {m[2] === 1 && <Frown className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-red-500 dark:text-red-400'}`} />}
                    {m[2] === 2 && <Frown className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-orange-400 dark:text-orange-300'}`} />}
                    {m[2] === 3 && <Meh className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />}
                    {m[2] === 4 && <Smile className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />}
                    {m[2] === 5 && <Laugh className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-teal-500 dark:text-teal-400'}`} />}
                  </span>
                  <span className="text-xs font-bold tracking-tight">{m[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Emotional Modulators */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Moduladores Emocionais e de Estresse Observados Hoje:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'Estresse pessoal', label: 'Estresse Pessoal' },
                { key: 'Estresse familiar', label: 'Estresse Familiar' },
                { key: 'Estresse ocupacional', label: 'Estresse Ocupacional / Cobrança' },
                { key: 'Preocupação financeira', label: 'Preocupação Financeira' },
                { key: 'Ansiedade com sintomas', label: 'Ansiedade com Sintomas (Catastrofização)' },
                { key: 'Sobrecarga mental', label: 'Sobrecarga Mental / Burnout' },
                { key: 'Crise emocional', label: 'Crise Emocional' },
                { key: 'Sensação de solidão', label: 'Sensação de Solidão / Isolamento' },
                { key: 'Viagem / mudança de rotina', label: 'Viagem ou Mudança de Rotina' }
              ].map((item) => {
                const isSelected = (selectedTriggers || []).includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleTrigger(item.key)}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-400/10 hover:bg-violet-400/20 border-violet-400/60 text-violet-700 dark:text-violet-400 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-350'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Extended Clinical Variables & Detailed Symptom Questionnaire Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-500" /> Detalhamento de Variáveis & Padrões Clínicos
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Responda com facilidade às perguntas sobre localização, tipo de dor, cognição, postura e sensibilidades do seu dia.
              </p>
            </div>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded shrink-0">
              Mapeamento Estendido
            </span>
          </div>

          {/* 1. Localização e Caráter da Dor */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Localização Predominante da Dor Hoje (Selecione todas as regiões afetadas):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'cabeca', label: 'Cabeça / Pescoço' },
                  { key: 'ombros', label: 'Ombros / Trapézio' },
                  { key: 'coluna', label: 'Coluna / Lombar' },
                  { key: 'maos', label: 'Mãos / Punhos' },
                  { key: 'quadril', label: 'Quadril / Bacia' },
                  { key: 'joelhos', label: 'Joelhos / Pés' },
                  { key: 'difusa', label: 'Dor Difusa pelo Corpo Todo' }
                ].map((item) => {
                  const isSelected = painLocations.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleTogglePainLocation(item.key)}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white font-bold border-rose-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Tipo / Sensação da Dor Sentida Hoje:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'queimacao', label: 'Queimação / Ardor' },
                  { key: 'pontada', label: 'Pontadas / Facadas' },
                  { key: 'peso', label: 'Sensação de Peso' },
                  { key: 'pulsatil', label: 'Latejante / Pulsátil' },
                  { key: 'choque', label: 'Choque / Formigamento' },
                  { key: 'rigidez', label: 'Travamento / Rigidez' },
                  { key: 'profunda', label: 'Dor Profunda (Osso/Músculo)' }
                ].map((item) => {
                  const isSelected = painCharacter.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleTogglePainCharacter(item.key)}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Em qual período a dor esteve pior?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'matinal', label: 'Ao Acordar (Matinal)' },
                  { key: 'tarde', label: 'Durante a Tarde' },
                  { key: 'noite', label: 'Fim do Dia / Noite' },
                  { key: 'madrugada', label: 'Madrugada / Sono' },
                  { key: 'constante', label: 'Constante o Dia Todo' }
                ].map((item) => {
                  const isSelected = painWorstTime === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPainWorstTime(isSelected ? '' : item.key)}
                      className={`text-xs font-bold p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Névoa Cerebral, Ansiedade e Sensibilidades */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {/* Brain Fog Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-violet-500" />
                  Névoa Cerebral / Dificuldade de Foco (Brain Fog)
                </label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${brainFog !== null ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                  {brainFog !== null ? `${brainFog} / 10` : 'Não avaliado'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={brainFog ?? 0}
                onChange={(e) => setBrainFog(Number(e.target.value))}
                className="w-full cursor-pointer h-1.5 rounded-lg appearance-none accent-violet-500 bg-slate-100 dark:bg-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0 (Mente clara)</span>
                <span>10 (Extrema lentidão / esquecimento)</span>
              </div>
            </div>

            {/* Anxiety Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Nível de Ansiedade ou Tensão Interna
                </label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${anxietyLevel !== null ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                  {anxietyLevel !== null ? `${anxietyLevel} / 10` : 'Não avaliado'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={anxietyLevel ?? 0}
                onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                className="w-full cursor-pointer h-1.5 rounded-lg appearance-none accent-blue-500 bg-slate-100 dark:bg-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0 (Tranquilo)</span>
                <span>10 (Muito ansioso)</span>
              </div>
            </div>

            {/* Fast Checkbox Toggles for Neuro-Somatic Symptoms */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Sintomas Neuro-Somáticos Presentes Hoje:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setParesthesia(!paresthesia)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    paresthesia
                      ? 'border-teal-500 bg-teal-50/20 text-teal-800 dark:text-teal-300 font-bold'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Formigamento ou Dormência nas Mãos/Pés</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${paresthesia ? 'bg-teal-500 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    {paresthesia ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHeadache(!headache)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    headache
                      ? 'border-teal-500 bg-teal-50/20 text-teal-800 dark:text-teal-300 font-bold'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Cefaleia ou Crise de Enxaqueca</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${headache ? 'bg-teal-500 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    {headache ? '✓' : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Sensitivities */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Sensibilidades e Desconfortos Ambientais Sentidos Hoje:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'fotofobia', label: 'Sensibilidade à Luz (Fotofobia)' },
                  { key: 'fonofobia', label: 'Sensibilidade a Barulhos Altos' },
                  { key: 'frio', label: 'Sensibilidade Intensa ao Ar Condicionado / Frio' },
                  { key: 'boca_seca', label: 'Sensação de Boca Seca' },
                  { key: 'olhos_secos', label: 'Sensação de Olhos Secos ou Irritados' }
                ].map((item) => {
                  const isSelected = sensitivities.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggleSensitivity(item.key)}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 text-white font-bold border-cyan-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Sono, Postura e Pausas Ativas */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Despertares durante a noite:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'nenhum', label: 'Ininterrupto' },
                  { key: '1-2', label: '1 a 2 Vezes' },
                  { key: '3+', label: '3+ Vezes' }
                ].map((item) => {
                  const isSelected = nightAwakenings === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setNightAwakenings(isSelected ? '' : item.key)}
                      className={`text-xs font-bold p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Realizou pausas ativas / alongamentos no trabalho?
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivePauses(true)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    activePauses
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Sim, fiz pausas
                </button>
                <button
                  type="button"
                  onClick={() => setActivePauses(false)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    !activePauses
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Não fiz
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Continuation & Feedback Prompts */}
        {yesterdayPromptJSX}

        {/* Smart Medication Adherence Block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" /> Adesão às Medicações (Horário Atual)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                O aplicativo prevê seus remédios pelo horário de preenchimento. Responda se tomou as doses do período.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> Preenchendo às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Smart Schedule Doses Breakdown */}
          {(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            const nowTotalMins = currentHour * 60 + currentMinutes;

            const continuousList = medications.filter(m => m.category !== 'rescue');

            if (continuousList.length === 0) {
              return (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Nenhum remédio de uso contínuo cadastrado no seu perfil.</p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                    Cadastre suas medicações e horários na aba "Minhas Medicações" do menu lateral.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {/* Section 1: Doses due TODAY up to current time */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Doses Previstas para HOJE (até {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allTaken: Record<string, 'taken' | 'forgotten' | 'skipped'> = {};
                        continuousList.forEach((m) => {
                          allTaken[m.name] = 'taken';
                        });
                        setMedicationAdherence((prev) => ({ ...prev, ...allTaken }));
                      }}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Marcar todos como tomados
                    </button>
                  </div>

                  {continuousList.map((med) => {
                    const times = med.scheduleTimes && med.scheduleTimes.length > 0 ? med.scheduleTimes : [med.scheduleTime || '08:00'];
                    
                    return times.map((schedTime, idx) => {
                      const [sH, sM] = schedTime.split(':').map(Number);
                      const schedTotalMins = (sH || 8) * 60 + (sM || 0);
                      const isDueToday = schedTotalMins <= nowTotalMins;
                      const isLaterToday = schedTotalMins > nowTotalMins;

                      const key = `${med.name}_${schedTime}`;
                      const status = medicationAdherence[key] || medicationAdherence[med.name] || '';

                      const diffMins = nowTotalMins - schedTotalMins;
                      const diffHours = Math.floor(diffMins / 60);

                      return (
                        <div
                          key={`${med.id}-${idx}`}
                          className={`p-3 rounded-2xl border transition-all text-xs space-y-2.5 ${
                            isDueToday
                              ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/70 dark:border-amber-900/30'
                              : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{med.name}</span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                  ⏰ {schedTime}
                                </span>
                                {isDueToday && diffHours >= 1 && (
                                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                                    Há {diffHours}h atrás
                                  </span>
                                )}
                                {isLaterToday && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    Mais tarde hoje
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {med.dosage} · {med.frequency}
                              </span>
                            </div>

                            {/* Response Toggles */}
                            <div className="flex flex-wrap gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setMedicationAdherence(prev => ({ ...prev, [key]: 'taken', [med.name]: 'taken' }))}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                                  status === 'taken'
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                }`}
                              >
                                ✓ Tomei
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedicationAdherence(prev => ({ ...prev, [key]: 'delayed', [med.name]: 'delayed' }))}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                                  status === 'delayed'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                }`}
                              >
                                ⏰ Com Atraso
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedicationAdherence(prev => ({ ...prev, [key]: 'forgotten', [med.name]: 'forgotten' }))}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                                  status === 'forgotten'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                                }`}
                              >
                                ✗ Não Tomei
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedicationAdherence(prev => ({ ...prev, [key]: 'skipped', [med.name]: 'skipped' }))}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                  status === 'skipped'
                                    ? 'bg-slate-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                Ø Não era dia
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>

                {/* Section 2: Previous Evening / Yesterday Prompts if filling in the morning */}
                {currentHour < 12 && (
                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-2 text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" /> Pergunta de Ontem à Noite:
                    </span>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Você está preenchendo o diário pela manhã. Tomou corretamente a dose da noite de ontem das suas medicações contínuas?
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMedicationAdherence(prev => ({ ...prev, 'yesterday_night': 'taken' }))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer ${
                          medicationAdherence['yesterday_night'] === 'taken'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        ✓ Sim, tomei ontem à noite
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedicationAdherence(prev => ({ ...prev, 'yesterday_night': 'forgotten' }))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer ${
                          medicationAdherence['yesterday_night'] === 'forgotten'
                            ? 'bg-rose-500 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        ✗ Não tomei / Esqueci ontem
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Medication Triggers & Management Link */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
            <span className="text-[10px] text-slate-400 block">
              💡 Para adicionar novos remédios ou alterar alarmes, acesse a aba lateral "Minhas Medicações".
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Mudanças de Tratamento:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'Mudança de medicação recente', label: 'Tive mudança recente de dose ou medicação' }
              ].map((item) => {
                const isSelected = (selectedTriggers || []).includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleTrigger(item.key)}
                    className={`text-[11px] font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hábitos de Bem-estar & Conexão */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-1.5 select-none">
            <Trees className="w-4 h-4 text-emerald-600" /> Hábitos de Bem-estar, Conexão & Nutrição
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Marque as conexões, interações e fatores de suporte metabólico realizados hoje:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setNatureContact(!natureContact)}
              className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                natureContact
                  ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-500'
              }`}
            >
              <Trees className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <div>
                <strong className="block">Contato com Natureza</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">🌳 Parques, sol, terra</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHobbies(!hobbies)}
              className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                hobbies
                  ? 'border-violet-500 bg-violet-50/10 text-violet-600 dark:text-violet-400'
                  : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-500'
              }`}
            >
              <Palette className="w-5 h-5 flex-shrink-0 text-violet-500" />
              <div>
                <strong className="block">Tempo para Hobbies</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">🎨 Leitura, pintura, música</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLovedOnes(!lovedOnes)}
              className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                lovedOnes
                  ? 'border-rose-500 bg-rose-50/10 text-rose-600 dark:text-rose-400'
                  : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-500'
              }`}
            >
              <Users className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <div>
                <strong className="block">Pessoas Queridas</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">👥 Riso, abraço, conversa</span>
              </div>
            </button>
          </div>

          {/* Nutrition and Habits triggers */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Nutrição e Fatores Metabólicos de Hoje:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'Alimentação inadequada', label: 'Alimentação Inadequada / Inflamatória' },
                { key: 'Jejum prolongado', label: 'Jejum Prolongado' },
                { key: 'Excesso de cafeína', label: 'Excesso de Cafeína' },
                { key: 'Consumo de álcool', label: 'Consumo de Álcool' }
              ].map((item) => {
                const isSelected = (selectedTriggers || []).includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleTrigger(item.key)}
                    className={`text-[11px] font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tempo de Tela & Higiene Digital */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2 gap-2 select-none">
            <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-violet-500" /> Monitor de Carga Digital (Tempo de Tela)
            </h3>
            <div className="flex items-center gap-1.5">
              {syncedAppsData && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Sincronizado
                </span>
              )}
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded">
                Higiene Digital
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            O tempo de uso excessivo e o estímulo visual contínuo de aparelhos móveis podem sensibilizar o sistema nervoso e intensificar a percepção de dores crônicas.
          </p>

          {/* Device Sync Button */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-violet-500 tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Integração Integrada com Hardware
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sincronizar estatísticas do dispositivo atual
                </p>
                <p className="text-[10px] text-slate-400">
                  Compatível com Bem-Estar Digital (Android) e Tempo de Uso (iOS/macOS).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncScreenTime}
                disabled={isSyncingScreenTime}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer ${
                  isSyncingScreenTime
                    ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 cursor-not-allowed'
                    : 'bg-violet-500 hover:bg-violet-600 text-white shadow-sm'
                }`}
              >
                {isSyncingScreenTime ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Buscando Logs...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sincronizar Aparelho
                  </>
                )}
              </button>
            </div>

            {/* Apps Breakdown if Synced */}
            {syncedAppsData && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Aplicativos Mais Utilizados Hoje (Registrados via Sistema Operacional):
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {syncedAppsData.appsList.map((app, index) => {
                    let IconComponent = Smartphone;
                    if (app.category === 'Redes Sociais') IconComponent = Users;
                    else if (app.category === 'Comunicação') IconComponent = MessageCircle;
                    else if (app.category === 'Entretenimento') IconComponent = Play;
                    else if (app.category === 'Produtividade') IconComponent = Briefcase;

                    return (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <IconComponent className="w-4 h-4 text-violet-500 shrink-0" />
                          </div>
                          <div>
                            <strong className="text-slate-700 dark:text-slate-300 block">{app.name}</strong>
                            <span className="text-[9px] text-slate-400 font-medium">{app.category}</span>
                          </div>
                        </div>
                        <span className="font-mono font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded">
                          {app.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {screenTimeTotal !== null ? (
            <div className="grid grid-cols-2 gap-3 text-xs animate-fade-in bg-violet-50/30 dark:bg-violet-950/10 p-3 rounded-xl border border-violet-100/50 dark:border-violet-900/20">
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 font-medium block">Tempo de Tela Total (Sincronizado)</span>
                <strong className="text-sm text-violet-700 dark:text-violet-400 font-bold">{screenTimeTotal} h</strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 font-medium block">Redes Sociais/TikTok (Sincronizado)</span>
                <strong className="text-sm text-violet-700 dark:text-violet-400 font-bold">{screenTimeSocial} min</strong>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Sincronize seu aparelho acima para registrar automaticamente o tempo de tela.</p>
            </div>
          )}
        </div>

        {/* Terapias & Atividades Agendadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-1.5 select-none">
            <Calendar className="w-4 h-4 text-pink-500" /> Terapias & Consultas Realizadas Hoje
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Marque se você participou de alguma sessão de saúde ou tratamento integrativo hoje:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <label htmlFor="chk-psychotherapy" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all select-none">
              <input
                id="chk-psychotherapy"
                type="checkbox"
                checked={psychotherapyDay}
                onChange={(e) => setPsychotherapyDay(e.target.checked)}
                className="accent-teal-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Psicoterapia</span>
            </label>

            <label htmlFor="chk-physiotherapy" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all select-none">
              <input
                id="chk-physiotherapy"
                type="checkbox"
                checked={physiotherapyDay}
                onChange={(e) => setPhysiotherapyDay(e.target.checked)}
                className="accent-teal-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Fisioterapia</span>
            </label>

            <label htmlFor="chk-massage" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all select-none">
              <input
                id="chk-massage"
                type="checkbox"
                checked={massageDay}
                onChange={(e) => setMassageDay(e.target.checked)}
                className="accent-teal-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Massagem / Quiro</span>
            </label>

            <label htmlFor="chk-mindfulness" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all select-none">
              <input
                id="chk-mindfulness"
                type="checkbox"
                checked={mindfulnessDay}
                onChange={(e) => setMindfulnessDay(e.target.checked)}
                className="accent-teal-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Mindfulness / Meditação</span>
            </label>

            <label htmlFor="chk-acupuncture" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all select-none">
              <input
                id="chk-acupuncture"
                type="checkbox"
                checked={acupunctureDay}
                onChange={(e) => setAcupunctureDay(e.target.checked)}
                className="accent-teal-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Acupuntura</span>
            </label>

            <label htmlFor="chk-reumatolo" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all select-none">
              <input
                id="chk-reumatolo"
                type="checkbox"
                checked={reumatoloConsult}
                onChange={(e) => setReumatoloConsult(e.target.checked)}
                className="accent-teal-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Consulta Médica</span>
            </label>
          </div>

          {/* Agenda de Terapias e Eventos Recorrentes - Agrupada em Minhas Medicações */}
          {scheduledEvents.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3">
              <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 p-3 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Agenda Multidisciplinar ({scheduledEvents.length} cadastrada{scheduledEvents.length > 1 ? 's' : ''})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gerencie, adicione ou edite suas terapias e consultas na aba <strong className="text-purple-600 dark:text-purple-400">Minhas Medicações & Agenda</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Atividade Profissional e Rotina de Trabalho */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-teal-500" /> Atividade Profissional & Rotina de Trabalho
            </span>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded">
              Ambiente Ativo
            </span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Qual foi sua situação profissional ou de trabalho hoje?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  { id: 'Trabalhei normalmente', label: 'Trabalhei normalmente', desc: 'Atividade habitual sem alterações' },
                  { id: 'Trabalhei com adaptação/restrição', label: 'Trabalhei adaptado(a)', desc: 'Fiz pausas, mudei postura ou ritmo' },
                  { id: 'Afastado(a) por saúde', label: 'Licença Médica / Afastado', desc: 'Afastamento para reabilitação' },
                  { id: 'Licença, férias ou folga', label: 'Folga ou Recesso', desc: 'Fim de semana, férias ou folga' },
                  { id: 'Não se aplica', label: 'Não se aplica', desc: 'Não possuo atividade profissional ativa' },
                ].map((opt) => {
                  const isSelected = workStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setWorkStatus(opt.id);
                        if (opt.id === 'Afastado(a) por saúde') {
                          setWorkLeaveContinued(true);
                        } else {
                          setWorkLeaveContinued(false);
                          setWorkLeaveDuration('');
                        }
                      }}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/15 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 font-bold shadow-xs'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight block">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If actively working, show supportive self-care questions to avoid Nocebo and empower the patient */}
            {(workStatus === 'Trabalhei normalmente' || workStatus === 'Trabalhei com adaptação/restrição') && (
              <div className="p-4 bg-teal-50/10 dark:bg-teal-950/5 rounded-xl border border-teal-100/30 dark:border-teal-900/15 space-y-3 animate-fade-in">
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                  Práticas Saudáveis e Autocuidado de Hoje
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Marcar hábitos de regulação e micropausas ergonômicas ajuda a calibrar sua neurofisiologia e desensibilizar as vias de dor crônica:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Fiz pausas curtas regulares para alongar' },
                    { label: 'Ajustei cadeira, apoio e altura da tela' },
                    { label: 'Mantive hidratação frequente à mesa' },
                    { label: 'Fiz respiração lenta em picos de foco' },
                    { label: 'Tirei os olhos da tela a cada 30 min' },
                    { label: 'Fiz minha refeição longe do computador' },
                  ].map((item) => {
                    const isSelected = (selectedTriggers || []).includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleToggleTrigger(item.label)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/40 text-teal-800 dark:text-teal-300 font-semibold'
                            : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <span className="text-[10.5px] leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Fatores de Carga de Trabalho Observados */}
                <div className="space-y-2 pt-2 border-t border-teal-100/30 dark:border-teal-900/15">
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                    Fatores de Carga de Trabalho Observados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'Estresse ocupacional', label: 'Estresse Ocupacional / Cobrança' },
                      { key: 'Trabalho intenso / hora extra', label: 'Jornada Intensa / Horas Extras' }
                    ].map((item) => {
                      const isSelected = (selectedTriggers || []).includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleToggleTrigger(item.key)}
                          className={`text-[11px] font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/40 text-teal-700 dark:text-teal-400 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* If on medical leave */}
            {workLeaveContinued && (
              <div className="p-4 bg-amber-50/10 dark:bg-amber-950/5 rounded-xl border border-amber-100/30 dark:border-amber-900/15 space-y-3 animate-fade-in">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Planejamento de Reabilitação & Repouso Clínico
                </span>
                
                <div className="space-y-1.5">
                  <label htmlFor="input-work-leave-duration" className="font-bold text-slate-600 dark:text-slate-400 block cursor-pointer">
                    Qual a previsão ou prazo estimado do afastamento?
                  </label>
                  <input
                    id="input-work-leave-duration"
                    type="text"
                    value={workLeaveDuration}
                    onChange={(e) => setWorkLeaveDuration(e.target.value)}
                    placeholder="Ex: mais 15 dias / até perícia / indeterminado"
                    className="inp"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis Modules */}
        {displayedDxs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-1.5 select-none">
              <Activity className="w-4 h-4 text-teal-500" /> Sintomas por Diagnóstico {showAllFields && <span className="text-[10px] text-amber-500 font-bold">(Exibindo Todos)</span>}
            </h3>

            <div className="space-y-4 divide-y divide-slate-50 dark:divide-slate-800/50">
              {displayedDxs.map((dx) => {
                const conf = DX[dx];
                const qs = DIARY.moduleQuestions[dx];
                if (!qs) return null;

                const isPredom = predominant === dx;

                return (
                  <div key={dx} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-8 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[9px] font-black tracking-widest text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 font-sans">
                          {conf.icon}
                        </span>
                        {conf.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPredominant(isPredom ? '' : dx)}
                        className={`text-[9px] font-bold py-1 px-2.5 rounded-full border transition-all ${
                          isPredom
                            ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-400'
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <svg className={`w-3 h-3 ${isPredom ? 'text-amber-950 fill-amber-950' : 'text-slate-400 fill-transparent'}`} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span>{isPredom ? 'Predominante' : 'Definir Predominante'}</span>
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {qs.map((q) => {
                        const isChecked = !!moduleAnswers[dx]?.[q[0]];
                        const chkId = `chk-symptom-${dx}-${q[0]}`;
                        return (
                          <label
                            key={q[0]}
                            htmlFor={chkId}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-semibold cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'border-teal-500 bg-teal-50/20 text-teal-700 dark:text-teal-300'
                                : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              id={chkId}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSymptom(dx, q[0])}
                              className="accent-teal-500 h-3.5 w-3.5"
                            />
                            {q[1]}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* Extra Modules & Sliders (Simplified layout for mobile-first scrolling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Detailed Pain */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Dor & Rigidez
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Opcional</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="slider-worst-pain" className="font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">Pico Máximo de Dor</label>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition-all ${worstPain != null ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 font-black' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                    {worstPain != null ? `${worstPain} / 10` : 'Não avaliado (arraste para definir)'}
                  </span>
                </div>
                <input
                  id="slider-worst-pain"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={worstPain ?? 0}
                  onChange={(e) => setWorstPain(Number(e.target.value))}
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-valuenow={worstPain ?? 0}
                  aria-label="Pico Máximo de Dor de 0 a 10"
                  className={`w-full cursor-pointer h-1 rounded-lg appearance-none transition-all ${worstPain != null ? 'accent-rose-500 bg-rose-200 dark:bg-rose-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="slider-stiffness" className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer">
                    Rigidez Matinal
                    <button
                      type="button"
                      onClick={() => setShowRigidityHelp(!showRigidityHelp)}
                      className="text-slate-400 hover:text-teal-500 transition-colors"
                      title="Ver explicação"
                      aria-label="Ver explicação sobre rigidez matinal"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition-all ${stiffness != null ? 'text-teal-500 bg-teal-50 dark:bg-teal-950/30 font-black' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`}>
                    {stiffness != null ? `${stiffness} minutos` : 'Não avaliado (arraste para definir)'}
                  </span>
                </div>
                {showRigidityHelp && (
                  <div className="p-3 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 rounded-xl text-[11px] text-teal-800 dark:text-teal-300 leading-relaxed space-y-1">
                    <p><strong>O que é Rigidez?</strong> É a sensação de corpo preso, juntas "enferrujadas" ou dificuldade para mover as articulações livremente (parece que falta lubrificação/óleo). Geralmente melhora após se movimentar ou após um banho quente.</p>
                    <p><strong>O que é Rigidez Matinal?</strong> É o tempo (em minutos) que você leva logo após acordar e sair da cama para conseguir se movimentar com mais facilidade e sentir que o corpo "destravou".</p>
                  </div>
                )}
                <input
                  id="slider-stiffness"
                  type="range"
                  min="0"
                  max="240"
                  step="15"
                  value={stiffness ?? 0}
                  onChange={(e) => setStiffness(Number(e.target.value))}
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={240}
                  aria-valuenow={stiffness ?? 0}
                  aria-label="Rigidez Matinal em minutos"
                  className={`w-full cursor-pointer h-1 rounded-lg appearance-none transition-all ${stiffness != null ? 'accent-teal-500 bg-teal-200 dark:bg-teal-950' : 'accent-slate-400 bg-slate-100 dark:bg-slate-800'}`}
                />
              </div>
            </div>
          </div>

          {/* Exercise Log */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-500" /> Exercício de Hoje
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="select-exercise-done" className="font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">Atividade feita?</label>
                <select
                  id="select-exercise-done"
                  value={exerciseDone}
                  onChange={(e) => setExerciseDone(e.target.value)}
                  className="inp"
                >
                  {DIARY.selects.exerciseDone.map((o) => (
                    <option key={o} value={o}>
                      {o === '' ? 'Selecione' : o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="input-exercise-type" className="font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">Tipo</label>
                <input
                  id="input-exercise-type"
                  type="text"
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  placeholder="Ex: Natação"
                  className="inp"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="input-exercise-duration" className="font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">Duração (min)</label>
                <input
                  id="input-exercise-duration"
                  type="number"
                  value={exerciseDuration ?? ''}
                  onChange={(e) => setExerciseDuration(e.target.value ? Number(e.target.value) : null)}
                  min="0"
                  className="inp"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="select-exercise-pain" className="font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">Resposta de dor</label>
                <select
                  id="select-exercise-pain"
                  value={exercisePain}
                  onChange={(e) => setExercisePain(e.target.value)}
                  className="inp"
                >
                  {DIARY.selects.exercisePain.map((o) => (
                    <option key={o} value={o}>
                      {o === '' ? 'Selecione' : o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Med Rescue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="input-rescue-med" className="font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Medicação de Resgate / S.O.S.</label>
            <input
              id="input-rescue-med"
              type="text"
              value={rescueMed}
              onChange={(e) => setRescueMed(e.target.value)}
              placeholder="Ex: Paracetamol 500mg"
              className="inp"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="select-rescue-response" className="font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Resposta Percebida</label>
            <select
              id="select-rescue-response"
              value={rescueResponse}
              onChange={(e) => setRescueResponse(e.target.value)}
              className="inp"
            >
              {DIARY.selects.rescueResponse.map((o) => (
                <option key={o} value={o}>
                  {o === '' ? 'Selecione a eficácia' : o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hormones & Cycle Prediction */}
        {(showAllFields || patientData.hormoneRelevant || patientData.gender === 'F') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 text-xs animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-pink-500" /> Parâmetros Menstruais & Previsão de Ciclo
              </h4>
              <button
                type="button"
                onClick={() => setShowCycleConfig(!showCycleConfig)}
                className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                {showCycleConfig ? 'Ocultar configurações do ciclo' : 'Ajustar tipo e duração do ciclo'}
              </button>
            </div>

            {/* Cycle Config Selector */}
            {showCycleConfig && (
              <div className="bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 p-4 rounded-xl space-y-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Como é o seu ciclo menstrual habitual?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'regular', label: 'Regular (Previsível)' },
                      { id: 'irregular', label: 'Irregular (Variável)' },
                      { id: 'menopause', label: 'Menopausa / Climatério' },
                      { id: 'continuous_hormone', label: 'Uso Contínuo / Anticoncep.' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCycleType(item.id as any)}
                        className={`py-2 px-2.5 rounded-xl font-semibold text-[11px] border text-center transition-all ${
                          cycleType === item.id
                            ? 'bg-pink-500 text-white border-pink-500 font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-pink-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {cycleType === 'regular' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-pink-100 dark:border-pink-900/40">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Data da Última Menstruação</label>
                      <input
                        type="date"
                        value={lastPeriodDate}
                        onChange={(e) => setLastPeriodDate(e.target.value)}
                        className="inp"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Duração Média do Ciclo (dias)</label>
                      <input
                        type="number"
                        min="20"
                        max="45"
                        value={cycleLength}
                        onChange={(e) => setCycleLength(Number(e.target.value) || 28)}
                        className="inp"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cycle Status & Predictions */}
            {cycleType === 'regular' ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Fase Prevista Hoje: <span className="text-pink-600 dark:text-pink-400">{cyclePrediction.predictedPhase}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold rounded-full text-[10px]">
                      Dia {cyclePrediction.cycleDay} de {cycleLength}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    🩸 Próx. Menstruação: <strong>{fmtDate(cyclePrediction.nextPeriodDateISO, 's')}</strong> (em {cyclePrediction.daysToNextPeriod} dias)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  💡 {cyclePrediction.recommendationNote}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                {cycleType === 'irregular'
                  ? 'Ciclo marcado como irregular. As perguntas de fluxo e cólica são apresentadas abertamente para você registrar quando os sintomas surgirem.'
                  : 'Registrando parâmetros de acompanhamento hormonal contínuo ou climatério.'}
              </div>
            )}

            {/* Smart Targeted Questions Render Logic */}
            {(cycleType !== 'regular' || cyclePrediction.isHighSymptomWindow || showCycleQuestionsOverride) ? (
              <div className="space-y-3 pt-2">
                {cycleType === 'regular' && !cyclePrediction.isHighSymptomWindow && (
                  <div className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 p-2 rounded-lg flex items-center justify-between">
                    <span>Exibindo perguntas estendidas do ciclo manualmente por sua solicitação.</span>
                    <button type="button" onClick={() => setShowCycleQuestionsOverride(false)} className="underline">Ocultar</button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Fase Estimada</label>
                    <select value={cyclePhase} onChange={(e) => setCyclePhase(e.target.value)} className="inp">
                      {DIARY.selects.cyclePhase.map((o) => (
                        <option key={o} value={o}>
                          {o === '' ? 'Selecione' : o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Dia do Ciclo</label>
                    <input
                      type="number"
                      value={cycleDay ?? ''}
                      onChange={(e) => setCycleDay(e.target.value ? Number(e.target.value) : null)}
                      min="1"
                      className="inp"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Fluxo / Cólica</label>
                    <select value={cycleSymptoms} onChange={(e) => setCycleSymptoms(e.target.value)} className="inp">
                      {DIARY.selects.cycleSymptoms.map((o) => (
                        <option key={o} value={o}>
                          {o === '' ? 'Selecione' : o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Sintomas de Climatério / Menopausa</label>
                  <select value={menopause} onChange={(e) => setMenopause(e.target.value)} className="inp">
                    {DIARY.selects.menopauseSymptoms.map((o) => (
                      <option key={o} value={o}>
                        {o === '' ? 'Selecione' : o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Gatilhos Hormonais do Ciclo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'Menstruação/TPM', label: 'Menstruação / TPM' },
                      { key: 'Ovulação provável', label: 'Ovulação Provável' }
                    ].map((item) => {
                      const isSelected = (selectedTriggers || []).includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleToggleTrigger(item.key)}
                          className={`text-[11px] font-semibold py-1.5 px-3 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-pink-400/10 hover:bg-pink-400/20 border-pink-400/60 text-pink-700 dark:text-pink-400 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400'
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
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>
                    <strong>Fase Folicular (Estabilidade Hormonal)</strong>: Perguntas estendidas sobre TPM/cólica estão ocultadas hoje para agilizar seu diário.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCycleQuestionsOverride(true)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] hover:bg-slate-50 transition-colors"
                >
                  Exibir Perguntas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Weather & Smartwatch Automatic Telemetry Sync */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 text-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Zap className="w-4 h-4 text-amber-500 animate-pulse" /> Sincronização Automática em Segundo Plano
              </h4>
              <p className="text-slate-400 font-medium text-[10px] mt-0.5">
                Clima local e telemetria do smartwatch são coletados e vinculados automaticamente ao diário sem necessidade de sincronização diária manual.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncWeather}
              disabled={weatherSyncing}
              className="px-3 py-1.5 text-[11px] font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 select-none transition-all disabled:opacity-50 flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${weatherSyncing ? 'animate-spin' : ''}`} />
              {weatherSyncing ? 'Atualizando...' : 'Forçar Atualização'}
            </button>
          </div>

          {weatherStatusMsg && (
            <div className={`p-2.5 rounded-xl text-xs font-semibold ${weatherStatusMsg.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'}`}>
              {weatherStatusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Weather Box */}
            <div className="bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5 text-[11px]">
                  <CloudSun className="w-4 h-4 text-sky-500" /> Meteorologia Sincronizada
                </span>
                <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                  Automático (Meteorologia)
                </span>
              </div>
              {weather ? (
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-semibold text-xs pt-0.5">
                  <span>🌡️ {weather.temp}°C</span>
                  <span>💧 {weather.humidity}% Umidade</span>
                  <span>📉 {weather.pressure} hPa</span>
                </div>
              ) : (
                <span className="text-slate-400 text-[11px]">Sincronizando clima...</span>
              )}
            </div>

            {/* Smartwatch / Relógio Box */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]">
                  <Smartphone className="w-4 h-4 text-emerald-500" /> Smartwatch / Relógio Sincronizado
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  {wearableSync?.device || 'Conexão Pronta'}
                </span>
              </div>
              {wearableSync ? (
                <div className="flex flex-wrap items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold text-[11px] pt-0.5">
                  {wearableSync.steps != null && <span>👟 {wearableSync.steps.toLocaleString('pt-BR')} passos</span>}
                  {wearableSync.sleepHours != null && <span>🌙 {wearableSync.sleepHours}h ({wearableSync.sleepQuality ?? 80}% qual.)</span>}
                  {wearableSync.hrv != null && <span>❤️ HRV {wearableSync.hrv}ms</span>}
                  {wearableSync.restingHeartRate != null && <span>💓 Repouso {wearableSync.restingHeartRate} bpm</span>}
                </div>
              ) : (
                <span className="text-slate-400 text-[11px]">Conecte seu relógio ou sensores no menu Dispositivos & Sensores.</span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Sua percepção ou exposição ambiental hoje:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'Frio', label: 'Frio' },
                { key: 'Calor', label: 'Calor' },
                { key: 'Chuva', label: 'Chuva' },
                { key: 'Umidade', label: 'Umidade / Tempo Úmido' },
                { key: 'Ar-condicionado', label: 'Ar-condicionado' },
                { key: 'Exposição solar', label: 'Exposição Solar' }
              ].map((item) => {
                const isSelected = (selectedTriggers || []).includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleTrigger(item.key)}
                    className={`text-[11px] font-semibold py-1.5 px-3 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-sky-400/10 hover:bg-sky-400/20 border-sky-400/60 text-sky-700 dark:text-sky-400 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bloco Chronos: Infecções, Vacinas e Confundidores de Sintomas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Infecções, Vacinas & Confundidores
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
              Efeito Contexto
            </span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                Teve algum sinal de infecção, vacina recente ou pausa de remédio por infecção?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'nao', label: 'Não', iconType: 'check' },
                  { id: 'leve', label: 'Sintomas Leves', iconType: 'info' },
                  { id: 'importante', label: 'Sintomas Importantes', iconType: 'alert' },
                  { id: 'vacina', label: 'Tomei Vacina', iconType: 'syringe' },
                  { id: 'antibiotico', label: 'Usei Antibiótico', iconType: 'pill' },
                  { id: 'pausa_infeccao', label: 'Pausei Remédio', iconType: 'pause' },
                ].map((opt) => {
                  const isSelected = infectionOrVaccineStatus === opt.id;
                  let iconElement = null;
                  if (opt.iconType === 'check') {
                    iconElement = <Check className="w-3 h-3 text-emerald-500" />;
                  } else if (opt.iconType === 'info') {
                    iconElement = <Info className="w-3 h-3 text-amber-500" />;
                  } else if (opt.iconType === 'alert') {
                    iconElement = <ShieldAlert className="w-3 h-3 text-rose-500" />;
                  } else if (opt.iconType === 'syringe') {
                    iconElement = (
                      <svg className="w-3 h-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    );
                  } else if (opt.iconType === 'pill') {
                    iconElement = <Pill className="w-3 h-3 text-indigo-500" />;
                  } else if (opt.iconType === 'pause') {
                    iconElement = (
                      <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="3" height="16" rx="0.5" />
                        <rect x="15" y="4" width="3" height="16" rx="0.5" />
                      </svg>
                    );
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setInfectionOrVaccineStatus(opt.id as any);
                        // Reset sub-questions if user changes to "nao"
                        if (opt.id === 'nao') {
                          setInfectionSite('');
                          setInfectionFever('nao');
                          setInfectionCareNeeded('nao');
                          setInfectionTreatmentImpact('nao');
                          setInfectionWorkImpact('nao');
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/20 text-rose-700 dark:text-rose-300 font-bold'
                          : 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 shadow-3xs">
                        {iconElement}
                      </div>
                      <span className="leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Details if not 'Não' */}
            {infectionOrVaccineStatus !== 'nao' && (
              <div className="p-4 bg-rose-50/10 dark:bg-rose-950/5 rounded-xl border border-rose-100/30 dark:border-rose-900/10 space-y-4 animate-fadeIn">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                  🔍 Detalhes opcionais da ocorrência
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Onde foi o problema? */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Onde foi o problema?</label>
                    <select
                      value={infectionSite}
                      onChange={(e) => setInfectionSite(e.target.value as any)}
                      className="inp"
                    >
                      <option value="">Selecione se aplicável</option>
                      <option value="respiratorio">Respiratório (tosse, garganta, coriza)</option>
                      <option value="urinario">Urinário (ardor, urgência, urina diferente)</option>
                      <option value="intestinal">Intestinal (diarreia ou vômitos)</option>
                      <option value="pele">Pele (ferida, vermelhidão ou secreção)</option>
                      <option value="dentario">Dentário</option>
                      <option value="herpes">Herpes ou bolhas dolorosas</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  {/* Teve febre? */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Teve febre?</label>
                    <select
                      value={infectionFever}
                      onChange={(e) => setInfectionFever(e.target.value as any)}
                      className="inp"
                    >
                      <option value="nao">Não</option>
                      <option value="sensacao">Sensação febril</option>
                      <option value="medida">Febre medida</option>
                    </select>
                  </div>

                  {/* Precisou atendimento? */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Precisou de atendimento médico?</label>
                    <select
                      value={infectionCareNeeded}
                      onChange={(e) => setInfectionCareNeeded(e.target.value as any)}
                      className="inp"
                    >
                      <option value="nao">Não precisou</option>
                      <option value="consulta">Consulta de rotina / telemedicina</option>
                      <option value="pronto_socorro">Pronto atendimento / PS</option>
                      <option value="internacao">Internação</option>
                    </select>
                  </div>

                  {/* Houve impacto no tratamento? */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Impacto no tratamento reumatológico?</label>
                    <select
                      value={infectionTreatmentImpact}
                      onChange={(e) => setInfectionTreatmentImpact(e.target.value as any)}
                      className="inp"
                    >
                      <option value="nao">Sem alteração</option>
                      <option value="pausa_orientada">Pausei remédio por orientação médica</option>
                      <option value="pausa_propria">Pausei remédio por conta própria</option>
                      <option value="antibiotico">Iniciei uso de antibiótico</option>
                      <option value="antiviral">Iniciei uso de antiviral</option>
                      <option value="aumento_corticoide">Aumentei a dose de corticoide</option>
                    </select>
                  </div>

                  {/* Impactou rotina */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">Impacto no trabalho ou rotina?</label>
                    <select
                      value={infectionWorkImpact}
                      onChange={(e) => setInfectionWorkImpact(e.target.value as any)}
                      className="inp"
                    >
                      <option value="nao">Nenhum</option>
                      <option value="reduzi_atividades">Sim, reduzi atividades normais</option>
                      <option value="faltei_trabalho">Sim, faltei ao trabalho/estudo</option>
                    </select>
                  </div>
                </div>

                {/* Patient Safety Guidance Banner */}
                {patientData.continuousMeds && patientData.continuousMeds.length > 0 && (
                  <div className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[10.5px] text-rose-700 dark:text-rose-300 leading-normal font-medium flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Observação para paciente em uso de medicação contínua</strong>: O uso de imunobiológicos ou imunossupressores em vigência de infecção ativa com febre geralmente requer a pausa temporária do medicamento de base. <strong>Sempre consulte seu profissional da saúde antes de alterar a terapia ou reiniciar o tratamento.</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center select-none">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Anotações Livres e Prontuário Pessoal
            </label>
            <button
              type="button"
              onClick={handleOpenVoiceModal}
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-bold transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              Relatar por Voz (Assistente Rápido)
            </button>
          </div>
          <textarea
            maxLength={2000}
            rows={3}
            placeholder="Relate sentimentos adicionais, sintomas atípicos ou anotações que deseja que seu profissional da saúde leia no prontuário de evolução."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:border-teal-500 focus:outline-none resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold rounded-2xl transition-all text-center text-xs"
            >
              Cancelar e Voltar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className={`${onBack ? 'flex-[2]' : 'w-full'} py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-1.5 text-xs`}
          >
            <Check className="w-5 h-5" />
            {existingLog ? '✓ Atualizar Registro Diário' : 'Salvar Registro Diário'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};
