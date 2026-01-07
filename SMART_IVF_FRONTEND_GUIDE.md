# ============================================================================
# دليل استخدام نظام التنشيط الذكي المتكامل
# SMART IVF STIMULATION - FRONTEND INTEGRATION GUIDE
# ============================================================================
# تاريخ: 2026-01-07
# الحالة: جاهز للاستخدام ✅
# ============================================================================

## 📋 نظرة عامة

تم إنشاء نظام متكامل للواجهة الأمامية يطابق تماماً قاعدة البيانات `SMART_IVF_STIMULATION_SCHEMA.sql`.

### ✅ ما تم إنشاؤه:

1. **واجهات TypeScript متكاملة** (`types/smartStimulation.types.ts`)
2. **خدمة موحدة** (`services/smartStimulationService.unified.ts`)
3. **مكونات React متكاملة**:
   - `SmartProtocolSelector` - اختيار البروتوكول الذكي
   - `UnifiedMonitoringVisitForm` - إدخال الزيارة المتكاملة

---

## 🏗️ البنية المعمارية

### النظام الموحد (Unified Architecture)

```
smart_monitoring_visits (جدول واحد)
├── معلومات الزيارة (visit_date, cycle_day)
├── الهرمونات (e2, lh, p4, fsh)
├── السونار (endometrium, follicles)
├── ✅ الأدوية (medications_given: JSONB[])
└── ✅ التحاليل (lab_results: JSONB[])
```

**الميزة الرئيسية**: كل بيانات الزيارة في سجل واحد، لا حاجة لـ JOIN!

---

## 📦 1. واجهات TypeScript

### الملف: `types/smartStimulation.types.ts`

```typescript
// أنواع أساسية
export type CycleStatus = 'assessment' | 'protocol' | 'baseline' | 'stimulation' | 'trigger' | ...
export type OvarianPhenotype = 'poor_responder' | 'normal_responder' | 'high_responder' | 'pcos'
export type ProtocolType = 'long_agonist' | 'antagonist' | 'flare_up' | ...

// الدورة الذكية
export interface SmartIVFCycle {
  id: string;
  patient_id: string;
  status: CycleStatus;
  protocol_id?: string;
  protocol_type?: ProtocolType;
  ovarian_phenotype?: OvarianPhenotype;
  predicted_oocytes?: number;
  ohss_risk_level?: OHSSRiskLevel;
  // ... المزيد
}

// ✅ الزيارة المتكاملة (مع الأدوية والتحاليل المدمجة)
export interface SmartMonitoringVisit {
  id: string;
  cycle_id: string;
  visit_date: string;
  cycle_day: number;
  
  // هرمونات
  e2_level?: number;
  lh_level?: number;
  
  // سونار
  follicles_right: number[];
  follicles_left: number[];
  
  // ✅ أدوية مدمجة
  medications_given?: MedicationGiven[];
  
  // ✅ تحاليل مدمجة
  lab_results?: LabResult[];
}

// الدواء المعطى
export interface MedicationGiven {
  medication_id?: string;
  medication_name: string;
  medication_name_ar?: string;
  medication_type: MedicationType;
  dose: number;
  unit: string;
  route: string;
  notes?: string;
}

// نتيجة التحليل
export interface LabResult {
  test_id?: string;
  test_name: string;
  result_value: number;
  unit: string;
  reference_min?: number;
  reference_max?: number;
  is_normal?: boolean;
  interpretation?: string;
}
```

---

## 🔧 2. الخدمة الموحدة

### الملف: `services/smartStimulationService.unified.ts`

### الوظائف الرئيسية:

#### إدارة الدورات

```typescript
// إنشاء دورة جديدة
const { data, error } = await smartStimulationService.createCycle({
  patient_id: 'uuid',
  cycle_number: 1,
  start_date: '2026-01-07',
  initial_assessment: {
    age: 30,
    amh: 2.5,
    afc: 12,
    bmi: 24
  }
});

// الحصول على دورة
const { data: cycle } = await smartStimulationService.getCycle(cycleId);

// تحديث دورة
await smartStimulationService.updateCycle(cycleId, {
  status: 'stimulation',
  protocol_id: 'uuid'
});
```

