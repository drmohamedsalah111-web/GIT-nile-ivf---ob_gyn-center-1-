import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
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
    <div className="min-h-screen bg-gray-50 flex flex-row-reverse font-[Tajawal]">
      <Sidebar activePage={activePage} setPage={setActivePage} />
      
      <main className="flex-1 mr-64 p-8 transition-all duration-300 no-print">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default App;