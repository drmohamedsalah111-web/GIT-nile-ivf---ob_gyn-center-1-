/**
 * QUICK INTEGRATION EXAMPLE
 * مثال سريع لدمج Smart Stimulation Copilot في التطبيق
 */

// ============================================================================
// 1. في App.tsx - أضف المسار
// ============================================================================

import SmartStimulationCopilot from './pages/SmartStimulationCopilot';

// في قسم Routes:
<Route path="/smart-stimulation" element={<SmartStimulationCopilot />} />

// ============================================================================
// 2. في Navigation/Sidebar - أضف رابط القائمة
// ============================================================================

const navigationItems = [
  // ... العناصر الموجودة
  {
    name: 'Smart IVF Copilot',
    path: '/smart-stimulation',
    icon: Brain, // من lucide-react
    description: 'مساعد ذكي لمتابعة التنشيط'
  }
];

// ============================================================================
// 3. استخدام الخدمة مباشرة في أي component
// ============================================================================

import smartStimulationService from '../services/smartStimulationService';

// Example: إنشاء دورة جديدة
const handleCreateCycle = async (patientId: string, doctorId: string) => {
  try {
    const newCycle = await smartStimulationService.createSmartCycle({
      patient_id: patientId,
      doctor_id: doctorId,
      cycle_number: 1,
      start_date: new Date().toISOString().split('T')[0],
      status: 'baseline',
      ovarian_phenotype: 'normal_responder',
      protocol_type: 'antagonist',
      initial_fsh_dose: 150,
      ohss_risk_level: 'low'
    });
    
    console.log('Cycle created:', newCycle);
    return newCycle;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example: إضافة زيارة متابعة
const handleAddVisit = async (cycleId: string) => {
  try {
    const visit = await smartStimulationService.addMonitoringVisit({
      cycle_id: cycleId,
      visit_number: 1, // سيتم حسابها تلقائيًا
      visit_date: new Date().toISOString().split('T')[0],
      cycle_day: 8,
      stimulation_day: 1,
      e2_level: 150,
      lh_level: 3.2,
      p4_level: 0.5,
      endometrium_thickness: 7.5,
      follicles_right: [10, 12, 14],
      follicles_left: [11, 13],
      fsh_dose_given: 150,
      hmg_dose_given: 0,
      antagonist_given: false,
      doctor_notes: 'بداية جيدة، استمر على نفس الجرعة'
    });
    
    console.log('Visit added:', visit);
    // التوصيات الذكية سيتم توليدها تلقائيًا!
    return visit;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example: الحصول على الدورات النشطة
const loadActiveCycles = async () => {
  try {
    const cycles = await smartStimulationService.getActiveCycles();
    console.log('Active cycles:', cycles);
    return cycles;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example: الحصول على زيارات دورة معينة
const loadCycleVisits = async (cycleId: string) => {
  try {
    const visits = await smartStimulationService.getCycleVisits(cycleId);
    console.log('Visits:', visits);
    
    // الحصول على آخر زيارة
    const latest = await smartStimulationService.getLatestVisit(cycleId);
    console.log('Latest visit:', latest);
    console.log('AI Recommendations:', latest?.ai_recommendations);
    
    return visits;
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// 4. استخدام Views الجاهزة من قاعدة البيانات
// ============================================================================

import { supabase } from '../lib/supabase';

// الحصول على ملخص الدورات النشطة
const getActiveCyclesSummary = async () => {
  const { data, error } = await supabase
    .from('active_smart_cycles_summary')
    .select('*')
    .order('last_visit_date', { ascending: false });
  
  if (error) throw error;
  return data;
};

// الحصول على الزيارات التي تحتاج متابعة
const getVisitsNeedingAttention = async () => {
  const { data, error } = await supabase
    .from('visits_needing_attention')
    .select('*');
  
  if (error) throw error;
  return data;
};

// ============================================================================
// 5. استخدام الدوال المساعدة من قاعدة البيانات
// ============================================================================

// الحصول على ملخص دورة
const getCycleSummary = async (cycleId: string) => {
  const { data, error } = await supabase
    .rpc('get_cycle_summary', { p_cycle_id: cycleId });
  
  if (error) throw error;
  return data;
};

// حساب معدل نمو الحويصلات
const getFollicleGrowthRate = async (cycleId: string) => {
  const { data, error } = await supabase
    .rpc('calculate_follicle_growth_rate', { p_cycle_id: cycleId });
  
  if (error) throw error;
  return data;
};

// ============================================================================
// 6. إنشاء Dashboard للمتابعة
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Brain, AlertTriangle, Activity } from 'lucide-react';

const StimulationDashboard: React.FC = () => {
  const [activeCycles, setActiveCycles] = useState<any[]>([]);
  const [needsAttention, setNeedsAttention] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const cycles = await smartStimulationService.getActiveCycles();
      const attention = await smartStimulationService.getVisitsNeedingAttention();
      
      setActiveCycles(cycles);
      setNeedsAttention(attention);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Brain className="w-8 h-8 text-indigo-600" />
        Smart Stimulation Dashboard
      </h1>
      
      {/* Alerts */}
      {needsAttention.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-yellow-900">
              {needsAttention.length} زيارات تحتاج متابعة
            </h3>
          </div>
          <ul className="space-y-2">
            {needsAttention.map(v => (
              <li key={v.id} className="text-sm">
                {v.patient_name} - زيارة {v.visit_date} - {v.ai_recommendations?.[0]?.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Active Cycles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCycles.map(cycle => (
          <div key={cycle.id} className="bg-white border-2 rounded-xl p-4">
            <h4 className="font-bold text-gray-900">{cycle.patient_name}</h4>
            <p className="text-sm text-gray-600">
              يوم التنشيط: {cycle.current_stim_day}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <span className="text-gray-500">الحويصلات:</span>{' '}
                <span className="font-bold">{cycle.current_follicle_count}</span>
              </div>
              <div>
                <span className="text-gray-500">E2:</span>{' '}
                <span className="font-bold">{cycle.current_e2}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StimulationDashboard;

// ============================================================================
// 7. مثال Widget للصفحة الرئيسية
// ============================================================================

const SmartStimulationWidget: React.FC = () => {
  const [stats, setStats] = useState({
    activeCycles: 0,
    needsAttention: 0,
    readyForTrigger: 0
  });
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    const cycles = await smartStimulationService.getActiveCycles();
    const attention = await smartStimulationService.getVisitsNeedingAttention();
    
    setStats({
      activeCycles: cycles.length,
      needsAttention: attention.length,
      readyForTrigger: cycles.filter((c: any) => 
        c.last_visit?.ready_for_trigger
      ).length
    });
  };
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-indigo-600" />
        <h3 className="font-bold text-gray-900">Smart IVF Copilot</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {stats.activeCycles}
          </div>
          <div className="text-xs text-gray-600">دورات نشطة</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.needsAttention}
          </div>
          <div className="text-xs text-gray-600">تحتاج متابعة</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.readyForTrigger}
          </div>
          <div className="text-xs text-gray-600">جاهزة للتفجير</div>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.href = '/smart-stimulation'}
        className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        فتح Copilot
      </button>
    </div>
  );
};

// ============================================================================
// 8. استخدام في مكون Patient Profile
// ============================================================================

const PatientStimulationHistory: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [cycles, setCycles] = useState<any[]>([]);
  
  useEffect(() => {
    loadHistory();
  }, [patientId]);
  
  const loadHistory = async () => {
    const data = await smartStimulationService.getPatientCycles(patientId);
    setCycles(data);
  };
  
  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">سجل دورات التنشيط</h3>
      <div className="space-y-3">
        {cycles.map(cycle => (
          <div key={cycle.id} className="border-b pb-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">دورة {cycle.cycle_number}</span>
              <span className="text-sm text-gray-600">{cycle.start_date}</span>
            </div>
            <div className="text-sm text-gray-600">
              البروتوكول: {cycle.protocol_name} • الحالة: {cycle.status}
            </div>
            {cycle.predicted_oocytes && (
              <div className="text-sm text-indigo-600">
                عدد البويضات المتوقع: {cycle.predicted_oocytes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// تصدير جميع الأمثلة
// ============================================================================

export {
  handleCreateCycle,
  handleAddVisit,
  loadActiveCycles,
  loadCycleVisits,
  getActiveCyclesSummary,
  getVisitsNeedingAttention,
  getCycleSummary,
  getFollicleGrowthRate,
  StimulationDashboard,
  SmartStimulationWidget,
  PatientStimulationHistory
};
