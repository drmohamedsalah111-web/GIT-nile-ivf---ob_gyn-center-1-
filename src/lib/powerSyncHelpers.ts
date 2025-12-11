// PowerSync Query Helpers
// Use these instead of Dexie queries

import { powerSync } from '../powersync/db';
import { useQuery } from '@powersync/react';

// Hook to get all patients
export const usePatients = () => {
    return useQuery('SELECT * FROM patients ORDER BY name');
};

// Hook to get all visits
export const useVisits = () => {
    return useQuery('SELECT * FROM visits ORDER BY date DESC');
};

// Hook to get all IVF cycles
export const useIVFCycles = () => {
    return useQuery('SELECT * FROM ivf_cycles ORDER BY start_date DESC');
};

// Hook to get all pregnancies
export const usePregnancies = () => {
    return useQuery('SELECT * FROM pregnancies ORDER BY lmp_date DESC');
};

// Hook to get visits by patient
export const useVisitsByPatient = (patientId: string) => {
    return useQuery('SELECT * FROM visits WHERE patient_id = ? ORDER BY date DESC', [patientId]);
};

// Hook to get cycles by patient
export const useCyclesByPatient = (patientId: string) => {
    return useQuery('SELECT * FROM ivf_cycles WHERE patient_id = ? ORDER BY start_date DESC', [patientId]);
};

// Hook to get stimulation logs by cycle
export const useStimulationLogsByCycle = (cycleId: string) => {
    return useQuery('SELECT * FROM stimulation_logs WHERE cycle_id = ? ORDER BY cycle_day', [cycleId]);
};

// Hook to get pregnancies by patient
export const usePregnanciesByPatient = (patientId: string) => {
    return useQuery('SELECT * FROM pregnancies WHERE patient_id = ?', [patientId]);
};

// Direct database operations (for mutations)
export const db = {
    patients: {
        async add(data: any) {
            const id = crypto.randomUUID();
            await powerSync.execute(
                'INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, data.name, data.age, data.phone, data.husband_name, data.history, data.doctor_id]
            );
            return { id };
        },
        async update(id: string, data: any) {
            const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
            const values = [...Object.values(data), id];
            await powerSync.execute(`UPDATE patients SET ${fields} WHERE id = ?`, values);
        },
        async delete(id: string) {
            await powerSync.execute('DELETE FROM patients WHERE id = ?', [id]);
        },
        async toArray() {
            const result = await powerSync.getAll('SELECT * FROM patients');
            return result;
        }
    },

    visits: {
        async add(data: any) {
            const id = crypto.randomUUID();
            await powerSync.execute(
                'INSERT INTO visits (id, patient_id, date, department, diagnosis, prescription, notes, clinical_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id, data.patient_id, data.date, data.department, data.diagnosis, data.prescription, data.notes, data.clinical_data]
            );
            return { id };
        }
    },

    ivf_cycles: {
        async add(data: any) {
            const id = crypto.randomUUID();
            await powerSync.execute(
                'INSERT INTO ivf_cycles (id, patient_id, doctor_id, protocol, status, start_date, assessment_data, lab_data, transfer_data, outcome_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, data.patient_id, data.doctor_id, data.protocol, data.status, data.start_date, data.assessment_data, data.lab_data, data.transfer_data, data.outcome_data]
            );
            return { id };
        },
        async where(field: string) {
            return {
                equals: async (value: string) => {
                    const result = await powerSync.getAll(`SELECT * FROM ivf_cycles WHERE ${field} = ?`, [value]);
                    return {
                        toArray: async () => result
                    };
                }
            };
        }
    },

    stimulation_logs: {
        async add(data: any) {
            const id = crypto.randomUUID();
            await powerSync.execute(
                'INSERT INTO stimulation_logs (id, cycle_id, cycle_day, date, fsh, hmg, e2, lh, rt_follicles, lt_follicles) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, data.cycle_id, data.cycle_day, data.date, data.fsh, data.hmg, data.e2, data.lh, data.rt_follicles, data.lt_follicles]
            );
            return { id };
        },
        async where(field: string) {
            return {
                equals: async (value: string) => {
                    const result = await powerSync.getAll(`SELECT * FROM stimulation_logs WHERE ${field} = ?`, [value]);
                    return {
                        toArray: async () => result
                    };
                }
            };
        }
    },

    pregnancies: {
        async add(data: any) {
            const id = crypto.randomUUID();
            await powerSync.execute(
                'INSERT INTO pregnancies (id, patient_id, doctor_id, lmp_date, edd_date, edd_by_scan, risk_level, risk_factors, aspirin_prescribed, thromboprophylaxis_needed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, data.patient_id, data.doctor_id, data.lmp_date, data.edd_date, data.edd_by_scan, data.risk_level, data.risk_factors, data.aspirin_prescribed, data.thromboprophylaxis_needed]
            );
            return { id };
        }
    }
};
