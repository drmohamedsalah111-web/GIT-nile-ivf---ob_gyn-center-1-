import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Calendar, Clock, CheckCircle, Smartphone, Hash, X, RefreshCw, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentService } from '../services/appointmentService';
import { usePatients } from '../hooks/usePatients';
import { Appointment } from '../../types';
import { authService } from '../../services/authService';

const ReceptionDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
    const [showRegisterPatientModal, setShowRegisterPatientModal] = useState(false);
    const { patients, addPatient, searchQuery, setSearchQuery } = usePatients();

    // Stats
    const stats = {
        total: appointments.length,
        waiting: appointments.filter(a => a.status === 'Waiting').length,
        completed: appointments.filter(a => a.status === 'Completed').length
    };

    // Load appointments for today
    const loadAppointments = async () => {
        try {
            // Don't set loading true on refresh if we already have data to avoid flicker
            if (appointments.length === 0) setLoading(true);

            const today = new Date().toISOString().split('T')[0];
            const data = await appointmentService.getAppointments(today);
            setAppointments(data);
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('Failed to reload schedule');
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
    }, []);

    const handleStatusUpdate = async (appointmentId: string, newStatus: any) => {
        try {
            await appointmentService.updateStatus(appointmentId, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            loadAppointments(); // Refresh list immediately
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <h1 className="text-2xl font-bold text-gray-900">Reception</h1>
                    <p className="text-gray-500 text-sm">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
                    <span className="text-gray-500 text-xs uppercase font-semibold">Total Today</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center border-l-4 border-l-green-500">
                    <span className="text-green-600 text-xs uppercase font-semibold">Waiting Now</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.waiting}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center border-l-4 border-l-blue-500">
                    <span className="text-blue-600 text-xs uppercase font-semibold">Completed</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    Today's Schedule
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={loadAppointments}
                        className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => setShowRegisterPatientModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        <UserPlus size={16} />
                        Quick Register
                    </button>
                    <button
                        onClick={() => setShowNewAppointmentModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        New Appointment
                    </button>
                </div>
            </div>

            {/* Today's Schedule Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading && appointments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Loading schedule...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No appointments today</h3>
                        <p className="text-sm">Click "New Appointment" to schedule a visit.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Visit Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                {apt.appointment_date ? new Date(apt.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{apt.patient?.name}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Smartphone size={10} />
                                                    {apt.patient?.phone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${apt.visit_type === 'Consultation' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                apt.visit_type === 'Procedure' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                    'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}>
                                                {apt.visit_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={apt.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {apt.status === 'Scheduled' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(apt.id, 'Waiting')}
                                                            className="text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 shadow-sm"
                                                        >
                                                            <CheckCircle size={12} />
                                                            Check In
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(apt.id, 'Cancelled')}
                                                            className="text-xs bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {apt.status === 'Waiting' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(apt.id, 'Completed')} // Normally doctor does this, but for dev/demo receptionist might need ability
                                                        className="text-xs bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg cursor-not-allowed"
                                                        title="Doctor will complete"
                                                    >
                                                        Waiting...
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
