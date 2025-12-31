import React, { useState, memo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Baby, Heart, Settings, LogOut,
  Activity, FileText, Brain, TestTube, DollarSign,
  Facebook, MessageCircle, Building2, ShieldCheck,
  Sparkles, ExternalLink
} from 'lucide-react';
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

export const Sidebar: React.FC<SidebarProps> = memo(({ activePage, setPage, onLogout, userRole }) => {
  const { branding } = useBranding();
  const { isDarkMode } = useTheme();
  const [logoError, setLogoError] = useState(false);

  // Reset logo error when branding changes
  useEffect(() => {
    setLogoError(false);
  }, [branding?.logo_url]);

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

  // Better logo check
  const hasValidLogo = branding?.logo_url && branding.logo_url.startsWith('http') && !logoError;

  return (
    <aside className="w-72 h-screen flex flex-col bg-surface border-x border-borderColor shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Clinic Header */}
      <div className="p-8 border-b border-borderColor/50 bg-gradient-to-br from-brand/5 to-transparent relative">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Sparkles size={40} className="text-brand" />
        </div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-brand/20 flex items-center justify-center overflow-hidden shadow-xl group hover:scale-105 transition-all duration-300">
            {hasValidLogo ? (
              <img
                src={branding.logo_url!}
                alt="Clinic Logo"
                className="w-16 h-16 object-contain group-hover:rotate-3 transition-transform"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-brand/30">
                <Building2 size={36} strokeWidth={1.5} />
                <span className="text-[10px] font-black uppercase tracking-widest mt-1">Nile IVF</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-foreground tracking-tight line-clamp-1">{branding?.clinic_name || 'نظام العيادة الذكية'}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 rounded-full mt-1.5 border border-brand/20">
              <ShieldCheck size={12} className="text-brand" />
              <p className="text-[10px] font-bold text-brand uppercase tracking-wider">
                {branding?.specialization || 'Obstetrics & Gynecology'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 space-y-2 no-scrollbar scroll-smooth">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border-2 ${isActive
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-[1.02]'
                : 'bg-transparent text-textSecondary border-transparent hover:bg-brand/5 hover:border-brand/10 hover:text-foreground'
                }`}
            >
              <div
                className={`flex-none flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20 shadow-inner' : 'bg-surface border border-borderColor/10 shadow-sm group-hover:bg-white dark:group-hover:bg-zinc-700'
                  }`}
              >
                <Icon size={20} style={{ color: isActive ? '#FFFFFF' : item.color }} />
              </div>
              <span className="font-bold text-[15px] tracking-wide text-right flex-1">{item.arLabel}</span>
              {isActive && (
                <div className="absolute left-1.5 w-1.5 h-6 bg-white rounded-full transition-all duration-300" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-5 border-t border-borderColor/50 bg-surface/50 space-y-4">
        {/* Theme Toggler */}
        <div className="bg-background/80 rounded-2xl border border-borderColor/20 p-1.5 shadow-inner">
          <ThemeSwitcher />
        </div>

        {/* Elegant Developer Support Card */}
        <div className="relative group overflow-hidden rounded-3xl bg-zinc-950 border border-white/5 p-5 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand tracking-[0.2em] uppercase leading-none mb-1.5">Lead Architect</p>
                <p className="text-lg font-black text-white leading-none">د. محمد صلاح جبر</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://wa.me/201015668664"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-green-500/5 hover:bg-green-500 text-green-500 hover:text-white rounded-2xl transition-all duration-300 border border-green-500/10 group/btn"
                >
                  <MessageCircle size={18} />
                  <span className="text-[10px] font-black uppercase tracking-wider">WhatsApp</span>
                </a>
                <a
                  href="https://www.facebook.com/mohamed.salahgabr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600/5 hover:bg-blue-600 text-blue-600 hover:text-white rounded-2xl transition-all duration-300 border border-blue-600/10 group/btn"
                >
                  <Facebook size={18} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Profile</span>
                </a>
              </div>

              <button
                onClick={() => {
                  const tid = toast.loading('Establishing Link...', { style: { borderRadius: '16px', background: '#09090b', color: '#fff', border: '1px solid #27272a' } });
                  setTimeout(() => toast.success('Secure Connection Established!', { id: tid, icon: '🛡️' }), 1200);
                }}
                className="w-full py-4 bg-brand hover:brightness-110 text-white text-[11px] font-black rounded-2xl uppercase tracking-[3px] shadow-xl shadow-brand/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} strokeWidth={3} />
                Get Partner Support
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 text-red-500 font-black rounded-2xl hover:bg-red-500/10 transition-all duration-300 group border border-transparent hover:border-red-500/20 active:scale-95"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[13px] font-black uppercase tracking-wider">Sign Out System</span>
        </button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
