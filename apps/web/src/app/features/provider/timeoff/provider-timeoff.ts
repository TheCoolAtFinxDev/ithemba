import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface TimeOff {
  id: string;
  startUtc: string;
  endUtc: string;
  reason: string | null;
}

@Component({
  selector: 'app-provider-timeoff',
  imports: [NgIf, NgFor, FormsModule, DatePipe],
  templateUrl: './provider-timeoff.html',
  styleUrl: './provider-timeoff.css',
})
export class ProviderTimeoff implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  providerId = '';
  periods: TimeOff[] = [];
  loading = false;
  error = '';

  showForm = false;
  startDate = '';
  endDate = '';
  reason = '';
  saving = false;
  saveError = '';
  deleteId = '';

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.provider?.id && !this.providerId) {
        this.providerId = p.provider.id;
        this.load();
      }
    });
  }

  load() {
    this.loading = true;
    this.error = '';
    this.http.get<TimeOff[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/time-off`)
      .subscribe({
        next: data => { this.periods = data || []; this.loading = false; },
        error: () => { this.error = 'Could not load time off.'; this.loading = false; },
      });
  }

  openForm() {
    this.startDate = '';
    this.endDate = '';
    this.reason = '';
    this.saveError = '';
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  save() {
    if (!this.startDate || !this.endDate) { this.saveError = 'Start and end dates are required.'; return; }
    if (new Date(this.endDate) < new Date(this.startDate)) { this.saveError = 'End must be after start.'; return; }

    this.saving = true;
    this.saveError = '';
    const startUtc = new Date(this.startDate + 'T00:00:00').toISOString();
    const endUtc   = new Date(this.endDate   + 'T23:59:59').toISOString();

    this.http.post(`${environment.apiUrl}/v1/providers/${this.providerId}/time-off`, {
      startUtc, endUtc, reason: this.reason || undefined,
    }).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); },
      error: e => { this.saveError = e?.error?.message || 'Could not save.'; this.saving = false; },
    });
  }

  remove(id: string) {
    this.deleteId = id;
    this.http.delete(`${environment.apiUrl}/v1/providers/${this.providerId}/time-off/${id}`)
      .subscribe({
        next: () => { this.deleteId = ''; this.load(); },
        error: () => { this.deleteId = ''; },
      });
  }

  today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
