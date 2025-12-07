import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { BiometryScan } from '../../../types';
import { obstetricsService, calculateEFW, calculatePercentile, calculateGestationalAge } from '../../../services/obstetricsService';

interface FetalGrowthChartProps {
  pregnancyId: string;
  lmpDate?: string;
}

const FetalGrowthChart: React.FC<FetalGrowthChartProps> = ({ pregnancyId, lmpDate }) => {
  const [scans, setScans] = useState<BiometryScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    scan_date: new Date().toISOString().split('T')[0],
    bpd_mm: '',
    hc_mm: '',
    ac_mm: '',
    fl_mm: '',
    notes: '',
  });

  useEffect(() => {
    fetchScans();
  }, [pregnancyId]);

  const fetchScans = async () => {
    try {
      setIsLoading(true);
      const data = await obstetricsService.getBiometryScans(pregnancyId);
      setScans(data || []);
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast.error('فشل تحميل المسح البيوميتري');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScan = async () => {
    try {
      if (!formData.scan_date || !formData.bpd_mm || !formData.hc_mm || !formData.ac_mm || !formData.fl_mm) {
        toast.error('جميع الحقول مطلوبة');
        return;
      }

      setIsSaving(true);

      const bpd = parseFloat(formData.bpd_mm);
      const hc = parseFloat(formData.hc_mm);
      const ac = parseFloat(formData.ac_mm);
      const fl = parseFloat(formData.fl_mm);

      let ga = { weeks: 20, days: 0 };
      if (lmpDate && formData.scan_date) {
        try {
          const lmpTimestamp = new Date(lmpDate).getTime();
          const scanTimestamp = new Date(formData.scan_date).getTime();
          if (!isNaN(lmpTimestamp) && !isNaN(scanTimestamp)) {
            const diffTime = Math.abs(scanTimestamp - lmpTimestamp);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            ga = { weeks: Math.max(0, Math.floor(diffDays / 7)), days: Math.max(0, diffDays % 7) };
          }
        } catch (err) {
          console.warn('Error calculating GA:', err);
          ga = { weeks: 20, days: 0 };
        }
      }

      if (isNaN(bpd) || isNaN(hc) || isNaN(ac) || isNaN(fl) || bpd <= 0 || hc <= 0 || ac <= 0 || fl <= 0) {
        toast.error('جميع القياسات يجب أن تكون أرقام موجبة');
        setIsSaving(false);
        return;
      }

      const efw = calculateEFW(bpd, hc, ac, fl);
      const percentile = calculatePercentile(efw, ga.weeks);

      if (!efw || efw === 0) {
        toast.error('فشل حساب وزن الجنين المقدر. تحقق من القياسات');
        setIsSaving(false);
        return;
      }

      const scanData = {
        scan_date: formData.scan_date,
        bpd_mm: Math.max(0, bpd),
        hc_mm: Math.max(0, hc),
        ac_mm: Math.max(0, ac),
        fl_mm: Math.max(0, fl),
        efw_grams: Math.max(0, efw),
        percentile: Math.max(0, Math.round(percentile)),
        pregnancy_id: pregnancyId,
        gestational_age_weeks: Math.max(0, ga.weeks),
        gestational_age_days: Math.max(0, ga.days),
        notes: formData.notes?.trim() || '',
      };

      if (editingId) {
        await obstetricsService.updateBiometryScan(editingId, scanData);
        toast.success('تم تحديث المسح بنجاح');
      } else {
        await obstetricsService.createBiometryScan(scanData);
        toast.success('تم إضافة المسح بنجاح');
      }

      fetchScans();
      resetForm();
    } catch (error) {
      console.error('Error saving scan:', error);
      toast.error('فشل حفظ المسح');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسح؟')) return;

    try {
      await obstetricsService.deleteBiometryScan(scanId);
      toast.success('تم حذف المسح بنجاح');
      fetchScans();
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast.error('فشل حذف المسح');
    }
  };

  const handleEditScan = (scan: BiometryScan) => {
    setFormData({
      scan_date: scan.scan_date,
      bpd_mm: scan.bpd_mm?.toString() || '',
      hc_mm: scan.hc_mm?.toString() || '',
      ac_mm: scan.ac_mm?.toString() || '',
      fl_mm: scan.fl_mm?.toString() || '',
      notes: scan.notes || '',
    });
    setEditingId(scan.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      scan_date: new Date().toISOString().split('T')[0],
      bpd_mm: '',
      hc_mm: '',
      ac_mm: '',
      fl_mm: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const chartData = scans && Array.isArray(scans)
    ? scans
        .slice()
        .reverse()
        .map((scan, idx) => {
          try {
            const gaWeeks = Number(scan?.gestational_age_weeks) || 20;
            return {
              name: `${gaWeeks}w`,
              efw: Number(scan?.efw_grams) || 0,
              p10: getP10(gaWeeks),
              p50: getP50(gaWeeks),
              p90: getP90(gaWeeks),
              percentile: Number(scan?.percentile) || 50,
            };
          } catch (err) {
            console.warn('Error mapping scan data:', err);
            return { name: '20w', efw: 0, p10: 0, p50: 0, p90: 0, percentile: 50 };
          }
        })
    : [];

  const getP10 = (weeks: number): number => {
    const weights: { [key: number]: number } = {
      20: 300, 22: 430, 24: 600, 26: 760, 28: 1000, 30: 1300, 32: 1600, 34: 2100, 36: 2600, 38: 3000, 40: 3200,
    };
    return weights[weeks] || 0;
  };

  const getP50 = (weeks: number): number => {
    const weights: { [key: number]: number } = {
      20: 330, 22: 475, 24: 660, 26: 850, 28: 1100, 30: 1440, 32: 1840, 34: 2450, 36: 3000, 38: 3400, 40: 3500,
    };
    return weights[weeks] || 0;
  };

  const getP90 = (weeks: number): number => {
    const weights: { [key: number]: number } = {
      20: 370, 22: 540, 24: 750, 26: 980, 28: 1270, 30: 1680, 32: 2150, 34: 2850, 36: 3500, 38: 3900, 40: 3900,
    };
    return weights[weeks] || 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 font-[Tajawal]">👶 مخطط نمو الجنين</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-[Tajawal] font-semibold transition-colors"
        >
          <Plus size={18} />
          إضافة مسح
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-teal-200">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                تاريخ المسح
              </label>
              <input
                type="date"
                value={formData.scan_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scan_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                BPD (Biparietal Diameter) - ملم
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.bpd_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, bpd_mm: e.target.value }))}
                placeholder="مثال: 54.2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                HC (Head Circumference) - ملم
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.hc_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, hc_mm: e.target.value }))}
                placeholder="مثال: 285"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                AC (Abdominal Circumference) - ملم
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.ac_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, ac_mm: e.target.value }))}
                placeholder="مثال: 254"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                FL (Femur Length) - ملم
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.fl_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, fl_mm: e.target.value }))}
                placeholder="مثال: 68"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
                ملاحظات
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddScan}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-[Tajawal] font-semibold transition-colors"
            >
              <Save size={18} />
              {isSaving ? 'جاري الحفظ...' : editingId ? 'تحديث المسح' : 'إضافة المسح'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-[Tajawal] font-semibold transition-colors"
            >
              <X size={18} />
              إلغاء
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : scans.length > 0 ? (
        <>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-[Tajawal]">
              📊 <strong>الخطوط المرجعية (RCOG/NICE):</strong> الخط الأخضر = 10th percentile (الحد الأدنى الطبيعي)، الأزرق = 50th (المتوسط)، الأحمر = 90th (الحد الأعلى)
            </p>
          </div>

          <div className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'الوزن (جرام)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: any) => `${value.toLocaleString()} g`}
                  labelFormatter={(label) => `أسابيع: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p10"
                  stroke="#16a34a"
                  strokeDasharray="5 5"
                  name="10th Percentile"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  name="50th Percentile"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="p90"
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  name="90th Percentile"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="efw"
                  stroke="#14b8a6"
                  name="وزن الجنين المقدر (EFW)"
                  strokeWidth={2}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-[Tajawal]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-right">التاريخ</th>
                  <th className="px-4 py-2 text-right">GA</th>
                  <th className="px-4 py-2 text-right">BPD</th>
                  <th className="px-4 py-2 text-right">HC</th>
                  <th className="px-4 py-2 text-right">AC</th>
                  <th className="px-4 py-2 text-right">FL</th>
                  <th className="px-4 py-2 text-right">EFW</th>
                  <th className="px-4 py-2 text-right">النسبة المئوية</th>
                  <th className="px-4 py-2 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(scans) && scans.map((scan) => {
                  try {
                    if (!scan || !scan.id) return null;
                    const scanDate = scan?.scan_date ? new Date(scan.scan_date).toLocaleDateString('ar-EG') : '-';
                    const gaWeeks = Number(scan?.gestational_age_weeks) || 0;
                    const gaDays = Number(scan?.gestational_age_days) || 0;
                    const efwGrams = Number(scan?.efw_grams) || 0;
                    const percentile = Number(scan?.percentile) || 50;

                    return (
                      <tr key={scan.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{scanDate}</td>
                        <td className="px-4 py-2">{gaWeeks}w+{gaDays}d</td>
                        <td className="px-4 py-2">{scan?.bpd_mm || '-'} ملم</td>
                        <td className="px-4 py-2">{scan?.hc_mm || '-'} ملم</td>
                        <td className="px-4 py-2">{scan?.ac_mm || '-'} ملم</td>
                        <td className="px-4 py-2">{scan?.fl_mm || '-'} ملم</td>
                        <td className="px-4 py-2 font-bold text-teal-700">
                          {efwGrams > 0 ? efwGrams.toLocaleString() : '-'} g
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              percentile < 10
                                ? 'bg-red-100 text-red-800'
                                : percentile > 90
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {percentile}th
                          </span>
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleEditScan(scan)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            تحرير
                          </button>
                          <button
                            onClick={() => handleDeleteScan(scan.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  } catch (err) {
                    console.warn('Error rendering scan row:', err);
                    return null;
                  }
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 py-8 font-[Tajawal]">لا توجد مسوحات بيوميترية حتى الآن</p>
      )}
    </div>
  );
};

export default FetalGrowthChart;
