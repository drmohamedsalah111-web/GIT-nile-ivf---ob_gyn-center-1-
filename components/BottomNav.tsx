import React from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, Activity, MoreVertical, LogOut } from 'lucide-react';
import { Page } from '../types';

interface Props {
  activePage: Page;
  setPage: (p: Page) => void;
  onLogout: () => void;
}

const BottomNav: React.FC<Props> = ({ activePage, setPage, onLogout }) => {
  const [showMore, setShowMore] = React.useState(false);

  const mainItems = [
    { id: Page.HOME, label: 'الرئيسية', icon: LayoutDashboard },
    { id: Page.RECEPTION, label: 'المرضى', icon: Users },
    { id: Page.GYNECOLOGY, label: 'النساء', icon: Activity },
    { id: Page.IVF, label: 'الخصوبة', icon: Baby },
    { id: Page.OBSTETRICS, label: 'الحمل', icon: Heart },
  ];

  const moreItems = [
    { id: Page.PATIENT_RECORD, label: 'السجلات', icon: 'record', action: null },
    { id: Page.SETTINGS, label: 'الإعدادات', icon: Settings, action: null },
    { id: 'logout', label: 'تسجيل الخروج', icon: LogOut, action: onLogout },
  ];

  const NavButton: React.FC<{ item: any, isActive: boolean }> = ({ item, isActive }) => {
    const Icon = typeof item.icon === 'string' ? null : item.icon;
    return (
      <button
        onClick={() => {
          setPage(item.id);
          setShowMore(false);
        }}
        className={`flex flex-col items-center justify-center flex-1 h-16 min-h-16 transition-colors duration-200 ${
          isActive
            ? 'text-teal-600 bg-teal-50 border-t-4 border-teal-600'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && <Icon className="w-6 h-6 mb-1" />}
        <span className="text-xs font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-xl z-50">
        <div className="flex h-16">
          {mainItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activePage === item.id}
            />
          ))}
          {/* More Menu Button */}
          <div className="relative flex-1 min-h-16">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`w-full h-full flex flex-col items-center justify-center transition-colors duration-200 ${
                showMore
                  ? 'text-teal-600 bg-teal-50 border-t-4 border-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="More options"
              aria-expanded={showMore}
            >
              <MoreVertical className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">المزيد</span>
            </button>

            {/* More Menu Dropdown */}
            {showMore && (
              <div className="absolute bottom-full right-0 left-0 bg-white border border-gray-200 shadow-xl rounded-t-2xl z-50">
                <div className="divide-y divide-gray-100">
                  {moreItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else {
                          setPage(item.id as Page);
                        }
                        setShowMore(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors duration-200 ${
                        activePage === item.id
                          ? 'bg-teal-50 text-teal-600 font-semibold'
                          : item.id === 'logout'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {typeof item.icon === 'string' && item.icon === 'record' && <Activity className="w-5 h-5" />}
                      {typeof item.icon !== 'string' && <item.icon className="w-5 h-5" />}
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay to close menu when clicking outside */}
      {showMore && (
        <div
          className="fixed inset-0 md:hidden z-40"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default BottomNav;
