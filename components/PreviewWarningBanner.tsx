import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { detectPreview, shouldAutoRedirectPreview, getAutoRedirectDelay } from '../src/lib/previewDetection';

const PreviewWarningBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const preview = detectPreview();

  useEffect(() => {
    if (!preview.isPreview) {
      return;
    }

    setIsVisible(true);

    if (shouldAutoRedirectPreview()) {
      const delayMs = getAutoRedirectDelay();
      const delaySeconds = Math.round(delayMs / 1000);
      setCountdown(delaySeconds);

      const redirectTimer = setTimeout(() => {
        window.location.href = preview.productionUrl;
      }, delayMs);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(redirectTimer);
        clearInterval(countdownInterval);
      };
    }
  }, [preview.isPreview]);

  if (!isVisible || !preview.isPreview) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-900 border-b-2 border-amber-700 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="w-6 h-6 text-amber-200 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">
                ⚠️ Preview Deployment
              </h3>
              <p className="text-amber-100 mb-2 text-sm">
                You are currently using a <strong>preview deployment</strong> with separate local storage. 
                Data saved here will NOT appear on other devices or the official site.
              </p>
              <p className="text-amber-100 text-sm font-semibold">
                Use the official site: <a 
                  href={preview.productionUrl}
                  className="text-white underline hover:text-amber-200 font-bold"
                >
                  {preview.productionUrl}
                </a>
              </p>
              {countdown !== null && (
                <p className="text-amber-200 text-xs mt-2 font-mono">
                  🔄 Redirecting to production in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-amber-200 hover:text-white transition-colors flex-shrink-0 mt-1"
            title="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewWarningBanner;
