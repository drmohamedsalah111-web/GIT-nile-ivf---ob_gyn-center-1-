import React from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, Activity, FileText, LogOut, Brain } from 'lucide-react';
import { Page } from '../types';

interface Props {
  activePage: Page;
  setPage: (p: Page) => void;
  onLogout: () => void;
}

const BottomNav: React.FC<Props> = ({ activePage, setPage, onLogout }) => {
  // Consolidated navigation items in logical order
  const navItems = [
    { id: Page.HOME, label: 'الرئيسية', icon: LayoutDashboard, action: null },
    { id: Page.RECEPTION, label: 'المرضى', icon: Users, action: null },
    { id: Page.GYNECOLOGY, label: 'النساء', icon: Activity, action: null },
    { id: Page.OBSTETRICS, label: 'الحمل', icon: Heart, action: null },
    { id: Page.IVF, label: 'الخصوبة', icon: Baby, action: null },
    { id: Page.SMART_IVF, label: 'IVF ذكي', icon: Brain, action: null },
    { id: Page.PATIENT_RECORD, label: 'السجلات', icon: FileText, action: null },
    { id: Page.SETTINGS, label: 'الإعدادات', icon: Settings, action: null },
    { id: 'logout', label: 'خروج', icon: LogOut, action: onLogout },
  ];

  const NavButton: React.FC<{ item: any, isActive: boolean }> = ({ item, isActive }) => {
    const Icon = typeof item.icon === 'string' ? null : item.icon;
    return (
      <button
        onClick={() => {
          if (item.action) {
            item.action();
          } else {
            setPage(item.id);
          }
        }}
        className={`flex-none flex flex-col items-center justify-center min-w-[4.5rem] py-2 pb-safe transition-colors duration-200 ${isActive
            ? 'text-teal-600 bg-teal-50 border-t-4 border-teal-600'
            : item.id === 'logout'
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && <Icon className="w-5 h-5 mb-1" />}
        <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Bottom Navigation - Horizontally Scrollable */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-xl z-50">
        <div className="flex overflow-x-auto w-full bg-white border-t border-gray-200 no-scrollbar">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activePage === item.id}
            />
          ))}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
