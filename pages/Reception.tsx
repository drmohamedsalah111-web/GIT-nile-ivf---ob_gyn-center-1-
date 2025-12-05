
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Phone, User, History, Loader2 } from 'lucide-react';
import { db } from '../services/ivfService';
import { Patient } from '../types';
import toast from 'react-hot-toast';

const Reception: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'directory'>('register');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    husbandName: '',
    history: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch patients when switching to directory or on mount
  const fetchPatients = async () => {
    setLoading(true);
    const data = await db.getPatients();
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchPatients();
    }
  }, [activeTab]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill required fields");
      return;
    }

    const toastId = toast.loading("Registering patient...");

    try {
      await db.savePatient({
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone,
        husbandName: formData.husbandName,
        history: formData.history
      });
      
      toast.success("Patient registered successfully!", { id: toastId });
      setFormData({ name: '', age: '', phone: '', husbandName: '', history: '' });
    } catch (error) {
      toast.error("Failed to register patient", { id: toastId });
      console.error(error);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
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

      <div className="p-8">
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
                    onChange={e => setFormData({...formData, name: e.target.value})}
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
                  onChange={e => setFormData({...formData, age: e.target.value})}
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
                    onChange={e => setFormData({...formData, phone: e.target.value})}
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
                  onChange={e => setFormData({...formData, husbandName: e.target.value})}
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
                  value={formData.history}
                  onChange={e => setFormData({...formData, history: e.target.value})}
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
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-12 flex justify-center text-teal-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Patient Name</th>
                      <th className="px-6 py-4">Age</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Husband</th>
                      <th className="px-6 py-4">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-teal-50/30 transition-colors text-sm text-gray-700">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">{patient.id.slice(0, 6)}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">{patient.name}</td>
                          <td className="px-6 py-4">{patient.age}</td>
                          <td className="px-6 py-4">{patient.phone}</td>
                          <td className="px-6 py-4">{patient.husbandName}</td>
                          <td className="px-6 py-4 truncate max-w-xs">{patient.history}</td>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reception;
