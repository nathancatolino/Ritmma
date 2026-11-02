/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WearableSyncData } from '../types';

export interface GoogleFitSyncResult {
  success: boolean;
  data?: WearableSyncData;
  source: 'google_fit_api' | 'google_fit_demo' | 'google_fit_unavailable';
  message: string;
  rawDetails?: {
    totalSteps?: number;
    sleepMinutes?: number;
    sleepSegmentsCount?: number;
    avgBpm?: number;
    hrvMs?: number;
  };
}

/**
 * Google Fit REST API Wrapper
 * Interacts with Google Fitness API v1 aggregate dataset endpoint
 * (https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate)
 *
 * RIGOR CIENTÍFICO E INTEGRIDADE:
 * - Apenas dados reais retornados pela API são gravados como medições clínicas.
 * - Falhas de conexão ou ausência de medições retornam erro transparente, sem valores fictícios.
 * - HRV não é inventado nem derivado de médias de BPM (requer medição fisiológica real de intervalos RR/RMSSD).
 */
export async function fetchGoogleFitMetrics(
  accessToken?: string | null,
  targetDateISO?: string,
  allowDemoFallback: boolean = false
): Promise<GoogleFitSyncResult> {
  const dateStr = targetDateISO || new Date().toISOString().split('T')[0];
  const dateObj = new Date(dateStr + 'T00:00:00');
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

  const startTimeMillis = startOfDay.getTime();
  const endTimeMillis = endOfDay.getTime();

  // If token is provided, attempt real Google Fit REST API call
  if (accessToken && accessToken.trim().length > 10) {
    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.sleep.segment' },
            { dataTypeName: 'com.google.heart_rate.bpm' }
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis
        })
      });

      if (response.ok) {
        const json = await response.json();
        const bucket = json.bucket?.[0];
        let steps = 0;
        let sleepMinutes = 0;
        let hrSamples: number[] = [];
        let hasStepData = false;
        let hasSleepData = false;

        if (bucket?.dataset) {
          bucket.dataset.forEach((ds: any) => {
            const dataTypeName = ds.dataSourceId || '';
            (ds.point || []).forEach((pt: any) => {
              // Steps
              if (dataTypeName.includes('step') || pt.dataTypeName?.includes('step')) {
                const val = pt.value?.[0]?.intVal || pt.value?.[0]?.fpVal || 0;
                steps += Math.round(val);
                hasStepData = true;
              }
              // Sleep segments: duration between startTimeNanos and endTimeNanos
              if (dataTypeName.includes('sleep') || pt.dataTypeName?.includes('sleep')) {
                const startNanos = Number(pt.startTimeNanos || 0);
                const endNanos = Number(pt.endTimeNanos || 0);
                const segType = pt.value?.[0]?.intVal; // 1: awake, 2: sleep, 4: light, 5: deep, 6: REM
                if (segType !== 1 && segType !== 3 && endNanos > startNanos) {
                  const durationMins = (endNanos - startNanos) / (1e9 * 60);
                  sleepMinutes += durationMins;
                  hasSleepData = true;
                }
              }
              // Heart rate
              if (dataTypeName.includes('heart') || pt.dataTypeName?.includes('heart')) {
                const bpm = pt.value?.[0]?.fpVal || pt.value?.[0]?.intVal;
                if (bpm && bpm > 35 && bpm < 220) {
                  hrSamples.push(bpm);
                }
              }
            });
          });
        }

        const finalSleepHours = hasSleepData ? Number((sleepMinutes / 60).toFixed(1)) : undefined;
        let avgBpm: number | undefined = undefined;
        if (hrSamples.length > 0) {
          avgBpm = Math.round(hrSamples.reduce((a, b) => a + b, 0) / hrSamples.length);
        }

        // Only include fields that actually have measurements
        const syncData: WearableSyncData = {
          steps: hasStepData ? steps : undefined,
          sleepHours: finalSleepHours,
          sleepQuality: finalSleepHours !== undefined ? Math.min(100, Math.max(30, Math.round((finalSleepHours / 8) * 100))) : undefined,
          // HRV is NOT calculated from aggregate BPM averages (scientifically invalid without beat-to-beat RMSSD)
          hrv: undefined,
          restingHeartRate: avgBpm,
          device: 'Google Fit / Wear OS',
          syncedAt: new Date().toISOString(),
          dataSource: 'device_api',
          isDemo: false
        };

        const detailsParts: string[] = [];
        if (hasStepData) detailsParts.push(`${steps.toLocaleString('pt-BR')} passos`);
        if (finalSleepHours !== undefined) detailsParts.push(`${finalSleepHours}h de sono`);
        if (avgBpm !== undefined) detailsParts.push(`FC média de ${avgBpm} bpm`);

        const summaryText = detailsParts.length > 0
          ? detailsParts.join(', ')
          : 'Nenhum registro de atividade encontrado para esta data no Google Fit.';

        return {
          success: true,
          data: syncData,
          source: 'google_fit_api',
          message: `Sincronizado da Google Fit API: ${summaryText}.`,
          rawDetails: {
            totalSteps: hasStepData ? steps : 0,
            sleepMinutes: Math.round(sleepMinutes),
            sleepSegmentsCount: hrSamples.length,
            avgBpm,
            hrvMs: undefined
          }
        };
      } else {
        const errorText = await response.text();
        console.warn('Google Fit API returned error:', response.status, errorText);
        return {
          success: false,
          source: 'google_fit_unavailable',
          message: `Erro na API do Google Fit (Código ${response.status}). Verifique o token de autorização.`
        };
      }
    } catch (err: any) {
      console.warn('Failed to call Google Fit API:', err);
      return {
        success: false,
        source: 'google_fit_unavailable',
        message: 'Falha de conexão com a API do Google Fit. Nenhuma medição fictícia foi gravada.'
      };
    }
  }

  // If no token is configured and demo is not explicitly allowed:
  if (!allowDemoFallback) {
    return {
      success: false,
      source: 'google_fit_unavailable',
      message: 'Token de acesso do Google Fit não configurado. Para sincronizar dados reais, conecte sua conta Google no menu de Opções de Conexão.'
    };
  }

  // Explicit demonstration sandbox only
  return getGoogleFitDemoMetrics(targetDateISO);
}

