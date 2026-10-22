/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'patient' | 'doctor';

export type CrmStatus = 'pending' | 'verified' | 'failed';

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled';

export interface Subscription {
  plan: 'basic' | 'pro';
  status: SubscriptionStatus;
  discountApplied: boolean;
}

export interface CrmInfo {
  number: string;
  uf: string;
  name: string;
  status: CrmStatus;
  verified: boolean;
}

export interface LgpdConsent {
  accepted: boolean;
  at: string | null;
}

export interface Account {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  lgpd: LgpdConsent;
  subscription: Subscription;
  // Doctor fields
  doctorCode?: string;
  specialty?: string;
  contact?: {
    whatsapp: string;
    label: string;
  };
  crm?: CrmInfo;
  // Patient fields
  gender?: string | null;
  onboardingDone?: boolean;
  reminderOptIn?: boolean;
  medicationReminderPush?: boolean;
  demo?: boolean;
}

export interface ExerciseLog {
  done: string;
  type: string;
  duration: number | null;
  pain: string;
}

export interface CycleLog {
  phase: string;
  day: number | null;
  symptoms: string;
}

export interface WeatherLog {
  temp: number;
  humidity: number;
  pressure: number;
}

export interface WearableSyncData {
  steps?: number;
  sleepHours?: number;
  sleepQuality?: number; // 0-100
  hrv?: number; // Variabilidade da Frequência Cardíaca (ms)
  restingHeartRate?: number; // bpm
  device?: string; // ex: Apple Watch, Garmin
  syncedAt?: string;
}

export interface DailyLog {
  date: string;
  pain?: number | null;
  fatigue?: number | null;
  sleep?: number | null;
  function?: number | null;
  worstPain?: number | null;
  stiffness?: number | null;
  mood?: number | null;
  stressWork?: number | null;
  stressFamily?: number | null;
  stressPersonal?: number | null;
  stressContext?: string;
  workStatus?: string;
  activityLoad?: string;
  triggers?: string[];
  exercise?: ExerciseLog;
  cycle?: CycleLog;
  menopause?: string;
  weather?: WeatherLog;
  moduleAnswers?: Record<string, Record<string, boolean>>;
  predominant?: string;
  rescueMed?: string;
  rescueResponse?: string;
  notes?: string;
  wearableSync?: WearableSyncData;
  // New health behaviors and inputs
  natureContact?: boolean;
  hobbies?: boolean;
  lovedOnes?: boolean;
  waterIntake?: number; // logged in ml
  waterTarget?: number; // target in ml
  screenTimeTotal?: number; // in hours
  screenTimeSocial?: number; // tiktok / social media in minutes
  // Therapy and specialist session flags for correlation
  psychotherapyDay?: boolean;
  physiotherapyDay?: boolean;
  massageDay?: boolean;
  mindfulnessDay?: boolean;
  acupunctureDay?: boolean;
  reumatoloConsult?: boolean;
  // Medication logs
  forgotMedication?: boolean;
  medicationAdherence?: Record<string, 'taken' | 'forgotten' | 'skipped'>; // medName: status
  // Work leave status continuation
  workLeaveContinued?: boolean;
  workLeaveDuration?: string; // prazo do afastamento
  // Nutrition & Bowel (Alimentação & Intestino) logs
  waterSimple?: 'pouco' | 'adequado' | 'bastante';
  caffeineSimple?: 'nenhum' | 'pouco' | 'muito';
  alcoholLog?: boolean;
  gasBeverage?: boolean;
  greasyMeal?: boolean;
  unusualFood?: boolean;
  longFasting?: boolean;
  ultraprocessedExcess?: boolean;
  // Extended Clinical Variables (Dores, Cognição, Neuro-Somáticos & Rotina)
  painCharacter?: string[]; // queimacao, pontada, peso, pulsatil, choque, rigidez, profunda
  painLocations?: string[]; // cabeca, ombros, coluna, maos, quadril, joelhos, difusa
  painWorstTime?: 'matinal' | 'tarde' | 'noite' | 'madrugada' | 'constante';
  brainFog?: number | null; // 0-10 névoa cerebral/concentração
  paresthesia?: boolean; // formigamento / dormência
  headache?: boolean; // enxaqueca ou dor de cabeça
  sensitivities?: string[]; // fotofobia, fonofobia, frio, boca_seca, olhos_secos
  anxietyLevel?: number | null; // 0-10 ansiedade
  emotionalBurnout?: 'nenhum' | 'leve' | 'moderado' | 'intenso';
  posturalFatigue?: 'nenhuma' | 'sentado_longo' | 'em_pe_longo' | 'esforço_repetitivo';
  activePauses?: boolean; // pausas ativas e alongamento no trabalho
  nightAwakenings?: 'nenhum' | '1-2' | '3+';
  sleepRestorative?: 'sim' | 'parcial' | 'nao';
  // IBS/SII symptoms
  abdominalPain?: number | null;
  bloating?: number | null;
  gasSeverity?: number | null;
  evacuationUrgency?: 'nao' | 'leve' | 'moderada' | 'intensa';
  evacuatedToday?: boolean;
  bristolStoolType?: number | null;
  incompleteEvacuation?: boolean;
  stoolMucus?: boolean;
  stoolBlood?: boolean;
  // Infections, vaccines and confounders
  infectionOrVaccineStatus?: 'nao' | 'leve' | 'importante' | 'vacina' | 'antibiotico' | 'pausa_infeccao';
  infectionSite?: 'respiratorio' | 'urinario' | 'intestinal' | 'pele' | 'dentario' | 'herpes' | 'outro';
  infectionFever?: 'nao' | 'sensacao' | 'medida';
  infectionCareNeeded?: 'nao' | 'consulta' | 'pronto_socorro' | 'internacao';
  infectionTreatmentImpact?: 'nao' | 'pausa_orientada' | 'pausa_propria' | 'antibiotico' | 'antiviral' | 'aumento_corticoide';
  infectionWorkImpact?: 'nao' | 'reduzi_atividades' | 'faltei_trabalho';
  bodyPainMap?: Record<string, number>;
  foodMeals?: FoodMeal[];
  rescueMedsLogs?: RescueMedLog[];
}

