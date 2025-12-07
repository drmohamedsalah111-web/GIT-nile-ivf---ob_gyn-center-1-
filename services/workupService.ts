import { supabase } from './supabaseClient';

// Database schema interface (snake_case for Supabase)
export interface WorkupData {
  id?: string;
  patient_id: string;
  // Ovarian Factor
  amh?: number;
  cycle_regularity?: 'Regular' | 'Irregular';
  // Male Factor
  sperm_count?: number;
  motility?: number;
  morphology?: number;
  // Tubal Factor
  left_tube?: 'Patent' | 'Blocked' | 'Hydrosalpinx';
  right_tube?: 'Patent' | 'Blocked' | 'Hydrosalpinx';
  // Uterine Factor
  cavity_status?: 'Normal' | 'Septum' | 'Polyp' | 'Adhesions';
  // Auto-generated
  diagnosis?: string;
  plan?: string;
  created_at?: string;
  updated_at?: string;
}

// TypeScript interface for component state (camelCase)
export interface WorkupState {
  patientId: string;
  ovarianFactor: {
    amh?: number;
    cycleRegularity?: 'Regular' | 'Irregular';
  };
  maleFactor: {
    spermCount?: number;
    motility?: number;
    morphology?: number;
  };
  tubalFactor: {
    leftTube?: 'Patent' | 'Blocked' | 'Hydrosalpinx';
    rightTube?: 'Patent' | 'Blocked' | 'Hydrosalpinx';
  };
  uterineFactor: {
    cavityStatus?: 'Normal' | 'Septum' | 'Polyp' | 'Adhesions';
  };
  diagnosis?: string;
  plan?: string;
}

// Convert database format to component state
const dbToState = (dbData: WorkupData): WorkupState => ({
  patientId: dbData.patient_id,
  ovarianFactor: {
    amh: dbData.amh,
    cycleRegularity: dbData.cycle_regularity,
  },
  maleFactor: {
    spermCount: dbData.sperm_count,
    motility: dbData.motility,
    morphology: dbData.morphology,
  },
  tubalFactor: {
    leftTube: dbData.left_tube,
    rightTube: dbData.right_tube,
  },
  uterineFactor: {
    cavityStatus: dbData.cavity_status,
  },
  diagnosis: dbData.diagnosis,
  plan: dbData.plan,
});

// Convert component state to database format
const stateToDb = (state: WorkupState): Omit<WorkupData, 'id' | 'created_at' | 'updated_at'> => ({
  patient_id: state.patientId,
  amh: state.ovarianFactor.amh,
  cycle_regularity: state.ovarianFactor.cycleRegularity,
  sperm_count: state.maleFactor.spermCount,
  motility: state.maleFactor.motility,
  morphology: state.maleFactor.morphology,
  left_tube: state.tubalFactor.leftTube,
  right_tube: state.tubalFactor.rightTube,
  cavity_status: state.uterineFactor.cavityStatus,
});

// Get workup data for a patient
export const getWorkup = async (patientId: string): Promise<WorkupState> => {
  try {
    const { data, error } = await supabase
      .from('infertility_workups')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (data) {
      return dbToState(data);
    }

    // Return default empty object if no data exists
    return {
      patientId,
      ovarianFactor: {},
      maleFactor: {},
      tubalFactor: {},
      uterineFactor: {},
    };
  } catch (error) {
    console.error('Error fetching workup data:', error);
    throw new Error('Failed to fetch infertility workup data');
  }
};

// Save workup data (upsert)
export const saveWorkup = async (data: WorkupState): Promise<void> => {
  try {
    const dbData = stateToDb(data);
    const diagnosis = generateDiagnosis(data);

    const workupData: WorkupData = {
      ...dbData,
      diagnosis: diagnosis.diagnosis,
      plan: diagnosis.plan,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('infertility_workups')
      .upsert(workupData, {
        onConflict: 'patient_id',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving workup data:', error);
    throw new Error('Failed to save infertility workup data');
  }
};

// Generate diagnosis and plan based on medical logic
export const generateDiagnosis = (data: WorkupState): { diagnosis: string; plan: string } => {
  const factors: string[] = [];
  const plans: string[] = [];

  // Male Factor Assessment
  const hasMaleFactor =
    (data.maleFactor.spermCount !== undefined && data.maleFactor.spermCount < 15) ||
    (data.maleFactor.motility !== undefined && data.maleFactor.motility < 40) ||
    (data.maleFactor.morphology !== undefined && data.maleFactor.morphology < 4);

  if (hasMaleFactor) {
    factors.push('Male Factor Infertility');
    plans.push('IVF/ICSI Recommended');
  }

  // Tubal Factor Assessment
  const hasTubalFactor =
    data.tubalFactor.leftTube === 'Blocked' ||
    data.tubalFactor.rightTube === 'Blocked' ||
    data.tubalFactor.leftTube === 'Hydrosalpinx' ||
    data.tubalFactor.rightTube === 'Hydrosalpinx';

  if (hasTubalFactor) {
    factors.push('Tubal Factor Infertility');
    plans.push('IVF/ICSI Recommended');
  }

  // Ovarian Factor Assessment
  const hasOvarianFactor =
    (data.ovarianFactor.amh !== undefined && (data.ovarianFactor.amh < 1.1 || data.ovarianFactor.amh > 3.5)) ||
    data.ovarianFactor.cycleRegularity === 'Irregular';

  if (hasOvarianFactor) {
    if (data.ovarianFactor.amh !== undefined && data.ovarianFactor.amh < 1.1) {
      factors.push('Diminished Ovarian Reserve (DOR)');
    } else if (data.ovarianFactor.amh !== undefined && data.ovarianFactor.amh > 3.5) {
      factors.push('Polycystic Ovary Syndrome (PCOS)');
    }
    if (data.ovarianFactor.cycleRegularity === 'Irregular') {
      factors.push('Ovulatory Dysfunction');
    }
  }

  // Uterine Factor Assessment
  const hasUterineFactor = data.uterineFactor.cavityStatus && data.uterineFactor.cavityStatus !== 'Normal';

  if (hasUterineFactor) {
    factors.push('Uterine Factor Infertility');
    plans.push('Hysteroscopic Correction Required');
  }

  // Hydrosalpinx specific note
  const hasHydrosalpinx =
    data.tubalFactor.leftTube === 'Hydrosalpinx' ||
    data.tubalFactor.rightTube === 'Hydrosalpinx';

  if (hasHydrosalpinx) {
    plans.push('Salpingectomy Required Before ET');
  }

  // Generate diagnosis string
  let diagnosis = 'Unexplained Infertility';
  if (factors.length > 0) {
    diagnosis = factors.join(' + ');
  }

  // Generate plan string
  let plan = 'Further Investigation Required';
  if (plans.length > 0) {
    plan = plans.join(' + ');
  } else if (hasOvarianFactor && !hasMaleFactor && !hasTubalFactor && !hasUterineFactor) {
    plan = 'Induction + Timed Intercourse';
  }

  return { diagnosis, plan };
};