/**
 * CYCLE CREATION EXAMPLES
 * =======================
 * Practical examples for using handleCreateCycle() in your application
 */

// ============================================================================
// EXAMPLE 1: Simple Button Click Handler
// ============================================================================
import { dbService } from '../services/dbService';

const handleStartIVFCycle = async (patientId: string) => {
  try {
    const result = await dbService.handleCreateCycle(patientId);
    
    if (result.success) {
      // Success: Show toast and navigate
      toast.success(result.message);
      navigate(`/ivf-journey/${result.cycleId}`);
    } else {
      // Failure: Show error toast
      toast.error(result.error);
    }
  } catch (error: any) {
    toast.error(error?.message || 'خطأ غير متوقع');
  }
};

// ============================================================================
// EXAMPLE 2: Using the CreateCycleButton Component
// ============================================================================
import { CreateCycleButton } from '../components/ivf/CreateCycleButton';
import { useNavigate } from 'react-router-dom';

const SecretaryPatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);

  return (
    <div>
      {patients.map(patient => (
        <div key={patient.id} className="flex items-center justify-between p-4 border rounded">
          <div>
            <h3>{patient.name}</h3>
            <p className="text-sm text-gray-600">{patient.phone}</p>
          </div>
          
          <CreateCycleButton
            patientId={patient.id}
            patientName={patient.name}
            onSuccess={(cycleId) => {
              navigate(`/ivf-journey?cycleId=${cycleId}`);
            }}
            onError={(error) => {
              console.error('Cycle creation failed:', error);
            }}
          />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: Using the Modal Component
// ============================================================================
import { StartCycleModal } from '../components/ivf/StartCycleModal';
import { useState } from 'react';

const PatientDetailPage = ({ patientId }: { patientId: string }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const navigate = useNavigate();

  const handleOpenModal = async () => {
    // Fetch patient details first
    const patient = await getPatientDetails(patientId);
    setSelectedPatient(patient);
    setModalOpen(true);
  };

  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        إنشاء دورة IVF جديدة
      </button>

      <StartCycleModal
        isOpen={modalOpen}
        patientId={patientId}
        patientName={selectedPatient?.name || ''}
        onClose={() => setModalOpen(false)}
        onCycleCreated={(cycleId) => {
          navigate(`/ivf-journey/${cycleId}`);
        }}
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: Advanced - With State Management and Callbacks
// ============================================================================
import { useState, useCallback } from 'react';

interface CreateCycleState {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const useCreateCycle = () => {
  const [state, setState] = useState<CreateCycleState>({
    isLoading: false,
    error: null,
    successMessage: null
  });

  const createCycle = useCallback(async (patientId: string) => {
    setState({ isLoading: true, error: null, successMessage: null });

    try {
      const result = await dbService.handleCreateCycle(patientId);

      if (result.success) {
        setState({
          isLoading: false,
          error: null,
          successMessage: result.message
        });
        return { success: true, cycleId: result.cycleId };
      } else {
        setState({
          isLoading: false,
          error: result.error,
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'خطأ غير متوقع';
      setState({
        isLoading: false,
        error: errorMessage,
        successMessage: null
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, successMessage: null });
  }, []);

  return { ...state, createCycle, reset };
};

// Usage of custom hook
const MyComponent = () => {
  const { isLoading, error, successMessage, createCycle } = useCreateCycle();

  const handleClick = async () => {
    const result = await createCycle('patient-id-123');
    if (result.success) {
      console.log('Cycle created:', result.cycleId);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'جاري الإنشاء...' : 'إنشاء دورة'}
      </button>
      
      {error && <div className="text-red-600">{error}</div>}
      {successMessage && <div className="text-green-600">{successMessage}</div>}
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: Form Integration (Create multiple cycles or batch operations)
// ============================================================================
import { useForm } from 'react-hook-form';

interface CycleFormData {
  patientId: string;
  protocol?: 'Long' | 'Antagonist' | 'Flare-up' | 'Mini-IVF';
  startDate?: string;
}

const CreateCycleForm = () => {
  const { register, handleSubmit, formState: { isSubmitting }, watch } = useForm<CycleFormData>();
  const patientId = watch('patientId');

  const onSubmit = async (data: CycleFormData) => {
    const result = await dbService.handleCreateCycle(data.patientId);
    
    if (result.success) {
      // Note: handleCreateCycle() creates with default protocol='Antagonist'
      // If you need custom protocol, you would need to update the cycle after creation
      console.log('Cycle created:', result.cycleId);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>اختر المريضة</label>
        <select {...register('patientId', { required: true })}>
          <option value="">-- اختر --</option>
          {/* Patient options */}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء دورة'}
      </button>
    </form>
  );
};

// ============================================================================
// EXAMPLE 6: Context API Integration (Global State)
// ============================================================================
import { createContext, useContext, ReactNode } from 'react';

interface CycleContextType {
  isCreating: boolean;
  error: string | null;
  createCycle: (patientId: string) => Promise<{ success: boolean; cycleId?: string }>;
}

const CycleContext = createContext<CycleContextType | undefined>(undefined);

export const CycleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCycle = async (patientId: string) => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await dbService.handleCreateCycle(patientId);
      
      if (result.success) {
        return { success: true, cycleId: result.cycleId };
      } else {
        setError(result.error);
        return { success: false };
      }
    } catch (err: any) {
      setError(err?.message || 'خطأ غير متوقع');
      return { success: false };
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <CycleContext.Provider value={{ isCreating, error, createCycle }}>
      {children}
    </CycleContext.Provider>
  );
};

export const useCycle = () => {
  const context = useContext(CycleContext);
  if (!context) throw new Error('useCycle must be used within CycleProvider');
  return context;
};

// Usage
const ComponentUsingContext = () => {
  const { isCreating, error, createCycle } = useCycle();

  return (
    <button onClick={() => createCycle('patient-id')} disabled={isCreating}>
      {isCreating ? 'جاري الإنشاء...' : 'إنشاء دورة'}
    </button>
  );
};

// ============================================================================
// EXAMPLE 7: Error Handling and Logging
// ============================================================================
const createCycleWithLogging = async (patientId: string) => {
  console.log('🔄 Starting cycle creation for patient:', patientId);

  try {
    const result = await dbService.handleCreateCycle(patientId);

    if (result.success) {
      console.log('✅ Cycle created successfully:', result.cycleId);
      return result;
    } else {
      console.error('❌ Cycle creation failed:', result.error);
      
      // Log specific error types
      if (result.error.includes('تعيين طبيب')) {
        console.warn('⚠️ Patient does not have assigned doctor');
      } else if (result.error.includes('غير موجودة')) {
        console.warn('⚠️ Patient not found');
      }
      
      return result;
    }
  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    throw error;
  }
};

// ============================================================================
// EXAMPLE 8: Retry Logic with Exponential Backoff
// ============================================================================
const createCycleWithRetry = async (
  patientId: string,
  maxRetries: number = 3,
  delayMs: number = 1000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📍 Attempt ${attempt}/${maxRetries}`);
      const result = await dbService.handleCreateCycle(patientId);

      if (result.success) {
        return result;
      } else if (attempt < maxRetries) {
        // Only retry on certain errors
        if (result.error.includes('تعيين طبيب')) {
          throw new Error('Cannot retry: Patient needs doctor assignment');
        }
        
        console.warn(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        return result;
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
};
