import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

interface AddPatientPayload {
  name: string;
  age?: number;
  phone?: string;
  husband_name?: string;
  history?: string;
}

interface AddPatientResponse {
  ok?: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientsService {
  private supabase: SupabaseClient;
  private functionUrl: string;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseAnonKey = environment.supabaseAnonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and ANON KEY are required in environment config');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.functionUrl = `${supabaseUrl}/functions/v1/add-patient`;
  }

  async addPatient(payload: AddPatientPayload): Promise<AddPatientResponse> {
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: 'Not authenticated' };
    }

    const accessToken = session.access_token;

    try {
      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data: AddPatientResponse = await response.json();
      return data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
