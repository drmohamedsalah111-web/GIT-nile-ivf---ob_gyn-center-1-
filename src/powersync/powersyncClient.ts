/// <reference types="vite/client" />
import { WASQLitePowerSyncDatabaseOpenFactory } from '@powersync/web';
import { AppSchema } from './schema';
import { SupabaseConnector } from './SupabaseConnector';

/**
 * PowerSync Singleton (offline-first dev mode)
 *
 * Goals:
 * - Exactly one DB instance for the app lifecycle (including Vite HMR)
 * - Initialization is idempotent (safe to call repeatedly)
 * - No reconnect loops (explicit connect only)
 */

type SingletonState = {
  db: any | null;
  connector: SupabaseConnector | null;
  initPromise: Promise<void> | null;
  connectPromise: Promise<void> | null;
  lastConnectAttemptAt: number;
};

const GLOBAL_KEY = '__powersync_singleton__';

function getState(): SingletonState {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      db: null,
      connector: null,
      initPromise: null,
      connectPromise: null,
      lastConnectAttemptAt: 0
    } satisfies SingletonState;
  }
  return g[GLOBAL_KEY] as SingletonState;
}

const CONNECT_COOLDOWN_MS = 5000;

export function getDb() {
  const state = getState();
  if (!state.db) {
    state.db = new WASQLitePowerSyncDatabaseOpenFactory({
      schema: AppSchema,
      dbFilename: 'powersync.db',
      // @ts-ignore - provided via public/
      workerScriptURL: '/powersync.worker.js'
    }).getInstance();
  }
  return state.db;
}

export async function initPowerSyncOnce(): Promise<void> {
  const state = getState();

  if (state.initPromise) return state.initPromise;

  state.initPromise = (async () => {
    // Ensure DB is constructed once
    getDb();

    // Connector is stateless w.r.t. auth changes (it fetches credentials on demand)
    if (!state.connector) {
      state.connector = new SupabaseConnector();
    }

    console.log('🚀 PowerSync initialized (singleton)');
  })().catch((err) => {
    // If init fails, allow retry by clearing promise
    state.initPromise = null;
    throw err;
  });

  return state.initPromise;
}

export async function connectPowerSync(options?: { force?: boolean }): Promise<void> {
  const state = getState();
  await initPowerSyncOnce();

  const force = options?.force ?? false;
  const now = Date.now();

  if (!force) {
    // Prevent multiple overlapping connects
    if (state.connectPromise) return state.connectPromise;

    // Basic cooldown to avoid spammy manual re-connect clicks
    if (now - state.lastConnectAttemptAt < CONNECT_COOLDOWN_MS) {
      return;
    }
  }

  state.lastConnectAttemptAt = now;

  state.connectPromise = (async () => {
    const db = getDb();
    const connector = state.connector!;

    console.log('🔌 PowerSync connecting...');
    await db.connect(connector);
    console.log('✅ PowerSync connection success');
  })().finally(() => {
    // Always clear so future manual reconnects are possible
    state.connectPromise = null;
  });

  return state.connectPromise;
}
