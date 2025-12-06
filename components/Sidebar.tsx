import React from 'react';
import { LayoutDashboard, Users, Stethoscope, Baby, Heart, Settings, LogOut } from 'lucide-react';
import { Page, Doctor } from '../types';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  doctorProfile: Doctor | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, doctorProfile }) => {
  const menuItems = [
    { id: Page.HOME, label: 'Dashboard', icon: LayoutDashboard },
    { id: Page.RECEPTION, label: 'Reception', icon: Users },
    { id: Page.GYNECOLOGY, label: 'قسم النسائية', icon: Heart },
    { id: Page.OBSTETRICS, label: 'قسم الولادة', icon: Baby },
    { id: Page.IVF, label: 'رحلة التلقيح', icon: Stethoscope },
    { id: Page.SETTINGS, label: 'الإعدادات', icon: Settings },
  ];

  const clinicName = doctorProfile?.clinic_name || 'Dr. Mohamed Salah Gabr System';
  const clinicImage = doctorProfile?.clinic_image;

  return (
    // Hidden on mobile, visible from md and up
    <div className="hidden md:w-64 md:flex md:flex-col bg-white h-screen shadow-lg fixed md:static inset-y-0 right-0 z-10 no-print">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          {clinicImage ? (
            <img
              src={clinicImage}
              alt="Clinic logo"
              className="w-12 h-12 rounded-full object-cover mb-2"
            />
          ) : (
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-2">
              <Baby className="text-teal-700 w-8 h-8" />
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-800">{clinicName}</h1>
          <p className="text-xs text-gray-400 uppercase tracking-wider">EMR System</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};