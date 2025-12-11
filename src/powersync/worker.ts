// PowerSync Web Worker
// This file is part of the PowerSync worker setup
// The actual worker implementation is handled by @powersync/web package
// and the worker script is served from /powersync.worker.js

// Re-export the necessary types and utilities from @powersync/web
// This ensures proper TypeScript compilation and module resolution
export * from '@powersync/web';

// The worker implementation is automatically handled by the WASQLitePowerSyncDatabaseOpenFactory
// when workerScriptURL is provided in client.ts
// No additional worker setup is needed here as it's managed by the main client