/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WearableSyncData } from '../types';

export interface HealthKitPayload {
  steps?: number;
  sleepHours?: number;
  sleepMinutes?: number;
  hrv?: number; // SDNN in ms
  restingHeartRate?: number; // bpm
  date?: string;
  sourceDevice?: string;
  samples?: {
    type: string;
    value: number;
    startDate?: string;
    endDate?: string;
  }[];
}

export interface HealthKitSyncResult {
  success: boolean;
  data?: WearableSyncData;
  source: 'healthkit_bridge' | 'healthkit_shortcut' | 'healthkit_demo' | 'healthkit_unavailable';
  message: string;
  shortcutUrl?: string;
  rawDetails?: {
    steps?: number;
    sleepHours?: number;
    hrvSdnn?: number;
    restingBpm?: number;
  };
}

/**
 * Apple HealthKit API & Web Bridge Wrapper
 * Bridges Apple HealthKit data (steps, sleep stages/duration, and HRV SDNN)
 * via iOS Shortcuts Automation, Health Auto Export Webhook, or local HealthKit Bridge.
 *
 * RIGOR CIENTÍFICO E INTEGRIDADE:
 * - Apenas dados reais fornecidos pelo iPhone/Apple Watch são aceitos como medição clínica.
 * - Falhas ou ausência de dados retornam aviso transparente, nunca valores fictícios.
 */
