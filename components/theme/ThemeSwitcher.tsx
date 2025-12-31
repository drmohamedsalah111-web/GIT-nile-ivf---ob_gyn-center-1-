/**
 * ThemeSwitcher.tsx
 * UI Component for switching between themes
 * Supports both dropdown and modal views
 */

import React, { useState } from 'react';
import { Palette, Check, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme, THEMES, ThemeName } from '../../context/ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'modal' | 'compact';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'dropdown' }) => {
  const { currentTheme, setTheme, isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full p-2.5 rounded-xl hover:bg-surface transition-all duration-300 border border-transparent hover:border-borderColor/20 group"
        title="تغيير المظهر"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className={`size-4 transition-colors ${isOpen ? 'text-brand' : 'text-textSecondary group-hover:text-brand'}`} />
            <span className="text-xs font-bold text-textMain">المظهر</span>
          </div>
          <span className="text-xs font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full">
            {THEMES.find(t => t.id === currentTheme)?.nameAr}
          </span>
        </div>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 bottom-full mb-3 w-64 bg-background border border-borderColor rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
              <div className="p-3 border-b border-borderColor bg-surface/50">
                <div className="text-[10px] font-black text-brand uppercase tracking-widest">اختر الستايل المفضل</div>
              </div>
              <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-surface transition-all duration-200 group/item ${currentTheme === theme.id ? 'bg-brand/5' : ''
                      }`}
                  >
                    <span className="text-xl group-hover/item:scale-125 transition-transform duration-200">{theme.icon}</span>
                    <div className="flex-1 text-right">
                      <div className={`font-black text-xs ${currentTheme === theme.id ? 'text-brand' : 'text-textMain'}`}>{theme.nameAr}</div>
                      <div className="text-[10px] text-textMuted font-bold">{theme.descriptionAr}</div>
                    </div>
                    {currentTheme === theme.id && (
                      <Check className="size-4 text-brand animate-in zoom-in" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </button>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surfaceTertiary rounded-lg transition-colors"
        >
          <Palette className="w-5 h-5" />
          <span>تغيير المظهر</span>
        </button>

        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
            <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-textMain">اختر المظهر</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Light Themes */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-5 h-5 text-warning" />
                  <h3 className="font-semibold text-textMain">الوضع النهاري</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {THEMES.filter(t => t.category === 'light').map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={currentTheme === theme.id}
                      onClick={() => {
                        setTheme(theme.id);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Dark Themes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Moon className="w-5 h-5 text-brand" />
                  <h3 className="font-semibold text-textMain">الوضع الليلي</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {THEMES.filter(t => t.category === 'dark').map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={currentTheme === theme.id}
                      onClick={() => {
                        setTheme(theme.id);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-surfaceTertiary rounded-xl transition-all duration-300 border border-borderColor/10 group"
      >
        <div className="flex items-center gap-2">
          <Palette className={`size-4 transition-colors ${isOpen ? 'text-brand' : 'text-textSecondary group-hover:text-brand'}`} />
          <span className="text-xs font-bold text-textMain">الستايل</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full">
            {THEMES.find(t => t.id === currentTheme)?.nameAr}
          </span>
          <ChevronDown className={`size-3 text-textSecondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 bottom-full mb-3 w-64 bg-background border border-borderColor rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 border-b border-borderColor bg-surface/50">
              <div className="text-[10px] font-black text-brand uppercase tracking-widest">مظهر النظام</div>
            </div>
            <div className="max-h-[320px] overflow-y-auto no-scrollbar scroll-smooth">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-surface transition-all duration-200 group/item ${currentTheme === theme.id ? 'bg-brand/5' : ''
                    }`}
                >
                  <span className="text-xl group-hover/item:scale-125 transition-transform duration-200">{theme.icon}</span>
                  <div className="flex-1 text-right">
                    <div className={`font-black text-xs ${currentTheme === theme.id ? 'text-brand' : 'text-textMain'}`}>{theme.nameAr}</div>
                    <div className="text-[10px] text-textMuted font-bold">{theme.descriptionAr}</div>
                  </div>
                  {currentTheme === theme.id && (
                    <Check className="size-4 text-brand animate-in zoom-in" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Theme Card Component for Modal View
interface ThemeCardProps {
  theme: typeof THEMES[0];
  isActive: boolean;
  onClick: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${isActive
        ? 'border-brand bg-brand/10'
        : 'border-borderColor hover:border-brand/50 bg-surface'
        }`}
    >
      {isActive && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="text-3xl mb-2">{theme.icon}</div>
      <div className="font-semibold text-textMain mb-1">{theme.nameAr}</div>
      <div className="text-xs text-textMuted">{theme.descriptionAr}</div>
    </button>
  );
};

export default ThemeSwitcher;
