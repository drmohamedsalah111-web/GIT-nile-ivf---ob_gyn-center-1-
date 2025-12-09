import React, { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { Pregnancy, Patient, PrescriptionItem } from '../types';
import { db } from '../src/db/localDB';
import { obstetricsService, calculateEDD, calculateGestationalAge } from '../services/obstetricsService';
import { authService } from '../services/authService';
import { visitsService } from '../services/visitsService';
import PregnancyHeader from './components/obstetrics/PregnancyHeader';
import RiskAssessment from './components/obstetrics/RiskAssessment';
import ANCFlowSheet from './components/obstetrics/ANCFlowSheet';
import FetalGrowthChart from './components/obstetrics/FetalGrowthChart';
import PrescriptionComponent from '../components/PrescriptionComponent';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import RefreshButton from '../components/RefreshButton';

const ObstetricsDashboard: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray(), []) || [];
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [isLoadingPregnancy, setIsLoadingPregnancy] = useState(false);
  const [showNewPregnancyForm, setShowNewPregnancyForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);

  const [formData, setFormData] = useState({
    lmp_date: '',
    edd_by_scan: '',
  });

  useEffect(() => {
    fetchDoctorProfile();
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id.toString());
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPregnancy(selectedPatientId);
      fetchLastPrescription(selectedPatientId);
    }
  }, [selectedPatientId]);

  const fetchLastPrescription = async (patientId: string) => {
    try {
      // Get the pregnancy first
      const pregnancy = await obstetricsService.getPregnancyByPatient(patientId);
      if (pregnancy && pregnancy.id) {
        // Get the most recent antenatal visit for this pregnancy to load prescription
        const visits = await obstetricsService.getANCVisits(pregnancy.id);
        if (visits.length > 0) {
          const lastVisit = visits[visits.length - 1];
          // Check if prescription exists in the visit data
          if (lastVisit.prescription && Array.isArray(lastVisit.prescription)) {
            setPrescription(lastVisit.prescription);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching last prescription:', error);
    }
  };

  const fetchPregnancy = async (patientId: string) => {
    try {
      setIsLoadingPregnancy(true);
      const data = await obstetricsService.getPregnancyByPatient(patientId);
      setPregnancy(data || null);
    } catch (error) {
      console.error('Error fetching pregnancy:', error);
      setPregnancy(null);
    } finally {
      setIsLoadingPregnancy(false);
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const doctor = await authService.getDoctorProfile(user.id);
        setDoctorId(doctor.id);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast.error('فشل تحميل بيانات الطبيب');
    }
  };

  const handleCreatePregnancy = async () => {
    try {
      if (!selectedPatientId) {
        toast.error('اختر مريضة أولاً');
        return;
      }

      if (!doctorId) {
        toast.error('فشل تحميل بيانات الطبيب');
        return;
      }

      const lmpDate = formData.lmp_date?.trim() || null;
      const eddByScan = formData.edd_by_scan?.trim() || null;

      if (!lmpDate && !eddByScan) {
        toast.error('أدخل تاريخ آخر دورة أو تاريخ الولادة المتوقع');
        return;
      }

      setIsSaving(true);

      let eddDate: string | null = null;

      if (eddByScan) {
        if (isNaN(new Date(eddByScan).getTime())) {
          toast.error('Invalid EDD date provided');
          setIsSaving(false);
          return;
        }
        eddDate = eddByScan;
      } else if (lmpDate) {
        eddDate = calculateEDD(lmpDate);
        if (!eddDate) {
          toast.error('Unable to calculate EDD from LMP date');
          setIsSaving(false);
          return;
        }
      }

      if (!eddDate) {
        toast.error('Invalid date provided. Please check LMP or EDD by scan.');
        setIsSaving(false);
        return;
      }

      const pregnancyData = {
        doctor_id: doctorId,
        patient_id: selectedPatientId,
        lmp_date: lmpDate,
        edd_date: eddDate,
        edd_by_scan: eddByScan,
        risk_level: 'low' as const,
        risk_factors: [] as string[],
        aspirin_prescribed: false,
        thromboprophylaxis_needed: false,
      };

      console.log('Creating pregnancy with data:', pregnancyData);

      const newPregnancy = await obstetricsService.createPregnancy(pregnancyData);

      if (!newPregnancy || !newPregnancy.id) {
        throw new Error('Failed to create pregnancy: Invalid response from server');
      }

      setPregnancy(newPregnancy);
      setShowNewPregnancyForm(false);
      setFormData({ lmp_date: '', edd_by_scan: '' });
      toast.success('تم إنشاء ملف الحمل بنجاح');
    } catch (error: any) {
      console.error('Error creating pregnancy:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.details,
        hint: error?.hint,
      });
      toast.error(`فشل إنشاء ملف الحمل: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePregnancy = async (updates: Partial<Pregnancy>) => {
    if (!pregnancy || !pregnancy.id) {
      console.error('Cannot update pregnancy: pregnancy data is invalid');
      toast.error('فشل تحديث ملف الحمل: البيانات غير صحيحة');
      return;
    }

    try {
      if (!updates || Object.keys(updates).length === 0) {
        console.warn('No updates provided');
        return;
      }

      const sanitizedUpdates = {
        ...updates,
        risk_factors: Array.isArray(updates.risk_factors) ? updates.risk_factors : [],
      };

      await obstetricsService.updatePregnancy(pregnancy.id, sanitizedUpdates);
      const updated = await obstetricsService.getPregnancyByPatient(pregnancy.patient_id);
      
      if (!updated || !updated.id) {
        throw new Error('Failed to fetch updated pregnancy data');
      }
      
      setPregnancy(updated);
    } catch (error) {
      console.error('Error updating pregnancy:', error);
      toast.error('فشل تحديث ملف الحمل');
      throw error;
    }
  };

  const handleSaveVisit = async () => {
    if (!selectedPatientId || !pregnancy || !pregnancy.id) {
      toast.error('Please select a patient and ensure pregnancy data is loaded');
      return;
    }

    setIsSaving(true);
    try {
      if (!selectedPatientId || typeof selectedPatientId !== 'string') {
        throw new Error('Invalid patient ID');
      }

      const gestationalAge = calculateGestationalAge(pregnancy.lmp_date);

      if (!gestationalAge || typeof gestationalAge.weeks !== 'number' || typeof gestationalAge.days !== 'number') {
        throw new Error('Invalid gestational age calculation');
      }

      // Save as antenatal visit with prescription data
      const visitData = {
        pregnancy_id: pregnancy.id,
        visit_date: new Date().toISOString().split('T')[0],
        gestational_age_weeks: gestationalAge.weeks,
        gestational_age_days: gestationalAge.days,
        systolic_bp: null, // Will be filled in ANCFlowSheet
        diastolic_bp: null,
        weight_kg: null,
        urine_albuminuria: 'negative',
        urine_glycosuria: 'negative',
        fetal_heart_sound: true,
        fundal_height_cm: null,
        edema: false,
        edema_grade: 'none',
        notes: `Pregnancy monitoring visit - GA: ${gestationalAge.weeks}w+${gestationalAge.days}d, Risk: ${pregnancy.risk_level || 'low'}`,
        next_visit_date: null,
        prescription: Array.isArray(prescription) ? prescription : [], // Include prescription
      };

      await obstetricsService.createANCVisit(visitData);

      toast.success('Obstetrics visit saved successfully');
      setPrescription([]);

    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error(`Failed to save visit: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentPatient = patients.find(p => p.id.toString() === selectedPatientId);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
            🤰 وحدة طب التوليد والنسائية
          </h1>
          <p className="text-gray-600 font-[Tajawal]">
            متابعة شاملة للحمل والولادة مع تقييم المخاطر والمسح البيوميتري
          </p>
        </div>
        <RefreshButton onRefreshComplete={() => {
          if (selectedPatientId) {
            fetchPregnancy(selectedPatientId);
          }
        }} />
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
            اختر المريضة
          </label>
          <select
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
          >
            <option value="">-- اختر مريضة --</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id.toString()}>
                {patient.name} - {patient.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
            &nbsp;
          </label>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-[Tajawal] font-semibold transition-colors"
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {isLoadingPregnancy ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : pregnancy && pregnancy.id && pregnancy.patient_id ? (
        <>
          <PregnancyHeader pregnancy={pregnancy} />
          <RiskAssessment pregnancy={pregnancy} onUpdate={handleUpdatePregnancy} />
          <ANCFlowSheet pregnancyId={pregnancy.id} lmpDate={pregnancy.lmp_date || undefined} />
          <FetalGrowthChart pregnancyId={pregnancy.id} lmpDate={pregnancy.lmp_date || undefined} />

          {/* Prescription Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <PrescriptionComponent
              prescriptions={prescription}
              onPrescriptionsChange={setPrescription}
              onPrint={() => setIsPrinterOpen(true)}
              showPrintButton={true}
            />
          </div>

          {/* Save Visit Button */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <button
              onClick={handleSaveVisit}
              disabled={isSaving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Obstetrics Visit'}
            </button>
          </div>
        </>
      ) : currentPatient ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
            <Plus size={32} className="text-teal-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-[Tajawal]">
            لا يوجد ملف حمل لـ {currentPatient.name}
          </h3>
          <p className="text-gray-600 mb-6 font-[Tajawal]">
            إنشاء ملف حمل جديد لبدء المتابعة الشاملة
          </p>

          {!showNewPregnancyForm ? (
            <button
              onClick={() => setShowNewPregnancyForm(true)}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
            >
              <Plus size={20} />
              إنشاء ملف حمل جديد
            </button>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-teal-200 max-w-md mx-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                  آخر دورة شهرية (LMP)
                </label>
                <input
                  type="date"
                  value={formData.lmp_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, lmp_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                  أو تاريخ الولادة المتوقع بالمسح (EDD by Ultrasound)
                </label>
                <input
                  type="date"
                  value={formData.edd_by_scan}
                  onChange={(e) => setFormData(prev => ({ ...prev, edd_by_scan: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreatePregnancy}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-[Tajawal] font-semibold transition-colors"
                >
                  {isSaving ? 'جاري...' : 'إنشاء'}
                </button>
                <button
                  onClick={() => setShowNewPregnancyForm(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-[Tajawal] font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 font-[Tajawal]">اختر مريضة لبدء المتابعة</p>
        </div>
      )}

      <PrescriptionPrinter
        patient={currentPatient || null}
        prescriptions={Array.isArray(prescription) ? prescription : []}
        diagnosis={pregnancy && pregnancy.id ? `Pregnancy - ${pregnancy.risk_level || 'low'} risk` : ''}
        notes={pregnancy && pregnancy.id && pregnancy.lmp_date ? (() => {
          try {
            const ga = calculateGestationalAge(pregnancy.lmp_date);
            return ga && ga.weeks > 0 ? `Gestational age: ${ga.weeks} weeks ${ga.days} days` : 'Gestational age: Not available';
          } catch (err) {
            console.warn('Error calculating GA for printer:', err);
            return 'Gestational age: Not available';
          }
        })() : ''}
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />
    </div>
  );
};

export default ObstetricsDashboard;
