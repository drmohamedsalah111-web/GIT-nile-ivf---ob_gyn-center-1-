# Intelligent Diagnostic & Clinical Decision Support System
## Integration Guide for IvfJourney.tsx

---

## Overview

This guide walks you through integrating the **Intelligent Assessment Tab** into your existing IVF Journey component. The system includes:

✅ **Smart PCOS Detection** (Rotterdam Criteria)  
✅ **WHO 2021 Semen Analysis Classification**  
✅ **Real-time ICSI Indication**  
✅ **RCOG Guideline Recommendations**  
✅ **Clinical Risk Alerting**  
✅ **BMI Risk Stratification**  

---

## File Structure

```
src/
├── types/
│   └── assessmentTypes.ts              [NEW] Enhanced interfaces
├── hooks/
│   └── useSmartDiagnostics.ts         [NEW] Smart calculation hooks
├── utils/
│   └── clinicalCalculations.ts        [NEW] Clinical logic engine
components/
├── assessment/
│   ├── AccordionSection.tsx           [NEW] Reusable accordion
│   ├── HistorySection.tsx             [NEW] Infertility history
│   ├── FemaleInvestigationSection.tsx [NEW] Female workup + PCOS logic
│   ├── MaleFactorSection.tsx          [NEW] WHO 2021 semen analysis
│   ├── EnhancedAssessmentTab.tsx      [NEW] Main orchestrator component
│   └── DiagnosticSummaryCard.tsx      [NEW] Summary view for saved assessments
```

---

## Step 1: Replace Assessment Tab in IvfJourney.tsx

### Current Code Structure (Existing)
```jsx
// In IvfJourney.tsx - Line ~100-200
{activeTab === 'assessment' && (
  <div className="...">
    {/* Old simple form here */}
  </div>
)}
```

### New Code (Replacement)
```jsx
import { EnhancedAssessmentTab } from '../components/assessment/EnhancedAssessmentTab';
import { DiagnosticSummaryCard } from '../components/assessment/DiagnosticSummaryCard';
import { AssessmentFormState, DiagnosticSummary } from '../src/types/assessmentTypes';

// In IvfJourney component
const [savedAssessment, setSavedAssessment] = useState<DiagnosticSummary | null>(null);

const handleAssessmentSave = async (formState: AssessmentFormState) => {
  try {
    const assessment: DiagnosticSummary = {
      patientId: selectedPatientId,
      assessmentDate: new Date().toISOString(),
      history: formState.history,
      vitals: {
        age: formState.vitals.age,
        weight: formState.vitals.weight,
        height: formState.vitals.height,
        bmi: (formState.vitals.weight || 0) / ((formState.vitals.height || 1) / 100) ** 2,
      },
      femaleInvestigation: {
        endocrine: formState.femaleEndocrine,
        ovarianReserve: formState.femaleOvarian,
        ultrasound: formState.femaleUltrasound,
      },
      maleFactor: formState.maleFactor,
      // Add other fields as needed
      diagnosticFindings: {
        pcos: { /* from diagnostics.state.pcos */ },
        maleFactorDiagnosis: formState.maleFactor.who2021Classification?.diagnosis || 'Normal',
        uterineTubalFactors: [],
        ovulationDisorder: false,
        unexplained: false,
        combinedFactors: [],
      },
      rcogRecommendations: { /* from diagnostics.state.rcogRecommendations */ },
      riskAlerts: [], // from diagnostics.state.riskAlerts
    };

    setSavedAssessment(assessment);
    
    // Optional: Save to database
    // await ivfService.updateCycleAssessment(cycleId, assessment);
    
    toast.success('Assessment saved successfully');
  } catch (error) {
    toast.error('Failed to save assessment');
  }
};

// In JSX render
{activeTab === 'assessment' && (
  <div>
    {savedAssessment ? (
      <>
        <DiagnosticSummaryCard
          summary={savedAssessment}
          onEdit={() => setSavedAssessment(null)}
        />
      </>
    ) : (
      <EnhancedAssessmentTab
        patientId={selectedPatientId}
        onSave={handleAssessmentSave}
      />
    )}
  </div>
)}
```

---

## Step 2: Update Database Schema (Optional)

If you want to persist assessments in Supabase, update the `ivf_cycles` table:

```sql
-- Add assessment_data column (if not exists)
ALTER TABLE ivf_cycles 
ADD COLUMN assessment_data JSONB DEFAULT NULL;

-- Update existing query to use EnhancedAssessmentTab structure
-- assessment_data will store the complete DiagnosticSummary object
```

---

## Step 3: Import Dependencies

Add to `IvfJourney.tsx`:
```typescript
import { EnhancedAssessmentTab } from '../components/assessment/EnhancedAssessmentTab';
import { DiagnosticSummaryCard } from '../components/assessment/DiagnosticSummaryCard';
import { AssessmentFormState, DiagnosticSummary } from '../src/types/assessmentTypes';
```

---

## Feature Breakdown

### 1. **PCOS Smart Logic**
- User selects oligo/anovulation, hyperandrogenism, polycystic ovaries
- System automatically calculates: 2+ criteria = PCOS diagnosis
- Real-time badge update (0/3 → 1/3 → 2/3 [**PCOS**] → 3/3)

