import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { obstetricsService, calculateEDD, calculateGestationalAge, calculateEFW } from '../services/obstetricsService';
import { ObstetricsData, Patient, Doctor, Pregnancy, AntenatalVisit, BiometryScan } from '../types';
import { EGYPTIAN_DRUGS } from '../constants';
import { Plus, Trash2, FileText, Printer, Activity, Heart, Baby, Calendar, Save } from 'lucide-react';

const Obstetrics: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [activeTab, setActiveTab] = useState<'anc' | 'biometry'>('anc');
  const [isLoading, setIsLoading] = useState(false);

  // ANC Visit Data
  const [ancData, setAncData] = useState({
    gestationalAge: { weeks: 0, days: 0 },
    bp: { systolic: 0, diastolic: 0 },
    weight: 0,
    urine: { albuminuria: '', glycosuria: '' },
    pallor: false,
    edema: false,
    edemaGrade: '',
    fetalHeartSound: false,
    fundalHeight: 0,
    notes: ''
  });

  // Fetal Biometry Data
  const [biometryData, setBiometryData] = useState({
    bpd: 0,
    fl: 0,
    ac: 0,
    hc: 0,
    efw: 0,
    placentaLocation: '',
    liquor: { afi: 0 },
    dopplerIndices: { umbilicalRI: 0, mcaPI: 0 }
  });

  // Prescription State
  const [rxItems, setRxItems] = useState<any[]>([]);
  const [drugCategory, setDrugCategory] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPregnancy(selectedPatientId);
    } else {
      setPregnancy(null);
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

  const fetchPregnancy = async (patientId: string) => {
    try {
      const data = await obstetricsService.getPregnancyByPatient(patientId);
      setPregnancy(data);
    } catch (error) {
      console.error('Error fetching pregnancy:', error);
      setPregnancy(null);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Calculate EFW when biometry values change
  useEffect(() => {
    if (biometryData.bpd && biometryData.hc && biometryData.ac && biometryData.fl) {
      const efw = calculateEFW(biometryData.bpd, biometryData.hc, biometryData.ac, biometryData.fl);
      setBiometryData(prev => ({ ...prev, efw }));
    }
  }, [biometryData.bpd, biometryData.hc, biometryData.ac, biometryData.fl]);

  const handleSaveANCVisit = async () => {
    if (!pregnancy || !doctorProfile) return;

    setIsLoading(true);
    try {
      await obstetricsService.createANCVisit({
        pregnancy_id: pregnancy.id,
        visit_date: new Date().toISOString().split('T')[0],
        gestational_age_weeks: ancData.gestationalAge.weeks,
        gestational_age_days: ancData.gestationalAge.days,
        systolic_bp: ancData.bp.systolic || undefined,
        diastolic_bp: ancData.bp.diastolic || undefined,
        weight_kg: ancData.weight || undefined,
        urine_albuminuria: ancData.urine.albuminuria || undefined,
        urine_glycosuria: ancData.urine.glycosuria || undefined,
        fetal_heart_sound: ancData.fetalHeartSound,
        fundal_height_cm: ancData.fundalHeight || undefined,
        edema: ancData.edema,
        edema_grade: ancData.edemaGrade || undefined,
        notes: ancData.notes || undefined
      });

      // Reset form
      setAncData({
        gestationalAge: { weeks: 0, days: 0 },
        bp: { systolic: 0, diastolic: 0 },
        weight: 0,
        urine: { albuminuria: '', glycosuria: '' },
        pallor: false,
        edema: false,
        edemaGrade: '',
        fetalHeartSound: false,
        fundalHeight: 0,
        notes: ''
      });

      toast.success('تم حفظ زيارة المتابعة بنجاح');
    } catch (error: any) {
      console.error('Error saving ANC visit:', error);
      toast.error(`فشل حفظ الزيارة: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBiometryScan = async () => {
    if (!pregnancy || !doctorProfile) return;

    setIsLoading(true);
    try {
      await obstetricsService.createBiometryScan({
        pregnancy_id: pregnancy.id,
        scan_date: new Date().toISOString().split('T')[0],
        gestational_age_weeks: ancData.gestationalAge.weeks,
        gestational_age_days: ancData.gestationalAge.days,
        bpd_mm: biometryData.bpd || undefined,
        hc_mm: biometryData.hc || undefined,
        ac_mm: biometryData.ac || undefined,
        fl_mm: biometryData.fl || undefined,
        efw_grams: biometryData.efw || undefined,
        notes: `Placenta: ${biometryData.placentaLocation}, AFI: ${biometryData.liquor.afi}, Doppler: RI ${biometryData.dopplerIndices.umbilicalRI}, PI ${biometryData.dopplerIndices.mcaPI}`
      });

      // Reset form
      setBiometryData({
        bpd: 0,
        fl: 0,
        ac: 0,
        hc: 0,
        efw: 0,
        placentaLocation: '',
        liquor: { afi: 0 },
        dopplerIndices: { umbilicalRI: 0, mcaPI: 0 }
      });

      toast.success('تم حفظ مسح البيوميتري بنجاح');
    } catch (error: any) {
      console.error('Error saving biometry scan:', error);
      toast.error(`فشل حفظ المسح: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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

  const handlePrint = () => {
    if (!selectedPatient || rxItems.length === 0) return;
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Calculate current gestational age if pregnancy exists
  const currentGA = pregnancy?.lmp_date ? calculateGestationalAge(pregnancy.lmp_date) : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
          🤰 قسم الولادة والتوليد
        </h1>
        <p className="text-gray-600 font-[Tajawal]">
          متابعة شاملة للحمل مع سجل زيارات المتابعة وبيانات البيوميتري الجنيني
        </p>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 no-print">
        <label className="block text-sm font-bold text-gray-700 mb-2 font-[Tajawal]">
          اختر المريضة
        </label>
        <select
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white text-sm min-h-[48px]"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">-- اختر مريضة --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
          ))}
        </select>
      </div>

      {selectedPatient && pregnancy && (
        <>
          {/* Pregnancy Timeline Header */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-teal-100 mb-6 no-print">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-700">{currentGA?.weeks}</div>
                <div className="text-sm text-gray-600">أسابيع</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-700">{currentGA?.days}</div>
                <div className="text-sm text-gray-600">أيام</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700">
                  {pregnancy.edd_date ? new Date(pregnancy.edd_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                </div>
                <div className="text-sm text-gray-600">تاريخ الولادة المتوقع</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${pregnancy.risk_level === 'high' ? 'text-red-700' : pregnancy.risk_level === 'moderate' ? 'text-yellow-700' : 'text-green-700'}`}>
                  {pregnancy.risk_level === 'high' ? 'مرتفع' : pregnancy.risk_level === 'moderate' ? 'متوسط' : 'منخفض'}
                </div>
                <div className="text-sm text-gray-600">مستوى المخاطر</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 no-print">
            <div className="border-b border-gray-100">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('anc')}
                  className={`flex-1 py-4 text-center text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'anc'
                      ? 'border-teal-500 text-teal-600 bg-teal-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  سجل زيارات المتابعة (ANC)
                </button>
                <button
                  onClick={() => setActiveTab('biometry')}
                  className={`flex-1 py-4 text-center text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'biometry'
                      ? 'border-teal-500 text-teal-600 bg-teal-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  البيوميتري الجنيني
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* ANC Visit Tab */}
              {activeTab === 'anc' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-600" />
                    زيارة متابعة الحمل
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Gestational Age */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">العمر الحملي</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="أسابيع"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                          value={ancData.gestationalAge.weeks}
                          onChange={(e) => setAncData(prev => ({
                            ...prev,
                            gestationalAge: { ...prev.gestationalAge, weeks: Number(e.target.value) }
                          }))}
                        />
                        <input
                          type="number"
                          placeholder="أيام"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                          value={ancData.gestationalAge.days}
                          onChange={(e) => setAncData(prev => ({
                            ...prev,
                            gestationalAge: { ...prev.gestationalAge, days: Number(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ضغط الدم</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="انقباضي"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                          value={ancData.bp.systolic || ''}
                          onChange={(e) => setAncData(prev => ({
                            ...prev,
                            bp: { ...prev.bp, systolic: Number(e.target.value) }
                          }))}
                        />
                        <input
                          type="number"
                          placeholder="انبساطي"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                          value={ancData.bp.diastolic || ''}
                          onChange={(e) => setAncData(prev => ({
                            ...prev,
                            bp: { ...prev.bp, diastolic: Number(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الوزن (كجم)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        value={ancData.weight || ''}
                        onChange={(e) => setAncData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      />
                    </div>

                    {/* Urine Analysis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">البول - بروتين</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        value={ancData.urine.albuminuria}
                        onChange={(e) => setAncData(prev => ({
                          ...prev,
                          urine: { ...prev.urine, albuminuria: e.target.value }
                        }))}
                      >
                        <option value="">اختر</option>
                        <option value="Negative">سلبي</option>
                        <option value="Trace">أثر</option>
                        <option value="1+">1+</option>
                        <option value="2+">2+</option>
                        <option value="3+">3+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">البول - سكر</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        value={ancData.urine.glycosuria}
                        onChange={(e) => setAncData(prev => ({
                          ...prev,
                          urine: { ...prev.urine, glycosuria: e.target.value }
                        }))}
                      >
                        <option value="">اختر</option>
                        <option value="Negative">سلبي</option>
                        <option value="Trace">أثر</option>
                        <option value="1+">1+</option>
                        <option value="2+">2+</option>
                        <option value="3+">3+</option>
                      </select>
                    </div>

                    {/* Fundal Height */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ارتفاع الرحم (سم)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        value={ancData.fundalHeight || ''}
                        onChange={(e) => setAncData(prev => ({ ...prev, fundalHeight: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        checked={ancData.pallor}
                        onChange={(e) => setAncData(prev => ({ ...prev, pallor: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">شحوب</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        checked={ancData.edema}
                        onChange={(e) => setAncData(prev => ({ ...prev, edema: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">وذمة</span>
                    </label>

                    <div>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 text-sm"
                        value={ancData.edemaGrade}
                        onChange={(e) => setAncData(prev => ({ ...prev, edemaGrade: e.target.value }))}
                      >
                        <option value="">درجة الوذمة</option>
                        <option value="1+">1+</option>
                        <option value="2+">2+</option>
                        <option value="3+">3+</option>
                        <option value="4+">4+</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        checked={ancData.fetalHeartSound}
                        onChange={(e) => setAncData(prev => ({ ...prev, fetalHeartSound: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">نبض الجنين</span>
                    </label>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                      rows={3}
                      value={ancData.notes}
                      onChange={(e) => setAncData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="أدخل الملاحظات..."
                    />
                  </div>

                  <button
                    onClick={handleSaveANCVisit}
                    disabled={isLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'جاري الحفظ...' : 'حفظ زيارة المتابعة'}
                  </button>
                </div>
              )}

              {/* Fetal Biometry Tab */}
              {activeTab === 'biometry' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-blue-600" />
                    مسح البيوميتري الجنيني
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* BPD */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">BPD (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.bpd || ''}
                        onChange={(e) => setBiometryData(prev => ({ ...prev, bpd: Number(e.target.value) }))}
                      />
                    </div>

                    {/* HC */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HC (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.hc || ''}
                        onChange={(e) => setBiometryData(prev => ({ ...prev, hc: Number(e.target.value) }))}
                      />
                    </div>

                    {/* AC */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AC (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.ac || ''}
                        onChange={(e) => setBiometryData(prev => ({ ...prev, ac: Number(e.target.value) }))}
                      />
                    </div>

                    {/* FL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FL (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.fl || ''}
                        onChange={(e) => setBiometryData(prev => ({ ...prev, fl: Number(e.target.value) }))}
                      />
                    </div>

                    {/* EFW - Auto calculated */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">EFW (grams)</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                        value={biometryData.efw || ''}
                        readOnly
                      />
                    </div>

                    {/* Placenta Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">موقع المشيمة</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.placentaLocation}
                        onChange={(e) => setBiometryData(prev => ({ ...prev, placentaLocation: e.target.value }))}
                      >
                        <option value="">اختر</option>
                        <option value="Anterior">أمامية</option>
                        <option value="Posterior">خلفية</option>
                        <option value="Fundal">قعرية</option>
                        <option value="Lateral">جانبية</option>
                      </select>
                    </div>

                    {/* AFI */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AFI</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.liquor.afi || ''}
                        onChange={(e) => setBiometryData(prev => ({
                          ...prev,
                          liquor: { ...prev.liquor, afi: Number(e.target.value) }
                        }))}
                      />
                    </div>

                    {/* Doppler Indices */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Umbilical RI</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.dopplerIndices.umbilicalRI || ''}
                        onChange={(e) => setBiometryData(prev => ({
                          ...prev,
                          dopplerIndices: { ...prev.dopplerIndices, umbilicalRI: Number(e.target.value) }
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MCA PI</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={biometryData.dopplerIndices.mcaPI || ''}
                        onChange={(e) => setBiometryData(prev => ({
                          ...prev,
                          dopplerIndices: { ...prev.dopplerIndices, mcaPI: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBiometryScan}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'جاري الحفظ...' : 'حفظ مسح البيوميتري'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 no-print">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              الوصفة الطبية
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
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
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Plus className="w-4 h-4" />
              إضافة دواء
            </button>

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

            <div className="flex gap-3 mt-4">
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
        </>
      )}

      {!pregnancy && selectedPatient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <Calendar className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا يوجد ملف حمل</h3>
          <p className="text-gray-600 mb-4">يجب إنشاء ملف حمل أولاً في قسم الولادة والتوليد</p>
          <button
            onClick={() => window.location.href = '#/obstetrics'}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            انتقل إلى قسم الولادة والتوليد
          </button>
        </div>
      )}
    </div>
  );
};

export default Obstetrics;