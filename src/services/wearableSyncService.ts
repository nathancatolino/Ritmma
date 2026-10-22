/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChronosData, DailyLog, WearableSyncData } from '../types';
import { fetchGoogleFitMetrics } from './googleFitWrapper';
import { fetchHealthKitMetrics, HealthKitPayload } from './healthKitWrapper';
import { todayISO } from '../utils';

export type WearableProvider = 'none' | 'google_fit' | 'apple_health';

export interface WearableConfig {
  provider: WearableProvider;
  autoSyncEnabled: boolean;
  googleFitToken?: string | null;
  lastSyncedAt?: string | null;
  syncFrequencyMinutes: number; // e.g., 60, 240, 1440
}

const STORAGE_KEY = 'ritma_wearable_config';

export function getWearableConfig(): WearableConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load wearable config:', e);
  }
  return {
    provider: 'none',
    autoSyncEnabled: false,
    googleFitToken: null,
    lastSyncedAt: null,
    syncFrequencyMinutes: 240
  };
}

export function saveWearableConfig(cfg: Partial<WearableConfig>): WearableConfig {
  const current = getWearableConfig();
  const updated = { ...current, ...cfg };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save wearable config:', e);
  }
  return updated;
}

export interface SyncOperationResult {
  success: boolean;
  provider: WearableProvider;
  data: WearableSyncData;
  date: string;
  message: string;
}

/**
 * Executes synchronization from the selected wearable wrapper (Google Fit or HealthKit)
 * and returns the structured wearable telemetry.
 */
export async function executeWearableSync(
  provider: WearableProvider,
  dateISO: string,
  googleFitToken?: string | null,
  healthKitPayload?: HealthKitPayload | null
): Promise<SyncOperationResult> {
  const targetDate = dateISO || todayISO();

  if (provider === 'google_fit') {
    const res = await fetchGoogleFitMetrics(googleFitToken, targetDate);
    return {
      success: res.success,
      provider: 'google_fit',
      data: res.data,
      date: targetDate,
      message: res.message
    };
  }

  if (provider === 'apple_health') {
    const res = await fetchHealthKitMetrics(healthKitPayload, targetDate);
    return {
      success: res.success,
      provider: 'apple_health',
      data: res.data,
      date: targetDate,
      message: res.message
    };
  }

  throw new Error(`Provedor desconhecido: ${provider}`);
}

/**
 * Injects wearable metrics (steps, sleep duration, HRV, and resting HR) into a patient's DailyLog
 * in the Central State.
 */
export function injectWearableDataIntoLog(
  dailyLogs: DailyLog[],
  dateISO: string,
  metrics: WearableSyncData
): DailyLog[] {
  const existingIndex = dailyLogs.findIndex((l) => l.date === dateISO);

  if (existingIndex >= 0) {
    const current = dailyLogs[existingIndex];
    dailyLogs[existingIndex] = {
      ...current,
      wearableSync: {
        ...(current.wearableSync || {}),
        ...metrics,
        syncedAt: new Date().toISOString()
      },
      // If sleep quality was blank, auto-populate score (scaled 0-10)
      sleep: current.sleep !== null && current.sleep !== undefined
        ? current.sleep
        : (metrics.sleepQuality ? Math.round(metrics.sleepQuality / 10) : 7)
    };
  } else {
    dailyLogs.push({
      date: dateISO,
      pain: null,
      fatigue: null,
      sleep: metrics.sleepQuality ? Math.round(metrics.sleepQuality / 10) : 7,
      function: null,
      wearableSync: {
        ...metrics,
        syncedAt: new Date().toISOString()
      }
    });
  }

  return dailyLogs;
}

/**
 * Backfills past days with wearable telemetry to give immediate rich historical trends
 */
export async function backfillWearableData(
  patientId: string,
  provider: WearableProvider,
  daysCount: number = 7,
  googleFitToken?: string | null,
  onUpdateData?: (updater: (prev: ChronosData) => void) => void
): Promise<number> {
  let syncedDaysCount = 0;
  const now = new Date();

  const updates: { date: string; data: WearableSyncData }[] = [];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    try {
      const res = await executeWearableSync(provider, dateStr, googleFitToken);
      if (res.success) {
        updates.push({ date: dateStr, data: res.data });
        syncedDaysCount++;
      }
    } catch (e) {
      console.warn(`Could not sync date ${dateStr}:`, e);
    }
  }

  if (onUpdateData && updates.length > 0) {
    onUpdateData((prev) => {
      const pData = prev.patientData[patientId];
      if (!pData) return;

      updates.forEach(({ date, data }) => {
        pData.dailyLogs = injectWearableDataIntoLog(pData.dailyLogs, date, data);
      });
    });
  }

  return syncedDaysCount;
}
