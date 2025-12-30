import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, LogOut, Activity, FileText, Brain, TestTube, DollarSign, CreditCard, Shield, Facebook, MessageCircle, QrCode } from 'lucide-react';
import { Page } from '../types';
import { useBranding } from '../context/BrandingContext';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { ThemeSwitcher } from './theme/ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, onLogout }) => {
  const { branding } = useBranding();
  const { isDarkMode } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  const doctorMenuItems = [
    { id: Page.HOME, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard, color: '#3B82F6' }, // Blue
    { id: Page.RECEPTION, label: 'Reception', arLabel: 'الاستقبال', icon: Users, color: '#6366F1' }, // Indigo
    { id: Page.PATIENT_RECORD, label: 'Patient Records', arLabel: 'سجلات المرضى', icon: FileText, color: '#10B981' }, // Emerald
    { id: Page.GYNECOLOGY, label: 'Gynecology', arLabel: 'عيادة النساء', icon: Activity, color: '#F43F5E' }, // Rose
    { id: Page.OBSTETRICS, label: 'Obstetrics', arLabel: 'متابعة الحمل', icon: Heart, color: '#EC4899' }, // Pink
    { id: Page.IVF, label: 'IVF Center', arLabel: 'مركز الخصوبة', icon: Baby, color: '#8B5CF6' }, // Violet
    { id: Page.SMART_IVF, label: 'Smart IVF', arLabel: '🧬 IVF الذكي', icon: Brain, color: '#06B6D4' }, // Cyan
    { id: Page.INFERTILITY_WORKUP, label: 'ESHRE Diagnosis', arLabel: 'تشخيص العقم', icon: TestTube, color: '#F59E0B' }, // Amber
    { id: Page.FINANCE, label: 'Finance', arLabel: '💰 الماليات', icon: DollarSign, color: '#22C55E' }, // Green
    { id: Page.SETTINGS, label: 'Settings', arLabel: 'الإعدادات', icon: Settings, color: '#6B7280' }, // Gray
  ];

  const receptionistMenuItems = [
    { id: Page.RECEPTION, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: Page.PATIENT_RECORD, label: 'Patient Records', arLabel: 'سجلات المرضى', icon: Users },
  ];

  const filteredMenuItems = userRole === 'receptionist' ? receptionistMenuItems : doctorMenuItems;

  if (loading) {
    return (
      <div className="hidden md:w-64 md:flex md:flex-col bg-background h-screen shadow-lg fixed md:static inset-y-0 right-0 z-10 p-6 border-l border-borderColor">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-12 h-12 bg-surface rounded-full mb-2"></div>
          <div className="h-4 bg-surface w-3/4 rounded mb-2"></div>
        </div>
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-surface rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    // Hidden on mobile, visible from md and up
    <div className={`hidden md:w-64 md:flex md:flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'} h-screen shadow-2xl fixed md:static inset-y-0 right-0 z-40 no-print border-l border-borderColor transition-colors duration-300`}>
      {/* Clinic Branding Header - Cheerful & Bold */}
      <div className={`p-8 border-b border-borderColor text-center ${isDarkMode ? 'bg-gray-800/50' : 'bg-brand/5'}`}>
        <div className="flex flex-col items-center">
          {branding?.logo_url ? (
            <div className="p-1 rounded-2xl bg-white shadow-lg mb-4 transform hover:scale-105 transition-transform duration-300">
              <img
                src={branding.logo_url}
                alt="Logo"
                className="w-16 h-16 rounded-xl object-cover"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
              style={{ backgroundColor: `${branding?.primary_color}15` || '#2d5a6b15' }}
            >
              <Baby className="w-10 h-10" style={{ color: branding?.primary_color || '#2d5a6b' }} />
            </div>
          )}
          <h1
            className="text-lg font-black tracking-tight mb-1"
            style={{ color: branding?.text_color || '#1f2937', fontFamily: branding?.header_font || 'Tajawal' }}
          >
            {branding?.clinic_name || 'Nile IVF Center'}
          </h1>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-brand text-white shadow-sm">
            Professional Suite
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-8">
        <ul className="space-y-1.5 px-4 text-right">
          {filteredMenuItems.map((item: any) => {
            if (item.adminOnly && userRole !== 'admin') return null;

            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 group relative ${isActive
                      ? 'text-white font-bold shadow-lg shadow-brand/20 scale-[1.02] z-10'
                      : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-brand hover:bg-brand/5'}`
                    }`}
                  style={{
                    backgroundColor: isActive ? (branding?.primary_color || '#2d5a6b') : 'transparent',
                    borderRadius: '16px',
                    fontFamily: branding?.body_font || 'Tajawal'
                  }}
                >
                  <div
                    className={`p-2 rounded-xl transition-colors duration-300 ${isActive ? 'bg-white/20' : isDarkMode ? 'bg-gray-800 group-hover:bg-gray-700' : 'bg-gray-50 group-hover:bg-brand/10'}`}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: isActive ? '#FFFFFF' : item.color }}
                    />
                  </div>
                  <span className="flex-1 text-[15px]">{item.arLabel || item.label}</span>
                  {isActive && (
                    <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Admin Section - Cheerful Pulse */}
        {userRole === 'admin' && (
          <div className="px-4 mt-8 pt-8 border-t border-borderColor">
            <button
              onClick={() => setPage(Page.SUPER_ADMIN)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-6 h-6 animate-bounce" />
                <div className="text-center">
                  <div className="text-lg">🔐 لوحة الإدارة</div>
                  <div className="text-[10px] opacity-80 uppercase font-bold tracking-tighter">System Control</div>
                </div>
              </div>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Section - Friendly Support Card */}
      <div className={`p-4 border-t border-borderColor ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'}`}>
        <div className="space-y-4">
          <div className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-white'} p-1.5 rounded-2xl border border-borderColor/50`}>
            <ThemeSwitcher variant="compact" />
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>تسجيل الخروج</span>
          </button>

          {/* New Friendly Dev Card */}
          <div className={`p-5 rounded-2xl border border-borderColor transition-all duration-300 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-white/5' : 'bg-white hover:bg-brand/5 shadow-sm'}`}>
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-1">
                  Technical Partner
                </span>
                <span className="text-sm font-black text-foreground block">
                  د. محمد صلاح جبر
                </span>
                <span className="text-[10px] items-center justify-center gap-1 font-bold text-brand mt-1 flex">
                  <Activity size={10} /> Clinical Developer
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 w-full">
                <a
                  href="https://wa.me/201003418068"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-110 transition-transform"
                >
                  <MessageCircle size={18} />
                </a>

                <div className="relative group/qr">
                  <div className="w-10 h-10 p-1 bg-white rounded-xl shadow-md border border-gray-100 cursor-zoom-in">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                      alt="Support"
                      className="w-full h-full"
                    />
                  </div>
                  {/* Zoomed QR */}
                  <div className="absolute bottom-full mb-4 right-1/2 translate-x-1/2 w-40 bg-white p-4 rounded-3xl shadow-2xl border border-borderColor opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-50 group-hover:scale-100 origin-bottom z-50">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                      alt="Support QR"
                      className="w-full h-full rounded-xl"
                    />
                    <div className="mt-3 text-[10px] font-black text-brand text-center uppercase tracking-tighter">
                      Technical Support
                    </div>
                  </div>
                </div>

                <a
                  href="https://www.facebook.com/profile.php?id=100000785193419"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-110 transition-transform"
                >
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
