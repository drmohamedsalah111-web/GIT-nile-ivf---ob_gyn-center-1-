import { BaseObserver } from '@powersync/web';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

const FATAL_RESPONSE_CODES = [
  /^22\d{3}$/, // Postgres data exception
  /^23\d{3}$/, // Integrity constraint violation
  /^42\d{3}$/, // Syntax / access rule
  /^PGRST\d{3}$/, // Supabase PostgREST errors
];

export type SupabaseConnectorConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  powersyncUrl: string;
};

type SupabaseConnectorListener = {
  sessionStarted?: (session: Session) => void;
};

export class SupabaseConnector extends BaseObserver<SupabaseConnectorListener> {
  readonly client: SupabaseClient;
  readonly config: SupabaseConnectorConfig;
  currentSession: Session | null = null;
  ready = false;

  constructor(config?: Partial<SupabaseConnectorConfig>) {
    super();

    this.config = {
      supabaseUrl: config?.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: config?.supabaseAnonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
      powersyncUrl: config?.powersyncUrl ?? import.meta.env.VITE_POWERSYNC_URL,
    };

    this.client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    });
  }

  async init() {
    if (this.ready) return;
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      console.error('Error getting Supabase session', error);
    }
    this.updateSession(data.session ?? null);
    this.ready = true;
  }

  async loginAnon() {
    const {
      data: { session },
      error,
    } = await this.client.auth.signInAnonymously();

    if (error) {
      console.error('Supabase anonymous login error:', error);
      throw error;
    }

    this.updateSession(session);
  }

  async fetchCredentials() {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error?.message ?? 'No session'}`);
    }

    return {
      endpoint: this.config.powersyncUrl,
      token: session.access_token ?? '',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: any) {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) return;

    let lastOp: any = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table);
        let result;

        switch (op.op) {
          case 'PUT': {
            const record = { ...op.opData, id: op.id };
            result = await table.upsert(record);
            break;
          }
          case 'PATCH':
            result = await table.update(op.opData).eq('id', op.id);
            break;
          case 'DELETE':
            result = await table.delete().eq('id', op.id);
            break;
        }

        if (result?.error) {
          console.error(result.error);
          throw new Error(
            `Could not update Supabase. Received error: ${result.error.message}`
          );
        }
      }

      await transaction.complete();
    } catch (ex: any) {
      console.debug('Upload error', ex);
      if (
        typeof ex.code === 'string' &&
        FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))
      ) {
        console.log(`Data upload error - discarding`, lastOp, ex);
        await transaction.complete();
      } else {
        throw ex;
      }
    }
  }

  private updateSession(session: Session | null) {
    this.currentSession = session;
    if (!session) return;

    this.iterateListeners((cb) => cb.sessionStarted?.(session));
  }
}
