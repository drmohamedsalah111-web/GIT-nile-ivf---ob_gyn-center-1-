import { useQuery, useStatus } from '@powersync/react';
import { useMemo } from 'react';
import { getDb } from '../powersync/client';

export type PowerSyncUiStatus = 'OFFLINE' | 'SYNCING' | 'READY';

function mapUiStatus(status: any): PowerSyncUiStatus {
    if (!status?.connected) return 'OFFLINE';
    if (status?.uploading || status?.downloading || status?.connecting) return 'SYNCING';
    return 'READY';
}

// Hook for querying PowerSync data (PowerSync-only; no Supabase fallback)
export function usePowerSyncQuery<T = any>(sql: string, parameters: any[] = []) {
    const status = useStatus() as any;
    const uiStatus = useMemo(() => mapUiStatus(status), [status?.connected, status?.uploading, status?.downloading, status?.connecting]);

    const { data = [], isLoading: queryLoading, error } = useQuery<T>(sql, parameters);

    // While PowerSync is syncing, keep UI in loading state to avoid showing empty placeholders.
    const isLoading = queryLoading || uiStatus === 'SYNCING';

    return { data, isLoading, error, status: uiStatus };
}

// Helper hooks for common queries
export function usePowerSyncPatients() {
    return usePowerSyncQuery('SELECT * FROM patients ORDER BY name');
}

export function usePowerSyncVisits(patientId?: string) {
    if (patientId) {
        return usePowerSyncQuery('SELECT * FROM visits WHERE patient_id = ? ORDER BY date DESC', [patientId]);
    }
    return usePowerSyncQuery('SELECT * FROM visits ORDER BY date DESC');
}

export function usePowerSyncCycles(patientId?: string) {
    if (patientId) {
        return usePowerSyncQuery('SELECT * FROM ivf_cycles WHERE patient_id = ? ORDER BY start_date DESC', [patientId]);
    }
    return usePowerSyncQuery('SELECT * FROM ivf_cycles ORDER BY start_date DESC');
}

// Direct database access for writes
export const db = getDb();
