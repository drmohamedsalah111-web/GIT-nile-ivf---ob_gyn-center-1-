/// <reference types="vite/client" />

export interface PreviewInfo {
  isPreview: boolean;
  productionUrl: string;
  currentHost: string;
}

export function detectPreview(): PreviewInfo {
  const host = window.location.host;
  const protocol = window.location.protocol;
  
  const PRODUCTION_HOST = 'mosalahicsi.pages.dev';
  const isPreview = host.endsWith('.pages.dev') && host !== PRODUCTION_HOST;
  const productionUrl = `${protocol}//${PRODUCTION_HOST}`;

  return {
    isPreview,
    productionUrl,
    currentHost: host
  };
}

export function shouldAutoRedirectPreview(): boolean {
  return import.meta.env.VITE_AUTO_REDIRECT_PREVIEW === 'true';
}

export function getAutoRedirectDelay(): number {
  const delayStr = import.meta.env.VITE_AUTO_REDIRECT_DELAY;
  return delayStr ? parseInt(delayStr, 10) : 3000; // 3 seconds default
}
