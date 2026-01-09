
import React, { useState } from 'react';
import { UserPlus, Search, Phone, User, History, Edit2 } from 'lucide-react';
import { usePatients } from '../src/hooks/usePatients';
import { authService } from '../services/authService';
import EditPatientModal from '../src/components/patients/EditPatientModal';
import toast from 'react-hot-toast';

const Reception: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'directory'>('register');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    husbandName: '',
    medical_history: ''
  });

  // PowerSync hook
  const { patients, addPatient, searchQuery, setSearchQuery, isLoading, refresh } = usePatients();

  // Edit Patient State
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);



  console.log('🏥 Reception: patients array from hook:', patients);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill required fields");
      return;
    }

    const toastId = toast.loading("Registering patient...");

    try {
      // Get current user and ensure doctor record exists
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctor) throw new Error("Doctor profile missing. Please log out and sign in again.");

      // Determine which doctor_id to use
      let doctorId = doctor.id;

      // If user is a secretary, use the doctor they're assigned to
      const userRole = await authService.getUserRole(user.id);
      if (userRole === 'secretary' && doctor.secretary_doctor_id) {
        doctorId = doctor.secretary_doctor_id;
      }

      await addPatient({
        name: formData.name,
        age: parseInt(formData.age) || 0,
        phone: formData.phone,
        husband_name: formData.husbandName,
        medical_history: formData.medical_history ? JSON.parse(formData.medical_history) : {},
        doctor_id: doctorId
      });

      toast.success("Patient registered successfully!", { id: toastId });
      setFormData({ name: '', age: '', phone: '', husbandName: '', medical_history: '' });
    } catch (error) {
      // Provide more detailed error feedback for debugging
      const msg = (error && (error as any).message) ? (error as any).message : JSON.stringify(error);
      toast.error(`Failed to register patient: ${msg}`, { id: toastId });
      console.error('Register patient error:', error);
    }
  };

  const filteredPatients = patients;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Reception & Patient Directory</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'register' ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            New Registration
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'directory' ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Patient Directory
          </button>
        </div>

        <div className="p-4 md:p-8">
          {activeTab === 'register' ? (
            <form onSubmit={handleRegister} className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name (Wife)</label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Years"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="01xxxxxxxxx"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Husband Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Husband Name"
                    value={formData.husbandName}
                    onChange={e => setFormData({ ...formData, husbandName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical History (Brief)</label>
                <div className="relative">
                  <History className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-32"
                    placeholder="G P A, Previous Operations, Allergies..."
                    value={formData.medical_history}
                    onChange={e => setFormData({ ...formData, medical_history: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-700 text-white py-3 rounded-xl font-bold hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20"
              >
                <UserPlus className="w-5 h-5" />
                Register Patient
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                  placeholder="Search by Name or Phone... / بحث بالاسم أو الهاتف"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Mobile: render cards */}
              <div className="block md:hidden space-y-3">
                {isLoading && (
                  <div className="text-center text-gray-400 py-6">Searching...</div>
                )}
                {filteredPatients.length > 0 ? filteredPatients.map(patient => (
                  <div key={patient.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{patient.name}</div>
                        <div className="text-xs text-gray-500 mt-1">Age {patient.age}</div>
                      </div>
                      <div className="text-right text-xs text-gray-400 font-mono">
                        {String(patient.id).slice(0, 6)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-600 truncate flex-1">{patient.medical_history?.notes || ''}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 px-2 flex items-center gap-1 text-teal-600 hover:bg-teal-50 rounded text-[10px] font-bold transition-colors"
                      >
                        <Edit2 size={12} />
                        تعديل
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-8">No patients found matching your search.</div>
                )}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Patient Name</th>
                      <th className="px-6 py-4">Age</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Husband</th>
                      <th className="px-6 py-4">History</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          Searching...
                        </td>
                      </tr>
                    ) : filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-teal-50/30 transition-colors text-sm text-gray-700">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">
                            {String(patient.id).slice(0, 6)}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">{patient.name}</td>
                          <td className="px-6 py-4">{patient.age}</td>
                          <td className="px-6 py-4">{patient.phone}</td>
                          <td className="px-6 py-4">{patient.husbandName}</td>
                          <td className="px-6 py-4 truncate max-w-xs">{patient.medical_history?.notes || ''}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          No patients found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {selectedPatient && (
          <EditPatientModal
            patient={selectedPatient}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPatient(null);
            }}
            onUpdate={() => {
              refresh();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Reception;
