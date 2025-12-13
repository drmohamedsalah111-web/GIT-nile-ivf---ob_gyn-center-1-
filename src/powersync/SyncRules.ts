export const SYNC_RULES = `
-- ============================================================================
-- POWERSYNC SYNC RULES (YAML FORMAT)
-- Configure in PowerSync Dashboard > Settings > Sync Rules
-- ============================================================================
--
-- UUID Handling:
-- - No CAST(... AS uuid) or ::uuid casts used
-- - PowerSync handles UUID values as text in comparisons
-- - Comparisons: auth.uid() = user_id (both text type)
-- - All subqueries return id fields for safe direct comparison
--
-- Use the following sync rules to configure which tables and columns
-- are synchronized based on user authentication and permissions

bucket_definitions:
  # Doctors sync: Each doctor only syncs their own profile
  doctors:
    table: doctors
    rule: 'auth.uid() = user_id'
    
  # Patients sync: Each doctor syncs only their assigned patients
  patients:
    table: patients
    rule: 'doctor_id in (select id from doctors where user_id = auth.uid())'
    
  # Visits sync: Each doctor syncs visits for their patients
  visits:
    table: visits
    rule: |
      patient_id in (
        select id from patients 
        where doctor_id in (select id from doctors where user_id = auth.uid())
      )
    
  # IVF Cycles sync: Each doctor syncs their IVF cycles
  ivf_cycles:
    table: ivf_cycles
    rule: 'doctor_id in (select id from doctors where user_id = auth.uid())'
    
  # Stimulation Logs sync: Related to doctor's IVF cycles
  stimulation_logs:
    table: stimulation_logs
    rule: |
      cycle_id in (
        select id from ivf_cycles 
        where doctor_id in (select id from doctors where user_id = auth.uid())
      )
    
  # Pregnancies sync: Each doctor syncs their pregnancies
  pregnancies:
    table: pregnancies
    rule: 'doctor_id in (select id from doctors where user_id = auth.uid())'
    
  # Antenatal Visits sync: Related to doctor's pregnancies
  antenatal_visits:
    table: antenatal_visits
    rule: |
      pregnancy_id in (
        select id from pregnancies 
        where doctor_id in (select id from doctors where user_id = auth.uid())
      )
    
  # Biometry Scans sync: Related to doctor's pregnancies
  biometry_scans:
    table: biometry_scans
    rule: |
      pregnancy_id in (
        select id from pregnancies 
        where doctor_id in (select id from doctors where user_id = auth.uid())
      )
    
  # Patient Files sync: Related to doctor's patients
  patient_files:
    table: patient_files
    rule: |
      patient_id in (
        select id from patients 
        where doctor_id in (select id from doctors where user_id = auth.uid())
      )
    
  # App Settings sync: Public data for all authenticated users
  app_settings:
    table: app_settings
    rule: 'true'
`;

export interface SyncConfig {
  enabled: boolean;
  interval: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: 'remote_wins' | 'local_wins' | 'merge';
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  interval: 5000,
  batchSize: 100,
  retryAttempts: 3,
  retryDelay: 1000,
  conflictResolution: 'remote_wins'
};

export const OFFLINE_FIRST_STRATEGY = {
  useLocalFirst: true,
  syncWhenOnline: true,
  queueOfflineChanges: true,
  persistQueue: true,
  maxOfflineQueue: 1000
};

export const CONFLICT_RESOLUTION_STRATEGIES = {
  timestamp: (local: any, remote: any) => {
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();
    return remoteTime > localTime ? remote : local;
  },
  
  custom: (local: any, remote: any, context?: any) => {
    if (context?.field === 'assessment_data' || context?.field === 'lab_data') {
      return { ...local, ...remote };
    }
    return remote;
  },
  
  localWins: (local: any) => local,
  remoteWins: (remote: any) => remote
};
