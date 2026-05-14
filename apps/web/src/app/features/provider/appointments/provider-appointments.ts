import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-provider-appointments',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './provider-appointments.html',
  styleUrl: './provider-appointments.css',
})
export class ProviderAppointments implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  providerId = '';
  appointments: any[] = [];
  filter = 'all';
  loading = true;

  // OTP modal state
  otpApt: any = null;
  otpCode = '';
  otpError = '';
  otpVerifying = false;
  otpSuccess = false;

  get filteredAppointments() {
    if (this.filter === 'all') return this.appointments;
    return this.appointments.filter(a => a.status === this.filter);
  }

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile?.provider?.id) {
        this.providerId = profile.provider.id;
        this.loadAppointments();
      }
    });
  }

  loadAppointments() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/appointments`)
      .subscribe({
        next: data => { this.appointments = data; this.loading = false; },
        error: () => { this.loading = false; },
      });
  }

  setFilter(f: string) { this.filter = f; }

  openOtpModal(apt: any) {
    this.otpApt = apt;
    this.otpCode = '';
    this.otpError = '';
    this.otpSuccess = false;
    this.otpVerifying = false;
  }

  closeOtpModal() { this.otpApt = null; }

  verifyAndCheckIn() {
    if (this.otpCode.trim().length !== 6) {
      this.otpError = 'Enter the 6-digit visit code shown on the patient\'s screen.';
      return;
    }
    this.otpVerifying = true;
    this.otpError = '';
    this.http.post(
      `${environment.apiUrl}/v1/providers/${this.providerId}/appointments/${this.otpApt.id}/verify-otp`,
      { code: this.otpCode.trim() },
    ).subscribe({
      next: () => {
        this.otpSuccess = true;
        this.otpVerifying = false;
        setTimeout(() => {
          this.closeOtpModal();
          this.loadAppointments();
        }, 1200);
      },
      error: e => {
        this.otpError = e?.error?.message || 'Invalid code. Please try again.';
        this.otpVerifying = false;
      },
    });
  }

  async providerAction(apt: any, action: string) {
    apt.loading = true;
    try {
      await this.http.put(
        `${environment.apiUrl}/v1/providers/${this.providerId}/appointments/${apt.id}/${action}`, {},
      ).toPromise();
      this.loadAppointments();
    } catch (e) {
      console.error(e);
      apt.loading = false;
    }
  }

  formatDate(utc: string): string {
    return new Date(utc).toLocaleDateString('en-LS', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(utc: string): string {
    return new Date(utc).toLocaleTimeString('en-LS', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Requested: 'badge-requested',
      Scheduled: 'badge-scheduled',
      Confirmed: 'badge-confirmed',
      Rescheduled: 'badge-scheduled',
      CheckedIn: 'bg-info text-white',
      InProgress: 'bg-primary text-white',
      Completed: 'badge-completed',
      CancelledByPatient: 'badge-cancelled',
      CancelledByProvider: 'badge-cancelled',
      NoShow: 'bg-secondary text-white',
    };
    return map[status] ?? 'bg-secondary text-white';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      Requested: 'Requested', Scheduled: 'Scheduled', Confirmed: 'Confirmed',
      Rescheduled: 'Rescheduled', CheckedIn: 'Checked In', InProgress: 'In Progress',
      Completed: 'Completed', CancelledByPatient: 'Cancelled (Patient)',
      CancelledByProvider: 'Cancelled (Provider)', NoShow: 'No Show',
    };
    return map[status] ?? status;
  }
}
