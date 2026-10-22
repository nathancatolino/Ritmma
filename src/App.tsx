/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChronosData, Account, PatientData, DailyLog } from './types';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { PatientView } from './components/PatientView';
import { DoctorView } from './components/DoctorView';
import { calcBaseline, validateClinicalData } from './utils';
import { testConnection, syncPatientDataToCloud, syncAccountToCloud, fetchPatientDataFromCloud, auth, logOutFromFirebase } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ROBUST SEED DATA FOR DEMO & CLINICAL SANDBOX TESTING
const INITIAL_SEED: ChronosData = {
  schemaVersion: '1.0.0',
  accounts: [
    {
      id: 'dr_silva',
      role: 'doctor',
      name: 'Dr. Roberto Silva',
      email: 'dr.silva@reuma.com',
      doctorCode: 'SILV-1234',
      specialty: 'Profissional da Saúde',
      crm: {
        number: '48329',
        uf: 'SP',
        name: 'Roberto Silva',
        status: 'verified',
        verified: true
      },
      lgpd: { accepted: true, at: '2026-06-01T10:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      contact: { whatsapp: '5511999998888', label: 'Secretária Márcia' }
    },
    {
      id: 'dr_marcos',
      role: 'doctor',
      name: 'Dr. Marcos Alencar',
      email: 'marcos@fisioterapia.com',
      doctorCode: 'ALEN-5678',
      specialty: 'Fisioterapeuta Traumato-Ortopédico',
      crm: {
        number: '12345',
        uf: 'SP',
        name: 'Marcos Alencar',
        status: 'verified',
        verified: true
      },
      lgpd: { accepted: true, at: '2026-06-01T10:30:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      contact: { whatsapp: '5511988887777', label: 'Recepção Fisio' }
    },
    {
      id: 'dr_luciana',
      role: 'doctor',
      name: 'Dra. Luciana Melo',
      email: 'luciana@treino.com',
      doctorCode: 'MELO-4321',
      specialty: 'Educadora Física - Treino Clínico',
      crm: {
        number: '98765',
        uf: 'SP',
        name: 'Luciana Melo',
        status: 'verified',
        verified: true
      },
      lgpd: { accepted: true, at: '2026-06-01T11:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      contact: { whatsapp: '5511977776666', label: 'Contato Personal' }
    },
    {
      id: 'dr_aline',
      role: 'doctor',
      name: 'Dra. Aline Santos',
      email: 'aline@nutri.com',
      doctorCode: 'SANT-8765',
      specialty: 'Nutricionista Funcional & Gastrintestinal',
      crm: {
        number: '13579',
        uf: 'RJ',
        name: 'Aline Santos',
        status: 'verified',
        verified: true
      },
      lgpd: { accepted: true, at: '2026-06-01T11:30:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      contact: { whatsapp: '5521966665555', label: 'Secretaria Nutrição' }
    },
    {
      id: 'dr_carla',
      role: 'doctor',
      name: 'Dra. Carla Mendes',
      email: 'carla@psico.com',
      doctorCode: 'MEND-2468',
      specialty: 'Psicóloga Comportamental de Dor',
      crm: {
        number: '24680',
        uf: 'MG',
        name: 'Carla Mendes',
        status: 'verified',
        verified: true
      },
      lgpd: { accepted: true, at: '2026-06-01T12:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      contact: { whatsapp: '5531955554444', label: 'Consultório de Psicologia' }
    },
    {
      id: 'patient_ana',
      role: 'patient',
      name: 'Ana Maria Ferreira',
      email: 'ana@pain.com',
      gender: 'F',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-02T14:30:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    },
    {
      id: 'patient_juliana',
      role: 'patient',
      name: 'Juliana Souza (Fisioterapia)',
      email: 'juliana@pain.com',
      gender: 'F',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-03T09:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    },
    {
      id: 'patient_carlos',
      role: 'patient',
      name: 'Carlos Roberto (Treinamento)',
      email: 'carlos@pain.com',
      gender: 'M',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-03T10:15:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    },
    {
      id: 'patient_mariana',
      role: 'patient',
      name: 'Mariana Costa (SII & Nutrição)',
      email: 'mariana@pain.com',
      gender: 'F',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-03T11:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    },
    {
      id: 'patient_lucas',
      role: 'patient',
      name: 'Lucas Almeida (Estresse & Humor)',
      email: 'lucas@pain.com',
      gender: 'M',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-03T14:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    },
    {
      id: 'dr_beatriz',
      role: 'doctor',
      name: 'Dra. Beatriz Santos',
      email: 'beatriz@geriatria.com',
      doctorCode: 'GERI-9988',
      specialty: 'Geriatra Especialista em Dor no Idoso',
      crm: {
        number: '77665',
        uf: 'SP',
        name: 'Beatriz Santos',
        status: 'verified',
        verified: true
      },
      lgpd: { accepted: true, at: '2026-06-01T13:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      contact: { whatsapp: '5511944443333', label: 'Consultório Geriatria' }
    },
    {
      id: 'patient_helena',
      role: 'patient',
      name: 'Dona Helena (Artrose & Dor Crônica)',
      email: 'helena@pain.com',
      gender: 'F',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-04T09:30:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    },
    {
      id: 'patient_thiago',
      role: 'patient',
      name: 'Thiago Neves (Lombalgia & Treino)',
      email: 'thiago@pain.com',
      gender: 'M',
      onboardingDone: true,
      lgpd: { accepted: true, at: '2026-06-04T10:00:00.000Z' },
      subscription: { plan: 'pro', status: 'active', discountApplied: false },
      reminderOptIn: true
    }
  ],
  patientData: {
    patient_ana: {
      diagnoses: { fibromialgia: true },
      gender: 'F',
      hormoneRelevant: true,
      baseline: null,
      periodicMetrics: [
        { type: 'PHQ9', date: '2026-06-10', score: 12, maxScore: 27, prev: null },
        { type: 'GAD7', date: '2026-06-10', score: 9, maxScore: 21, prev: null },
        { type: 'fibromialgia', date: '2026-06-12', score: 45, maxScore: 100, prev: null },
        { type: 'PHQ9', date: '2026-06-25', score: 7, maxScore: 27, prev: 12 },
        { type: 'GAD7', date: '2026-06-25', score: 5, maxScore: 21, prev: 9 }
      ],
      flareAlerts: [
        { date: '2026-06-14', score: 3.2, level: 'MODERATE' },
        { date: '2026-06-20', score: 4.1, level: 'HIGH' }
      ],
      dailyLogs: []
    },
    patient_juliana: {
      diagnoses: { osteoartrite: true, miofascial: true },
      gender: 'F',
      hormoneRelevant: false,
      baseline: null,
      height: 165,
      weight: 72,
      birthDate: '1984-09-15',
      gastricSensitivity: true,
      continuousMeds: ['metotrexato', 'pregabalina'],
      periodicMetrics: [
        { type: 'osteoartrite', date: '2026-06-11', score: 28, maxScore: 96, prev: null },
        { type: 'CSI7', date: '2026-06-11', score: 14, maxScore: 28, prev: null }
      ],
      flareAlerts: [],
      dailyLogs: []
    },
    patient_carlos: {
      diagnoses: { espondiloartrite: true },
      gender: 'M',
      hormoneRelevant: false,
      baseline: null,
      height: 180,
      weight: 85,
      birthDate: '1990-05-20',
      cardiovascularRisk: true,
      continuousMeds: ['adalimumabe'],
      periodicMetrics: [
        { type: 'espondiloartrite', date: '2026-06-12', score: 3.8, maxScore: 10, prev: null }
      ],
      flareAlerts: [],
      dailyLogs: []
    },
    patient_mariana: {
      diagnoses: { fibromialgia: true },
      gender: 'F',
      hormoneRelevant: true,
      baseline: null,
      height: 160,
      weight: 58,
      birthDate: '1995-11-03',
      gastricSensitivity: true,
      continuousMeds: ['duloxetina'],
      periodicMetrics: [
        { type: 'GAD7', date: '2026-06-10', score: 11, maxScore: 21, prev: null }
      ],
      flareAlerts: [],
      dailyLogs: []
    },
    patient_lucas: {
      diagnoses: { fibromialgia: true },
      gender: 'M',
      hormoneRelevant: false,
      baseline: null,
      height: 175,
      weight: 78,
      birthDate: '1988-02-14',
      continuousMeds: ['pregabalina', 'duloxetina'],
      periodicMetrics: [
        { type: 'migrainea', date: '2026-06-12', score: 56, maxScore: 78, prev: null },
        { type: 'PHQ9', date: '2026-06-12', score: 14, maxScore: 27, prev: null }
      ],
      flareAlerts: [],
      dailyLogs: []
    },
    patient_helena: {
      diagnoses: { osteoartrite: true, miofascial: true },
      gender: 'F',
      hormoneRelevant: false,
      baseline: null,
      height: 158,
      weight: 68,
      birthDate: '1952-04-12',
      continuousMeds: ['paracetamol', 'condroitina'],
      periodicMetrics: [
        { type: 'osteoartrite', date: '2026-06-12', score: 42, maxScore: 96, prev: null }
      ],
      flareAlerts: [],
      dailyLogs: []
    },
    patient_thiago: {
      diagnoses: { miofascial: true },
      gender: 'M',
      hormoneRelevant: false,
      baseline: null,
      height: 182,
      weight: 80,
      birthDate: '1992-08-24',
      cardiovascularRisk: false,
      continuousMeds: [],
      periodicMetrics: [
        { type: 'CSI7', date: '2026-06-12', score: 8, maxScore: 28, prev: null }
      ],
      flareAlerts: [],
      dailyLogs: []
    }
  },
  links: [
    {
      patientId: 'patient_ana',
      doctorId: 'dr_silva',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    },
    {
      patientId: 'patient_juliana',
      doctorId: 'dr_marcos',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    },
    {
      patientId: 'patient_carlos',
      doctorId: 'dr_luciana',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    },
    {
      patientId: 'patient_mariana',
      doctorId: 'dr_aline',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    },
    {
      patientId: 'patient_lucas',
      doctorId: 'dr_carla',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    },
    {
      patientId: 'patient_helena',
      doctorId: 'dr_beatriz',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    },
    {
      patientId: 'patient_thiago',
      doctorId: 'dr_luciana',
      status: 'authorized',
      initiatedBy: 'patient',
      createdAt: '2026-06-03'
    }
  ],
  notifications: [
    {
      id: 'n1',
      status: 'unread',
      createdAt: '2026-06-25T16:00:00.000Z',
      toUserId: 'patient_ana',
      fromUserId: 'dr_silva',
      type: 'outreach',
      message: 'Olá Ana, notei uma oscilação na sua rigidez matinal nos últimos logs. Como você está se sentindo hoje?',
      contactUrl: 'https://wa.me/5511999998888'
    }
  ],
  session: {
    currentUserId: null
  }
};

// Populate 14 consecutive daily logs for Ana Maria to showcase analytics beautifully
const generateAnaLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const pains = [5, 4, 6, 8, 7, 5, 4, 3, 4, 5, 8, 9, 6, 4];
  const fatigues = [6, 5, 7, 8, 8, 6, 5, 4, 5, 6, 9, 8, 7, 5];
  const sleeps = [4, 5, 3, 2, 4, 5, 6, 7, 5, 4, 2, 3, 5, 6];
  const functions = [7, 8, 6, 4, 5, 7, 8, 9, 8, 7, 4, 3, 6, 8];
  const triggers = [
    ['Frio'],
    [],
    ['Estresse familiar', 'Chuva'],
    ['Estresse familiar', 'Sono ruim'],
    ['Sono ruim'],
    [],
    [],
    [],
    ['Esforço físico'],
    [],
    ['Frio', 'Estresse ocupacional'],
    ['Frio', 'Sono ruim', 'Estresse ocupacional'],
    ['Mudança de medicação'],
    []
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: pains[i],
      fatigue: fatigues[i],
      sleep: sleeps[i],
      function: functions[i],
      worstPain: pains[i] + (Math.random() > 0.5 ? 1 : 0),
      stiffness: pains[i] > 6 ? 45 : 15,
      mood: sleeps[i] >= 5 ? 4 : 2,
      triggers: triggers[i],
      activityLoad: pains[i] > 6 ? 'Leve' : 'Moderada',
      notes: pains[i] > 7 ? 'Sinto muita rigidez hoje nas articulações.' : 'Dia tranquilo.',
      weather: {
        temp: 18 + Math.sin(i) * 4,
        humidity: 70 + Math.cos(i) * 10,
        pressure: 1012 + Math.sin(i) * 5
      },
      moduleAnswers: {
        fibromialgia: {
          brainFog: pains[i] > 6,
          dorDifusa: true,
          sensibilidade: pains[i] > 5,
          sonoNaoReparador: sleeps[i] < 5
        }
      }
    });
  }
  return list;
};

// Populate 14 logs for Juliana Souza (Physiotherapy & Pacing metrics focus)
const generateJulianaLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const pains = [4, 4, 5, 7, 6, 5, 3, 3, 4, 5, 8, 7, 5, 3];
  const stiffnessValues = [3, 4, 5, 8, 7, 5, 2, 3, 3, 4, 9, 8, 4, 3]; // Scale of 10 for physio chart
  const fatigues = [4, 5, 5, 6, 6, 4, 3, 3, 4, 4, 7, 6, 5, 4];
  const loads = [
    'Leve', 'Moderada', 'Intensa / exagerei', 'Leve', 'Repouso maior que habitual',
    'Leve', 'Moderada', 'Leve', 'Moderada', 'Intensa / exagerei',
    'Repouso maior que habitual', 'Leve', 'Moderada', 'Leve'
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: pains[i],
      fatigue: fatigues[i],
      sleep: 6,
      function: 7,
      stiffness: stiffnessValues[i],
      activityLoad: loads[i],
      triggers: loads[i] === 'Intensa / exagerei' ? ['Esforço físico'] : [],
      notes: loads[i] === 'Intensa / exagerei' ? 'Exagerei nas atividades ontem, hoje acordei com muita rigidez.' : 'Tudo estável.'
    });
  }
  return list;
};

