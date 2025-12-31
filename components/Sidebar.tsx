import React, { useState, memo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Baby, Heart, Settings, LogOut,
  Activity, FileText, Brain, TestTube, DollarSign,
  Facebook, MessageCircle, Building2, ShieldCheck,
  Sparkles, ExternalLink, ChevronRight
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
  const hasValidLogo = branding?.logo_url && branding.logo_url.startsWith('http') && !logoError;

  return (
    <aside className="w-64 h-screen flex flex-col bg-surface border-x border-borderColor shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Clinic Header - More Compact */}
      <div className="p-5 border-b border-borderColor/50 bg-gradient-to-br from-brand/5 to-transparent relative">
        <div className="flex flex-col items-center gap-2.5 relative z-10">
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-800 border border-brand/20 flex items-center justify-center overflow-hidden shadow-md group hover:scale-105 transition-all duration-300">
            {hasValidLogo ? (
              <img
                src={branding.logo_url!}
                alt="Clinic Logo"
                className="w-10 h-10 object-contain group-hover:rotate-3 transition-transform"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-brand/30">
                <Building2 size={24} strokeWidth={1.5} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Nile IVF</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-base font-black text-foreground tracking-tight line-clamp-1">{branding?.clinic_name || 'نظام العيادة'}</h2>
            <p className="text-[9px] font-bold text-brand uppercase tracking-widest opacity-80 mt-0.5 line-clamp-1">
              {branding?.specialization || 'Obstetrics & Gynecology'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Compact Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-1 no-scrollbar scroll-smooth">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border ${isActive
                  ? 'bg-brand/10 text-brand border-brand/20 ring-1 ring-brand/10'
                  : 'bg-transparent text-textSecondary border-transparent hover:bg-brand/5 hover:text-foreground'
                }`}
            >
              <div
                className={`flex-none flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300 ${isActive ? 'bg-brand text-white shadow-sm' : 'bg-surface/50 border border-borderColor/5 group-hover:bg-white dark:group-hover:bg-zinc-800'
                  }`}
              >
                <Icon size={16} style={{ color: isActive ? '#FFFFFF' : item.color }} />
              </div>
              <span className={`font-bold text-xs tracking-wide text-right flex-1 ${isActive ? 'text-brand' : 'text-textSecondary'}`}>
                {item.arLabel}
              </span>
              {isActive && (
                <div className="absolute left-1.5 w-1 h-3.5 bg-brand rounded-full transition-all duration-300" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Area - Minimalist */}
      <div className="p-4 border-t border-borderColor/50 bg-surface/50 space-y-3">
        {/* Theme Toggler - Small */}
        <div className="bg-background/80 rounded-xl border border-borderColor/10 p-1 shadow-inner">
          <ThemeSwitcher />
        </div>

        {/* Minimalist Developer Info */}
        <div className="rounded-xl border border-borderColor/20 bg-zinc-900/5 dark:bg-white/5 p-3 group transition-colors hover:border-brand/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center border border-brand/20">
              <Sparkles size={12} className="text-brand" />
            </div>
            <div>
              <p className="text-[8px] font-black text-brand/60 uppercase tracking-tighter leading-none mb-0.5">Developed By</p>
              <p className="text-[11px] font-black text-foreground leading-none">د. محمد صلاح جبر</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            <a
              href="https://wa.me/201015668664"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-surface border border-borderColor/20 hover:border-green-500/50 text-textSecondary hover:text-green-500 rounded-md transition-all text-[9px] font-bold"
            >
              <MessageCircle size={12} />
              <span>WASAP</span>
            </a>
            <a
              href="https://www.facebook.com/mohamed.salahgabr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-surface border border-borderColor/20 hover:border-blue-500/50 text-textSecondary hover:text-blue-500 rounded-md transition-all text-[9px] font-bold"
            >
              <Facebook size={12} />
              <span>FB</span>
            </a>
          </div>
        </div>

        {/* Logout - Small */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-red-500/70 hover:text-red-500 font-bold rounded-lg hover:bg-red-500/5 transition-all text-xs"
        >
          <LogOut size={14} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
