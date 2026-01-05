import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavigationButtonsProps {
  className?: string;
  showHome?: boolean;
  homeRoute?: string;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({ 
  className = '', 
  showHome = true,
  homeRoute = '/'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const canGoBack = window.history.length > 1;
  const canGoForward = window.history.state?.idx < window.history.length - 1;
  const isNotHome = location.pathname !== homeRoute;

  const buttonBaseClass = `
    inline-flex items-center justify-center
    transition-all duration-300 ease-in-out
    rounded-xl
    px-3 py-2
    min-w-[44px]
    group
    relative
    overflow-hidden
    ${isDarkMode 
      ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/60 hover:to-gray-700/60 border border-gray-600/30' 
      : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200/50 shadow-sm hover:shadow-md'
    }
  `;

  const iconClass = `
    w-5 h-5 transition-all duration-300
    ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-blue-600'}
  `;

  const disabledClass = `
    opacity-40 cursor-not-allowed
    ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'}
  `;

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      navigate(1);
    }
  };

  const handleHome = () => {
    if (isNotHome) {
      navigate(homeRoute);
    }
  };

  const isVertical = className?.includes('flex-col');
  
  return (
    <div className={`flex items-center ${isVertical ? 'flex-col' : ''} gap-2 ${className}`}>
      {/* زر الرجوع */}
      <button
        onClick={handleBack}
        disabled={!canGoBack}
        className={`${buttonBaseClass} ${!canGoBack ? disabledClass : ''}`}
        title="رجوع للخلف"
        aria-label="رجوع للخلف"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <ArrowRight className={iconClass} />
      </button>

      {/* زر التقدم */}
      <button
        onClick={handleForward}
        disabled={!canGoForward}
        className={`${buttonBaseClass} ${!canGoForward ? disabledClass : ''}`}
        title="تقدم للأمام"
        aria-label="تقدم للأمام"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <ArrowLeft className={iconClass} />
      </button>

      {/* فاصل */}
      {showHome && (
        <div className={`${isVertical ? 'h-px w-6' : 'w-px h-6'} ${isDarkMode ? 'bg-gray-600/50' : 'bg-gray-300/50'}`} />
      )}

      {/* زر الرئيسية */}
      {showHome && (
        <button
          onClick={handleHome}
          disabled={!isNotHome}
          className={`${buttonBaseClass} ${!isNotHome ? disabledClass : ''}`}
          title="الرئيسية"
          aria-label="الرئيسية"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Home className={`${iconClass} group-hover:scale-110`} />
        </button>
      )}
    </div>
  );
};

// نسخة مصغرة للهواتف المحمولة
export const NavigationButtonsMobile: React.FC<NavigationButtonsProps> = ({ 
  className = '', 
  showHome = true,
  homeRoute = '/'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const canGoBack = window.history.length > 1;
  const canGoForward = window.history.state?.idx < window.history.length - 1;
  const isNotHome = location.pathname !== homeRoute;

  const buttonClass = `
    p-2 rounded-lg transition-all duration-200
    ${isDarkMode 
      ? 'bg-gray-800/70 active:bg-gray-700 text-gray-300' 
      : 'bg-white/90 active:bg-gray-100 text-gray-700'
    }
    shadow-sm active:shadow-none
  `;

  const disabledClass = 'opacity-30 cursor-not-allowed';
  const iconSize = 'w-5 h-5';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => canGoBack && navigate(-1)}
        disabled={!canGoBack}
        className={`${buttonClass} ${!canGoBack ? disabledClass : ''}`}
        aria-label="رجوع"
      >
        <ArrowRight className={iconSize} />
      </button>

      <button
        onClick={() => canGoForward && navigate(1)}
        disabled={!canGoForward}
        className={`${buttonClass} ${!canGoForward ? disabledClass : ''}`}
        aria-label="للأمام"
      >
        <ArrowLeft className={iconSize} />
      </button>

      {showHome && (
        <>
          <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <button
            onClick={() => isNotHome && navigate(homeRoute)}
            disabled={!isNotHome}
            className={`${buttonClass} ${!isNotHome ? disabledClass : ''}`}
            aria-label="الرئيسية"
          >
            <Home className={iconSize} />
          </button>
        </>
      )}
    </div>
  );
};

export default NavigationButtons;