// Populate 14 logs for Carlos Roberto (Fitness & wearable steps focus)
const generateCarlosLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const pains = [3, 4, 5, 4, 6, 5, 3, 4, 4, 5, 6, 5, 4, 3];
  const fatigues = [3, 4, 6, 5, 7, 6, 4, 4, 5, 5, 8, 6, 5, 3];
  const steps = [8200, 9500, 11400, 6200, 4100, 7800, 9000, 10200, 8900, 10800, 12500, 5200, 7300, 8500];
  const exercises = [
    { done: 'Sim', type: 'Alongamento', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Caminhada', duration: 45, pain: 'Não piorou' },
    { done: 'Sim', type: 'Natação', duration: 40, pain: 'Piorou horas depois' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Sim', type: 'Alongamento', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Caminhada', duration: 40, pain: 'Não piorou' },
    { done: 'Sim', type: 'Bicicleta', duration: 35, pain: 'Não piorou' },
    { done: 'Sim', type: 'Caminhada', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Treino de Força', duration: 45, pain: 'Piorou no dia seguinte' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Sim', type: 'Caminhada', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Alongamento', duration: 25, pain: 'Não piorou' }
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: pains[i],
      fatigue: fatigues[i],
      sleep: 7,
      function: 8,
      wearableSync: {
        steps: steps[i],
        sleepHours: 7.5,
        sleepQuality: 80,
        device: 'Apple Watch',
        syncedAt: new Date().toISOString()
      },
      exercise: {
        done: exercises[i].done,
        type: exercises[i].type,
        duration: exercises[i].duration,
        pain: exercises[i].pain
      }
    });
  }
  return list;
};