export async function fetchHealthKitMetrics(
  customPayload?: HealthKitPayload | null,
  targetDateISO?: string,
  allowDemoFallback: boolean = false
): Promise<HealthKitSyncResult> {
  const dateStr = targetDateISO || new Date().toISOString().split('T')[0];

  // If a direct HealthKit payload was received (e.g. from iOS Shortcut or Health Auto Export webhook)
  if (customPayload) {
    let steps = customPayload.steps;
    let sleepHours = customPayload.sleepHours || (customPayload.sleepMinutes ? customPayload.sleepMinutes / 60 : undefined);
    let hrv = customPayload.hrv;
    let restingHeartRate = customPayload.restingHeartRate;

    // Parse samples if present (HealthKit standard export structure)
    if (customPayload.samples && Array.isArray(customPayload.samples)) {
      let sampleSteps = 0;
      let hasSampleSteps = false;
      let sampleSleep = 0;
      let hasSampleSleep = false;

      customPayload.samples.forEach((sample) => {
        const type = sample.type.toLowerCase();
        if (type.includes('stepcount') || type.includes('passos')) {
          sampleSteps += sample.value || 0;
          hasSampleSteps = true;
        } else if (type.includes('sleep') || type.includes('sono')) {
          if (sample.startDate && sample.endDate) {
            const duration = (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / (1000 * 3600);
            sampleSleep += Math.max(0, duration);
            hasSampleSleep = true;
          } else if (sample.value) {
            sampleSleep += sample.value / 60;
            hasSampleSleep = true;
          }
        } else if (type.includes('heartratevariability') || type.includes('hrv') || type.includes('sdnn')) {
          hrv = sample.value || hrv;
        } else if (type.includes('restingheartrate') || type.includes('repouso')) {
          restingHeartRate = sample.value || restingHeartRate;
        }
      });

      if (hasSampleSteps) steps = sampleSteps;
      if (hasSampleSleep) sleepHours = sampleSleep;
    }

    const finalSteps = steps !== undefined ? Math.round(steps) : undefined;
    const finalSleep = sleepHours !== undefined ? Number(sleepHours.toFixed(1)) : undefined;
    const finalHrv = hrv !== undefined ? Math.round(hrv) : undefined;
    const finalBpm = restingHeartRate !== undefined ? Math.round(restingHeartRate) : undefined;

    const syncData: WearableSyncData = {
      steps: finalSteps,
      sleepHours: finalSleep,
      sleepQuality: finalSleep !== undefined ? Math.min(100, Math.max(30, Math.round((finalSleep / 8) * 100))) : undefined,
      hrv: finalHrv,
      restingHeartRate: finalBpm,
      device: customPayload.sourceDevice || 'Apple Watch (HealthKit)',
      syncedAt: new Date().toISOString(),
      dataSource: 'device_api',
      isDemo: false
    };

    const detailsParts: string[] = [];
    if (finalSteps !== undefined) detailsParts.push(`${finalSteps.toLocaleString('pt-BR')} passos`);
    if (finalSleep !== undefined) detailsParts.push(`${finalSleep}h de sono`);
    if (finalHrv !== undefined) detailsParts.push(`HRV (SDNN) de ${finalHrv}ms`);
    if (finalBpm !== undefined) detailsParts.push(`FC de ${finalBpm} bpm`);

    return {
      success: true,
      data: syncData,
      source: 'healthkit_bridge',
      message: `Dados recebidos do Apple HealthKit: ${detailsParts.join(', ')}.`,
      rawDetails: {
        steps: finalSteps,
        sleepHours: finalSleep,
        hrvSdnn: finalHrv,
        restingBpm: finalBpm
      }
    };
  }

  // If no payload and demo is not explicitly allowed
  if (!allowDemoFallback) {
    return {
      success: false,
      source: 'healthkit_unavailable',
      message: 'Nenhum dado do Apple HealthKit recebido hoje. Configure o Atalho do iPhone ou importe seu arquivo de exportação de saúde para sincronizar.'
    };
  }

  // Explicit demo only
  return getHealthKitDemoMetrics(targetDateISO);
}

/**
 * Retorna dados fictícios exclusivamente para validação e testes de tela no navegador.
 * Identificado como [DEMO] e isDemo: true.
 */
export function getHealthKitDemoMetrics(targetDateISO?: string): HealthKitSyncResult {
  const dateStr = targetDateISO || new Date().toISOString().split('T')[0];
  const dateObj = new Date(dateStr + 'T00:00:00');
  const daySeed = (dateObj.getDate() * 23 + dateObj.getMonth() * 41) % 100;
  const mockSteps = 7240 + (daySeed * 50);
  const mockSleepHours = Number((7.1 + (daySeed % 12) * 0.1).toFixed(1));
  const mockHrv = 48 + (daySeed % 28);
  const mockRestingBpm = 61 + (daySeed % 10);

  return {
    success: true,
    data: {
      steps: mockSteps,
      sleepHours: mockSleepHours,
      sleepQuality: Math.round(78 + (mockSleepHours - 7) * 7),
      hrv: mockHrv,
      restingHeartRate: mockRestingBpm,
      device: '[DEMO] Apple Watch Simulado',
      syncedAt: new Date().toISOString(),
      dataSource: 'demo_simulation',
      isDemo: true
    },
    source: 'healthkit_demo',
    message: `[AMBIENTE DE TESTE / DEMO]: Dados simulados gerados para teste de tela no navegador. Não gravados como medição clínica.`,
    rawDetails: {
      steps: mockSteps,
      sleepHours: mockSleepHours,
      hrvSdnn: mockHrv,
      restingBpm: mockRestingBpm
    }
  };
}

/**
 * Generates an Apple iOS Shortcut configuration template that users can run on iPhone
 * to automatically send Apple Health steps, sleep, and HRV directly into RITMA.
 */
export function generateAppleHealthShortcutTemplate(baseUrl: string, userId: string) {
  const webhookEndpoint = `${baseUrl.replace(/\/$/, '')}/api/sync/healthkit`;
  
  return {
    shortcutName: 'Sincronizar RITMA com Apple Health',
    instructions: [
      'Abra o aplicativo "Atalhos" (Shortcuts) no seu iPhone.',
      'Crie uma Nova Automação Pessoal: "Ao Despertar" ou "Todos os dias às 08:00".',
      'Adicione a Ação "Buscar Amostras de Saúde":',
      '  - Tipo: Passos (Soma de Hoje)',
      '  - Tipo: Análise do Sono (Duração de Hoje)',
      '  - Tipo: Variabilidade da Frequência Cardíaca (Mais recente)',
      '  - Tipo: Frequência Cardíaca em Repouso (Mais recente)',
      `Adicione a Ação "Obter Conteúdo de URL": Método POST para: ${webhookEndpoint}`,
      `Corpo da requisição JSON com chave userId: "${userId}"`,
      'Pronto! A partir de agora, seus dados de passos, sono e HRV sincronizarão sozinhos.'
    ],
    payloadExample: {
      userId,
      date: new Date().toISOString().split('T')[0],
      steps: 8430,
      sleepHours: 7.5,
      hrv: 54,
      restingHeartRate: 62,
      sourceDevice: 'Apple Watch'
    }
  };
}
