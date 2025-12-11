// Dexie Compatibility Layer for PowerSync
// This file makes PowerSync work like Dexie so we don't need to change all the code

import { powerSync } from '../powersync/db';

// Fake useLiveQuery hook that uses PowerSync
export function useLiveQuery<T>(querier: () => Promise<T[]>, deps: any[]): T[] | undefined {
    const [data, setData] = React.useState<T[] | undefined>(undefined);

    React.useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const result = await querier();
                if (!cancelled) {
                    setData(result);
                }
            } catch (error) {
                console.error('useLiveQuery error:', error);
                if (!cancelled) {
                    setData([]);
                }
            }
        };

        fetchData();

        // Subscribe to PowerSync changes
        const unsubscribe = powerSync.watch('SELECT 1', [], {
            onResult: () => {
                fetchData();
            }
        });

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, deps);

    return data;
}

// Fake Dexie database that uses PowerSync
class PowerSyncTable<T = any> {
    constructor(private tableName: string) { }

    async toArray(): Promise<T[]> {
        const result = await powerSync.getAll(`SELECT * FROM ${this.tableName}`);
        return result as T[];
    }

    where(field: string) {
        return {
            equals: async (value: any) => {
                const result = await powerSync.getAll(
                    `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
                    [value]
                );
                return {
                    toArray: async () => result as T[]
                };
            }
        };
    }

    async add(data: any) {
        const id = crypto.randomUUID();
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(data);

        await powerSync.execute(
            `INSERT INTO ${this.tableName} (id, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
            [id, ...values]
        );

        return id;
    }

    async update(id: any, data: any) {
        const fields = Object.keys(data);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = Object.values(data);

        await powerSync.execute(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
            [...values, id]
        );
    }

    async delete(id: any) {
        await powerSync.execute(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
    }
}

// Fake Dexie database
export const db = {
    patients: new PowerSyncTable('patients'),
    visits: new PowerSyncTable('visits'),
    ivf_cycles: new PowerSyncTable('ivf_cycles'),
    stimulation_logs: new PowerSyncTable('stimulation_logs'),
    pregnancies: new PowerSyncTable('pregnancies'),
    antenatal_visits: new PowerSyncTable('antenatal_visits'),
    biometry_scans: new PowerSyncTable('biometry_scans'),
    patient_files: new PowerSyncTable('patient_files'),
    profiles: new PowerSyncTable('profiles'),
    app_settings: new PowerSyncTable('app_settings')
};

// Import React for hooks
import React from 'react';