// Populate 14 logs for Mariana Costa (Nutrition & visceral SII focus)
const generateMarianaLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const abdominalPains = [2, 3, 5, 6, 4, 3, 2, 2, 3, 5, 7, 6, 4, 2];
  const bloatings = [2, 4, 6, 7, 5, 3, 2, 1, 3, 4, 8, 7, 5, 2];
  const water = [1800, 2000, 1400, 1100, 1300, 1900, 2100, 1900, 1700, 1200, 900, 1400, 1800, 2000];
  const bristol = [4, 4, 2, 1, 3, 4, 4, 4, 3, 5, 6, 6, 4, 4];
  const triggerCaffeine = [
    'pouco', 'pouco', 'muito', 'muito', 'pouco', 'nenhum', 'pouco',
    'pouco', 'pouco', 'muito', 'muito', 'pouco', 'nenhum', 'pouco'
  ];
  const greasy = [
    false, false, true, true, false, false, false,
    false, false, true, true, false, false, false
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: Math.round((abdominalPains[i] + 3) / 2),
      fatigue: 5,
      sleep: 6,
      function: 7,
      waterIntake: water[i],
      abdominalPain: abdominalPains[i],
      bloating: bloatings[i],
      bristolStoolType: bristol[i],
      caffeineSimple: triggerCaffeine[i] as 'nenhum' | 'pouco' | 'muito',
      greasyMeal: greasy[i],
      ultraprocessedExcess: greasy[i],
      longFasting: triggerCaffeine[i] === 'muito',
      notes: greasy[i] ? 'Alimentação fora de hora e café demais atacaram meu intestino.' : 'Intestino regulado.'
    });
  }
  return list;
};

