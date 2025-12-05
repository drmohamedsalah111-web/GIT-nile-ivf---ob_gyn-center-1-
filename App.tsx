import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { Page } from './types';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import ClinicalStation from './pages/ClinicalStation';
import IvfJourney from './pages/IvfJourney';
import { Login } from './pages/Login';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/authService';
import { LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.HOME);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('No user logged in');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const subscription = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setActivePage(Page.HOME);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Tajawal]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLoginSuccess={() => setActivePage(Page.HOME)} />
        <Toaster position="top-center" reverseOrder={false} />
      </>
    );
  }

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
      <div className="hidden md:flex">
        <Sidebar activePage={activePage} setPage={setActivePage} />
      </div>

      <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              مرحباً، {user?.email}
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-200 font-[Tajawal]"
            >
              <LogOut size={18} />
              تسجيل الخروج
            </button>
          </div>
          {renderContent()}
        </div>
      </main>

      <BottomNav activePage={activePage} setPage={setActivePage} />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default App;