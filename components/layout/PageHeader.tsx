import React from 'react';
import { NavigationButtons } from '../common/NavigationButtons';
import { useTheme } from '../../context/ThemeContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  showNavigation?: boolean;
  homeRoute?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  showNavigation = true,
  homeRoute = '/'
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div 
      className={`
        sticky top-0 z-40 backdrop-blur-lg border-b transition-all duration-300
        ${isDarkMode 
          ? 'bg-gray-900/80 border-gray-700/50 shadow-lg shadow-black/10' 
          : 'bg-white/80 border-gray-200/50 shadow-sm'
        }
      `}
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Right Side - Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Title Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {icon && (
                <div 
                  className={`
                    flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                    ${isDarkMode 
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400' 
                      : 'bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600'
                    }
                    shadow-sm
                  `}
                >
                  {icon}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <h1 
                  className={`
                    text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}
                  `}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p 
                    className={`
                      text-xs sm:text-sm truncate mt-0.5
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    `}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Left Side - Actions */}
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
