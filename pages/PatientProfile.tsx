import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Calendar, Stethoscope, Loader, AlertCircle, Clock, FileText, FlaskConical, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface PatientData {
  id: string;
  name: string;
  age: number;
  phone: string;
  husband_name?: string;
  history?: string;
  doctor_id: string;
  created_at?: string;
  updated_at?: string;
}

interface DoctorData {
  id: string;
  name: string;
  specialization?: string;
  phone?: string;
}

interface AppointmentForm {
  appointment_date: string;
  appointment_time: string;
  visit_type: 'Consultation' | 'Follow-up' | 'Procedure';
  notes: string;
}

interface LabForm {
  test_names: string[];
  notes: string;
}

interface PatientProfileProps {
  patientId: string;
  onBack?: () => void;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, onBack }) => {

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [submittingLab, setSubmittingLab] = useState(false);

  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    appointment_date: '',
    appointment_time: '09:00',
    visit_type: 'Consultation',
    notes: ''
  });

  const [labForm, setLabForm] = useState<LabForm>({
    test_names: [],
    notes: ''
  });

  const [labTestInput, setLabTestInput] = useState('');

  useEffect(() => {
    fetchPatientAndDoctor();
  }, [patientId]);

  const fetchPatientAndDoctor = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!patientId) {
        setError('Patient ID is missing');
        return;
      }

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      if (!patientData) {
        setError('Patient not found');
        return;
      }

      setPatient(patientData);

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id, name, specialization, phone')
        .eq('id', patientData.doctor_id)
        .single();

      if (doctorError) throw doctorError;
      setDoctor(doctorData);
    } catch (err: any) {
      console.error('❌ Error fetching patient/doctor:', err);
      setError(err.message || 'Failed to load patient data');
      toast.error('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentForm.appointment_date || !appointmentForm.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmittingAppointment(true);
    const toastId = toast.loading('Booking appointment...');

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      const appointmentDateTime = `${appointmentForm.appointment_date}T${appointmentForm.appointment_time}:00`;

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: patientId,
            doctor_id: patient?.doctor_id,
            appointment_date: appointmentDateTime,
            status: 'Scheduled',
            visit_type: appointmentForm.visit_type,
            notes: appointmentForm.notes || null,
            created_by: currentUser.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Appointment booked successfully!', { id: toastId });
      setShowAppointmentModal(false);
      setAppointmentForm({
        appointment_date: '',
        appointment_time: '09:00',
        visit_type: 'Consultation',
        notes: ''
      });
    } catch (err: any) {
      console.error('❌ Error booking appointment:', err);
      toast.error(`Failed to book appointment: ${err.message}`, { id: toastId });
    } finally {
      setSubmittingAppointment(false);
    }
  };

  const addLabTest = () => {
    if (!labTestInput.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    if (labForm.test_names.includes(labTestInput.trim())) {
      toast.error('This test is already added');
      return;
    }

    setLabForm(prev => ({
      ...prev,
      test_names: [...prev.test_names, labTestInput.trim()]
    }));
    setLabTestInput('');
  };

  const removeLabTest = (index: number) => {
    setLabForm(prev => ({
      ...prev,
      test_names: prev.test_names.filter((_, i) => i !== index)
    }));
  };

  const handleRequestLab = async (e: React.FormEvent) => {
    e.preventDefault();

    if (labForm.test_names.length === 0) {
      toast.error('Please add at least one test');
      return;
    }

    setSubmittingLab(true);
    const toastId = toast.loading('Submitting lab request...');

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('lab_requests')
        .insert([
          {
            patient_id: patientId,
            doctor_id: patient?.doctor_id,
            test_names: labForm.test_names,
            status: 'Pending',
            notes: labForm.notes || null,
            created_by: currentUser.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lab request submitted successfully!', { id: toastId });
      setShowLabModal(false);
      setLabForm({
        test_names: [],
        notes: ''
      });
    } catch (err: any) {
      console.error('❌ Error requesting lab:', err);
      toast.error(`Failed to submit lab request: ${err.message}`, { id: toastId });
    } finally {
      setSubmittingLab(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to load patient data'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Patients
          </button>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 md:px-8 py-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{patient.name}</h1>
                <p className="text-blue-100">Patient ID: {patientId?.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          {/* Patient Info Grid */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="text-xl font-semibold text-gray-900">{patient.age} years</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Phone className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-xl font-semibold text-gray-900">{patient.phone}</p>
              </div>
            </div>

            {patient.husband_name && (
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Husband Name</p>
                  <p className="text-xl font-semibold text-gray-900">{patient.husband_name}</p>
                </div>
              </div>
            )}

            {doctor && (
              <div className="flex items-center gap-4">
                <Stethoscope className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Assigned Doctor</p>
                  <p className="text-xl font-semibold text-gray-900">{doctor.name}</p>
                  {doctor.specialization && (
                    <p className="text-sm text-gray-500 mt-1">{doctor.specialization}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Medical History */}
          {patient.history && (
            <div className="px-6 md:px-8 pb-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Medical History
              </h3>
              <p className="text-gray-700 leading-relaxed">{patient.history}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Clock className="w-5 h-5" />
            Book Appointment
          </button>

          <button
            onClick={() => setShowLabModal(true)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-cyan-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FlaskConical className="w-5 h-5" />
            Request Lab
          </button>
        </div>

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Book Appointment</h2>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Appointment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm(prev => ({
                      ...prev,
                      appointment_date: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={appointmentForm.appointment_time}
                    onChange={(e) => setAppointmentForm(prev => ({
                      ...prev,
                      appointment_time: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Visit Type
                  </label>
                  <select
                    value={appointmentForm.visit_type}
                    onChange={(e) => setAppointmentForm(prev => ({
                      ...prev,
                      visit_type: e.target.value as AppointmentForm['visit_type']
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                    placeholder="Any special notes or requirements..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submittingAppointment}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingAppointment ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Book Now'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAppointmentModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lab Request Modal */}
        {showLabModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Request Lab Tests</h2>
                <button
                  onClick={() => setShowLabModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleRequestLab} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Add Lab Test <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={labTestInput}
                      onChange={(e) => setLabTestInput(e.target.value)}
                      placeholder="e.g., Blood Test, Ultrasound..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLabTest();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addLabTest}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Tests */}
                {labForm.test_names.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Tests:</p>
                    <div className="space-y-2">
                      {labForm.test_names.map((test, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg"
                        >
                          <span className="text-gray-700">{test}</span>
                          <button
                            type="button"
                            onClick={() => removeLabTest(idx)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={labForm.notes}
                    onChange={(e) => setLabForm(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-20"
                    placeholder="Any additional information for the lab..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submittingLab || labForm.test_names.length === 0}
                    className="flex-1 bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingLab ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLabModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