export interface RescueMedLog {
  id: string;
  name: string;
  dosage: string;
  time: string;
  reason: string;
  painLevelAtUse?: number;
  responseAfterHours?: string;
  date: string;
}

export interface FoodMeal {
  id: string;
  mealType: 'cafe_manha' | 'almoco' | 'lanche' | 'jantar' | 'outro';
  foods: string; // items eaten
  suspectedTriggers?: string[]; // e.g. ['gluten', 'lactose', 'sugar', 'nightshades', 'artificial_sweeteners', 'red_meat', 'processed_food']
}

export interface PeriodicMetric {
  type: string;
  date: string;
  score: number;
  maxScore: number;
  prev: number | null;
}

export interface FlareAlert {
  date: string;
  score: number;
  level: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface BaselineField {
  mean: number;
  sd: number;
}

export type Baseline = Record<string, BaselineField>;

export interface MedicationConfig {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "1x ao dia", "2x ao dia", "A cada 12h", "À noite", "Semanal", "Crise / SOS"
  category?: 'continuous' | 'rescue'; // Uso Contínuo x Crise/Resgate
  scheduleTime?: string; // e.g. "08:00"
  scheduleTimes?: string[]; // e.g. ["08:00", "20:00"]
  reminderActive?: boolean;
  notes?: string;
  stockCount?: number; // Quantidade atual em estoque hoje
  stockAlertDaysBefore?: number; // Com quantos dias de antecedência do término quer avisar (ex: 5 dias)
  maxDailyDose?: string;
}

export interface ScheduledEventConfig {
  id: string;
  type: 'psychotherapy' | 'physiotherapy' | 'massage' | 'mindfulness' | 'acupuncture' | 'reumatologista' | 'other';
  title: string;
  recurrence: 'none' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0 = Domingo, 1 = Segunda, etc.
  date?: string; // data específica se for evento único
  active: boolean;
}

export interface PatientData {
  diagnoses: Record<string, boolean>;
  gender: string | null;
  hormoneRelevant: boolean;
  baseline: Baseline | null;
  periodicMetrics: PeriodicMetric[];
  flareAlerts: FlareAlert[];
  dailyLogs: DailyLog[];
  weight?: number; // em kg, para cálculo hídrico
  medications?: MedicationConfig[];
  scheduledEvents?: ScheduledEventConfig[];
  height?: number; // em cm
  birthDate?: string; // YYYY-MM-DD
  cardiovascularRisk?: boolean; // risco cardiovascular / hipertensão
  gastricSensitivity?: boolean; // sensibilidade gástrica / história de SII
  continuousMeds?: string[]; // medicamentos de uso contínuo (ex: Humira, Semaglutida, etc)
  painBaseline?: number; // dor crônica basal referida (1 a 10)
  sleepBaselineHours?: number; // média habitual de horas de sono
  fatigueBaseline?: number; // nível basal de fadiga recorrente (1 a 10)
  customSilhouetteSvg?: string; // Código SVG gerado pelo Gemini
  customSilhouetteBiotype?: string; // Biótipo selecionado para silhueta
  customSilhouetteStyle?: string; // Estilo estético da silhueta
  // Menstrual Cycle Configuration & Prediction
  menstrualCycleType?: 'regular' | 'irregular' | 'amenorrhea' | 'menopause' | 'continuous_hormone';
  cycleLengthDays?: number; // e.g. 28 days
  lastPeriodDate?: string; // YYYY-MM-DD of last period start
}

export interface LinkRecord {
  patientId: string;
  doctorId: string;
  status: 'pending' | 'authorized';
  initiatedBy: UserRole;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  status: 'unread' | 'read' | 'acted';
  createdAt: string;
  toUserId: string;
  fromUserId: string;
  type: 'link_request' | 'link_authorized' | 'outreach' | string;
  message: string;
  contactUrl?: string;
}

export interface Session {
  currentUserId: string | null;
}

export interface ChronosData {
  schemaVersion: string;
  accounts: Account[];
  patientData: Record<string, PatientData>;
  links: LinkRecord[];
  notifications: NotificationRecord[];
  session: Session;
}
