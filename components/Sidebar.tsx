import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, LogOut, Activity, FileText, Brain, TestTube, DollarSign, CreditCard, Shield, Facebook, MessageCircle, QrCode } from 'lucide-react';
import { Page } from '../types';
import { useBranding } from '../context/BrandingContext';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { ThemeSwitcher } from './theme/ThemeSwitcher';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, onLogout }) => {
  const { branding } = useBranding();
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
    { id: Page.HOME, label: 'Dashboard', arLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: Page.RECEPTION, label: 'Reception', arLabel: 'الاستقبال', icon: Users },
    { id: Page.PATIENT_RECORD, label: 'Patient Records', arLabel: 'سجلات المرضى', icon: FileText },
    { id: Page.GYNECOLOGY, label: 'Gynecology', arLabel: 'عيادة النساء', icon: Activity },
    { id: Page.OBSTETRICS, label: 'Obstetrics', arLabel: 'متابعة الحمل', icon: Heart },
    { id: Page.IVF, label: 'IVF Center', arLabel: 'مركز الخصوبة', icon: Baby },
    { id: Page.SMART_IVF, label: 'Smart IVF', arLabel: '🧬 IVF الذكي', icon: Brain },
    { id: Page.INFERTILITY_WORKUP, label: 'ESHRE Diagnosis', arLabel: 'تشخيص العقم', icon: TestTube },
    { id: Page.FINANCE, label: 'Finance', arLabel: '💰 الماليات', icon: DollarSign },
    { id: Page.SETTINGS, label: 'Settings', arLabel: 'الإعدادات', icon: Settings },
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
    <div className="hidden md:w-64 md:flex md:flex-col bg-background h-screen shadow-lg fixed md:static inset-y-0 right-0 z-10 no-print border-l border-borderColor">
      <div className="p-6 border-b border-borderColor flex items-center justify-center" style={{ backgroundColor: branding?.background_color || 'var(--bg-primary)' }}>
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
          {filteredMenuItems.map((item: any) => {
            // Hide admin-only items for non-admin users
            if (item.adminOnly && userRole !== 'admin') {
              return null;
            }

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

        {/* Admin Button - زر الأدمن الكبير */}
        {userRole === 'admin' && (
          <div className="px-4 mt-6 pt-6 border-t border-borderColor">
            <button
              onClick={() => setPage(Page.SUPER_ADMIN)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-lg">🔐 لوحة الأدمن</div>
                  <div className="text-xs opacity-90">Admin Dashboard</div>
                </div>
              </div>
            </button>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-borderColor">
        {/* Theme Switcher */}
        <div className="mb-3">
          <ThemeSwitcher variant="compact" />
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-textMuted hover:text-error transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        {/* Developer Credits - Professional Copyright Style */}
        <div className="mt-6 pt-6 border-t border-borderColor/50 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-textMuted font-[Tajawal] uppercase tracking-widest opacity-70">
                © 2026 جميع الحقوق محفوظة
              </span>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-primary" style={{ color: branding?.primary_color }}>
                  برمجة و تطوير
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  د. محمد صلاح جبر
                </span>
              </div>
            </div>

            {/* Social Links & QR */}
            <div className="flex items-center justify-center gap-3 w-full">
              <a
                href="https://www.facebook.com/profile.php?id=100000785193419"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                title="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://wa.me/201003418068"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all duration-300"
                title="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>

              <div className="relative group cursor-pointer">
                <div className="p-1 bg-white rounded-lg shadow-sm border border-borderColor/50 group-hover:border-primary/50 transition-colors">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                    alt="Support QR"
                    className="w-[30px] h-[30px] grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                {/* Expanded QR on Hover */}
                <div className="absolute bottom-full right-0 mb-4 p-3 bg-white rounded-2xl shadow-2xl border border-borderColor opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-50 group-hover:scale-100 origin-bottom-right z-50">
                  <div className="w-[120px] bg-white">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                      alt="Support QR Large"
                      className="w-full h-full"
                    />
                    <p className="text-[10px] font-bold mt-2 text-center text-textSecondary uppercase tracking-tighter">
                      امسح للتواصل المباشر
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
