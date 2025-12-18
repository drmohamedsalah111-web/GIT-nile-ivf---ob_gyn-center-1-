import React from 'react';
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasError?: boolean;
  isComplete?: boolean;
  alertMessage?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  description,
  icon,
  isOpen,
  onToggle,
  children,
  hasError = false,
  isComplete = false,
  alertMessage,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-4">
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition ${
          isOpen ? 'bg-gray-50 border-b border-gray-200' : ''
        }`}
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          {icon && <div className="text-2xl">{icon}</div>}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasError && <AlertCircle className="w-5 h-5 text-red-600" />}
          {isComplete && !hasError && <CheckCircle className="w-5 h-5 text-green-600" />}
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 space-y-4">
          {alertMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{alertMessage}</p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionSection;
