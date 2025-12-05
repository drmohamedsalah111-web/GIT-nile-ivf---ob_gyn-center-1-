import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { Page } from './types';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import ClinicalStation from './pages/ClinicalStation';
import IvfJourney from './pages/IvfJourney';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.HOME);

  const renderContent = () => {
    switch (activePage) {
      case Page.HOME: return <Dashboard />;
      case Page.RECEPTION: return <Reception />;
      case Page.CLINICAL: return <ClinicalStation />;
      case Page.IVF: return <IvfJourney />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row-reverse font-[Tajawal]">
      {/* Sidebar: hidden on mobile, visible md+ */}
      <div className="hidden md:flex">
        <Sidebar activePage={activePage} setPage={setActivePage} />
      </div>

      <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <BottomNav activePage={activePage} setPage={setActivePage} />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default App;