// Populate 14 logs for Lucas Almeida (Psychological stress & mood focus)
const generateLucasLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const moods = [4, 4, 3, 2, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4];
  const sWork = [3, 4, 6, 8, 7, 5, 3, 4, 5, 7, 9, 8, 5, 3];
  const sPersonal = [2, 3, 4, 6, 5, 4, 2, 2, 3, 5, 8, 7, 4, 2];
  const support = [
    true, true, false, false, false, true, true,
    true, false, false, false, false, true, true
  ]; // natureContact / hobbies / lovedOnes
  const contexts = [
    '', '', 'Reunião tensa de fechamento trimestral', 'Cobrança excessiva da gerência e ansiedade', 'Preocupações financeiras e insônia', '', '',
    '', 'Discussão boba com colega de trabalho', 'Muita pressão por prazos no projeto', 'Crise de estresse severa por sobrecarga mental', 'Recuperando da ressaca emocional de ontem', '', ''
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: moods[i] <= 2 ? 7 : 4,
      fatigue: moods[i] <= 2 ? 8 : 4,
      sleep: moods[i] + 2,
      function: moods[i] + 4,
      mood: moods[i],
      stressWork: sWork[i],
      stressFamily: 3,
      stressPersonal: sPersonal[i],
      stressContext: contexts[i],
      natureContact: support[i],
      hobbies: support[i],
      lovedOnes: support[i]
    });
  }
  return list;
};

