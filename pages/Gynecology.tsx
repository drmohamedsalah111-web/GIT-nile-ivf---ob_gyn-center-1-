import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { GynecologyData, Patient, Doctor, Visit, PrescriptionItem } from '../types';
import { EGYPTIAN_DRUGS } from '../constants';
import { Plus, Trash2, FileText, Printer, Activity, Microscope, Info, Save } from 'lucide-react';

const Gynecology: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);

  // Clinical Data State
  const [clinicalData, setClinicalData] = useState<GynecologyData>({
    department: 'gynecology',
    hormonalProfile: {},
    ultrasoundFindings: {
      uterus: {},
      endometrium: {},
      ovaries: { right: {}, left: {} },
      pouchOfDouglas: {}
    },
    diagnosis: [],
    clinicalNotes: ''
  });

  // Prescription State
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [drugCategory, setDrugCategory] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchVisits(selectedPatientId);
    } else {
      setVisits([]);
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('فشل تحميل المرضى');
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const doctor = await authService.getDoctorProfile(user.id);
        setDoctorProfile(doctor);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast.error('فشل تحميل بيانات الطبيب');
    }
  };

  const fetchVisits = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Update clinical data helpers
  const updateHormonalProfile = (field: string, value: number | undefined) => {
    setClinicalData(prev => ({
      ...prev,
      hormonalProfile: {
        ...prev.hormonalProfile,
        [field]: value
      }
    }));
  };

  const updateUltrasoundFindings = (section: string, field: string, value: any) => {
    setClinicalData(prev => ({
      ...prev,
      ultrasoundFindings: {
        ...prev.ultrasoundFindings,
        [section]: {
          ...prev.ultrasoundFindings?.[section as keyof typeof prev.ultrasoundFindings],
          [field]: value
        }
      }
    }));
  };

  const toggleDiagnosis = (diagnosis: string) => {
    setClinicalData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis?.includes(diagnosis)
        ? prev.diagnosis.filter(d => d !== diagnosis)
        : [...(prev.diagnosis || []), diagnosis]
    }));
  };

  const handleAddDrug = () => {
    if (!drugCategory || !selectedDrug) return;
    // @ts-ignore
    const drugInfo = EGYPTIAN_DRUGS[drugCategory][selectedDrug];
    const dose = drugInfo ? drugInfo.dose : '';
    setRxItems([...rxItems, { category: drugCategory, drug: selectedDrug, dose }]);
    setSelectedDrug('');
  };

  const removeDrug = (idx: number) => {
    setRxItems(rxItems.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedPatient || !doctorProfile) return;

    setIsSaving(true);
    try {
      const visitData = {
        patient_id: selectedPatient.id,
        date: new Date().toISOString().split('T')[0],
        diagnosis: clinicalData.diagnosis?.join('; ') || '',
        prescription: rxItems,
        notes: clinicalData.clinicalNotes || '',
        clinical_data: clinicalData
      };

      const { error } = await supabase
        .from('visits')
        .insert([visitData]);

      if (error) throw error;

      // Reset form
      setClinicalData({
        department: 'gynecology',
        hormonalProfile: {},
        ultrasoundFindings: {
          uterus: {},
          endometrium: {},
          ovaries: { right: {}, left: {} },
          pouchOfDouglas: {}
        },
        diagnosis: [],
        clinicalNotes: ''
      });
      setRxItems([]);
      setDrugCategory('');
      setSelectedDrug('');

      // Refresh visits
      fetchVisits(selectedPatient.id);

      toast.success('تم حفظ الزيارة بنجاح');
    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error(`فشل حفظ الزيارة: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!selectedPatient || rxItems.length === 0) return;
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
          🚺 قسم النسائية
        </h1>
        <p className="text-gray-600 font-[Tajawal]">
          تقييم شامل للصحة النسائية مع التركيز على الهرمونات والمسح بالموجات فوق الصوتية
        </p>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 no-print">
        <label className="block text-sm font-bold text-gray-700 mb-2 font-[Tajawal]">
          اختر المريضة
        </label>
        <select
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white text-sm min-h-[48px]"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">-- اختر مريضة --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          {/* LEFT COLUMN: Clinical Assessment */}
          <div className="space-y-6">
            {/* Hormonal Profile Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-600" />
                ملف هرموني (اليوم 2-3)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FSH (IU/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={clinicalData.hormonalProfile?.fsh || ''}
                    onChange={(e) => updateHormonalProfile('fsh', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LH (IU/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={clinicalData.hormonalProfile?.lh || ''}
                    onChange={(e) => updateHormonalProfile('lh', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E2 (pg/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={clinicalData.hormonalProfile?.e2 || ''}
                    onChange={(e) => updateHormonalProfile('e2', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prolactin (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={clinicalData.hormonalProfile?.prolactin || ''}
                    onChange={(e) => updateHormonalProfile('prolactin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TSH (mIU/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={clinicalData.hormonalProfile?.tsh || ''}
                    onChange={(e) => updateHormonalProfile('tsh', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AMH (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={clinicalData.hormonalProfile?.amh || ''}
                    onChange={(e) => updateHormonalProfile('amh', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Ultrasound Findings Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-blue-600" />
                نتائج المسح بالموجات فوق الصوتية (TVS)
              </h3>

              {/* Uterus */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">الرحم</h4>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">طول (mm)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={clinicalData.ultrasoundFindings?.uterus?.length || ''}
                      onChange={(e) => updateUltrasoundFindings('uterus', 'length', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">عرض (mm)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={clinicalData.ultrasoundFindings?.uterus?.width || ''}
                      onChange={(e) => updateUltrasoundFindings('uterus', 'width', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">AP (mm)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={clinicalData.ultrasoundFindings?.uterus?.ap || ''}
                      onChange={(e) => updateUltrasoundFindings('uterus', 'ap', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">التوجه</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={clinicalData.ultrasoundFindings?.uterus?.orientation || ''}
                      onChange={(e) => updateUltrasoundFindings('uterus', 'orientation', e.target.value)}
                    >
                      <option value="">اختر</option>
                      <option value="AVF">AVF</option>
                      <option value="RVF">RVF</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">النسيج الرحمي</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={clinicalData.ultrasoundFindings?.uterus?.myometrium || ''}
                    onChange={(e) => updateUltrasoundFindings('uterus', 'myometrium', e.target.value)}
                  >
                    <option value="">اختر</option>
                    <option value="Normal">طبيعي</option>
                    <option value="Adenomyosis">التهاب بطانة الرحم</option>
                    <option value="Fibroid">ورم عضلي</option>
                  </select>
                </div>
              </div>

              {/* Endometrium */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">البطانة الرحمية</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">السمك (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={clinicalData.ultrasoundFindings?.endometrium?.thickness || ''}
                      onChange={(e) => updateUltrasoundFindings('endometrium', 'thickness', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">النمط</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={clinicalData.ultrasoundFindings?.endometrium?.pattern || ''}
                      onChange={(e) => updateUltrasoundFindings('endometrium', 'pattern', e.target.value)}
                    >
                      <option value="">اختر</option>
                      <option value="Triple Line">خط ثلاثي</option>
                      <option value="Homogeneous">متجانس</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ovaries */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">المبايض</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Right Ovary */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-2">المبيض الأيمن</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">الحجم</label>
                        <input
                          type="text"
                          placeholder="مثال: 3.2 x 2.1 x 1.8 cm"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          value={clinicalData.ultrasoundFindings?.ovaries?.right?.size || ''}
                          onChange={(e) => updateUltrasoundFindings('ovaries', 'right', {
                            ...clinicalData.ultrasoundFindings?.ovaries?.right,
                            size: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">الكيسات</label>
                        <input
                          type="text"
                          placeholder="بسيط، نزفي، دهني..."
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          value={clinicalData.ultrasoundFindings?.ovaries?.right?.cysts || ''}
                          onChange={(e) => updateUltrasoundFindings('ovaries', 'right', {
                            ...clinicalData.ultrasoundFindings?.ovaries?.right,
                            cysts: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Ovary */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-2">المبيض الأيسر</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">الحجم</label>
                        <input
                          type="text"
                          placeholder="مثال: 3.2 x 2.1 x 1.8 cm"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          value={clinicalData.ultrasoundFindings?.ovaries?.left?.size || ''}
                          onChange={(e) => updateUltrasoundFindings('ovaries', 'left', {
                            ...clinicalData.ultrasoundFindings?.ovaries?.left,
                            size: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">الكيسات</label>
                        <input
                          type="text"
                          placeholder="بسيط، نزفي، دهني..."
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          value={clinicalData.ultrasoundFindings?.ovaries?.left?.cysts || ''}
                          onChange={(e) => updateUltrasoundFindings('ovaries', 'left', {
                            ...clinicalData.ultrasoundFindings?.ovaries?.left,
                            cysts: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pouch of Douglas */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">كيس دوغلاس</h4>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={clinicalData.ultrasoundFindings?.pouchOfDouglas?.freeFluid || false}
                    onChange={(e) => updateUltrasoundFindings('pouchOfDouglas', 'freeFluid', e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">سائل حر موجود</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Diagnosis & Plan */}
          <div className="space-y-6">
            {/* Diagnosis */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-green-600" />
                التشخيص والخطة العلاجية
              </h3>

              {/* Diagnosis Selection */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">التشخيصات</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'PCOS', 'Endometriosis', 'Uterine Fibroid', 'Adenomyosis',
                    'Diminished Ovarian Reserve', 'Premature Ovarian Failure',
                    'Hyperprolactinemia', 'Thyroid Disorder', 'Unexplained Infertility'
                  ].map(diagnosis => (
                    <button
                      key={diagnosis}
                      onClick={() => toggleDiagnosis(diagnosis)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        clinicalData.diagnosis?.includes(diagnosis)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {diagnosis}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات سريرية</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  value={clinicalData.clinicalNotes || ''}
                  onChange={(e) => setClinicalData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                  placeholder="أدخل الملاحظات السريرية..."
                />
              </div>

              {/* Prescription Section */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">الوصفة الطبية</h4>

                {/* Add Drug */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">الفئة</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      value={drugCategory}
                      onChange={(e) => { setDrugCategory(e.target.value); setSelectedDrug(''); }}
                    >
                      <option value="">اختر الفئة</option>
                      {Object.keys(EGYPTIAN_DRUGS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">الدواء</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      value={selectedDrug}
                      onChange={(e) => setSelectedDrug(e.target.value)}
                      disabled={!drugCategory}
                    >
                      <option value="">اختر الدواء</option>
                      {drugCategory && Object.keys((EGYPTIAN_DRUGS as any)[drugCategory]).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddDrug}
                  disabled={!selectedDrug}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <Plus className="w-4 h-4" />
                  إضافة دواء
                </button>

                {/* Prescription List */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                  {rxItems.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm">لا توجد أدوية</p>
                  ) : (
                    <ul className="space-y-2">
                      {rxItems.map((item, idx) => (
                        <li key={idx} className="bg-white p-2 rounded shadow-sm flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{item.drug}</div>
                            <div className="text-xs text-green-600 font-mono mt-0.5">{item.dose}</div>
                          </div>
                          <button
                            onClick={() => removeDrug(idx)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'جاري الحفظ...' : 'حفظ الزيارة'}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={rxItems.length === 0}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  طباعة الوصفة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Previous Visits */}
      {visits.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 mb-4">الزيارات السابقة</h3>
          <div className="space-y-3">
            {visits.map(visit => (
              <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-green-700">{new Date(visit.date).toLocaleDateString('ar-EG')}</div>
                </div>
                {visit.diagnosis && (
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">التشخيص:</span>
                    <p className="text-sm text-gray-600 mt-1">{visit.diagnosis}</p>
                  </div>
                )}
                {visit.prescription && visit.prescription.length > 0 && (
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">الوصفة:</span>
                    <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                      {visit.prescription.map((item, idx) => (
                        <li key={idx}>{item.drug} - {item.dose}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {visit.notes && (
                  <div>
                    <span className="font-medium text-gray-700">ملاحظات:</span>
                    <p className="text-sm text-gray-600 mt-1">{visit.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gynecology;