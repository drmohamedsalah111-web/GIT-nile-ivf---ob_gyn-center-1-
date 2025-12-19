import React, { useState, useEffect } from 'react';
import { ivfCycleService, AssessmentData } from '../../services/ivfCycleService';
import { User, Activity, Heart, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssessmentFormProps {
    cycleId: string;
    onSave?: () => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ cycleId, onSave }) => {
    const [assessment, setAssessment] = useState<Partial<AssessmentData>>({
        cycle_id: cycleId,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAssessment();
    }, [cycleId]);

    const loadAssessment = async () => {
        try {
            setLoading(true);
            const { data, error } = await ivfCycleService.getAssessment(cycleId);
            if (error) throw error;
            if (data) setAssessment(data);
        } catch (error) {
            console.error('Error loading assessment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await ivfCycleService.saveAssessment(assessment as AssessmentData);
            if (error) throw error;

            toast.success('تم حفظ التقييم بنجاح');
            if (onSave) onSave();
        } catch (error: any) {
            console.error('Error saving assessment:', error);
            toast.error('فشل حفظ التقييم');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof AssessmentData, value: any) => {
        setAssessment(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Female Assessment */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-pink-600" />
                    <h3 className="text-xl font-bold text-gray-900">تقييم الزوجة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">العمر</label>
                        <input
                            type="number"
                            value={assessment.female_age || ''}
                            onChange={(e) => updateField('female_age', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="سنة"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">BMI</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.female_bmi || ''}
                            onChange={(e) => updateField('female_bmi', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="kg/m²"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AMH</label>
                        <input
                            type="number"
                            step="0.01"
                            value={assessment.amh || ''}
                            onChange={(e) => updateField('amh', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="ng/mL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AFC يمين</label>
                        <input
                            type="number"
                            value={assessment.afc_right || ''}
                            onChange={(e) => updateField('afc_right', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AFC يسار</label>
                        <input
                            type="number"
                            value={assessment.afc_left || ''}
                            onChange={(e) => updateField('afc_left', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">FSH</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.fsh || ''}
                            onChange={(e) => updateField('fsh', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="mIU/mL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LH</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.lh || ''}
                            onChange={(e) => updateField('lh', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="mIU/mL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">E2</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.e2 || ''}
                            onChange={(e) => updateField('e2', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="pg/mL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">احتياطي المبيض</label>
                        <select
                            value={assessment.ovarian_reserve || ''}
                            onChange={(e) => updateField('ovarian_reserve', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">اختر...</option>
                            <option value="poor">ضعيف</option>
                            <option value="normal">طبيعي</option>
                            <option value="high">عالي</option>
                            <option value="pcos">PCOS</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Male Assessment */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">تقييم الزوج</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">العدد (Count)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.sperm_count || ''}
                            onChange={(e) => updateField('sperm_count', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="million/mL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الحركة (Motility)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.motility || ''}
                            onChange={(e) => updateField('motility', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="%"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الحركة التقدمية</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.progressive_motility || ''}
                            onChange={(e) => updateField('progressive_motility', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="%"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الشكل (Morphology)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.morphology || ''}
                            onChange={(e) => updateField('morphology', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="%"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">TMSC</label>
                        <input
                            type="number"
                            step="0.1"
                            value={assessment.tmsc || ''}
                            onChange={(e) => updateField('tmsc', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="million"
                        />
                    </div>
                </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Heart className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">التشخيص</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع العقم</label>
                        <select
                            value={assessment.infertility_type || ''}
                            onChange={(e) => updateField('infertility_type', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">اختر...</option>
                            <option value="primary">أولي</option>
                            <option value="secondary">ثانوي</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">مدة العقم (شهور)</label>
                        <input
                            type="number"
                            value={assessment.infertility_duration || ''}
                            onChange={(e) => updateField('infertility_duration', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">محاولات IVF سابقة</label>
                        <input
                            type="number"
                            value={assessment.previous_ivf_cycles || ''}
                            onChange={(e) => updateField('previous_ivf_cycles', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">حمل سابق</label>
                        <input
                            type="number"
                            value={assessment.previous_pregnancies || ''}
                            onChange={(e) => updateField('previous_pregnancies', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ولادة حية سابقة</label>
                        <input
                            type="number"
                            value={assessment.previous_live_births || ''}
                            onChange={(e) => updateField('previous_live_births', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                    <textarea
                        value={assessment.notes || ''}
                        onChange={(e) => updateField('notes', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="أي ملاحظات إضافية..."
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'جاري الحفظ...' : 'حفظ التقييم'}
                </button>
            </div>
        </div>
    );
};

export default AssessmentForm;
