/**
 * ThemeContext.tsx
 * Advanced Multi-Theme System for Medical SaaS
 * Supports 5 themes: 2 Light + 3 Dark modes
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 
  | 'clinical-pure'      // Default Light
  | 'soft-harmony'       // Ob/Gyn Light
  | 'midnight-pro'       // Modern Dark
  | 'oled-deep'          // High Contrast Dark
  | 'forest-dim';        // Relaxed Dark

export interface Theme {
  id: ThemeName;
  name: string;
  nameAr: string;
  category: 'light' | 'dark';
  description: string;
  descriptionAr: string;
  icon: string;
}

export const THEMES: Theme[] = [
  {
    id: 'clinical-pure',
    name: 'Clinical Pure',
    nameAr: 'نقاء طبي',
    category: 'light',
    description: 'Clean white interface for bright offices',
    descriptionAr: 'واجهة بيضاء نظيفة للعيادات المضيئة',
    icon: '☀️'
  },
  {
    id: 'soft-harmony',
    name: 'Soft Harmony',
    nameAr: 'انسجام ناعم',
    category: 'light',
    description: 'Warm pink tones for Ob/Gyn departments',
    descriptionAr: 'ألوان وردية دافئة لأقسام النساء والتوليد',
    icon: '🌸'
  },
  {
    id: 'midnight-pro',
    name: 'Midnight Pro',
    nameAr: 'ميدنايت برو',
    category: 'dark',
    description: 'Modern dark mode for long shifts',
    descriptionAr: 'وضع داكن عصري للورديات الطويلة',
    icon: '🌙'
  },
  {
    id: 'oled-deep',
    name: 'OLED Deep',
    nameAr: 'أوليد عميق',
    category: 'dark',
    description: 'High contrast for ultrasound rooms',
    descriptionAr: 'تباين عالي لغرف الموجات الفوق صوتية',
    icon: '🖤'
  },
  {
    id: 'forest-dim',
    name: 'Forest Dim',
    nameAr: 'غابة خافتة',
    category: 'dark',
    description: 'Relaxed warm dark mode',
    descriptionAr: 'وضع داكن دافئ ومريح',
    icon: '🌲'
  }
];

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: Theme[];
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    // Load from localStorage or default
    const savedTheme = localStorage.getItem('app-theme') as ThemeName;
    return savedTheme && THEMES.find(t => t.id === savedTheme) 
      ? savedTheme 
      : 'clinical-pure';
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const isDarkMode = THEMES.find(t => t.id === currentTheme)?.category === 'dark';

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: THEMES, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
