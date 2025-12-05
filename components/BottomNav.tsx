import React from 'react';
import { LayoutDashboard, Users, Stethoscope, Baby } from 'lucide-react';
import { Page } from '../types';

interface Props {
  activePage: Page;
  setPage: (p: Page) => void;
}

const BottomNav: React.FC<Props> = ({ activePage, setPage }) => {
  return (
    <nav className="fixed bottom-0 w-full md:hidden bg-white border-t shadow-lg z-50">
      <div className="max-w-3xl mx-auto grid grid-cols-4">
        <button
          onClick={() => setPage(Page.HOME)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.HOME ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Home"
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="mt-1 text-[12px]">Home</span>
        </button>

        <button
          onClick={() => setPage(Page.CLINICAL)}
          className={`py-2 px-1 flex flex-col items-center justify-center text-xs ${activePage === Page.CLINICAL ? 'text-teal-600' : 'text-gray-500'}`}
          aria-label="Clinic"
        >
          <Stethoscope className="w-6 h-6" />
          <span className="mt-1 text-[12px]">Clinic</span>
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
      </div>
    </nav>
  );
};

export default BottomNav;
