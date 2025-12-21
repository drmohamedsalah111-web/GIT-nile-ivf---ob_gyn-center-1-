import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Calendar, Clock, CheckCircle, Smartphone, Hash, X, RefreshCw, User, Activity, TrendingUp, XCircle, AlertCircle, Users, ArrowUp, ArrowDown, Bell, Search, Filter, Download, MoreVertical, Eye, Edit, Trash2, Phone, Mail, MapPin, FileText, ChevronRight, Stethoscope, HeartPulse, CalendarCheck, ClipboardList } from 'lucide-react';
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
    todayRevenue?: number;
    completionRate?: number;
}

const ReceptionDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
    const [showRegisterPatientModal, setShowRegisterPatientModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week'>('today');
    const { patients, addPatient, searchQuery, setSearchQuery } = usePatients();
    const [doctorName, setDoctorName] = useState<string>('الطبيب');

    // Enhanced Stats with animations
    const [stats, setStats] = useState<Stats>({
        todayTotal: 0,
        todayCompleted: 0,
        todayPending: 0,
        todayCancelled: 0,
        totalPatients: 0,
        weeklyAppointments: 0,
        todayRevenue: 0,
        completionRate: 0
    });
    const [previousStats, setPreviousStats] = useState<Stats>({
        todayTotal: 0,
        todayCompleted: 0,
        todayPending: 0,
        todayCancelled: 0,
        totalPatients: 0,
        weeklyAppointments: 0,
        todayRevenue: 0,
        completionRate: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Load appointments based on filter
    const loadAppointments = async () => {
        try {
            if (appointments.length === 0) setLoading(true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let data = [];
            let yesterdayData = [];
            
            // Get current user and doctor info
            const user = await authService.getCurrentUser();
            let doctorId = null;
            
            if (user) {
                const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
                doctorId = doctor?.id;
                
                // Set doctor name from database
                if (doctor?.name) {
                    setDoctorName(doctor.name);
                } else if (user.email) {
                    setDoctorName(user.email.split('@')[0]);
                }
            }
            
            if (selectedFilter === 'today') {
                // Fetch today's appointments
                const dateFilter = today.toISOString().split('T')[0];
                data = await appointmentService.getAppointments(dateFilter);
                
                // Fetch yesterday's data for comparison
                const yesterdayFilter = yesterday.toISOString().split('T')[0];
                try {
                    yesterdayData = await appointmentService.getAppointments(yesterdayFilter);
                } catch (e) {
                    console.log('Could not fetch yesterday data for comparison');
                }
            } else if (selectedFilter === 'week') {
                // Fetch all appointments and filter for this week
                if (doctorId) {
                    data = await appointmentService.getAllDoctorAppointments(doctorId);
                    
                    // Filter for this week
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    data = data.filter(apt => {
                        const aptDate = new Date(apt.appointment_date);
                        return aptDate >= today && aptDate <= weekEnd;
                    });
                }
            } else if (selectedFilter === 'all') {
                // Fetch all appointments
                if (doctorId) {
                    data = await appointmentService.getAllDoctorAppointments(doctorId);
                }
            }
            
            setAppointments(data);
            
            // Calculate enhanced stats
            const todayAppointments = data.filter(app => {
                const appDate = new Date(app.appointment_date);
                return appDate.toDateString() === today.toDateString();
            });
            
            const yesterdayAppointments = yesterdayData.filter(app => {
                const appDate = new Date(app.appointment_date);
                return appDate.toDateString() === yesterday.toDateString();
            });

            const completed = todayAppointments.filter(a => a.status === 'Completed').length;
            const total = todayAppointments.length;
            const pending = todayAppointments.filter(a => a.status === 'Waiting' || a.status === 'Scheduled').length;
            const cancelled = todayAppointments.filter(a => a.status === 'Cancelled').length;
            const totalPatients = new Set(data.map(a => a.patient_id)).size;
            
            // Calculate previous stats for comparison
            const yesterdayTotal = yesterdayAppointments.length;
            const yesterdayCompleted = yesterdayAppointments.filter(a => a.status === 'Completed').length;
            
            const newStats = {
                todayTotal: total,
                todayCompleted: completed,
                todayPending: pending,
                todayCancelled: cancelled,
                totalPatients: totalPatients,
                weeklyAppointments: data.length,
                todayRevenue: completed * 500, // Example calculation
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
            
            setPreviousStats({
                todayTotal: yesterdayTotal,
                todayCompleted: yesterdayCompleted,
                todayPending: 0,
                todayCancelled: 0,
                totalPatients: 0,
                weeklyAppointments: 0,
                todayRevenue: 0,
                completionRate: 0
            });
            
            setStats(newStats);
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
    }, [selectedFilter]); // Re-fetch when filter changes

    const handleStatusUpdate = async (appointmentId: string, newStatus: any) => {
        try {
            await appointmentService.updateStatus(appointmentId, newStatus);
            
            // Show appropriate Arabic message
            const statusMessages: { [key: string]: string } = {
                'Waiting': 'تم تسجيل حضور المريض',
                'Completed': 'تم إكمال الموعد',
                'Cancelled': 'تم إلغاء الموعد',
                'Scheduled': 'تم جدولة الموعد'
            };
            
            toast.success(statusMessages[newStatus] || `تم تحديث الحالة إلى ${newStatus}`);
            
            // Reload appointments to reflect changes
            await loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
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
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    // Filter appointments by search
    const filteredAppointments = appointments.filter(apt => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const patientName = apt.patient?.name?.toLowerCase() || '';
        const patientPhone = apt.patient?.phone || '';
        const visitType = apt.visit_type?.toLowerCase() || '';
        
        return patientName.includes(searchLower) ||
               patientPhone.includes(searchTerm) ||
               visitType.includes(searchLower);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8" dir="rtl">
            {/* Modern Header with Glass Effect */}
            <div className="mb-8 backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h- جبر20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                                <Stethoscope className="w-10 h-10 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent mb-1">
                                مرحباً {doctorName}
                            </h1>
                            <p className="text-gray-600 text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="relative p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                            <Bell className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                3
                            </span>
                        </button>
                        <button className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* World-Class Stats Cards with Advanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1 - Total Today */}
                <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-7 h-7 text-white" />
                            </div>
                            {stats.todayTotal > 0 && previousStats.todayTotal > 0 && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-teal-50 rounded-full">
                                    {stats.todayTotal > previousStats.todayTotal ? (
                                        <>
                                            <ArrowUp className="w-3 h-3 text-teal-600" />
                                            <span className="text-xs font-bold text-teal-600">
                                                +{Math.round(((stats.todayTotal - previousStats.todayTotal) / previousStats.todayTotal) * 100)}%
                                            </span>
                                        </>
                                    ) : stats.todayTotal < previousStats.todayTotal ? (
                                        <>
                                            <ArrowDown className="w-3 h-3 text-red-600" />
                                            <span className="text-xs font-bold text-red-600">
                                                {Math.round(((stats.todayTotal - previousStats.todayTotal) / previousStats.todayTotal) * 100)}%
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-600">0%</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">إجمالي اليوم</h3>
                        <p className="text-4xl font-black text-gray-800 mb-1">{stats.todayTotal}</p>
                        <p className="text-xs text-gray-500">موعد مجدول</p>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
                </div>

                {/* Card 2 - Completed */}
                <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <CheckCircle className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full">
                                <span className="text-xs font-bold text-green-600">{stats.completionRate}%</span>
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">المكتملة</h3>
                        <p className="text-4xl font-black text-gray-800 mb-1">{stats.todayCompleted}</p>
                        <p className="text-xs text-gray-500">من {stats.todayTotal} موعد</p>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                </div>

                {/* Card 3 - Pending */}
                <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">قيد الانتظار</h3>
                        <p className="text-4xl font-black text-gray-800 mb-1">{stats.todayPending}</p>
                        <p className="text-xs text-gray-500">في الانتظار</p>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                </div>

                {/* Card 4 - Total Patients */}
                <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            {stats.totalPatients > 0 && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
                                    <Activity className="w-3 h-3 text-blue-600" />
                                    <span className="text-xs font-bold text-blue-600">نشط</span>
                                </div>
                            )}
                        </div>
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">إجمالي المرضى</h3>
                        <p className="text-4xl font-black text-gray-800 mb-1">{stats.totalPatients}</p>
                        <p className="text-xs text-gray-500">مريض مسجل</p>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                </div>
            </div>

            {/* Advanced Filters and Actions Bar */}
            <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search Bar */}
                    <div className="flex-1 w-full lg:w-auto">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="ابحث عن مريض، رقم تليفون، أو نوع الزيارة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-gray-700 font-medium"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setSelectedFilter('today')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                selectedFilter === 'today'
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <CalendarCheck className="w-4 h-4 inline-block ml-1" />
                            اليوم
                        </button>
                        <button
                            onClick={() => setSelectedFilter('week')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                selectedFilter === 'week'
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            هذا الأسبوع
                        </button>
                        <button
                            onClick={() => setSelectedFilter('all')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                selectedFilter === 'all'
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            الكل
                        </button>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={loadAppointments}
                            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all hover:scale-110 hover:rotate-180 duration-500"
                            title="تحديث"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={() => setShowRegisterPatientModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-teal-500 hover:text-teal-600 hover:shadow-lg transition-all font-bold text-sm hover:scale-105"
                        >
                            <UserPlus size={18} />
                            تسجيل سريع
                        </button>
                        <button
                            onClick={() => setShowNewAppointmentModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-2xl transition-all shadow-lg font-bold text-sm hover:scale-105"
                        >
                            <Plus size={18} />
                            موعد جديد
                        </button>
                    </div>
                </div>
            </div>

            {/* World-Class Appointments List */}
            <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                {/* Header with Gradient */}
                <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-10 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl">
                                <ClipboardList className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white mb-1">
                                    المواعيد والحجوزات
                                </h2>
                                <p className="text-white/80 text-sm">
                                    {filteredAppointments.length} من {appointments.length} موعد
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl px-4 py-2 rounded-xl">
                            <HeartPulse className="w-5 h-5 text-white animate-pulse" />
                            <span className="text-white font-bold">مباشر</span>
                        </div>
                    </div>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Calendar className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد مواعيد</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد مواعيد محجوزة في هذه الفترة'}
                        </p>
                        {!searchTerm && (
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowRegisterPatientModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-bold text-sm"
                                >
                                    <UserPlus size={18} />
                                    تسجيل مريض جديد
                                </button>
                                <button
                                    onClick={() => setShowNewAppointmentModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm"
                                >
                                    <Plus size={18} />
                                    حجز موعد جديد
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {filteredAppointments.map((appointment, index) => (
                            <div
                                key={appointment.id}
                                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 hover:border-teal-300 transition-all duration-500 overflow-hidden hover:shadow-2xl"
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animation: 'slideIn 0.5s ease-out forwards'
                                }}
                            >
                                {/* Hover Gradient Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-cyan-500/0 to-blue-500/0 group-hover:from-teal-500/5 group-hover:via-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-500"></div>
                                
                                <div className="relative p-6">
                                    <div className="flex items-start justify-between gap-6">
                                        {/* Patient Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                        <User className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-800 mb-1">
                                                        {appointment.patient?.name || 'مريض'}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {appointment.patient?.phone || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">التاريخ</p>
                                                        <p className="text-sm font-bold text-gray-800">
                                                            {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                                    <Clock className="w-4 h-4 text-purple-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">الوقت</p>
                                                        <p className="text-sm font-bold text-gray-800">
                                                            {appointment.appointment_date ? formatTime(appointment.appointment_date) : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                                    <Activity className="w-4 h-4 text-orange-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">النوع</p>
                                                        <p className="text-sm font-bold text-gray-800">
                                                            {appointment.visit_type || 'استشارة'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {appointment.notes && (
                                                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 mb-1">ملاحظات</p>
                                                            <p className="text-sm text-gray-700">{appointment.notes}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex flex-col gap-3 items-end">
                                            {/* Status Badge */}
                                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 shadow-lg ${getStatusColor(appointment.status)}`}>
                                                {getStatusIcon(appointment.status)}
                                                <span className="text-sm font-black">
                                                    {appointment.status === 'Completed' && 'مكتمل'}
                                                    {appointment.status === 'Scheduled' && 'مجدول'}
                                                    {appointment.status === 'Waiting' && 'قيد الانتظار'}
                                                    {appointment.status === 'Cancelled' && 'ملغي'}
                                                </span>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-2 w-full">
                                                {appointment.status === 'Scheduled' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(appointment.id, 'Waiting')}
                                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105"
                                                        >
                                                            <CheckCircle size={16} />
                                                            حضر
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
                                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 rounded-xl transition-all font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105"
                                                        >
                                                            <XCircle size={16} />
                                                            إلغاء
                                                        </button>
                                                    </>
                                                )}
                                                {appointment.status === 'Waiting' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
                                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105"
                                                    >
                                                        <CheckCircle size={16} />
                                                        إنهاء
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Accent Line */}
                                <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>
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