### 2. **WHO 2021 Semen Analysis**
- Enter: Volume, Concentration, Motility (PR%), Morphology
- Auto-classification:
  - Normal
  - Oligozoospermia (Conc < 16)
  - Asthenozoospermia (Motility < 42%)
  - Teratozoospermia (Morphology < 4%)
  - Combined OAT
- Auto-triggers ICSI indication if:
  - Concentration < 5 M/mL
  - OAT pattern detected

### 3. **BMI Risk Stratification**
- Input: Weight, Height, Age
- Auto-calculates BMI category
- Alerts:
  - BMI > 30: "Weight reduction recommended"
  - BMI > 35: "Delay treatment - weight management essential"
  - BMI < 18.5: "Nutritional counseling"

### 4. **RCOG Guideline Recommendations**
- Based on combination of:
  - Age (>35, >40)
  - Infertility duration (>1yr, >2yr)
  - Semen analysis results
  - PCOS status
  - Ovarian reserve (AFC, AMH)
- Generates:
  - HSG urgency
  - Hysteroscopy indication
  - dFSH testing need
  - Referral pathways
  - Urgency level (Routine / Expedited / Urgent)

### 5. **Clinical Risk Alerts**
Triggered alerts for:
- Advanced maternal age (>40)
- High BMI (>30, >35)
- Long infertility duration (>3 years)
- PCOS diagnosis
- Male factor abnormalities (with ICSI flag)
- Tubal pathology (Hydrosalpinx)
- Low ovarian reserve (AFC < 5, AMH < 1)

---

## Component Hierarchy

```
EnhancedAssessmentTab (Main container, state management)
├── VitalsSection (Age, Weight, Height, BMI)
├── HistorySection (Accordion)
│   ├── Infertility Duration & Type
│   ├── Menstrual Pattern
│   ├── Obstetric History
│   └── Medical/Surgical History
├── FemaleInvestigationSection (Accordion with 4 tabs)
│   ├── Endocrine Profile (FSH, LH, E2, Prolactin, TSH)
│   ├── Ovarian Reserve (AMH, AFC, Interpretation)
│   ├── Ultrasound (Endometrium, Uterine Pathology, Tubal)
│   └── PCOS Assessment (Rotterdam Criteria with auto-calculation)
├── MaleFactorSection (Accordion)
│   ├── WHO 2021 Parameters
│   ├── Auto-Classification
│   └── ICSI Indication
├── Clinical Alerts Display (Real-time, color-coded)
├── RCOG Recommendations Display
└── Save & Print Buttons
```

---

## Styling Notes

- Uses Tailwind CSS (matching your existing design)
- Color scheme:
  - 🟢 Green: Normal findings
  - 🟡 Yellow: Mild concerns
  - 🟠 Orange: Warnings  
  - 🔴 Red: Critical findings / Action required
- Responsive grid layout (1 col mobile, 2-3 col desktop)

---

## Testing Checklist

After integration:

- [ ] PCOS logic triggers at 2/3 criteria
- [ ] WHO 2021 semen classification updates in real-time
- [ ] ICSI indication appears when concentration < 5 or OAT
- [ ] BMI alerts appear correctly
- [ ] Risk alerts populate based on inputs
- [ ] RCOG recommendations generate based on age + duration
- [ ] Assessment can be saved
- [ ] Summary card displays all findings
- [ ] Print functionality works
- [ ] Responsive design on mobile/tablet/desktop

---

## Future Enhancements

1. **Database Integration**: Save assessments to Supabase
2. **PDF Export**: Generate clinical report PDFs
3. **Patient History**: Load previous assessments for comparison
4. **Batch Testing**: Mark which tests are already done vs. needed
5. **Treatment Planning**: Link assessment to protocol selection
6. **Multi-language**: RTL support for Arabic interface
7. **Audit Trail**: Track assessment changes over time

---

## File Locations

| File | Location |
|------|----------|
| Types | `src/types/assessmentTypes.ts` |
| Hooks | `src/hooks/useSmartDiagnostics.ts` |
| Utils | `src/utils/clinicalCalculations.ts` |
| Components | `components/assessment/*.tsx` (4 accordion + main + summary) |

---

## API Integration (When Ready)

```typescript
// Example: Save assessment to Supabase
const handleAssessmentSave = async (formState: AssessmentFormState) => {
  const assessment = buildDiagnosticSummary(formState);
  
  await ivfService.updateCycleAssessment(cycleId, {
    assessment_data: assessment
  });
};
```

---

## Support & Troubleshooting

**Q: PCOS badge not updating?**  
A: Check that all 3 checkbox handlers call `onUpdatePCOS()` properly

**Q: ICSI not triggering?**  
A: Ensure concentration is entered and < 5, or OAT pattern detected

**Q: Recommendations not showing?**  
A: Verify `generateRecommendations()` is called in handleSaveAssessment

**Q: Styling looks off?**  
A: Ensure Tailwind CSS is properly configured with color utilities

---

Generated: 2025-12-18  
System: Intelligent Diagnostic & Clinical Decision Support v1.0
