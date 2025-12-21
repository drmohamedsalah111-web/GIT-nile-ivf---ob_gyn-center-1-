import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Calendar, Clock, CheckCircle, Smartphone, Hash, X, RefreshCw, User, Activity, TrendingUp, XCircle, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentService } from '../services/appointmentService';
import { usePatients } from '../hooks/usePatients';
import { Appointment } from '../../types';
import { authService } from '../../services/authService';

interface Stats {
    todayTotal: number;
    todayCompleted: number;
    todayPending: number;
    todayCancelled: number;
    totalPatients: number;
    weeklyAppointments: number;
}

const ReceptionDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
    const [showRegisterPatientModal, setShowRegisterPatientModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week'>('today');
    const { patients, addPatient, searchQuery, setSearchQuery } = usePatients();

    // Enhanced Stats
    const [stats, setStats] = useState<Stats>({
        todayTotal: 0,
        todayCompleted: 0,
        todayPending: 0,
        todayCancelled: 0,
        totalPatients: 0,
        weeklyAppointments: 0
    });

    // Load appointments based on filter
    const loadAppointments = async () => {
        try {
            if (appointments.length === 0) setLoading(true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let dateFilter = today.toISOString().split('T')[0];
            
            if (selectedFilter === 'week') {
                // For weekly view, we'll fetch today and filter in the UI
                // In a real app, you'd pass date range to the service
            } else if (selectedFilter === 'all') {
                // Fetch all appointments (you may want to add a date range limit)
            }

            const data = await appointmentService.getAppointments(dateFilter);
            
            // Filter based on selected filter
            let filteredData = data;
            if (selectedFilter === 'week') {
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + 7);
                filteredData = data.filter(apt => {
                    const aptDate = new Date(apt.appointment_date);
                    return aptDate >= today && aptDate <= weekEnd;
                });
            }
            
            setAppointments(filteredData);
            
            // Calculate enhanced stats
            const todayAppointments = data.filter(app => {
                const appDate = new Date(app.appointment_date);
                return appDate.toDateString() === today.toDateString();
            });

            setStats({
                todayTotal: todayAppointments.length,
                todayCompleted: todayAppointments.filter(a => a.status === 'Completed').length,
                todayPending: todayAppointments.filter(a => a.status === 'Waiting' || a.status === 'Scheduled').length,
                todayCancelled: todayAppointments.filter(a => a.status === 'Cancelled').length,
                totalPatients: new Set(data.map(a => a.patient_id)).size,
                weeklyAppointments: data.length
            });
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('فشل تحميل المواعيد');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();

        // Subscribe to realtime updates
        const subscription = appointmentService.subscribeToAppointments(() => {
            loadAppointments();
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [selectedFilter]);

    const handleStatusUpdate = async (appointmentId: string, newStatus: any) => {
        try {
            await appointmentService.updateStatus(appointmentId, newStatus);
            toast.success(`تم تحديث الحالة إلى ${newStatus}`);
            loadAppointments();
        } catch (error) {
            toast.error('فشل تحديث الحالة');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Scheduled':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Waiting':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'Cancelled':
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    مرحباً د. محمد صلاح
                </h1>
                <p className="text-gray-600 text-lg">
                    لوحة التحكم الطبية - {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-teal-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">إجمالي اليوم</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.todayTotal}</p>
                        </div>
                        <div className="bg-teal-100 p-4 rounded-full">
                            <Calendar className="w-8 h-8 text-teal-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-green-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">المكتملة</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.todayCompleted}</p>
                        </div>
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-yellow-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">قيد الانتظار</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.todayPending}</p>
                        </div>
                        <div className="bg-yellow-100 p-4 rounded-full">
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-blue-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">إجمالي المرضى</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalPatients}</p>
                        </div>
                        <div className="bg-blue-100 p-4 rounded-full">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex justify-between items-center">
                <div className="flex gap-4">
                    <button
                        onClick={() => setSelectedFilter('today')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            selectedFilter === 'today'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        اليوم
                    </button>
                    <button
                        onClick={() => setSelectedFilter('week')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            selectedFilter === 'week'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        هذا الأسبوع
                    </button>
                    <button
                        onClick={() => setSelectedFilter('all')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            selectedFilter === 'all'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        الكل
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={loadAppointments}
                        className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="تحديث"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => setShowRegisterPatientModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        <UserPlus size={16} />
                        تسجيل سريع
                    </button>
                    <button
                        onClick={() => setShowNewAppointmentModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        موعد جديد
                    </button>
                </div>
            </div>

            {/* Appointments List - Professional Design */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-7 h-7" />
                        المواعيد والحجوزات
                    </h2>
                </div>

                {appointments.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد مواعيد محجوزة</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {appointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-teal-100 p-2 rounded-full">
                                                <Users className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {appointment.patient?.name || 'مريض'}
                                                </h3>
                                                <p className="text-sm text-gray-600">{appointment.patient?.phone || '-'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-12">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-4 h-4 text-teal-600" />
                                                <span className="text-sm">{appointment.appointment_date ? formatDate(appointment.appointment_date) : '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Clock className="w-4 h-4 text-teal-600" />
                                                <span className="text-sm">{appointment.appointment_date ? formatTime(appointment.appointment_date) : '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Activity className="w-4 h-4 text-teal-600" />
                                                <span className="text-sm font-medium">{appointment.visit_type || 'استشارة'}</span>
                                            </div>
                                        </div>

                                        {appointment.notes && (
                                            <div className="mt-3 mr-12 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-semibold">ملاحظات: </span>
                                                    {appointment.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 items-end">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getStatusColor(appointment.status)}`}>
                                            {getStatusIcon(appointment.status)}
                                            <span className="text-sm font-semibold">
                                                {appointment.status === 'Completed' && 'مكتمل'}
                                                {appointment.status === 'Scheduled' && 'مجدول'}
                                                {appointment.status === 'Waiting' && 'قيد الانتظار'}
                                                {appointment.status === 'Cancelled' && 'ملغي'}
                                            </span>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        {appointment.status === 'Scheduled' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment.id, 'Waiting')}
                                                    className="text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 shadow-sm"
                                                >
                                                    <CheckCircle size={12} />
                                                    حضر
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
                                                    className="text-xs bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                                >
                                                    إلغاء
                                                </button>
                                            </div>
                                        )}
                                        {appointment.status === 'Waiting' && (
                                            <button
                                                onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
                                                className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                            >
                                                إنهاء
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Appointment Modal */}
            {showNewAppointmentModal && (
                <NewAppointmentModal
                    onClose={() => setShowNewAppointmentModal(false)}
                    onSuccess={() => {
                        setShowNewAppointmentModal(false);
                        loadAppointments();
                    }}
                    onQuickRegister={() => {
                        setShowNewAppointmentModal(false);
                        setShowRegisterPatientModal(true);
                    }}
                    patients={patients}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            )}

            {/* Register Patient Modal */}
            {showRegisterPatientModal && (
                <RegisterPatientModal
                    onClose={() => setShowRegisterPatientModal(false)}
                    onSuccess={(patientName) => {
                        setShowRegisterPatientModal(false);
                        toast.success(`Registered ${patientName}`);
                        // Re-open appointment modal to continue flow
                        setShowNewAppointmentModal(true);
                        setSearchQuery(patientName); // Pre-fill search
                    }}
                    addPatient={addPatient}
                />
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        Scheduled: 'bg-gray-100 text-gray-600',
        Waiting: 'bg-green-100 text-green-700',
        Completed: 'bg-blue-100 text-blue-700',
        Cancelled: 'bg-red-50 text-red-600 line-through decoration-red-600',
        'No Show': 'bg-orange-50 text-orange-600'
    };
    const style = styles[status as keyof typeof styles] || styles.Scheduled;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
            {status}
        </span>
    );
};

// New Appointment Modal
const NewAppointmentModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
    onQuickRegister: () => void;
    patients: any[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}> = ({ onClose, onSuccess, onQuickRegister, patients, searchQuery, setSearchQuery }) => {
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'Consultation' as const,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Auto-select if exact match found (helper)
    useEffect(() => {
        if (patients.length === 1 && patients[0].name.toLowerCase() === searchQuery.toLowerCase()) {
            setSelectedPatientId(patients[0].id);
        }
    }, [patients, searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) {
            toast.error('Please select a patient');
            return;
        }

        setSubmitting(true);
        try {
            const user = await authService.getCurrentUser();
            const doctor = await authService.ensureDoctorRecord(user?.id || 'anon', user?.email || '');

            const datetime = `${formData.date}T${formData.time}:00`;
            await appointmentService.createAppointment({
              patient_id: selectedPatientId,
              doctor_id: doctor?.id,
              appointment_date: datetime,
              status: 'Scheduled',
              visit_type: formData.type,
              notes: formData.notes,
              created_by: user?.id
            });

            toast.success('Appointment scheduled');
            onSuccess();
        } catch (error) {
            toast.error('Failed to schedule');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={20} className="text-teal-600" />
                        New Appointment
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Patient Search Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">1. Find Patient</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedPatientId(''); // Reset selection when searching
                                }}
                                autoFocus
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchQuery && !selectedPatientId && (
                            <div className="mt-2 border border-gray-100 rounded-lg bg-white shadow-sm max-h-48 overflow-y-auto">
                                {patients.length > 0 ? (
                                    patients.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatientId(p.id);
                                                setSearchQuery(p.name);
                                            }}
                                            className="px-4 py-2.5 cursor-pointer hover:bg-teal-50 flex justify-between items-center group transition-colors"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-800 group-hover:text-teal-800">{p.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Smartphone size={10} /> {p.phone}
                                                </div>
                                            </div>
                                            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Select</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500 mb-2">No patient found with that name.</p>
                                        <button
                                            onClick={onQuickRegister}
                                            className="text-sm text-teal-600 font-medium hover:underline flex items-center gap-1 justify-center mx-auto"
                                        >
                                            <UserPlus size={14} /> Register New Patient
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {selectedPatientId && (
                            <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg flex justify-between items-center animate-in fade-in">
                                <div className="flex items-center gap-2">
                                    <div className="bg-teal-100 text-teal-700 p-1.5 rounded-full">
                                        <CheckCircle size={14} />
                                    </div>
                                    <span className="text-sm font-medium text-teal-900">Patient Selected</span>
                                </div>
                                <button onClick={() => { setSelectedPatientId(''); setSearchQuery(''); }} className="text-xs text-teal-600 hover:text-teal-800 underline">Change</button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${!selectedPatientId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">2. Appointment Details</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            required
                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="time"
                                            required
                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Visit Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Consultation', 'Follow-up', 'Procedure'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type as any })}
                                        className={`py-2 px-1 text-sm border rounded-lg transition-all ${formData.type === type
                                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-20 resize-none text-sm"
                                placeholder="Optional notes usually visible to doctor..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !selectedPatientId}
                                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium shadow-sm transition-transform active:scale-95"
                            >
                                {submitting ? 'Confirming...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Register Patient Modal
const RegisterPatientModal: React.FC<{
    onClose: () => void;
    onSuccess: (name: string) => void;
    addPatient: (data: any) => Promise<any>;
}> = ({ onClose, onSuccess, addPatient }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const user = await authService.getCurrentUser();
            const doctor = await authService.ensureDoctorRecord(user?.id || 'anon', user?.email || '');

            await addPatient({
                name: formData.name,
                phone: formData.phone,
                age: parseInt(formData.age) || 0,
                doctor_id: doctor?.id
            });
            onSuccess(formData.name);
        } catch (error) {
            toast.error('Failed to register patient');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus size={20} className="text-teal-600" />
                        Quick Register
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                required
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="tel"
                                required
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="010xxxxxxxx"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="number"
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Optional"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 font-medium shadow-sm transition-transform active:scale-95"
                        >
                            {submitting ? 'Saving...' : 'Save & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceptionDashboard;
