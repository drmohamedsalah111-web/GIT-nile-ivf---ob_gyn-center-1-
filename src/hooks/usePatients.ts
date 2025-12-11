import { usePowerSync } from '@powersync/react';
import { usePowerSyncQuery } from './usePowerSync';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { useStatus } from '@powersync/react';

export interface Patient {
    id: string;
    name: string;
    age: number;
    phone: string;
    husband_name: string;
    history: string;
    doctor_id: string;
    created_at?: string;
    updated_at?: string;
    remoteId?: string; // For compatibility with existing code
}

export function usePatients() {
    const powerSync = usePowerSync();
    const powerSyncStatus = useStatus();
    const [supabasePatients, setSupabasePatients] = useState<Patient[]>([]);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);

    // Live query for all patients from PowerSync
    const { data: powerSyncData = [], isLoading: isLoadingPowerSync, error: powerSyncError } = usePowerSyncQuery<Patient>(
        'SELECT * FROM patients ORDER BY created_at DESC'
    );

    // Fallback: Fetch from Supabase directly if PowerSync is not connected
    useEffect(() => {
        const fetchFromSupabase = async () => {
            // Only fetch from Supabase if PowerSync is not connected and we have no data
            if (!powerSyncStatus.connected && powerSyncData.length === 0 && !isLoadingPowerSync) {
                setIsLoadingSupabase(true);
                try {
                    const user = await supabase.auth.getUser();
                    if (user.data.user) {
                        const { data, error } = await supabase
                            .from('patients')
                            .select('*')
                            .order('created_at', { ascending: false });
                        
                        if (error) {
                            console.error('❌ Error fetching patients from Supabase:', error);
                        } else if (data) {
                            console.log('✅ Fetched patients from Supabase:', data.length);
                            setSupabasePatients(data as Patient[]);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error in Supabase fallback:', error);
                } finally {
                    setIsLoadingSupabase(false);
                }
            }
        };

        fetchFromSupabase();
    }, [powerSyncStatus.connected, powerSyncData.length, isLoadingPowerSync]);

    // Use PowerSync data if available, otherwise use Supabase fallback
    const patients = powerSyncStatus.connected && powerSyncData.length > 0 
        ? powerSyncData 
        : (supabasePatients.length > 0 ? supabasePatients : powerSyncData);
    
    const isLoading = isLoadingPowerSync || isLoadingSupabase;
    const error = powerSyncError;

    console.log('🔄 usePatients hook:', { 
        patients: patients.length, 
        isLoading, 
        error,
        powerSyncConnected: powerSyncStatus.connected,
        source: powerSyncStatus.connected ? 'PowerSync' : 'Supabase'
    });

    const addPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await powerSync.execute(
            'INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, patient.name, patient.age, patient.phone, patient.husband_name, patient.history, patient.doctor_id, now, now]
        );
        return id;
    };

    const updatePatient = async (id: string, patient: Partial<Patient>) => {
        // Construct dynamic update query
        const updates: string[] = [];
        const values: any[] = [];

        Object.entries(patient).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'remoteId') {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (updates.length === 0) return;

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        await powerSync.execute(
            `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
    };

    const deletePatient = async (id: string) => {
        await powerSync.execute('DELETE FROM patients WHERE id = ?', [id]);
    };

    return {
        patients,
        isLoading,
        error,
        addPatient,
        updatePatient,
        deletePatient
    };
}
