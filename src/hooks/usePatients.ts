import { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { Patient as PatientType } from '../../types';

export interface Patient {
    id: string;
    name: string;
    age: number;
    phone: string;
    husband_name: string;
    history: string;
    doctor_id?: string;
    created_at?: string;
    updated_at?: string;
    remoteId?: string;
}

export function usePatients() {
    const [patients, setPatients] = useState<PatientType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
        }, 500);

        return () => clearTimeout(handle);
    }, [searchQuery]);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const data = await dbService.getPatients(debouncedSearchQuery || undefined);
                console.log('✅ usePatients hook - Successfully fetched patients:', data.length);
                setPatients(data);
            } catch (err: any) {
                console.error('❌ usePatients hook - Error fetching patients:', err?.message);
                setError(err);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [debouncedSearchQuery]);

    const addPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const newPatient = await dbService.savePatient({
                name: patient.name,
                age: patient.age,
                phone: patient.phone,
                husbandName: patient.husband_name,
                history: patient.history
            });
            
            setPatients(prev => [newPatient, ...prev]);
            console.log('✅ usePatients hook - Patient added:', newPatient.id);
            return newPatient.id;
        } catch (err: any) {
            console.error('❌ usePatients hook - Error adding patient:', err?.message);
            throw err;
        }
    };

    const updatePatient = async (id: string, patient: Partial<Patient>) => {
        try {
            const updateData: any = {};
            
            if (patient.name !== undefined) updateData.name = patient.name;
            if (patient.age !== undefined) updateData.age = patient.age;
            if (patient.phone !== undefined) updateData.phone = patient.phone;
            if (patient.husband_name !== undefined) updateData.husband_name = patient.husband_name;
            if (patient.history !== undefined) updateData.history = patient.history;

            const { supabase } = await import('../../services/supabaseClient');
            const { error: updateError } = await supabase
                .from('patients')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patient } : p));
            console.log('✅ usePatients hook - Patient updated:', id);
        } catch (err: any) {
            console.error('❌ usePatients hook - Error updating patient:', err?.message);
            throw err;
        }
    };

    const deletePatient = async (id: string) => {
        try {
            const { supabase } = await import('../../services/supabaseClient');
            const { error: deleteError } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setPatients(prev => prev.filter(p => p.id !== id));
            console.log('✅ usePatients hook - Patient deleted:', id);
        } catch (err: any) {
            console.error('❌ usePatients hook - Error deleting patient:', err?.message);
            throw err;
        }
    };

    return {
        patients,
        isLoading,
        error,
        searchQuery,
        setSearchQuery,
        addPatient,
        updatePatient,
        deletePatient
    };
}
