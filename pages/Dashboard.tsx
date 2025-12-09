
import React, { useEffect, useState } from 'react';
import { Users, Activity, CalendarCheck, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '../services/ivfService';
import { Patient } from '../types';
import { useBranding } from '../context/BrandingContext';
import { syncManager } from '../src/services/syncService';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { branding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCycles: 0,
    todayVisits: 0
  });

  const fetchData = async () => {
    try {
      const patients = await db.getPatients();
      const cycles = await db.getCycles();
      // In a real app, we'd query visits by date via Supabase directly for performance
      // const visits = await db.getVisits(); 
      
      setStats({
        totalPatients: patients.length,
        activeCycles: cycles.filter(c => c.status === 'Active').length,
        todayVisits: 5 // Mock for now until visits table is fully populated
      });
    } catch (error) {
      console.error("Failed to load dashboard data");
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    initializeData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force sync with server
      await syncManager.forceSync();
      toast.success('Data refreshed successfully');
      
      // Reload dashboard data
      await fetchData();
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Mock Data for Charts (Keep static for UI demo)
  const growthData = [
    { name: 'Jan', patients: 30 },
    { name: 'Feb', patients: 45 },
    { name: 'Mar', patients: 60 },
    { name: 'Apr', patients: 90 },
    { name: 'May', patients: 110 },
    { name: 'Jun', patients: 150 },
  ];

  const visitTypes = [
    { name: 'Consultation', value: 400 },
    { name: 'Scan', value: 300 },
    { name: 'Lab', value: 300 },
    { name: 'Procedure', value: 200 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{branding?.clinic_name || 'Dashboard Overview'}</h2>
          <p className="text-gray-500">Welcome back to your clinic management system</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh data from server"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
          <div className="flex-1">
            <p className="text-xs md:text-sm font-medium text-gray-400">Total Patients</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{stats.totalPatients}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
          <div className="flex-1">
            <p className="text-xs md:text-sm font-medium text-gray-400">Active Cycles</p>
            <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mt-1">{stats.activeCycles}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
            <Activity className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 sm:col-span-2 md:col-span-1">
          <div className="flex-1">
            <p className="text-xs md:text-sm font-medium text-gray-400">Today's Visits</p>
            <h3 className="text-2xl md:text-3xl font-bold text-purple-600 mt-1">{stats.todayVisits}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <CalendarCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-8">
        
        {/* Patient Growth Area Chart */}
        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-sm md:text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              Patient Growth
            </h3>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00838f" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00838f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#00838f" fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Types Donut Chart */}
        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-4 md:mb-6">Visit Distribution</h3>
          <div className="h-48 md:h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitTypes}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {visitTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-2 md:gap-4 mt-4 flex-wrap">
            {visitTypes.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="hidden sm:inline">{entry.name}</span>
                <span className="sm:hidden">{entry.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
