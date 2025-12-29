import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseFinanceService } from './supabase-finance.service';
import { FinanceSummary } from './types';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  templateUrl: './finance-dashboard.component.html',
})
export class FinanceDashboardComponent implements OnInit {
  private svc = inject(SupabaseFinanceService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  summary: FinanceSummary | null = null;
  ledger: Array<{ payment: any; patient?: any; serviceName?: string }> = [];
  todayClosed = false;

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.todayClosed = await this.svc.isTodayClosed();
      this.summary = await this.svc.getTodayFinanceSummary();
      this.ledger = await this.svc.getTodayLedger();
    } catch (err: any) {
      this.error = err?.message || String(err);
    } finally {
      this.loading = false;
    }
  }

  goNew(): void {
    if (this.todayClosed) return alert('Today is closed');
    this.router.navigateByUrl('/finance/new');
  }

  goClose(): void {
    this.router.navigateByUrl('/finance/close');
  }
}
