// PWA functionality disabled - using online-only Supabase architecture
// This file is kept for compatibility but all functions are no-ops

export const registerServiceWorker = async (): Promise<void> => {
  console.log('ℹ️ Service worker registration disabled (online-only app)');
};

export const isPWAInstalled = (): boolean => {
  return false;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  return 'denied';
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const setupNetworkListeners = (
  onOnline: () => void,
  onOffline: () => void
): void => {
  // Network listeners not needed for online-only app
};

export const initPWA = async (): Promise<void> => {
  // PWA initialization disabled
};
