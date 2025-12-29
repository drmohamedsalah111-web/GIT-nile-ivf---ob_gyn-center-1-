import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  startISO: string;
  endISO: string;
  label?: string;
}

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="date-range">
      <label>Range</label>
      <select (change)="onSelect($any($event.target).value)">
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="month">This month</option>
        <option value="custom">Custom</option>
      </select>

      <div *ngIf="mode==='custom'">
        <label>Start</label>
        <input type="date" [(ngModel)]="customStart" />
        <label>End</label>
        <input type="date" [(ngModel)]="customEnd" />
        <button (click)="emitCustom()">Apply</button>
      </div>
    </div>
  `,
})
export class DateRangeSelectorComponent {
  @Output() rangeSelected = new EventEmitter<DateRange>();
  mode: 'today' | 'week' | 'month' | 'custom' = 'today';
  customStart = '';
  customEnd = '';

  onSelect(mode: string) {
    this.mode = mode as any;
    if (this.mode === 'today') this.emitToday();
    else if (this.mode === 'week') this.emitThisWeek();
    else if (this.mode === 'month') this.emitThisMonth();
  }

  private isoForDate(d: Date): string {
    return d.toISOString();
  }

  private emitToday() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    this.rangeSelected.emit({ startISO: this.isoForDate(start), endISO: this.isoForDate(end), label: 'today' });
  }

  private emitThisWeek() {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    this.rangeSelected.emit({ startISO: this.isoForDate(start), endISO: this.isoForDate(end), label: 'week' });
  }

  private emitThisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    this.rangeSelected.emit({ startISO: this.isoForDate(start), endISO: this.isoForDate(end), label: 'month' });
  }

  emitCustom() {
    if (!this.customStart || !this.customEnd) return;
    const start = new Date(this.customStart + 'T00:00:00');
    const end = new Date(this.customEnd + 'T23:59:59.999');
    this.rangeSelected.emit({ startISO: this.isoForDate(start), endISO: this.isoForDate(end), label: 'custom' });
  }
}