// Populate 14 logs for Helena Oliveira (Artrose & joint pain focus)
const generateHelenaLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const pains = [5, 6, 6, 7, 5, 4, 3, 4, 5, 6, 7, 5, 4, 4];
  const stiffnessValues = [6, 7, 8, 9, 7, 5, 4, 5, 6, 8, 9, 7, 5, 4];
  const fatigues = [5, 6, 7, 8, 6, 4, 3, 4, 5, 6, 8, 6, 5, 4];
  const loads = [
    'Leve', 'Moderada', 'Intensa / exagerei', 'Leve', 'Repouso maior que habitual',
    'Leve', 'Moderada', 'Leve', 'Moderada', 'Intensa / exagerei',
    'Repouso maior que habitual', 'Leve', 'Moderada', 'Leve'
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: pains[i],
      fatigue: fatigues[i],
      sleep: 5,
      function: 6,
      stiffness: stiffnessValues[i],
      activityLoad: loads[i],
      triggers: loads[i] === 'Intensa / exagerei' ? ['Mudança de clima'] : [],
      notes: loads[i] === 'Intensa / exagerei' ? 'Artrose atacou com a chuva de ontem, muita dor nos joelhos.' : 'Dor tolerável sob medicação.'
    });
  }
  return list;
};

// Populate 14 logs for Thiago Neves (Athlete load & kinetic recovery focus)
const generateThiagoLogs = (): DailyLog[] => {
  const list: DailyLog[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const pains = [3, 4, 5, 4, 6, 5, 3, 4, 4, 5, 6, 5, 4, 3];
  const fatigues = [3, 4, 6, 5, 7, 6, 4, 4, 5, 5, 8, 6, 5, 3];
  const steps = [10200, 12500, 14400, 8200, 5100, 9800, 11000, 12200, 9900, 11800, 13500, 6200, 8300, 9500];
  const exercises = [
    { done: 'Sim', type: 'Fisioterapia de Lombar', duration: 45, pain: 'Não piorou' },
    { done: 'Sim', type: 'Corrida Leve', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Treino Funcional', duration: 50, pain: 'Piorou horas depois' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Sim', type: 'Fisioterapia de Lombar', duration: 45, pain: 'Não piorou' },
    { done: 'Sim', type: 'Caminhada', duration: 40, pain: 'Não piorou' },
    { done: 'Sim', type: 'Musculação Clinica', duration: 50, pain: 'Não piorou' },
    { done: 'Sim', type: 'Caminhada', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Corrida', duration: 45, pain: 'Piorou no dia seguinte' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Não fiz', type: '', duration: null, pain: '' },
    { done: 'Sim', type: 'Caminhada', duration: 30, pain: 'Não piorou' },
    { done: 'Sim', type: 'Fisioterapia de Lombar', duration: 45, pain: 'Não piorou' }
  ];

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate.getTime() + i * 864e5);
    const dIso = d.toISOString().split('T')[0];

    list.push({
      date: dIso,
      pain: pains[i],
      fatigue: fatigues[i],
      sleep: 7,
      function: 8,
      wearableSync: {
        steps: steps[i],
        sleepHours: 7.2,
        sleepQuality: 82,
        device: 'Garmin Fenix',
        syncedAt: new Date().toISOString()
      },
      exercise: {
        done: exercises[i].done,
        type: exercises[i].type,
        duration: exercises[i].duration,
        pain: exercises[i].pain
      }
    });
  }
  return list;
};

