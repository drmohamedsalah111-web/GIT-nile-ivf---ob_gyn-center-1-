import React, { useState } from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, LogOut, Activity, FileText, Brain, TestTube, DollarSign, Facebook, MessageCircle } from 'lucide-react';
import { Page } from '../types';
import { useBranding } from '../context/BrandingContext';
import { ThemeSwitcher } from './theme/ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
  userRole: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, onLogout, userRole }) => {
  const { branding } = useBranding();
  const { isDarkMode } = useTheme();

  const doctorMenuItems = [
    { id: Page.HOME, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard, color: '#3B82F6' },
    { id: Page.RECEPTION, label: 'Reception', arLabel: 'الاستقبال', icon: Users, color: '#6366F1' },
    { id: Page.PATIENT_RECORD, label: 'Patient Records', arLabel: 'سجلات المرضى', icon: FileText, color: '#10B981' },
    { id: Page.GYNECOLOGY, label: 'Gynecology', arLabel: 'عيادة النساء', icon: Activity, color: '#F43F5E' },
    { id: Page.OBSTETRICS, label: 'Obstetrics', arLabel: 'متابعة الحمل', icon: Heart, color: '#EC4899' },
    { id: Page.IVF, label: 'IVF Center', arLabel: 'مركز الخصوبة', icon: Baby, color: '#8B5CF6' },
    { id: Page.SMART_IVF, label: 'Smart IVF', arLabel: '🧬 IVF الذكي', icon: Brain, color: '#06B6D4' },
    { id: Page.INFERTILITY_WORKUP, label: 'ESHRE Diagnosis', arLabel: 'تشخيص العقم', icon: TestTube, color: '#F59E0B' },
    { id: Page.FINANCE, label: 'Finance', arLabel: '💰 الماليات', icon: DollarSign, color: '#22C55E' },
    { id: Page.SETTINGS, label: 'Settings', arLabel: 'الإعدادات', icon: Settings, color: '#6B7280' },
  ];

  const secretaryMenuItems = [
    { id: Page.HOME, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard, color: '#3B82F6' },
    { id: Page.RECEPTION, label: 'Reception', arLabel: 'الاستقبال', icon: Users, color: '#6366F1' },
    { id: Page.PATIENT_RECORD, label: 'Records', arLabel: 'سجلات المرضى', icon: FileText, color: '#10B981' },
    { id: Page.FINANCE, label: 'Finance', arLabel: 'الماليات', icon: DollarSign, color: '#22C55E' },
    { id: Page.SETTINGS, label: 'Settings', arLabel: 'الإعدادات', icon: Settings, color: '#6B7280' },
  ];

  const menuItems = userRole === 'secretary' ? secretaryMenuItems : doctorMenuItems;

  return (
    <aside className="w-72 h-screen flex flex-col bg-surface border-x border-borderColor shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Clinic Header */}
      <div className="p-8 border-b border-borderColor/50 bg-gradient-to-br from-brand/5 to-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border-2 border-brand/20 flex items-center justify-center overflow-hidden shadow-inner group hover:scale-105 transition-all duration-300">
            <img src={branding?.logo_url || '/logo.png'} alt="Clinic Logo" className="w-12 h-12 object-contain group-hover:rotate-6 transition-transform" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-foreground tracking-tight">{branding?.clinic_name || 'العيادة الذكية'}</h2>
            <p className="text-xs font-bold text-brand mt-1 uppercase tracking-widest opacity-80">{branding?.specialty || 'Medical Center'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 space-y-2 no-scrollbar">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border-2 ${isActive
                  ? 'bg-brand text-white border-brand shadow-lg shadow-brand/25 scale-[1.02]'
                  : 'bg-transparent text-textSecondary border-transparent hover:bg-brand/5 hover:border-brand/10 hover:text-foreground'
                }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-transform duration-300 group-hover:scale-110 ${isActive ? 'bg-white shadow-sm' : 'bg-surface border border-borderColor/10 shadow-sm'
                  }`}
              >
                <Icon size={20} style={{ color: isActive ? item.color : (isDarkMode ? '#A1A1AA' : '#4B5563') }} />
              </div>
              <span className="font-bold text-[15px] tracking-wide">{item.arLabel}</span>
              {isActive && (
                <div className="absolute left-1 w-1.5 h-6 bg-white rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme & Actions Footer */}
      <div className="p-6 border-t border-borderColor/50 space-y-4 bg-surface/50">
        <div className="p-2 bg-background/50 rounded-2xl border border-borderColor/10">
          <ThemeSwitcher />
        </div>

        {/* Developer Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center border-2 border-white/20">
              <span className="text-brand font-black text-xs">Dr.M</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-brand uppercase tracking-tighter leading-none mb-1">Developed By</p>
              <p className="text-sm font-black text-foreground leading-none">د. محمد صلاح جبر</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-brand/10">
            <div className="flex gap-2">
              <a href="https://wa.me/201015668664" target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg text-green-500 hover:scale-110 transition-transform shadow-sm"><MessageCircle size={16} /></a>
              <a href="https://www.facebook.com/mohamed.salahgabr" target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg text-blue-600 hover:scale-110 transition-transform shadow-sm"><Facebook size={16} /></a>
            </div>
            <button
              onClick={() => {
                const toastId = toast.loading('Connecting to support...');
                setTimeout(() => toast.success('Support center ready!', { id: toastId }), 1000);
              }}
              className="px-3 py-1.5 bg-brand text-white text-[10px] font-black rounded-lg uppercase tracking-tight shadow-md shadow-brand/20 hover:brightness-110 transition-all"
            >
              Get Support
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all duration-300 group border-2 border-transparent hover:border-red-100"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};
