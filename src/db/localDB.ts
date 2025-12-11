// Supabase Direct Access (Simplified)
// Using Supabase client directly for now

import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

// Simple live query hook using Supabase
export function useLiveQuery<T>(querier: () => Promise<T[]>, deps: any[]): T[] | undefined {
    const [data, setData] = useState<T[] | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const result = await querier();
                if (!cancelled) {
                    setData(result);
                }
            } catch (error) {
                console.error('Query error:', error);
                if (!cancelled) {
                    setData([]);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, deps);

    return data;
}

// Table wrapper for Supabase
class SupabaseTable<T = any> {
    constructor(private tableName: string) { }

    async toArray(): Promise<T[]> {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*');

            if (error) throw error;
            return (data || []) as T[];
        } catch (error) {
            console.error(`Error fetching ${this.tableName}:`, error);
            return [];
        }
    }

    where(field: string) {
        const tableName = this.tableName;
        return {
            equals: (value: any) => ({
                toArray: async () => {
                    try {
                        const { data, error } = await supabase
                            .from(tableName)
                            .select('*')
                            .eq(field, value);

                        if (error) throw error;
                        return (data || []);
                    } catch (error) {
                        console.error(`Error querying ${tableName}:`, error);
                        return [];
                    }
                }
            })
        };
    }

    async add(data: any) {
        const { data: result, error } = await supabase
            .from(this.tableName)
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async update(id: any, data: any) {
        const { error } = await supabase
            .from(this.tableName)
            .update(data)
            .eq('id', id);

        if (error) throw error;
    }

    async delete(id: any) {
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

// Export database tables
export const db = {
    patients: new SupabaseTable('patients'),
    visits: new SupabaseTable('visits'),
    ivf_cycles: new SupabaseTable('ivf_cycles'),
    stimulation_logs: new SupabaseTable('stimulation_logs'),
    pregnancies: new SupabaseTable('pregnancies'),
    antenatal_visits: new SupabaseTable('antenatal_visits'),
    biometry_scans: new SupabaseTable('biometry_scans'),
    patient_files: new SupabaseTable('patient_files'),
    profiles: new SupabaseTable('profiles'),
    app_settings: new SupabaseTable('app_settings')
};