// Populate and calculate baselines for all patients
const anaLogs = generateAnaLogs();
INITIAL_SEED.patientData.patient_ana.dailyLogs = anaLogs;
INITIAL_SEED.patientData.patient_ana.baseline = calcBaseline(anaLogs);

const julianaLogs = generateJulianaLogs();
INITIAL_SEED.patientData.patient_juliana.dailyLogs = julianaLogs;
INITIAL_SEED.patientData.patient_juliana.baseline = calcBaseline(julianaLogs);

const carlosLogs = generateCarlosLogs();
INITIAL_SEED.patientData.patient_carlos.dailyLogs = carlosLogs;
INITIAL_SEED.patientData.patient_carlos.baseline = calcBaseline(carlosLogs);

const marianaLogs = generateMarianaLogs();
INITIAL_SEED.patientData.patient_mariana.dailyLogs = marianaLogs;
INITIAL_SEED.patientData.patient_mariana.baseline = calcBaseline(marianaLogs);

const lucasLogs = generateLucasLogs();
INITIAL_SEED.patientData.patient_lucas.dailyLogs = lucasLogs;
INITIAL_SEED.patientData.patient_lucas.baseline = calcBaseline(lucasLogs);

const helenaLogs = generateHelenaLogs();
INITIAL_SEED.patientData.patient_helena.dailyLogs = helenaLogs;
INITIAL_SEED.patientData.patient_helena.baseline = calcBaseline(helenaLogs);

