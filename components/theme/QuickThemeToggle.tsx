/**
 * QuickThemeToggle.tsx
 * Simple toggle button to quickly switch between light and dark modes
 * Perfect for adding to headers, toolbars, or floating action buttons
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme, THEMES, ThemeName } from '../../context/ThemeContext';

interface QuickThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export const QuickThemeToggle: React.FC<QuickThemeToggleProps> = ({
  size = 'medium',
  variant = 'icon',
  className = ''
}) => {
  const { currentTheme, setTheme, isDarkMode } = useTheme();

  // Get default light and dark themes
  const defaultLightTheme: ThemeName = 'clinical-pure';
  const defaultDarkTheme: ThemeName = 'midnight-pro';

  const handleToggle = () => {
    if (isDarkMode) {
      // Switch to light mode
      setTheme(defaultLightTheme);
    } else {
      // Switch to dark mode
      setTheme(defaultDarkTheme);
    }
  };

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 22
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surfaceTertiary border border-borderColor transition-all duration-300 ${className}`}
        title={isDarkMode ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      >
        {isDarkMode ? (
          <>
            <Sun size={iconSizes[size]} className="text-warning" />
            <span className="text-xs font-bold">وضع فاتح</span>
          </>
        ) : (
          <>
            <Moon size={iconSizes[size]} className="text-brand" />
            <span className="text-xs font-bold">وضع داكن</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleToggle}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${
          isDarkMode
            ? 'from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20'
            : 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20'
        } border border-borderColor transition-all duration-300 group ${className}`}
        title={isDarkMode ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${
            isDarkMode ? 'bg-indigo-500/20' : 'bg-amber-500/20'
          } group-hover:scale-110 transition-transform`}
        >
          {isDarkMode ? (
            <Sun size={iconSizes[size]} className="text-warning" />
          ) : (
            <Moon size={iconSizes[size]} className="text-brand" />
          )}
        </div>
        <div className="flex-1 text-right">
          <div className="text-xs font-black text-textMain">
            {isDarkMode ? 'وضع فاتح' : 'وضع داكن'}
          </div>
          <div className="text-[10px] text-textMuted font-bold">
            {isDarkMode ? 'أكثر إضاءة' : 'أكثر راحة للعين'}
          </div>
        </div>
      </button>
    );
  }

  // Default: icon only
  return (
    <button
      onClick={handleToggle}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-surface hover:bg-surfaceTertiary border border-borderColor transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
      title={isDarkMode ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun
          size={iconSizes[size]}
          className="text-warning transition-transform rotate-0 hover:rotate-45"
        />
      ) : (
        <Moon
          size={iconSizes[size]}
          className="text-brand transition-transform rotate-0 hover:-rotate-12"
        />
      )}
    </button>
  );
};

export default QuickThemeToggle;
