import { usePowerSync } from '@powersync/react';
import { usePowerSyncQuery } from './usePowerSync';

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

    // Live query for all patients
    const { data: patients = [], isLoading, error } = usePowerSyncQuery<Patient>(
        'SELECT * FROM patients ORDER BY created_at DESC'
    );

    console.log('🔄 usePatients hook:', { patients, isLoading, error });

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
