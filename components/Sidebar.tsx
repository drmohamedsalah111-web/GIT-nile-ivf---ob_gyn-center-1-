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
    <div className="hidden md:w-64 md:flex md:flex-col bg-background/80 backdrop-blur-xl h-screen shadow-2xl fixed md:static inset-y-0 right-0 z-40 no-print border-l border-white/10 overflow-hidden">
      {/* Clinic Branding Header */}
      <div className="relative p-6 border-b border-borderColor overflow-hidden group">
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${branding?.primary_color || '#2d5a6b'}, transparent)` }}
        />
        <div className="relative flex flex-col items-center z-10">
          {branding?.logo_url ? (
            <div className="relative p-1 rounded-full bg-white shadow-xl mb-3 transform group-hover:scale-105 transition-transform duration-300">
              <img
                src={branding.logo_url}
                alt="Logo"
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-3 shadow-lg transform group-hover:rotate-6 transition-transform duration-300"
              style={{ backgroundColor: `${branding?.primary_color}15` || '#2d5a6b15' }}
            >
              <Baby className="w-10 h-10" style={{ color: branding?.primary_color || '#2d5a6b' }} />
            </div>
          )}
          <h1
            className="text-base font-bold text-center leading-tight mb-1"
            style={{ color: branding?.text_color || '#1f2937', fontFamily: branding?.header_font || 'Tajawal' }}
          >
            {branding?.clinic_name || 'Nile IVF Center'}
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-60">
              Premium EMR
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <ul className="space-y-1.5 px-3">
          {filteredMenuItems.map((item: any) => {
            if (item.adminOnly && userRole !== 'admin') return null;

            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id} className="relative group/item">
                {isActive && (
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-l-full z-20"
                    style={{ backgroundColor: branding?.primary_color || '#2d5a6b', boxShadow: `0 0 10px ${branding?.primary_color}` }}
                  />
                )}
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-all duration-300 relative overflow-hidden ${isActive ? 'font-bold' : 'hover:translate-x-[-4px]'
                    }`}
                  style={{
                    backgroundColor: isActive ? `${branding?.primary_color}10` : 'transparent',
                    color: isActive ? branding?.primary_color || '#2d5a6b' : branding?.text_color || '#1f2937',
                    borderRadius: '12px',
                    fontFamily: branding?.body_font || 'Tajawal'
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{ background: `linear-gradient(to left, ${branding?.primary_color}, transparent)` }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/item:rotate-12'}`}
                    style={{ color: isActive ? branding?.primary_color || '#2d5a6b' : 'currentColor' }}
                  />
                  <span className="relative z-10 text-[14px]">{item.arLabel || item.label}</span>
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

      {/* Footer Section */}
      <div className="mt-auto p-4 bg-surface/30 backdrop-blur-sm border-t border-borderColor/50">
        <div className="space-y-4">
          {/* Theme Switcher Card */}
          <div className="p-1.5 bg-background/50 rounded-2xl border border-borderColor/30">
            <ThemeSwitcher variant="compact" />
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-textMuted hover:text-error hover:bg-error/5 rounded-xl transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
            <span>Sign Out</span>
          </button>

          {/* Developer Credits Card - The Signature */}
          <div className="relative group/dev overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-background to-surface/50 border border-borderColor/60 shadow-sm hover:shadow-md transition-all duration-500">
            {/* Animated Background Element */}
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover/dev:scale-150 transition-transform duration-700" />

            <div className="relative flex flex-col items-center gap-3 z-10 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-textMuted font-[Tajawal] uppercase tracking-[0.2em] mb-1.5 opacity-80">
                  Powered & Developed By
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold" style={{ color: branding?.primary_color }}>
                    المهندس و المطور
                  </span>
                  <span className="text-base font-black text-foreground tracking-tight">
                    د. محمد صلاح جبر
                  </span>
                </div>
              </div>

              {/* Social Ecosystem */}
              <div className="flex items-center justify-between w-full px-1">
                <a
                  href="https://www.facebook.com/profile.php?id=100000785193419"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/5 text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-110 shadow-sm transition-all duration-300"
                >
                  <Facebook size={16} />
                </a>

                <div className="relative group/qr">
                  <div className="w-10 h-10 p-1.5 bg-white rounded-xl shadow-inner border border-borderColor/40 cursor-help transform group-hover/qr:scale-110 transition-transform">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                      alt="Support QR"
                      className="w-full h-full grayscale group-hover/qr:grayscale-0 transition-all"
                    />
                  </div>
                  {/* Tooltip QR */}
                  <div className="absolute bottom-full mb-3 right-[-10px] w-36 bg-white p-3 rounded-2xl shadow-2xl border border-borderColor ring-1 ring-black/5 opacity-0 group-hover/qr:opacity-100 transition-all pointer-events-none scale-50 group-hover/qr:scale-100 origin-bottom-right z-50">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                      alt="Support QR Large"
                      className="w-full h-full rounded-lg"
                    />
                    <p className="text-[9px] font-extrabold mt-2 text-primary uppercase text-center tracking-tight">
                      دعم فني مباشر
                    </p>
                  </div>
                </div>

                <a
                  href="https://wa.me/201003418068"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-500/5 text-green-600 hover:bg-green-600 hover:text-white hover:scale-110 shadow-sm transition-all duration-300"
                >
                  <MessageCircle size={16} />
                </a>
              </div>

              <div className="text-[10px] text-textMuted font-medium opacity-50">
                © 2024-2026 • AI Medical Suite
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
