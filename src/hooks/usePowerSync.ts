import { useQuery } from '@powersync/react';
import { powerSyncDb } from '../powersync/client';

// Hook for querying PowerSync data
export function usePowerSyncQuery<T = any>(sql: string, parameters: any[] = []) {
    return useQuery<T>(sql, parameters);
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
export { powerSyncDb as db };
