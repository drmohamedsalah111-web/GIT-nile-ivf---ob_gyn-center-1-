import React from 'react';
import { LayoutDashboard, Users, Baby, Heart, Settings, Activity, Shield } from 'lucide-react';
import { Page } from '../types';

interface Props {
  activePage: Page;
  setPage: (p: Page) => void;
}

const BottomNav: React.FC<Props> = ({ activePage, setPage }) => {
  return (
    <nav className="fixed bottom-0 w-full md:hidden bg-white border-t shadow-lg z-50">
      <div className="max-w-3xl mx-auto flex overflow-x-auto">
        <button
          onClick={() => setPage(Page.HOME)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.HOME ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Home"
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="mt-1 text-[12px]">Home</span>
        </button>

        <button
          onClick={() => setPage(Page.GYNECOLOGY)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.GYNECOLOGY ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Gynecology"
        >
          <Activity className="w-6 h-6" />
          <span className="mt-1 text-[12px]">نساء</span>
        </button>

        <button
          onClick={() => setPage(Page.IVF)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.IVF ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="IVF"
        >
          <Baby className="w-6 h-6" />
          <span className="mt-1 text-[12px]">IVF</span>
        </button>

        <button
          onClick={() => setPage(Page.RECEPTION)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.RECEPTION ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Patients"
        >
          <Users className="w-6 h-6" />
          <span className="mt-1 text-[12px]">Patients</span>
        </button>

        <button
          onClick={() => setPage(Page.OBSTETRICS)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.OBSTETRICS ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Obstetrics"
        >
          <Heart className="w-6 h-6" />
          <span className="mt-1 text-[12px]">OB/GYN</span>
        </button>

        <button
          onClick={() => setPage(Page.SETTINGS)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs min-w-fit ${activePage === Page.SETTINGS ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
          <span className="mt-1 text-[12px]">Settings</span>
        </button>

        <button
          onClick={() => setPage(Page.ADMIN)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs min-w-fit ${activePage === Page.ADMIN ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Admin"
        >
          <Shield className="w-6 h-6" />
          <span className="mt-1 text-[12px]">Admin</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
