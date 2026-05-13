import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Appointment {
  id: string;
  startUtc: string;
  endUtc: string;
  status: string;
  reason: string;
  provider: { id: string; firstName: string; lastName: string; clinicName: string; specialization: string };
}

interface ApptView {
  id: string;
  start: Date;
  label: string;
  dateLabel: string;
  clinic: string;
  doctor: string;
  status: string;
  statusText: string;
  statusSlug: string;
}

function statusText(s: string): string {
  const map: Record<string, string> = {
    Requested: 'Requested', Scheduled: 'Scheduled', Confirmed: 'Confirmed',
    Rescheduled: 'Rescheduled', CheckedIn: 'Checked In', InProgress: 'In Progress',
    Completed: 'Completed', CancelledByPatient: 'Cancelled', CancelledByProvider: 'Cancelled by Provider',
    NoShow: 'No Show',
  };
  return map[s] ?? s;
}

function statusSlug(s: string): string {
  if (!s) return 'st-unknown';
  const l = s.toLowerCase();
  if (l === 'requested') return 'st-requested';
  if (l === 'scheduled') return 'st-scheduled';
  if (l === 'confirmed') return 'st-confirmed';
  if (l === 'rescheduled') return 'st-rescheduled';
  if (l === 'checkedin') return 'st-checkedin';
  if (l === 'inprogress') return 'st-inprogress';
  if (l === 'completed') return 'st-completed';
  if (l.includes('cancel') || l === 'noshow') return 'st-cancelled';
  return 'st-unknown';
}

@Component({
  selector: 'app-patient-appointments',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './patient-appointments.html',
  styleUrl: './patient-appointments.css',
})
export class PatientAppointments implements OnInit {
  @Output() openDetail = new EventEmitter<string>();
  @Output() openBook = new EventEmitter<void>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  tab: 'upcoming' | 'past' = 'upcoming';
  all: ApptView[] = [];
  loading = false;
  error = '';
  private patientId = '';

  get list(): ApptView[] {
    const now = Date.now();
    return this.all
      .filter(a => this.tab === 'upcoming' ? a.start.getTime() >= now : a.start.getTime() < now)
      .sort((a, b) => this.tab === 'upcoming'
        ? a.start.getTime() - b.start.getTime()
        : b.start.getTime() - a.start.getTime());
  }

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id && !this.patientId) {
        this.patientId = p.patient.id;
        this.load();
      }
    });
  }

  setTab(t: 'upcoming' | 'past') { this.tab = t; }

  refresh() { this.load(); }

  load() {
    if (!this.patientId || this.loading) return;
    this.loading = true;
    this.error = '';
    this.http.get<Appointment[]>(`${environment.apiUrl}/patients/${this.patientId}/appointments`)
      .subscribe({
        next: data => {
          this.all = (data || []).map(a => this.map(a));
          this.loading = false;
        },
        error: () => { this.error = 'Could not load appointments.'; this.loading = false; },
      });
  }

  private map(a: Appointment): ApptView {
    const start = new Date(a.startUtc);
    const end = new Date(a.endUtc);
    const fmt = (d: Date) => d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    return {
      id: a.id,
      start,
      label: `${fmt(start)} – ${fmt(end)}`,
      dateLabel: start.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      clinic: a.provider?.clinicName ?? '',
      doctor: `${a.provider?.firstName ?? ''} ${a.provider?.lastName ?? ''}`.trim(),
      status: a.status,
      statusText: statusText(a.status),
      statusSlug: statusSlug(a.status),
    };
  }
}