const thiagoLogs = generateThiagoLogs();
INITIAL_SEED.patientData.patient_thiago.dailyLogs = thiagoLogs;
INITIAL_SEED.patientData.patient_thiago.baseline = calcBaseline(thiagoLogs);

export default function App() {
  const [data, setData] = useState<ChronosData>(() => {
    const saved = localStorage.getItem('chronos_app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.accounts && parsed.patientData) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved chronos data, using seed.', e);
      }
    }
    return INITIAL_SEED;
  });

  const [loading, setLoading] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  // Track shared doctor code if present in the URL query parameters
  const [prefilledDocCode, setPrefilledDocCode] = useState<string | null>(null);

  // Test Firestore connection on boot and listen to auth changes
  useEffect(() => {
    testConnection().then((ok) => {
      setCloudSyncStatus(ok ? 'synced' : 'offline');
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const emailLower = user.email.toLowerCase();
        setData((prev) => {
          const acc = prev.accounts.find((a) => a.email.toLowerCase() === emailLower);
          if (acc && prev.session.currentUserId !== acc.id) {
            return {
              ...prev,
              session: { ...prev.session, currentUserId: acc.id }
            };
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chronos_theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    validateClinicalData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setPrefilledDocCode(code.trim().toUpperCase());
    }
  }, []);

  // Update central state, write to localStorage and automatically backup to Firestore
  const handleUpdateData = (updater: (prev: ChronosData) => void) => {
    setData((prev) => {
      // Clone deeply to ensure real immutability of PatientData objects and their internal structures (dailyLogs, periodicMetrics, flareAlerts, etc)
      const cloned: ChronosData = {
        ...prev,
        accounts: prev.accounts.map((acc) => ({ ...acc })),
        patientData: JSON.parse(JSON.stringify(prev.patientData)),
        links: prev.links.map((l) => ({ ...l })),
        notifications: prev.notifications.map((n) => ({ ...n })),
        session: { ...prev.session }
      };

      updater(cloned);

      // Write to storage
      localStorage.setItem('chronos_app_data', JSON.stringify(cloned));

      // Asynchronously backup to Firestore if user is active
      if (cloned.session.currentUserId) {
        const uId = cloned.session.currentUserId;
        const currentAcc = cloned.accounts.find((a) => a.id === uId);
        const currentPData = cloned.patientData[uId];
        if (currentAcc && currentPData) {
          setCloudSyncStatus('syncing');
          Promise.all([
            syncAccountToCloud(currentAcc),
            syncPatientDataToCloud(uId, currentPData)
          ])
            .then(() => setCloudSyncStatus('synced'))
            .catch(() => setCloudSyncStatus('offline'));
        }
      }

      return cloned;
    });
  };

  const handleManualCloudSync = async (): Promise<boolean> => {
    const current = data.accounts.find((a) => a.id === data.session.currentUserId);
    if (!current) return false;
    setCloudSyncStatus('syncing');
    const pData = data.patientData[current.id];
    try {
      const okAcc = await syncAccountToCloud(current);
      let okPData = true;
      if (pData) {
        okPData = await syncPatientDataToCloud(current.id, pData);
      }
      const allOk = okAcc && okPData;
      setCloudSyncStatus(allOk ? 'synced' : 'offline');
      return allOk;
    } catch (e) {
      setCloudSyncStatus('error');
      return false;
    }
  };

  const handleLogout = async () => {
    await logOutFromFirebase();
    handleUpdateData((prev) => {
      prev.session.currentUserId = null;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-14 h-14 bg-teal-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-teal-500/20 mb-4 animate-pulse">
          ⏱
        </div>
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sincronizando dados clínicos...</p>
      </div>
    );
  }

  const currentUser = data.accounts.find((a) => a.id === data.session.currentUserId) || null;

  // ROUTER CONTROLLER
  if (!currentUser) {
    return (
      <Auth
        data={data}
        onUpdateData={handleUpdateData}
        prefillDocCode={prefilledDocCode}
      />
    );
  }

  // If Patient logged in but hasn't completed diagnostic onboarding tutorial
  if (currentUser.role === 'patient' && !currentUser.onboardingDone) {
    const handleOnboardingComplete = (
      diagnoses: Record<string, boolean>,
      hormone: boolean,
      fullData?: any
    ) => {
      handleUpdateData((prev) => {
        const acc = prev.accounts.find((a) => a.id === currentUser.id);
        if (acc) {
          acc.onboardingDone = true;
          if (fullData?.name) acc.name = fullData.name;
          if (fullData?.gender) acc.gender = fullData.gender;
          if (fullData?.reminderOptIn !== undefined) acc.reminderOptIn = fullData.reminderOptIn;
        }

        // Initialize patient data container with full biometric and baseline values
        prev.patientData[currentUser.id] = {
          diagnoses,
          gender: fullData?.gender || acc?.gender || null,
          hormoneRelevant: hormone,
          birthDate: fullData?.birthDate || '',
          height: fullData?.height || '',
          weight: fullData?.weight || '',
          painBaseline: fullData?.painBaseline ?? 3,
          sleepBaselineHours: fullData?.sleepBaselineHours ?? 7,
          fatigueBaseline: fullData?.fatigueBaseline ?? 4,
          continuousMeds: fullData?.continuousMeds || [],
          cardiovascularRisk: fullData?.cardiovascularRisk ?? false,
          gastricSensitivity: fullData?.gastricSensitivity ?? false,
          baseline: null,
          periodicMetrics: [],
          flareAlerts: [],
          dailyLogs: []
        };

        // If there was a prefilled invitation code, establish a link right away!
        if (prefilledDocCode) {
          const doc = prev.accounts.find((a) => a.role === 'doctor' && a.doctorCode === prefilledDocCode);
          if (doc) {
            prev.links = prev.links.filter((l) => l.patientId !== currentUser.id);
            prev.links.push({
              patientId: currentUser.id,
              doctorId: doc.id,
              status: 'pending',
              initiatedBy: 'patient',
              createdAt: new Date().toISOString().split('T')[0]
            });
            prev.notifications.push({
              id: Math.random().toString(36).slice(2),
              status: 'unread',
              createdAt: new Date().toISOString(),
              toUserId: doc.id,
              fromUserId: currentUser.id,
              type: 'link_request',
              message: `${acc?.name || 'Novo Paciente'} iniciou compartilhamento via código ${prefilledDocCode}.`
            });
          }
        }
      });
    };

    return (
      <Onboarding
        account={currentUser}
        patientData={data.patientData[currentUser.id]}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Route to DoctorView for clinicians / health professionals
  if (currentUser.role === 'doctor') {
    return (
      <DoctorView
        data={data}
        account={currentUser}
        onLogout={handleLogout}
        onUpdateData={handleUpdateData}
      />
    );
  }

  // Render PatientView for patients
  return (
    <PatientView
      data={data}
      account={currentUser}
      onLogout={handleLogout}
      onUpdateData={handleUpdateData}
      cloudSyncStatus={cloudSyncStatus}
      onManualCloudSync={handleManualCloudSync}
    />
  );
}
