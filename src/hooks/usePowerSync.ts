import { useQuery, useStatus } from '@powersync/react';
import { powerSyncDb } from '../powersync/client';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

// Hook for querying PowerSync data with Supabase fallback
export function usePowerSyncQuery<T = any>(sql: string, parameters: any[] = []) {
    const powerSyncStatus = useStatus();
    const [supabaseData, setSupabaseData] = useState<T[]>([]);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
    const [hasFetchedSupabase, setHasFetchedSupabase] = useState(false);
    
    // Try PowerSync first
    let powerSyncQueryResult;
    try {
        powerSyncQueryResult = useQuery<T>(sql, parameters);
    } catch (error) {
        console.warn('⚠️ PowerSync query failed, using Supabase fallback:', error);
        powerSyncQueryResult = { data: [], isLoading: false, error };
    }
    
    const { data: powerSyncData = [], isLoading: isLoadingPowerSync, error: powerSyncError } = powerSyncQueryResult;

    // Extract table name from SQL
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : null;

    // Fallback to Supabase only when online and local PowerSync has no data
    useEffect(() => {
        const fetchFromSupabase = async () => {
            // Only fetch once if online, local has no data, and we haven't fetched yet
            if (navigator.onLine && powerSyncData.length === 0 && tableName && !hasFetchedSupabase && !isLoadingPowerSync) {
                setIsLoadingSupabase(true);
                setHasFetchedSupabase(true);
                
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        console.warn('⚠️ No user logged in for Supabase fallback');
                        setIsLoadingSupabase(false);
                        return;
                    }

                    console.log(`🔄 Fetching ${tableName} from Supabase (fallback mode)...`);
                    
                    // Build basic query
                    let query = supabase.from(tableName).select('*');
                    
                    // Handle WHERE clause with parameters
                    if (parameters.length > 0 && sql.includes('WHERE')) {
                        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
                        if (whereMatch) {
                            const whereClause = whereMatch[1];
                            // Handle common patterns: patient_id = ?, doctor_id = ?
                            if (whereClause.includes('patient_id = ?')) {
                                query = query.eq('patient_id', parameters[0]);
                            } else if (whereClause.includes('doctor_id = ?')) {
                                query = query.eq('doctor_id', parameters[0]);
                            } else if (whereClause.includes('id = ?')) {
                                query = query.eq('id', parameters[0]);
                            }
                        }
                    }
                    
                    // Handle ORDER BY
                    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
                    if (orderMatch) {
                        const orderColumn = orderMatch[1];
                        const orderDirection = orderMatch[2]?.toLowerCase() === 'desc' ? { ascending: false } : { ascending: true };
                        query = query.order(orderColumn, orderDirection);
                    }
                    
                    const { data, error } = await query;
                    
                    if (error) {
                        console.error(`❌ Error fetching ${tableName} from Supabase:`, error);
                    } else if (data && data.length > 0) {
                        console.log(`✅ Fetched ${data.length} records from Supabase (${tableName})`);
                        setSupabaseData(data as T[]);
                    } else {
                        console.log(`ℹ️ No data found in Supabase for ${tableName}`);
                    }
                } catch (error) {
                    console.error(`❌ Error in Supabase fallback for ${tableName}:`, error);
                } finally {
                    setIsLoadingSupabase(false);
                }
            }
        };

        fetchFromSupabase();
    }, [powerSyncStatus.connected, tableName, hasFetchedSupabase, isLoadingPowerSync]);

    // Reset Supabase fetch flag when PowerSync connects
    useEffect(() => {
        if (powerSyncStatus.connected) {
            setHasFetchedSupabase(false);
            setSupabaseData([]);
        }
    }, [powerSyncStatus.connected]);

    // Return PowerSync data first (offline-first), fallback to Supabase only if PowerSync has no data
    const data = powerSyncData.length > 0
        ? powerSyncData
        : supabaseData;
    
    const isLoading = isLoadingPowerSync || isLoadingSupabase;
    const error = powerSyncError;

    return { data, isLoading, error };
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
