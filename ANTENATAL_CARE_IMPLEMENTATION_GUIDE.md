# Antenatal Care (ANC) Card System - Implementation Guide

## ✅ Components Created

### 1. **AntenatalCareProfile.tsx** (Main Container)
Located: `src/components/obstetrics/AntenatalCareProfile.tsx`

**Features:**
- Main container component integrating all ANC Card sections
- Collapsible sections with print-optimized layout
- Print button with custom print styles
- RTL support for Arabic text
- Responsive design for mobile/tablet viewing

**Usage:**
```tsx
import { AntenatalCareProfile } from '../components/obstetrics/AntenatalCareProfile';

<AntenatalCareProfile 
  pregnancyId="uuid-here"
  patientName="Patient Name"
  patientId="patient-id"
/>
```

---

### 2. **RiskAssessmentHeader.tsx** (Section A)
Located: `src/components/obstetrics/RiskAssessmentHeader.tsx`

**Features:**
- 🚩 **HIGH RISK PREGNANCY** badge with animation when risk factors detected
- **GPA Code Display:** Auto-calculated (e.g., G2P1+0A0L1)
- **Medical History Tags:** HTN, DM, Thyroid, Cardiac, DVT/VTE
- **Past Obstetric History:** Pre-eclampsia, PPH, Previous C/S, Recurrent Abortion
- **Current Risk Factors:** Smoking, BMI>30, Rh-, Twins, Advanced age
- Edit mode with inline save
- Color-coded badges for different risk types

**Risk Calculation Logic:**
- Previous C/S → HIGH RISK
- HTN + Previous Pre-eclampsia → HIGH RISK
- Cardiac disease → HIGH RISK
- Twin pregnancy → HIGH RISK
- Advanced maternal age (>35) → MODERATE/HIGH

---

### 3. **VisitFlowSheet.tsx** (Section B)
Located: `src/components/obstetrics/VisitFlowSheet.tsx`

**Features:**
- Dense table design mimicking physical ANC cards
- **Auto-calculated GA:** Shows gestational age as "24w+3d" format
- **Weight Change Indicators:** Shows ⬆️/⬇️ with kg change from last visit
- **BP Alerts:** RED cell highlighting when Systolic > 140 OR Diastolic > 90
- **Urine Results:** Color-coded badges (Nil=Green, +=Amber, ++=Red)
- **Presentation Field:** Active from week 28 onwards
- **Last 3 Visits Highlight:** Background color to draw attention
- **Summary Stats:** Total visits, last weight, last BP, current GA

**Columns:**
1. Date (التاريخ)
2. GA (عمر الحمل)
3. Weight with change indicator (الوزن)
4. BP with alert (ضغط الدم)
5. Urine Albumin (بروتين البول)
6. Urine Sugar (سكر البول)
7. Edema (الوذمة)
8. Fundal Height (ارتفاع الرحم)
9. Presentation - Cephalic/Breech (وضع الجنين)
10. FHS - Fetal Heart Sound (نبض الجنين)

---

### 4. **TrendCharts.tsx** (Section C)
Located: `src/components/obstetrics/TrendCharts.tsx`

**Features:**
- **Recharts Integration** for professional medical charts
- **Weight Curve:** 
  - Actual weight vs. Ideal weight gain (IOM guidelines)
  - Shows total weight gain
  - First/last weight stats
- **BP Trend Chart:**
  - Systolic & Diastolic lines
  - Reference lines at 140 (High Systolic) and 90 (High Diastolic)
  - Average BP calculations
  - Alert badge if any high readings detected
- Custom tooltips with Arabic/English labels
- Responsive design

---

## 📊 Database Schema Updates

### File: `ANTENATAL_CARE_SCHEMA.sql`

**New Columns Added to `pregnancies` table:**
```sql
obstetric_history JSONB
medical_history JSONB
past_obs_history JSONB
current_risk_factors JSONB
```

**New Column Added to `antenatal_visits` table:**
```sql
presentation TEXT CHECK (presentation IN ('Cephalic', 'Breech', 'Transverse', 'Oblique', NULL))
```

**Auto Risk Level Calculation:**
- Function: `calculate_pregnancy_risk_level()`
- Trigger: `trigger_update_risk_level` (runs on INSERT/UPDATE)
- Scores risk factors and auto-sets `risk_level` to 'low'/'moderate'/'high'

