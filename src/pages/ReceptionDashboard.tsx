import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Calendar, Clock, CheckCircle } from 'lucide-react';
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

    // Load appointments for today
    const loadAppointments = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const data = await appointmentService.getAppointments(today);
            setAppointments(data);
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const handleCheckIn = async (appointmentId: string) => {
        try {
            await appointmentService.updateStatus(appointmentId, 'Waiting');
            toast.success('Patient checked in');
            loadAppointments(); // Refresh list
        } catch (error) {
            toast.error('Failed to check in patient');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
                    <p className="text-gray-500">
                        Today's Schedule: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowRegisterPatientModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <UserPlus size={18} />
                        Register Patient
                    </button>
                    <button
                        onClick={() => setShowNewAppointmentModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        New Appointment
                    </button>
                </div>
            </div>

            {/* Today's Schedule Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-900">Today's Appointments</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading schedule...</div>
                ) : appointments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No appointments scheduled for today.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Patient</th>
                                    <th className="px-6 py-3">Visit Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                {apt.appointment_date ? new Date(apt.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{apt.patient?.name}</div>
                                            <div className="text-xs text-gray-500">{apt.patient?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apt.visit_type === 'Consultation' ? 'bg-blue-50 text-blue-700' :
                                                apt.visit_type === 'Procedure' ? 'bg-purple-50 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {apt.visit_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apt.status === 'Scheduled' ? 'bg-yellow-50 text-yellow-700' :
                                                apt.status === 'Waiting' ? 'bg-green-50 text-green-700' :
                                                    apt.status === 'Completed' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-red-50 text-red-700'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {apt.status === 'Scheduled' && (
                                                <button
                                                    onClick={() => handleCheckIn(apt.id)}
                                                    className="text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1 rounded-md transition-colors font-medium"
                                                >
                                                    Check In
                                                </button>
                                            )}
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
                        // Optionally open appointment modal or pre-fill it
                    }}
                    addPatient={addPatient}
                />
            )}
        </div>
    );
};

// -- Sub-components (could receive their own files, but keeping single-file as per task structure ease) --

// New Appointment Modal
const NewAppointmentModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
    patients: any[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}> = ({ onClose, onSuccess, patients, searchQuery, setSearchQuery }) => {
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'Consultation' as const,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) {
            toast.error('Please select a patient');
            return;
        }

        setSubmitting(true);
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                toast.error("Not authenticated");
                return;
            }

            const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
            if (!doctor) {
                toast.error("Doctor profile missing");
                return;
            }

            // Combine date and time
            const datetime = `${formData.date}T${formData.time}:00`;

            await appointmentService.createAppointment({
                patient_id: selectedPatientId,
                doctor_id: doctor.id, // Assigning to current logged in doctor/user context
                appointment_date: datetime,
                status: 'Scheduled',
                visit_type: formData.type,
                notes: formData.notes
            });

            toast.success('Appointment scheduled');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule appointment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">New Appointment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                        <input
                            type="text"
                            placeholder="Search patient name..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none mb-2"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* Simple dropdown for selection - filtering handled by usePatients hook via searchQuery */}
                        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50">
                            {patients.length > 0 ? (
                                patients.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedPatientId(p.id);
                                            setSearchQuery(p.name); // Updates input to show name
                                        }}
                                        className={`px-4 py-2 cursor-pointer hover:bg-teal-50 text-sm ${selectedPatientId === p.id ? 'bg-teal-100 text-teal-800 font-medium' : 'text-gray-700'}`}
                                    >
                                        {p.name} <span className="text-gray-400 text-xs">({p.phone})</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-gray-400 text-sm">No patients found</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        >
                            <option value="Consultation">Consultation</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Procedure">Procedure</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-20 resize-none"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !selectedPatientId}
                            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Scheduling...' : 'Schedule'}
                        </button>
                    </div>
                </form>
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
            if (!user) throw new Error("Not authenticated");

            const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');

            await addPatient({
                name: formData.name,
                phone: formData.phone,
                age: parseInt(formData.age) || 0,
                doctor_id: doctor?.id
            });
            onSuccess(formData.name);
        } catch (error) {
            console.error(error);
            toast.error('Failed to register patient');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">New Patient Registration</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="010xxxxxxxx"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Age"
                            value={formData.age}
                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50"
                        >
                            {submitting ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceptionDashboard;
