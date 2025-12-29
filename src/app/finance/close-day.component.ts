import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupabaseFinanceService } from './supabase-finance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-close-day',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './close-day.component.html',
})
export class CloseDayComponent implements OnInit {
  private svc = inject(SupabaseFinanceService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  systemTotal = 0;
  dayClosed = false;

  form = new FormGroup({
    countedCash: new FormControl<number | null>(null),
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.dayClosed = await this.svc.isTodayClosed();
      const sum = await this.svc.getTodayFinanceSummary();
      this.systemTotal = sum.totalPaymentsToday || 0;
    } catch (err: any) {
      this.error = String(err?.message || err);
    } finally {
      this.loading = false;
    }
  }

  get difference(): number {
    const counted = Number(this.form.get('countedCash')?.value || 0);
    return counted - this.systemTotal;
  }

  async confirmClose(): Promise<void> {
    if (this.dayClosed) return alert('Today is already closed');
    const counted = Number(this.form.get('countedCash')?.value);
    if (isNaN(counted)) return alert('Enter counted cash');

    this.loading = true;
    try {
      await this.svc.closeDay(counted);
      alert('Day closed');
      this.router.navigateByUrl('/finance');
    } catch (err: any) {
      this.error = String(err?.message || err);
    } finally {
      this.loading = false;
    }
  }

  cancel(): void {
    this.router.navigateByUrl('/finance');
  }
}
