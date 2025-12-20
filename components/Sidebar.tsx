import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, LogOut, Activity, FileText, Brain } from 'lucide-react';
import { Page } from '../types';
import { useBranding } from '../context/BrandingContext';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, onLogout }) => {
  const { branding } = useBranding();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user?.email) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', user.email)
            .single();

          if (data) {
            setUserRole(data.role);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchRole();
  }, []);

  const doctorMenuItems = [
    { id: Page.HOME, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: Page.RECEPTION, label: 'Reception', arLabel: 'الاستقبال', icon: Users },
    { id: Page.GYNECOLOGY, label: 'Gynecology', arLabel: 'عيادة النساء', icon: Activity },
    { id: Page.OBSTETRICS, label: 'Obstetrics', arLabel: 'متابعة الحمل', icon: Heart },
    { id: Page.IVF, label: 'IVF Center', arLabel: 'مركز الخصوبة', icon: Baby },
    { id: Page.SMART_IVF, label: 'Smart IVF', arLabel: '🧬 IVF الذكي', icon: Brain },
    { id: Page.PATIENT_RECORD, label: 'Patient Records', arLabel: 'سجلات المرضى', icon: FileText },
    { id: Page.SETTINGS, label: 'Settings', arLabel: 'الإعدادات', icon: Settings },
  ];

  const receptionistMenuItems = [
    { id: Page.RECEPTION, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: Page.PATIENT_RECORD, label: 'Patient Records', arLabel: 'سجلات المرضى', icon: Users },
  ];

  const filteredMenuItems = userRole === 'receptionist' ? receptionistMenuItems : doctorMenuItems;

  if (loading) {
    return (
      <div className="hidden md:w-64 md:flex md:flex-col bg-white h-screen shadow-lg fixed md:static inset-y-0 right-0 z-10 p-6">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
        </div>
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    // Hidden on mobile, visible from md and up
    <div className="hidden md:w-64 md:flex md:flex-col bg-white h-screen shadow-lg fixed md:static inset-y-0 right-0 z-10 no-print">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center" style={{ backgroundColor: branding?.background_color || '#ffffff' }}>
        <div className="flex flex-col items-center">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt="Logo" className="w-12 h-12 rounded-full mb-2 object-cover border-2" style={{ borderColor: branding?.primary_color || '#2d5a6b' }} />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `${branding?.primary_color}20` || '#2d5a6b20' }}>
              <Baby className="w-8 h-8" style={{ color: branding?.primary_color || '#2d5a6b' }} />
            </div>
          )}
          <h1 className="text-sm font-bold text-center" style={{ color: branding?.text_color || '#1f2937', fontFamily: branding?.header_font || 'Tajawal' }}>
            {branding?.clinic_name || 'Nile IVF Center'}
          </h1>
          <p className="text-xs uppercase tracking-wider" style={{ color: branding?.text_color || '#1f2937', opacity: 0.6 }}>
            EMR System
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 ${isActive
                    ? 'font-bold shadow-sm'
                    : 'hover:opacity-80'
                    }`}
                  style={{
                    backgroundColor: isActive ? `${branding?.primary_color}20` || '#2d5a6b20' : 'transparent',
                    color: isActive ? branding?.primary_color || '#2d5a6b' : branding?.text_color || '#1f2937',
                    borderRadius: branding?.button_style === 'rounded' ? '0.75rem' : branding?.button_style === 'pill' ? '9999px' : '0.25rem',
                    fontFamily: branding?.body_font || 'Tajawal'
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? branding?.primary_color || '#2d5a6b' : 'currentColor' }} />
                  <span>{item.arLabel || item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        {/* Developer Credits */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 font-[Tajawal] leading-tight">
            برمجة وتطوير<br />
            د. محمد صلاح جبر
          </p>
        </div>
      </div>
    </div>
  );
};
