import React, { useEffect, useState, useMemo } from 'react';
import {
  Users, Activity, Calendar, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Search, Filter, Plus, Eye, Edit, Phone, MapPin,
  BarChart3, PieChart, CalendarDays, Bell, Download, RefreshCw,
  Stethoscope, Baby, Microscope, UserCheck, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, LineChart, Line
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/localDB';
import { db as ivfService } from '../services/ivfService';
import { obstetricsService } from '../services/obstetricsService';
import { Patient, IvfCycle, Pregnancy } from '../types';
import { useBranding } from '../context/BrandingContext';
import { syncService } from '../src/services/syncService';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { branding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());

  // Live queries for real-time data
  const patients = useLiveQuery(() => db.patients.toArray(), []);
  const cycles = useLiveQuery(() => db.ivf_cycles.toArray(), []);
  const pregnancies = useLiveQuery(() => db.pregnancies.toArray(), []);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    if (!patients || !cycles || !pregnancies) return null;

    const activeCycles = cycles.filter(c => c.status === 'Active').length;
    const completedCycles = cycles.filter(c => c.status === 'Completed').length;
    const highRiskPregnancies = pregnancies.filter(p => p.risk_level === 'high').length;
    const totalPregnancies = pregnancies.length;

    // Mock today's visits (would come from visits table)
    const todayVisits = Math.floor(Math.random() * 15) + 5;

    // Calculate success rates
    const successfulCycles = cycles.filter(c => c.outcome_data?.clinicalPregnancy).length;
    const successRate = cycles.length > 0 ? Math.round((successfulCycles / cycles.length) * 100) : 0;

    return {
      totalPatients: patients.length,
      activeCycles,
      completedCycles,
      totalPregnancies,
      highRiskPregnancies,
      todayVisits,
      successRate,
      pendingLabs: Math.floor(Math.random() * 8) + 2, // Mock
      upcomingAppointments: Math.floor(Math.random() * 12) + 3 // Mock
    };
  }, [patients, cycles, pregnancies]);

  // Filter patients based on search and department
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    return patients.filter(patient => {
      const matchesSearch = searchTerm === '' ||
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm);

      const matchesDepartment = selectedDepartment === 'all' ||
        (selectedDepartment === 'ivf' && cycles?.some(c => c.patient_id === patient.remoteId || c.patient_id === patient.id.toString())) ||
        (selectedDepartment === 'ob' && pregnancies?.some(p => p.patient_id === patient.remoteId || p.patient_id === patient.id.toString()));

      return matchesSearch && matchesDepartment;
    }).slice(0, 10); // Show top 10
  }, [patients, cycles, pregnancies, searchTerm, selectedDepartment]);

  // Mock data for charts
  const monthlyGrowth = [
    { month: 'Jan', patients: 45, cycles: 12, pregnancies: 8 },
    { month: 'Feb', patients: 52, cycles: 15, pregnancies: 10 },
    { month: 'Mar', patients: 61, cycles: 18, pregnancies: 12 },
    { month: 'Apr', patients: 78, cycles: 22, pregnancies: 15 },
    { month: 'May', patients: 89, cycles: 25, pregnancies: 18 },
    { month: 'Jun', patients: 95, cycles: 28, pregnancies: 20 },
  ];

  const cycleOutcomes = [
    { name: 'Successful', value: stats?.successRate || 0, color: '#10B981' },
    { name: 'Ongoing', value: 100 - (stats?.successRate || 0), color: '#3B82F6' },
  ];

  const departmentStats = [
    { name: 'IVF', patients: cycles?.length || 0, color: '#8B5CF6' },
    { name: 'Obstetrics', patients: pregnancies?.length || 0, color: '#F59E0B' },
    { name: 'Gynecology', patients: Math.floor((patients?.length || 0) * 0.6), color: '#EF4444' },
  ];

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      // Data is loaded via live queries
      setLoading(false);
    };

    initializeData();

    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    try {
      await syncService.forceSync();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const getPatientStatus = (patient: Patient) => {
    const patientId = patient.id?.toString();
    const hasActiveCycle = cycles?.some(c => c.patient_id === patientId && c.status === 'Active');
    const hasPregnancy = pregnancies?.some(p => p.patient_id === patientId);

    if (hasActiveCycle) return { status: 'IVF Active', color: 'bg-purple-100 text-purple-800' };
    if (hasPregnancy) return { status: 'Pregnancy Care', color: 'bg-pink-100 text-pink-800' };
    return { status: 'General Care', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading || !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 md:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-[Tajawal]">
              {branding?.clinic_name || 'Nile IVF & OB/GYN Center'}
            </h1>
            <p className="text-gray-600 mt-1">Professional Clinic Management Dashboard</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {syncStatus.isOnline ? 'Online' : 'Offline'}
                {syncStatus.syncInProgress && ' (Syncing...)'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 space-y-6">
        {/* Advanced KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active IVF Cycles</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeCycles}</p>
              </div>
              <Microscope className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pregnancy Care</p>
                <p className="text-2xl font-bold text-pink-600">{stats.totalPregnancies}</p>
              </div>
              <Baby className="w-8 h-8 text-pink-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Visits</p>
                <p className="text-2xl font-bold text-orange-600">{stats.todayVisits}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Risk Cases</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskPregnancies}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  <option value="ivf">IVF Patients</option>
                  <option value="ob">Obstetrics</option>
                  <option value="gyn">Gynecology</option>
                </select>
              </div>

              {/* Patient List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => {
                  const status = getPatientStatus(patient);
                  return (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-700 font-semibold">{patient.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                          <p className="text-sm text-gray-600">{patient.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.status}
                        </span>
                        <div className="flex gap-1">
                          <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors">
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Growth Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Monthly Growth
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="patients" stroke="#00838f" strokeWidth={2} />
                      <Line type="monotone" dataKey="cycles" stroke="#8B5CF6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  IVF Success Rate
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={cycleOutcomes}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {cycleOutcomes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Department Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Department Overview
              </h3>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                      <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dept.patients}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Alerts & Notifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">High Risk Pregnancy</p>
                    <p className="text-xs text-red-700">Patient requires immediate attention</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Pending Lab Results</p>
                    <p className="text-xs text-yellow-700">{stats.pendingLabs} results awaiting review</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Upcoming Appointments</p>
                    <p className="text-xs text-blue-700">{stats.upcomingAppointments} scheduled for today</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-600" />
                Today's Schedule
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Dr. Ahmed - IVF Consultation</p>
                    <p className="text-xs text-blue-700">10:00 AM - 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Ultrasound - Pregnancy Check</p>
                    <p className="text-xs text-purple-700">11:00 AM - 11:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Lab Results Review</p>
                    <p className="text-xs text-green-700">2:00 PM - 2:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                  <Plus className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-teal-900">New Patient</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <Microscope className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Start IVF Cycle</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                  <Baby className="w-5 h-5 text-pink-600" />
                  <span className="text-sm font-medium text-pink-900">Add Pregnancy</span>
                </button>
                <button
                  onClick={() => {
                    // Mock export functionality
                    toast.success('Report exported successfully');
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Export Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