#### البروتوكولات الذكية

```typescript
// الحصول على البروتوكولات المتاحة
const { data: protocols } = await smartStimulationService.getProtocols();

// اقتراح بروتوكول ذكي (AI)
const { data: suggestions } = await smartStimulationService.suggestProtocol(
  30,  // age
  2.5, // amh
  12,  // afc
  24,  // bmi
  0    // previous_cycles
);
// Returns: [{protocol_id, protocol_name, match_score, reason}]
```

#### ✅ الزيارات المتكاملة

```typescript
// إضافة زيارة متكاملة
const { data: visit } = await smartStimulationService.addVisit({
  cycle_id: 'uuid',
  visit_date: '2026-01-07',
  cycle_day: 5,
  stimulation_day: 2,
  
  // هرمونات
  e2_level: 500,
  lh_level: 5.2,
  
  // سونار
  endometrium_thickness: 8.5,
  follicles_right: [10, 12, 14, 15],
  follicles_left: [11, 13, 16],
  
  // ✅ أدوية (مدمجة)
  medications_given: [
    {
      medication_name: 'Gonal-F',
      medication_type: 'gonadotropin_fsh',
      dose: 225,
      unit: 'IU',
      route: 'SC'
    },
    {
      medication_name: 'Menopur',
      medication_type: 'gonadotropin_hmg',
      dose: 75,
      unit: 'IU',
      route: 'SC'
    }
  ],
  
  // ✅ تحاليل (مدمجة)
  lab_results: [
    {
      test_name: 'Estradiol (E2)',
      result_value: 500,
      unit: 'pg/mL',
      is_normal: true
    }
  ],
  
  doctor_notes: 'استجابة جيدة، نكمل نفس الجرعة'
});
```

#### الحصول على الرحلة الكاملة

```typescript
// رحلة IVF المتكاملة
const { data: journey } = await smartStimulationService.getIVFJourneyComplete(cycleId);
// Returns: {
//   cycle_id, patient_name, status,
//   journey_timeline: [
//     {visit_date, hormones, ultrasound, medications, labs, ...}
//   ],
//   total_visits, total_medications, total_labs
// }
```

---

## 🎨 3. مكون اختيار البروتوكول الذكي

### الملف: `components/ivf/SmartProtocolSelector.tsx`

### الاستخدام:

```typescript
import SmartProtocolSelector from '@/components/ivf/SmartProtocolSelector';

function CycleSetupPage() {
  const [patientAssessment, setPatientAssessment] = useState({
    age: 30,
    amh: 2.5,
    afc: 12,
    bmi: 24,
    previous_cycles: 0
  });

  const handleProtocolSelected = (protocol, suggestion) => {
    console.log('Selected:', protocol.protocol_name);
    console.log('Match Score:', suggestion.match_score);
    console.log('AI Reason:', suggestion.reason);
    
    // حفظ البروتوكول في الدورة
    updateCycle({ protocol_id: protocol.id });
  };

  return (
    <SmartProtocolSelector
      patientAssessment={patientAssessment}
      onProtocolSelected={handleProtocolSelected}
      showAllProtocols={true}
    />
  );
}
```

### المميزات:

- ✅ اقتراحات AI بناءً على البيانات السريرية
- ✅ عرض درجة التطابق (Match Score)
- ✅ سبب الاقتراح
- ✅ تفاصيل كاملة للبروتوكول (أدوية، مزايا، عيوب)
- ✅ إمكانية الاختيار اليدوي
- ✅ واجهة عربية جميلة

---

## 📝 4. نموذج الزيارة المتكاملة

### الملف: `components/ivf/UnifiedMonitoringVisitForm.tsx`

### الاستخدام:

```typescript
import UnifiedMonitoringVisitForm from '@/components/ivf/UnifiedMonitoringVisitForm';

function MonitoringPage() {
  const handleVisitSaved = (visit) => {
    console.log('Visit saved:', visit);
    toast.success('تم حفظ الزيارة بنجاح');
    // Reload visits list
  };

  return (
    <UnifiedMonitoringVisitForm
      cycleId={currentCycleId}
      cycleStartDate="2026-01-01"
      onSuccess={handleVisitSaved}
      onCancel={() => router.back()}
    />
  );
}
```

