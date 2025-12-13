import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { validateEnvironment } from '../src/lib/envValidation';

const EnvErrorBanner: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const validation = validateEnvironment();
    if (validation.errors.length > 0) {
      setErrors(validation.errors);
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-900 border-b-2 border-red-700 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="w-6 h-6 text-red-200 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">
                ⚠️ Invalid API Configuration
              </h3>
              <p className="text-red-100 mb-3 text-sm">
                The application cannot start due to missing or invalid environment variables. Please contact the administrator.
              </p>
              <div className="bg-red-800 rounded p-3 text-red-50 text-sm font-mono space-y-1 max-h-48 overflow-y-auto">
                {errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-red-300 flex-shrink-0">✗</span>
                    <span>{error}</span>
                  </div>
                ))}
              </div>
              <p className="text-red-200 mt-3 text-xs">
                <strong>Required Variables:</strong>
              </p>
              <ul className="text-red-200 text-xs mt-1 list-disc list-inside space-y-1">
                <li><code className="bg-red-800 px-2 py-1 rounded">VITE_SUPABASE_URL</code> (must be https://your-project.supabase.co)</li>
                <li><code className="bg-red-800 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code> (JWT token format)</li>
                <li><code className="bg-red-800 px-2 py-1 rounded">VITE_POWERSYNC_URL</code> (optional, for offline sync)</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-200 hover:text-white transition-colors flex-shrink-0 mt-1"
            title="Dismiss (errors will still prevent login)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvErrorBanner;