**To Apply Schema:**
Run `ANTENATAL_CARE_SCHEMA.sql` in your Supabase SQL Editor.

---

## 🔧 TypeScript Interfaces Updated

### File: `types.ts`

**New Interfaces:**
```typescript
ObstetricHistory
MedicalHistory
PastObsHistory
CurrentRiskFactors
```

**Updated Interfaces:**
- `Pregnancy`: Added risk assessment fields
- `AntenatalVisit`: Added `presentation` field

---

## 🛠️ Service Layer Updates

### File: `services/obstetricsService.ts`

**New Method:**
```typescript
getPregnancyById(pregnancyId: string)
```

---

## 📱 Integration Instructions

### Step 1: Add to Pregnancy Profile Page
In `src/pages/Obstetrics/PregnancyProfile.tsx`, add a new tab:

```tsx
import { AntenatalCareProfile } from '../../components/obstetrics/AntenatalCareProfile';

// In your tab buttons:
<button onClick={() => setActiveTab('anc_card')}>
  <FileText size={20} />
  <span>بطاقة المتابعة (ANC Card)</span>
</button>

// In your content area:
{activeTab === 'anc_card' && (
  <AntenatalCareProfile 
    pregnancyId={pregnancy.id}
    patientName={pregnancy.patient_name}
    patientId={pregnancy.patient_id}
  />
)}
```

### Step 2: Install Dependencies
Ensure `recharts` is installed:
```bash
npm install recharts
```

### Step 3: Run Database Migration
Execute `ANTENATAL_CARE_SCHEMA.sql` in Supabase SQL Editor.

---

## 🖨️ Print Functionality

The system includes print-optimized CSS:
- Hidden buttons and interactive elements on print
- Page break controls for clean PDF generation
- Border styling for professional medical records
- Preserved colors and layouts

**To Print:**
Click the "طباعة" (Print) button or use Ctrl+P / Cmd+P

---

## 🎨 Design Highlights

✅ **One-Glance Design:** Risk header + last 3 visits visible without scrolling
✅ **High Contrast Alerts:** RED cells for high BP, animated HIGH RISK badge
✅ **Color Coding:** Medical conditions have unique colors for quick scanning
✅ **Mobile Responsive:** Horizontal scroll for table on small screens
✅ **RTL Support:** Full Arabic language support with proper alignment
✅ **Print Ready:** Professional A4/A5 layout for clinic records

---

## 🚀 Next Steps (Optional Enhancements)

1. **Add Visit Modal:** Implement the "Add Visit" form (currently placeholder)
2. **Edit Visit Inline:** Enable quick edits directly in the table
3. **Export to PDF:** Add jsPDF integration for direct PDF download
4. **SMS Reminders:** Auto-send reminders for next visit dates
5. **Risk Score Display:** Show numeric risk score alongside badge
6. **Growth Percentiles:** Add fetal growth percentile curves to charts

---

## 📋 Testing Checklist

- [ ] Run `ANTENATAL_CARE_SCHEMA.sql` in Supabase
- [ ] Install `recharts` package
- [ ] Verify data loads for existing pregnancies
- [ ] Test risk level auto-calculation
- [ ] Test print layout (Ctrl+P)
- [ ] Verify BP alerts (red cells for high readings)
- [ ] Check weight change indicators
- [ ] Verify GA calculation accuracy
- [ ] Test mobile/tablet responsiveness
- [ ] Verify RTL text alignment

---

## 🎯 Key Medical Features Implemented

✅ GPA Code (Gravida, Parity, Abortions, Living)
✅ Automatic High Risk Detection
✅ BP Monitoring with Pre-eclampsia Alerts
✅ Weight Gain Tracking (vs. IOM Guidelines)
✅ Presentation Tracking (from 28 weeks)
✅ Comprehensive Risk Factor Documentation
✅ Edema & Urine Monitoring
✅ Fetal Heart Sound Documentation
✅ Fundal Height Tracking
✅ Visit History with Trends

---

**Status:** ✅ All components created and ready for integration
**Database:** ⚠️ Requires SQL migration execution
**Dependencies:** ⚠️ Requires `recharts` installation