### المميزات:

- ✅ **نموذج شامل واحد** لكل بيانات الزيارة
- ✅ حساب تلقائي ليوم الدورة
- ✅ إدخال الهرمونات (E2, LH, P4, FSH)
- ✅ إدخال السونار (بطانة الرحم، الحويصلات)
- ✅ **إضافة أدوية متعددة** مع اختيار من المرجع
- ✅ **إضافة تحاليل متعددة** مع اختيار من المرجع
- ✅ تحديد تلقائي للقيم الطبيعية/غير طبيعية
- ✅ ملاحظات الطبيب
- ✅ واجهة منظمة وسهلة

---

## 🚀 5. مثال تطبيق كامل

### صفحة رحلة التنشيط الذكي

```typescript
// pages/SmartStimulationJourney.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import smartStimulationService from '@/services/smartStimulationService.unified';
import SmartProtocolSelector from '@/components/ivf/SmartProtocolSelector';
import UnifiedMonitoringVisitForm from '@/components/ivf/UnifiedMonitoringVisitForm';

const SmartStimulationJourney = () => {
  const { cycleId } = useParams();
  const [cycle, setCycle] = useState(null);
  const [visits, setVisits] = useState([]);
  const [currentTab, setCurrentTab] = useState<'protocol' | 'monitoring'>('protocol');
  const [showAddVisit, setShowAddVisit] = useState(false);

  useEffect(() => {
    loadCycleData();
  }, [cycleId]);

  const loadCycleData = async () => {
    // Load cycle
    const { data: cycleData } = await smartStimulationService.getCycle(cycleId);
    setCycle(cycleData);

    // Load visits
    const { data: visitsData } = await smartStimulationService.getCycleVisits(cycleId);
    setVisits(visitsData || []);
  };

  const handleProtocolSelected = async (protocol, suggestion) => {
    await smartStimulationService.updateCycle(cycleId, {
      protocol_id: protocol.id,
      protocol_type: protocol.protocol_type,
      protocol_name: protocol.protocol_name,
      protocol_ai_score: suggestion.match_score / 100,
      protocol_selection_reason: suggestion.reason,
      status: 'baseline'
    });
    
    toast.success('تم اختيار البروتوكول');
    setCurrentTab('monitoring');
  };

  const handleVisitAdded = () => {
    setShowAddVisit(false);
    loadCycleData();
  };

  if (!cycle) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg mb-6">
        <h1 className="text-3xl font-bold">رحلة التنشيط الذكي</h1>
        <p className="text-purple-100 mt-2">
          دورة رقم {cycle.cycle_number} - الحالة: {cycle.status}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCurrentTab('protocol')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            currentTab === 'protocol'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          1. اختيار البروتوكول
        </button>
        <button
          onClick={() => setCurrentTab('monitoring')}
          disabled={!cycle.protocol_id}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            currentTab === 'monitoring'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          }`}
        >
          2. المتابعة
        </button>
      </div>

      {/* Content */}
      {currentTab === 'protocol' && (
        <SmartProtocolSelector
          patientAssessment={cycle.initial_assessment || {}}
          onProtocolSelected={handleProtocolSelected}
          showAllProtocols={true}
        />
      )}

      {currentTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Visits List */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">زيارات المتابعة ({visits.length})</h2>
              <button
                onClick={() => setShowAddVisit(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                + إضافة زيارة جديدة
              </button>
            </div>

            {visits.map((visit) => (
              <div key={visit.id} className="border-b py-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg">D{visit.cycle_day}</span>
                    <span className="text-gray-600 mr-3">{visit.visit_date}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {visit.e2_level && (
                      <div>E2: <span className="font-semibold">{visit.e2_level}</span></div>
                    )}
                    {visit.total_follicles && (
                      <div>Follicles: <span className="font-semibold">{visit.total_follicles}</span></div>
                    )}
                    {visit.medications_given && visit.medications_given.length > 0 && (
                      <div className="text-blue-600">
                        💊 {visit.medications_given.length} أدوية
                      </div>
                    )}
                    {visit.lab_results && visit.lab_results.length > 0 && (
                      <div className="text-green-600">
                        🧪 {visit.lab_results.length} تحاليل
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Visit Form */}
          {showAddVisit && (
            <UnifiedMonitoringVisitForm
              cycleId={cycleId}
              cycleStartDate={cycle.start_date}
              onSuccess={handleVisitAdded}
              onCancel={() => setShowAddVisit(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SmartStimulationJourney;
```

---

## 📊 6. عرض البيانات المتكاملة

### مكون Timeline بسيط

```typescript
// components/ivf/VisitTimeline.tsx
import { SmartMonitoringVisit } from '@/types/smartStimulation.types';

interface VisitTimelineProps {
  visits: SmartMonitoringVisit[];
}

const VisitTimeline = ({ visits }: VisitTimelineProps) => {
  return (
    <div className="space-y-4" dir="rtl">
      {visits.map((visit, idx) => (
        <div key={visit.id} className="bg-white rounded-lg shadow p-6 border-r-4 border-indigo-500">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-3xl font-bold text-indigo-600">D{visit.cycle_day}</span>
              {visit.stimulation_day && (
                <span className="text-gray-600 mr-2">(Stim D{visit.stimulation_day})</span>
              )}
            </div>
            <div className="text-gray-600">{visit.visit_date}</div>
          </div>

          {/* Hormones */}
          {(visit.e2_level || visit.lh_level) && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {visit.e2_level && (
                <div className="bg-pink-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-600">E2</div>
                  <div className="font-bold text-pink-700">{visit.e2_level}</div>
                </div>
              )}
              {visit.lh_level && (
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-600">LH</div>
                  <div className="font-bold text-blue-700">{visit.lh_level}</div>
                </div>
              )}
              {visit.total_follicles && (
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-600">Follicles</div>
                  <div className="font-bold text-purple-700">{visit.total_follicles}</div>
                </div>
              )}
              {visit.endometrium_thickness && (
                <div className="bg-green-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-600">Endo</div>
                  <div className="font-bold text-green-700">{visit.endometrium_thickness} mm</div>
                </div>
              )}
            </div>
          )}

          {/* ✅ Medications (Integrated) */}
          {visit.medications_given && visit.medications_given.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                💊 الأدوية المعطاة
              </h4>
              <div className="space-y-2">
                {visit.medications_given.map((med, idx) => (
                  <div key={idx} className="bg-blue-50 rounded p-3 text-sm">
                    <span className="font-semibold">{med.medication_name_ar || med.medication_name}</span>
                    <span className="text-gray-600 mr-2">
                      - {med.dose} {med.unit} ({med.route})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Lab Results (Integrated) */}
          {visit.lab_results && visit.lab_results.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                🧪 نتائج التحاليل
              </h4>
              <div className="space-y-2">
                {visit.lab_results.map((lab, idx) => (
                  <div key={idx} className="bg-green-50 rounded p-3 text-sm">
                    <span className="font-semibold">{lab.test_name_ar || lab.test_name}</span>
                    <span className="text-gray-600 mr-2">
                      - {lab.result_value} {lab.unit}
                    </span>
                    {lab.is_normal !== undefined && (
                      <span className={`mr-2 ${lab.is_normal ? 'text-green-700' : 'text-orange-700'}`}>
                        {lab.is_normal ? '✓ طبيعي' : '⚠ غير طبيعي'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          {visit.doctor_notes && (
            <div className="bg-gray-50 rounded p-3 text-sm">
              <span className="font-semibold text-gray-700">ملاحظات:</span>
              <p className="text-gray-600 mt-1">{visit.doctor_notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VisitTimeline;
```

---

## 🔥 7. المميزات الرئيسية

### ✅ نظام موحد حقيقي
- **كل بيانات الزيارة في سجل واحد**
- لا حاجة لعمل JOIN بين جداول متعددة
- سرعة في الوصول للبيانات

### ✅ اختيار بروتوكول ذكي
- AI يقيّم البيانات السريرية
- يعطي درجة تطابق (Match Score)
- يشرح سبب الاقتراح

### ✅ إدخال متكامل
- نموذج واحد لكل شيء
- اختيار من مراجع الأدوية والتحاليل
- تحديد تلقائي للقيم الطبيعية

### ✅ دعم تراجعي
- الجداول القديمة (cycle_medications_log, cycle_lab_results) محفوظة
- الدوال تدمج البيانات من المصدرين
- لا فقدان لأي بيانات قديمة

---

## 🎯 8. التكامل مع قاعدة البيانات

### Views المتاحة

```sql
-- رحلة كاملة مدمجة
SELECT * FROM ivf_journey_complete WHERE cycle_id = 'uuid';

-- ملخص الدورة مع كل الإحصائيات
SELECT * FROM cycle_complete_details WHERE cycle_id = 'uuid';

-- الدورات النشطة
SELECT * FROM active_smart_cycles_summary;

-- الزيارات التي تحتاج انتباه
SELECT * FROM visits_needing_attention;
```

### Functions المتاحة

```sql
-- اقتراح بروتوكول ذكي
SELECT * FROM suggest_protocol(30, 2.5, 12, 24, 0);

-- حساب معدل نمو الحويصلات
SELECT * FROM calculate_follicle_growth_rate('cycle_id');

-- ملخص الدورة
SELECT * FROM get_cycle_summary('cycle_id');

-- سجل الأدوية (يدمج من المصدرين)
SELECT * FROM get_cycle_medications_history('cycle_id');

-- ملخص التحاليل (يدمج من المصدرين)
SELECT * FROM get_cycle_labs_summary('cycle_id');
```

---

## 📝 9. الخطوات التالية للتشغيل

### 1. تنفيذ Schema في Supabase

```bash
# في Supabase SQL Editor
# نفذ: SMART_IVF_STIMULATION_SCHEMA.sql
```

### 2. إضافة Types إلى مشروعك

```bash
# نسخ types/smartStimulation.types.ts إلى مجلد types
```

### 3. إضافة الخدمة

```bash
# نسخ services/smartStimulationService.unified.ts إلى مجلد services
```

### 4. إضافة المكونات

```bash
# نسخ components/ivf/SmartProtocolSelector.tsx
# نسخ components/ivf/UnifiedMonitoringVisitForm.tsx
```

### 5. إنشاء الصفحة الرئيسية

```bash
# استخدم المثال من القسم 5 أعلاه
```

---

## ✅ الخلاصة

### ما تم تحقيقه:

1. ✅ **قاعدة بيانات موحدة** - كل شيء في سجل واحد
2. ✅ **واجهات TypeScript كاملة** - Type-safe
3. ✅ **خدمة شاملة** - تغطي كل الوظائف
4. ✅ **مكونات React جاهزة** - UI جميل وعملي
5. ✅ **تكامل كامل** - Frontend ↔ Backend
6. ✅ **دعم تراجعي** - البيانات القديمة محفوظة
7. ✅ **ذكاء اصطناعي** - اقتراحات البروتوكول

### الفائدة للطبيب:

- 🎯 **واجهة موحدة بسيطة** بدلاً من صفحات متفرقة
- 📊 **رؤية شاملة** لكل الزيارة في مكان واحد
- 🤖 **توصيات ذكية** من الAI
- ⚡ **سرعة في الإدخال** - نموذج واحد لكل شيء
- 📈 **تتبع دقيق** للتطور عبر الزمن

---

## 💡 نصائح للاستخدام

1. **ابدأ بالبروتوكول** - اختر البروتوكول المناسب أولاً
2. **أدخل الزيارات بانتظام** - كل يوم متابعة = زيارة جديدة
3. **استخدم الملاحظات** - اكتب ملاحظاتك السريرية
4. **راجع الRisks** - انتبه للتنبيهات التلقائية
5. **استفد من الAI** - اقبل التوصيات الذكية

---

**جاهز للاستخدام الآن! 🚀**

للدعم: راجع الملفات المذكورة أعلاه أو أرسل سؤالك.
