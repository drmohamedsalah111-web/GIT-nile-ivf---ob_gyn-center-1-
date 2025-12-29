import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseFinanceService } from './supabase-finance.service';

@Component({
  selector: 'app-new-collection',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-collection.component.html',
})
export class NewCollectionComponent implements OnInit {
  private svc = inject(SupabaseFinanceService);
  private router = inject(Router);

  form = new FormGroup({
    patientId: new FormControl<string | null>(null),
    appointmentId: new FormControl<string | null>(null),
    serviceId: new FormControl<string | null>(null),
    price: new FormControl<string | number | null>(null),
  });

  patients: Array<any> = [];
  appointments: Array<any> = [];
  services: Array<any> = [];

  loading = false;
  error: string | null = null;
  dayClosed = false;

  ngOnInit(): void {
    this.loadServices();
    this.checkClosed();

    this.form.get('serviceId')?.valueChanges.subscribe((svcId) => {
      const svc = this.services.find((s) => s.id === svcId);
      if (svc) this.form.get('price')?.setValue(svc.price);
    });

    this.form.get('patientId')?.valueChanges.subscribe(async (patientId) => {
      this.appointments = [];
      this.form.get('appointmentId')?.setValue(null);
      if (patientId) {
        try {
          this.appointments = await this.svc.getAppointmentsForPatient(patientId);
        } catch (err: any) {
          this.error = String(err?.message || err);
        }
      }
    });
  }

  async checkClosed(): Promise<void> {
    try {
      this.dayClosed = await this.svc.isTodayClosed();
    } catch (err: any) {
      this.error = String(err?.message || err);
    }
  }

  async loadServices(): Promise<void> {
    try {
      this.services = await this.svc.listServices();
    } catch (err: any) {
      this.error = String(err?.message || err);
    }
  }

  async searchPatients(term: string): Promise<void> {
    if (!term || term.trim().length < 1) {
      this.patients = [];
      return;
    }
    try {
      this.patients = await this.svc.searchPatients(term);
    } catch (err: any) {
      this.error = String(err?.message || err);
    }
  }

  selectPatient(patient: any): void {
    this.form.get('patientId')?.setValue(patient.id);
    this.patients = [];
  }

  async submit(): Promise<void> {
    if (this.dayClosed) return alert('Today is closed');
    const patientId = this.form.get('patientId')?.value;
    const serviceId = this.form.get('serviceId')?.value;
    const appointmentId = this.form.get('appointmentId')?.value || null;
    const price = this.form.get('price')?.value;

    if (!patientId || !serviceId || !price) return alert('Fill patient, service and price');

    this.loading = true;
    try {
      await this.svc.createChargeAndPayment({
        patient_id: patientId,
        appointment_id: appointmentId,
        service_id: serviceId,
        price_at_time: price,
      });
      alert('Collection recorded');
      this.router.navigateByUrl('/finance');
    } catch (err: any) {
      this.error = err?.message || String(err);
    } finally {
      this.loading = false;
    }
  }

  cancel(): void {
    this.router.navigateByUrl('/finance');
  }
}
