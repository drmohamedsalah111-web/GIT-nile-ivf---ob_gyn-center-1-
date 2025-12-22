# Create IVF Cycle - Implementation Guide

## Problem Fixed
**Error**: `23503 insert or update on table "ivf_cycles" violates foreign key constraint "ivf_cycles_doctor_id_fkey"`

**Root Cause**: System was sending the current user's ID (secretary) instead of the patient's assigned doctor ID.

## Solution Overview

The `handleCreateCycle()` function:
1. ✅ Queries the `patients` table to fetch the assigned `doctor_id`
2. ✅ Validates that the patient has a doctor assigned
3. ✅ Inserts into `ivf_cycles` using the patient's `doctor_id` (NOT the auth user ID)
4. ✅ Returns success/error with detailed messages

---

## Usage - Option 1: Service Function (Direct)

```typescript
import { dbService } from '../../services/dbService';

const result = await dbService.handleCreateCycle(patientId);

if (result.success) {
  console.log('Cycle created:', result.cycleId);
  // Navigate to cycle page or refresh data
} else {
  console.error('Error:', result.error);
  // Show error alert to user
}
```

**Response Object**:
```typescript
{
  success: true;
  cycleId: string;
  message: 'تم إنشاء دورة IVF بنجاح';
}
// OR
{
  success: false;
  error: 'يجب تعيين طبيب للمريضة قبل إنشاء دورة IVF...';
  details: string;
}
```

---

## Usage - Option 2: React Component (Recommended)

### Basic Usage

```typescript
import { CreateCycleButton } from '../../components/ivf/CreateCycleButton';

function PatientProfile() {
  const patientId = '...';
  
  return (
    <CreateCycleButton
      patientId={patientId}
      patientName="أحمد علي"
      onSuccess={(cycleId) => {
        console.log('Cycle created:', cycleId);
        // Redirect to cycle page
      }}
      onError={(error) => {
        console.error('Failed:', error);
      }}
    />
  );
}
```

### With Custom Styling

```typescript
<CreateCycleButton
  patientId={patientId}
  patientName={patientName}
  className="w-full md:w-auto"
  onSuccess={handleNavigateToCycle}
  onError={handleShowError}
/>
```

---

## Integration Examples

### In SecretaryDashboard (Create cycle from patient list)

```typescript
import { CreateCycleButton } from '../../components/ivf/CreateCycleButton';
import { useNavigate } from 'react-router-dom';

export const SecretaryDashboard = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handleCycleCreated = (cycleId: string) => {
    // Navigate to IVF journey for this cycle
    navigate(`/ivf-journey?cycleId=${cycleId}`);
  };

  return (
    <div>
      {/* Patient selection UI */}
      {selectedPatient && (
        <CreateCycleButton
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          onSuccess={handleCycleCreated}
        />
      )}
    </div>
  );
};
```

### In PatientProfile (Start new cycle)

```typescript
export const PatientProfile = ({ patientId }: { patientId: string }) => {
  const [cycles, setCycles] = useState<any[]>([]);

  const handleCycleCreated = (cycleId: string) => {
    // Refresh cycles list
    loadPatientCycles();
    // Optionally scroll to new cycle
    document.getElementById(`cycle-${cycleId}`)?.scrollIntoView();
  };

  return (
    <div className="space-y-4">
      <CreateCycleButton
        patientId={patientId}
        onSuccess={handleCycleCreated}
      />
      
      {/* List of cycles */}
      <div>
        {cycles.map(cycle => (
          <div key={cycle.id} id={`cycle-${cycle.id}`}>
            {/* Cycle details */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### In Custom Button Handler

```typescript
import { dbService } from '../../services/dbService';
import { toast } from 'react-toastify'; // or your toast library

const handleStartNewCycle = async () => {
  setIsLoading(true);
  try {
    const result = await dbService.handleCreateCycle(currentPatientId);
    
    if (result.success) {
      toast.success(result.message);
      // Navigate or refresh
      navigate(`/ivf-journey/${result.cycleId}`);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error('حدث خطأ غير متوقع');
  } finally {
    setIsLoading(false);
  }
};
```

---

## Database Flow

```
User (Secretary/Doctor) calls handleCreateCycle(patientId)
    ↓
Query patients table → Get patient.doctor_id
    ↓
Validate doctor_id exists (if not → throw error)
    ↓
Insert into ivf_cycles with:
  - patient_id: from parameter
  - doctor_id: from patient.doctor_id (NOT auth.uid)
  - protocol: 'Antagonist' (default)
  - status: 'Active'
  - start_date: today
    ↓
Return success with cycleId
```

---

## Key Features

| Feature | Details |
|---------|---------|
| **Doctor Resolution** | Fetches doctor_id from patient record, not from current user |
| **Validation** | Ensures patient exists and has assigned doctor |
| **Error Handling** | Detailed error messages in Arabic |
| **Logging** | Console logs for debugging (emojis for clarity) |
| **Default Values** | Automatically sets protocol='Antagonist', status='Active', start_date=today |
| **Return Type** | Clear success/failure response object |

---

## Error Messages (Arabic)

| Error | Meaning | Action |
|-------|---------|--------|
| `رقم المريضة غير صالح` | Invalid patient ID | Verify patient ID |
| `المريضة غير موجودة في النظام` | Patient not found | Check patient exists in database |
| `يجب تعيين طبيب للمريضة قبل إنشاء دورة IVF` | No doctor assigned | Assign doctor to patient first |
| `فشل إنشاء دورة IVF: [details]` | Creation failed | Check error details in console |

---

## Testing Checklist

```typescript
// ✅ Test 1: Happy path - Patient with assigned doctor
const result1 = await dbService.handleCreateCycle('valid-patient-id-with-doctor');
expect(result1.success).toBe(true);

// ✅ Test 2: Patient without assigned doctor
const result2 = await dbService.handleCreateCycle('patient-id-without-doctor');
expect(result2.success).toBe(false);
expect(result2.error).toContain('تعيين طبيب');

// ✅ Test 3: Invalid patient ID
const result3 = await dbService.handleCreateCycle('invalid-id');
expect(result3.success).toBe(false);

// ✅ Test 4: Verify RLS policies respect doctor_id
// Ensure only the assigned doctor can view/edit the cycle
```

---

## Migration from Old Code

If you were using `saveCycle()`, switch to `handleCreateCycle()`:

```typescript
// ❌ OLD - Used auth user ID as doctor
dbService.saveCycle({ patientId, protocol: 'Long' });

// ✅ NEW - Uses patient's assigned doctor
dbService.handleCreateCycle(patientId);
```

The new function automatically handles:
- Fetching correct doctor_id from patient
- Setting protocol and status
- Setting start_date
- All validation and error handling
