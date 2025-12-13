export async function checkOfflineReadiness() {
  // Only run in DEV or on preview deployments
  if (!import.meta.env.DEV && !window.location.host.includes('.pages.dev')) {
    return;
  }

  const swSupported = 'serviceWorker' in navigator;
  let swController = null;
  let swScope = null;

  try {
    swController = navigator.serviceWorker?.controller;
    const swRegistration = await navigator.serviceWorker?.getRegistration();
    swScope = swRegistration?.scope;
  } catch (e) {
    // Ignore errors
  }

  // Find wasm URL
  let wasmUrl: string | null = null;
  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const wasmEntry = resources.find(entry =>
      entry.name.endsWith('.wasm') && entry.name.includes('wa-sqlite')
    );
    if (wasmEntry) {
      wasmUrl = wasmEntry.name;
    } else {
      // Fallback: fetch current HTML and regex match
      const html = await fetch(window.location.href).then(r => r.text());
      const match = html.match(/\/assets\/[^"]*\.wasm/);
      if (match) {
        wasmUrl = window.location.origin + match[0];
      }
    }
  } catch (e) {
    // Ignore errors
  }

  // Find worker URL
  let workerUrl: string | null = null;
  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const workerEntry = resources.find(entry =>
      entry.name.includes('.worker-') && entry.name.endsWith('.js')
    );
    if (workerEntry) {
      workerUrl = workerEntry.name;
    }
  } catch (e) {
    // Ignore errors
  }

  // Probe wasm if online
  let probeResult = 'skipped';
  if (navigator.onLine && wasmUrl) {
    try {
      const res = await fetch(wasmUrl, { method: 'HEAD' });
      probeResult = res.ok ? 'ok' : 'failed';
    } catch (e) {
      probeResult = 'failed';
    }
  } else if (!navigator.onLine) {
    probeResult = 'offline';
  }

  // Log summary
  console.group('Offline Readiness Check ✅');
  console.log('SW supported:', swSupported ? 'yes' : 'no');
  console.log('SW controlling page:', swController ? 'yes' : 'no');
  console.log('SW scope:', swScope || 'none');
  console.log('Found wasm url:', wasmUrl || 'not found');
  console.log('Probe result:', probeResult);
  console.log('Found worker url:', workerUrl || 'not found');
  console.log('Hint: Open once online, wait, refresh, then go offline and refresh.');
  console.groupEnd();
}