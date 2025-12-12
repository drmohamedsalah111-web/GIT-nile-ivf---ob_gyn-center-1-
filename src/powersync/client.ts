/**
 * Legacy client exports.
 *
 * NOTE: The app should use `src/powersync/powersyncClient.ts` for singleton init/connect/db.
 * This file is kept as a compatibility shim to minimize changes.
 */

import { connectPowerSync, getDb, initPowerSyncOnce } from './powersyncClient';

// Backwards-compatible exports used across the app
export const powerSyncDb = getDb();
export const initPowerSync = initPowerSyncOnce;
export { connectPowerSync, getDb };

// Backwards compat alias used in some older imports
export const connector = undefined as any;
