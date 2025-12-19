import React, { useState, useEffect } from 'react';
import { ivfCycleService, MonitoringVisitData } from '../../services/ivfCycleService';
import { Calendar, TrendingUp, Activity, Plus, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface MonitoringDashboardProps {
    cycleId: string;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ cycleId }) => {
    const [visits, setVisits] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVisit, setNewVisit] = useState<Partial<MonitoringVisitData>>({
        cycle_id: cycleId,
        visit_date: new Date().toISOString().split('T')[0],
        follicles_right: [],
        follicles_left: [],
    });

    useEffect(() => {
        loadVisits();
    }, [cycleId]);

    const loadVisits = async () => {
        const { data } = await ivfCycleService.getMonitoringVisits(cycleId);
        if (data) setVisits(data);
    };

    const handleAddVisit = async () => {
        try {
            const { error } = await ivfCycleService.addMonitoringVisit(newVisit as MonitoringVisitData);
            if (error) throw error;

            toast.success('تم إضافة الزيارة بنجاح');
            setShowAddForm(false);
            loadVisits();
            setNewVisit({
                cycle_id: cycleId,
                visit_date: new Date().toISOString().split('T')[0],
                follicles_right: [],
                follicles_left: [],
            });
        } catch (error) {
            toast.error('فشل إضافة الزيارة');
        }
    };

    const chartData = visits.map(v => ({
        day: `D${v.cycle_day}`,
        E2: v.e2 || 0,
        LH: v.lh || 0,
        Endo: v.endometrium_thickness || 0,
        Follicles: v.total_follicles || 0,
    }));

    return (
        <div className="space-y-6" dir="rtl">
            {/* Charts */}
            {visits.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hormones Chart */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">الهرمونات</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="E2" stroke="#ef4444" name="E2 (pg/mL)" />
                                <Line type="monotone" dataKey="LH" stroke="#3b82f6" name="LH (mIU/mL)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Follicles & Endo Chart */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">الحويصلات والبطانة</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Follicles" stroke="#10b981" name="عدد الحويصلات" />
                                <Line type="monotone" dataKey="Endo" stroke="#8b5cf6" name="البطانة (mm)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Add Visit Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    إضافة زيارة متابعة
                </button>
            </div>

            {/* Add Visit Form */}
            {showAddForm && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">زيارة متابعة جديدة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                            <input
                                type="date"
                                value={newVisit.visit_date}
                                onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">يوم الدورة</label>
                            <input
                                type="number"
                                value={newVisit.cycle_day || ''}
                                onChange={(e) => setNewVisit({ ...newVisit, cycle_day: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">E2 (pg/mL)</label>
                            <input
                                type="number"
                                value={newVisit.e2 || ''}
                                onChange={(e) => setNewVisit({ ...newVisit, e2: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">LH (mIU/mL)</label>
                            <input
                                type="number"
                                value={newVisit.lh || ''}
                                onChange={(e) => setNewVisit({ ...newVisit, lh: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">سُمك البطانة (mm)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newVisit.endometrium_thickness || ''}
                                onChange={(e) => setNewVisit({ ...newVisit, endometrium_thickness: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">نمط البطانة</label>
                            <select
                                value={newVisit.endometrium_pattern || ''}
                                onChange={(e) => setNewVisit({ ...newVisit, endometrium_pattern: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">اختر...</option>
                                <option value="trilaminar">Trilaminar</option>
                                <option value="homogeneous">Homogeneous</option>
                                <option value="irregular">Irregular</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                        <textarea
                            value={newVisit.notes || ''}
                            onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleAddVisit}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            <Save className="w-4 h-4" />
                            حفظ
                        </button>
                    </div>
                </div>
            )}

            {/* Visits Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">اليوم</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">E2</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">LH</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">البطانة</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحويصلات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {visits.map((visit) => (
                                <tr key={visit.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{new Date(visit.visit_date).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-4 py-3 text-sm">D{visit.cycle_day}</td>
                                    <td className="px-4 py-3 text-sm">{visit.e2 || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{visit.lh || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{visit.endometrium_thickness || '-'} mm</td>
                                    <td className="px-4 py-3 text-sm">{visit.total_follicles || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonitoringDashboard;
