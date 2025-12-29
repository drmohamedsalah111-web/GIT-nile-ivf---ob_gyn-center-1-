import { Component, inject } from '@angular/core';
import { DateRangeSelectorComponent, DateRange } from './date-range-selector.component';
import { SupabaseFinanceService } from './supabase-finance.service';

@Component({
  selector: 'app-doctor-finance-report',
  standalone: true,
  imports: [DateRangeSelectorComponent],
  templateUrl: './doctor-finance-report.component.html',
})
export class DoctorFinanceReportComponent {
  // inject service for proper DI
  svc = inject(SupabaseFinanceService);

  loading = false;
  error: string | null = null;

  totalRevenue = 0;
  serviceCount = 0;
  breakdown: Array<{ service_id: string; service_name?: string; count: number; total: number }> = [];

  async onRangeSelected(range: DateRange): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const report = await this.svc.getDoctorReport({ startISO: range.startISO, endISO: range.endISO });
      this.totalRevenue = report.totalRevenue;
      this.serviceCount = report.serviceCount;
      this.breakdown = report.breakdown.map((b) => ({ service_id: b.service_id, count: b.count, total: b.total }));
      // resolve service names
      const services = await this.svc.listServices();
      const byId: Record<string, any> = {};
      services.forEach((s) => (byId[s.id] = s));
      this.breakdown.forEach((b) => (b.service_name = byId[b.service_id]?.name));
    } catch (err: any) {
      this.error = String(err?.message || err);
    } finally {
      this.loading = false;
    }
  }
}