/**
 * Retorna dados exclusivamente para demonstração interativa de interface.
 * OBRIGATORIAMENTE identificado como [DEMO] e isDemo: true.
 */
export function getGoogleFitDemoMetrics(targetDateISO?: string): GoogleFitSyncResult {
  const dateStr = targetDateISO || new Date().toISOString().split('T')[0];
  const dateObj = new Date(dateStr + 'T00:00:00');
  const daySeed = (dateObj.getDate() * 17 + dateObj.getMonth() * 31) % 100;
  const mockSteps = 6800 + (daySeed * 45);
  const mockSleepHours = Number((6.8 + (daySeed % 15) * 0.1).toFixed(1));
  const mockRestingBpm = 64 + (daySeed % 12);

  return {
    success: true,
    data: {
      steps: mockSteps,
      sleepHours: mockSleepHours,
      sleepQuality: Math.round(75 + (mockSleepHours - 7) * 8),
      restingHeartRate: mockRestingBpm,
      device: '[DEMO] Simulador de Testes Google Fit',
      syncedAt: new Date().toISOString(),
      dataSource: 'demo_simulation',
      isDemo: true
    },
    source: 'google_fit_demo',
    message: `[AMBIENTE DE TESTE / DEMO]: Dados fictícios gerados apenas para validação de interface. Não gravados como medição clínica.`,
    rawDetails: {
      totalSteps: mockSteps,
      sleepMinutes: Math.round(mockSleepHours * 60),
      sleepSegmentsCount: 4,
      avgBpm: mockRestingBpm
    }
  };
}
