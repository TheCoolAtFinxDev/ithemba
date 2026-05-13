import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Appointment {
  id: string;
  startUtc: string;
  status: string;
  reason: string;
  patient: { userProfile: { fullName: string } };
}

interface Claim {
  id: string;
  claimNumber: string;
  status: string;
  totalAmount: string;
  dateOfVisit: string;
  description: string | null;
  createdAt: string;
  account: { patient: { userProfile: { fullName: string; email: string } } };
  appointment: { startUtc: string } | null;
}

@Component({
  selector: 'app-provider-claims',
  imports: [NgIf, NgFor, NgClass, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './provider-claims.html',
  styleUrl: './provider-claims.css',
})
export class ProviderClaims implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  tab: 'submit' | 'history' = 'submit';
  providerId = '';

  completedAppointments: Appointment[] = [];
  claims: Claim[] = [];

  apptLoading = false;
  claimsLoading = false;
  error = '';

  showSubmitModal = false;
  selectedAppt: Appointment | null = null;
  claimAmount = 0;
  claimDescription = '';
  submitting = false;
  submitError = '';
  submitSuccess = '';

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.provider?.id && !this.providerId) {
        this.providerId = p.provider.id;
        this.loadCompletedAppointments();
        this.loadClaims();
      }
    });
  }

  loadCompletedAppointments() {
    if (!this.providerId) return;
    this.apptLoading = true;
    this.http.get<Appointment[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/appointments`)
      .subscribe({
        next: data => {
          this.completedAppointments = (data || []).filter(a => a.status === 'Completed');
          this.apptLoading = false;
        },
        error: () => { this.apptLoading = false; },
      });
  }

  loadClaims() {
    if (!this.providerId) return;
    this.claimsLoading = true;
    this.http.get<Claim[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/claims`)
      .subscribe({
        next: data => { this.claims = data || []; this.claimsLoading = false; },
        error: () => { this.claimsLoading = false; },
      });
  }

  openSubmit(appt: Appointment) {
    this.selectedAppt = appt;
    this.claimAmount = 0;
    this.claimDescription = '';
    this.submitError = '';
    this.submitSuccess = '';
    this.showSubmitModal = true;
  }

  closeSubmit() { this.showSubmitModal = false; this.selectedAppt = null; }

  submitClaim() {
    if (!this.selectedAppt || !this.claimAmount || this.submitting) return;
    if (this.claimAmount <= 0) { this.submitError = 'Enter a valid amount'; return; }

    this.submitting = true;
    this.submitError = '';
    this.http.post(`${environment.apiUrl}/v1/providers/${this.providerId}/claims`, {
      appointmentId: this.selectedAppt.id,
      totalAmount: this.claimAmount,
      description: this.claimDescription || undefined,
      dateOfVisit: this.selectedAppt.startUtc,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showSubmitModal = false;
        this.submitSuccess = 'Claim submitted successfully!';
        this.loadClaims();
        this.loadCompletedAppointments();
        this.tab = 'history';
      },
      error: e => {
        this.submitError = e?.error?.message || 'Failed to submit claim.';
        this.submitting = false;
      },
    });
  }

  alreadyClaimed(apptId: string): boolean {
    return this.claims.some(c => c.appointment?.startUtc && c.id && this.claims.find(cl => cl.appointment && cl.id === c.id) !== undefined);
  }

  statusText(s: string): string {
    const map: Record<string, string> = {
      Pending: 'Pending', Submitted: 'Submitted', InReview: 'In Review',
      Approved: 'Approved', Rejected: 'Rejected', Paid: 'Paid', Denied: 'Denied',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    switch (s) {
      case 'Approved': case 'Paid': return 'badge-green';
      case 'Rejected': case 'Denied': return 'badge-red';
      case 'InReview': return 'badge-blue';
      case 'Submitted': return 'badge-orange';
      default: return 'badge-grey';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}
