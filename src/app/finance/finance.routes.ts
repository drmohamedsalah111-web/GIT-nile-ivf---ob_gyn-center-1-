import type { Routes } from '@angular/router';
import { FinanceDashboardComponent } from './finance-dashboard.component';
import { NewCollectionComponent } from './new-collection.component';
import { CloseDayComponent } from './close-day.component';
import { DoctorFinanceReportComponent } from './doctor-finance-report.component';

export const FINANCE_ROUTES: Routes = [
  { path: 'finance', component: FinanceDashboardComponent },
  { path: 'finance/new', component: NewCollectionComponent },
  { path: 'finance/close', component: CloseDayComponent },
  { path: 'doctor/finance', component: DoctorFinanceReportComponent },
];
