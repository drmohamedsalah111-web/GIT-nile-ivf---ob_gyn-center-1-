/**
 * ReceptionLayout.tsx
 * Simplified layout for clinic receptionist/secretary
 * Focuses on: Appointments, Patients, Waiting List, Daily Cash
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  Wallet, 
  LogOut, 
  Baby,
  Menu,
  X
} from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';

interface ReceptionLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  userName?: string;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'الرئيسية', icon: Clock },
  { id: 'appointments', label: 'المواعيد', icon: Calendar },
  { id: 'patients', label: 'المرضى', icon: Users },
  { id: 'cash', label: 'الصندوق اليومي', icon: Wallet },
] as const;

export const ReceptionLayout: React.FC<ReceptionLayoutProps> = ({
  children,
  activePage,
  onPageChange,
  onLogout,
  userName = 'السكرتيرة'
}) => {
  const { branding } = useBranding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 bg-white border-l border-gray-200 flex-col">
        {/* Clinic Branding */}
        <div 
          className="p-6 border-b border-gray-200"
          style={{ backgroundColor: branding?.background_color || '#ffffff' }}
        >
          <div className="flex flex-col items-center">
            {branding?.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt="Logo" 
                className="w-16 h-16 rounded-full mb-3 object-cover border-2" 
                style={{ borderColor: branding?.primary_color || '#10b981' }}
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${branding?.primary_color || '#10b981'}20` }}
              >
                <Baby className="w-10 h-10" style={{ color: branding?.primary_color || '#10b981' }} />
              </div>
            )}
            <h1 
              className="text-lg font-bold text-center"
              style={{ 
                color: branding?.text_color || '#1f2937',
                fontFamily: branding?.header_font || 'Tajawal'
              }}
            >
              {branding?.clinic_name || 'Nile IVF Center'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">مكتب الاستقبال</p>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 bg-teal-50 border-b border-teal-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
              {userName.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">سكرتيرة الاستقبال</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Clock & Date */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatTime(currentTime)}</div>
            <div className="text-xs text-gray-500 mt-1">{formatDate(currentTime)}</div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">القائمة</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="py-4">
          <ul className="space-y-1 px-3">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Baby className="w-6 h-6 text-teal-600" />
            <span className="font-semibold text-gray-900">مكتب الاستقبال</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ReceptionLayout;
