// PWA Registration and Management
// NOTE: Service Worker registration is handled automatically by VitePWA
// (see vite.config.ts: injectRegister: 'auto')
// This function now focuses on monitoring the SW and handling updates

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // VitePWA auto-registers the SW, but we still need to listen for updates
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        console.warn('⚠️ No service worker registrations found');
        return;
      }

      registrations.forEach((registration) => {
        console.log('✅ Service Worker found:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('📦 New app version available');
                showUpdateNotification();
              }
            });
          }
        });
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 New service worker activated, reloading app...');
        window.location.reload();
      });

      console.log('✅ Service Worker monitoring initialized');
    } catch (error) {
      console.error('❌ Service Worker monitoring failed:', error);
    }
  }
};

const showUpdateNotification = (): void => {
  // Create a toast or notification for app update
  const updateToast = document.createElement('div');
  updateToast.className = 'fixed top-4 left-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg';
  updateToast.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="font-semibold">تحديث متاح</p>
        <p class="text-sm">تم تحديث التطبيق. انقر للتحديث</p>
      </div>
      <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100">
        تحديث
      </button>
    </div>
  `;

  document.body.appendChild(updateToast);

  document.getElementById('update-btn')?.addEventListener('click', () => {
    window.location.reload();
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    updateToast.remove();
  }, 10000);
};

// Check if app is installed
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
};

// Check online status
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Listen for online/offline events
export const setupNetworkListeners = (
  onOnline: () => void,
  onOffline: () => void
): void => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
};

// Initialize PWA features
export const initPWA = async (): Promise<void> => {
  // Suppress manifest.json 401 errors (non-critical)
  const originalError = console.error;
  const manifestErrorHandler = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('manifest.json') && message.includes('401')) {
      // Suppress manifest.json 401 errors - they're non-critical
      return;
    }
    originalError.apply(console, args);
  };
  
  // Temporarily replace console.error to suppress manifest errors
  console.error = manifestErrorHandler as any;

  try {
    // Register service worker
    await registerServiceWorker();

    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
    }

    // Log PWA status
    console.log('PWA Status:', {
      installed: isPWAInstalled(),
      online: isOnline(),
      notifications: permission
    });
  } finally {
    // Restore original console.error after a delay
    setTimeout(() => {
      console.error = originalError;
    }, 2000);
  }
};