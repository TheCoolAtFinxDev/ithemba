import { Component, inject, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface AppointmentDetail {
  id: string;
  startUtc: string;
  endUtc: string;
  status: string;
  reason: string;
  visitCode: string | null;
  provider: { id: string; firstName: string; lastName: string; clinicName: string; specialization: string; location: string };
  beneficiary: { fullName: string; relationship: string } | null;
}

@Component({
  selector: 'app-patient-appointment-detail',
  imports: [NgIf, FormsModule],
  templateUrl: './patient-appointment-detail.html',
  styleUrl: './patient-appointment-detail.css',
})
export class PatientAppointmentDetail implements OnInit, OnChanges {
  @Input() appointmentId = '';
  @Output() back = new EventEmitter<void>();
  @Output() reschedule = new EventEmitter<{ apptId: string; providerId: string }>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  appointment: AppointmentDetail | null = null;
  loading = false;
  error = '';

  showCancelModal = false;
  cancelNote = '';
  cancelling = false;

  sendingOtp = false;
  otpSent = false;

  private patientId = '';

  get canCancel(): boolean {
    if (!this.appointment) return false;
    const terminal = ['Completed', 'CancelledByPatient', 'CancelledByProvider', 'NoShow'];
    return new Date(this.appointment.startUtc) > new Date() && !terminal.includes(this.appointment.status);
  }

  get canReschedule(): boolean {
    if (!this.appointment) return false;
    return ['Requested', 'Scheduled'].includes(this.appointment.status) && new Date(this.appointment.startUtc) > new Date();
  }

  get canSendOtp(): boolean {
    if (!this.appointment) return false;
    return ['Requested', 'Scheduled', 'Confirmed'].includes(this.appointment.status);
  }

  get statusText(): string {
    const map: Record<string, string> = {
      Requested: 'Requested', Scheduled: 'Scheduled', Confirmed: 'Confirmed',
      Rescheduled: 'Rescheduled', CheckedIn: 'Checked In', InProgress: 'In Progress',
      Completed: 'Completed', CancelledByPatient: 'Cancelled', CancelledByProvider: 'Cancelled by Provider',
      NoShow: 'No Show',
    };
    return map[this.appointment?.status ?? ''] ?? (this.appointment?.status ?? '');
  }

  get statusSlug(): string {
    const s = (this.appointment?.status ?? '').toLowerCase();
    if (s === 'requested') return 'st-requested';
    if (s === 'scheduled') return 'st-scheduled';
    if (s === 'confirmed') return 'st-confirmed';
    if (s === 'rescheduled') return 'st-rescheduled';
    if (s === 'checkedin') return 'st-checkedin';
    if (s === 'inprogress') return 'st-inprogress';
    if (s === 'completed') return 'st-completed';
    if (s.includes('cancel') || s === 'noshow') return 'st-cancelled';
    return 'st-unknown';
  }

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id) {
        this.patientId = p.patient.id;
        if (this.appointmentId && !this.appointment) this.load();
      }
    });
  }

  ngOnChanges() {
    if (this.appointmentId && this.patientId) {
      this.appointment = null;
      this.otpSent = false;
      this.load();
    }
  }

  load() {
    if (!this.appointmentId || !this.patientId) return;
    this.loading = true;
    this.error = '';
    this.http.get<AppointmentDetail>(`${environment.apiUrl}/patients/${this.patientId}/appointments/${this.appointmentId}`)
      .subscribe({
        next: data => { this.appointment = data; this.loading = false; },
        error: () => { this.error = 'Could not load appointment.'; this.loading = false; },
      });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Cancel
  openCancelModal() { this.showCancelModal = true; this.cancelNote = ''; }
  closeCancelModal() { this.showCancelModal = false; }

  submitCancel() {
    if (!this.patientId || !this.appointmentId) return;
    this.cancelling = true;
    this.http.put(`${environment.apiUrl}/patients/${this.patientId}/appointments/${this.appointmentId}/cancel`, {
      reason: this.cancelNote || undefined,
    }).subscribe({
      next: () => { this.cancelling = false; this.showCancelModal = false; this.load(); },
      error: e => { this.error = e?.error?.message || 'Could not cancel.'; this.cancelling = false; },
    });
  }

  // Reschedule
  doReschedule() {
    if (!this.appointment) return;
    this.reschedule.emit({ apptId: this.appointmentId, providerId: this.appointment.provider.id });
  }

  // OTP / Visit code
  sendOtp() {
    if (!this.patientId || !this.appointmentId || this.sendingOtp) return;
    this.sendingOtp = true;
    this.http.post(`${environment.apiUrl}/patients/${this.patientId}/appointments/${this.appointmentId}/otp/send`, {})
      .subscribe({
        next: () => { this.sendingOtp = false; this.otpSent = true; this.load(); },
        error: e => { this.error = e?.error?.message || 'Could not send visit code.'; this.sendingOtp = false; },
      });
  }
}
