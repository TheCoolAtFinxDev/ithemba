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
  patient: { userProfile: { fullName: string }; savingsAccount: { balance: string } | null };
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Claim {
  id: string;
  claimNumber: string;
  status: string;
  totalAmount: string;
  hsaCoveredAmount: string;
  outOfPocketAmount: string;
  dateOfVisit: string;
  description: string | null;
  createdAt: string;
  account: { balance: string; patient: { userProfile: { fullName: string; email: string } } };
  appointment: { startUtc: string } | null;
  lineItems: LineItem[];
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
  editingClaim: Claim | null = null;
  claimAmount = 0;
  claimDescription = '';
  lineItems: LineItem[] = [];
  submitting = false;
  submitError = '';
  submitSuccess = '';

  withdrawingId = '';

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
    this.editingClaim = null;
    this.claimAmount = 0;
    this.claimDescription = '';
    this.lineItems = [];
    this.submitError = '';
    this.submitSuccess = '';
    this.showSubmitModal = true;
  }

  openEdit(claim: Claim) {
    this.editingClaim = claim;
    this.selectedAppt = null;
    this.claimAmount = Number(claim.totalAmount);
    this.claimDescription = claim.description ?? '';
    this.lineItems = (claim.lineItems ?? []).map(li => ({
      description: li.description, quantity: Number(li.quantity), unitPrice: Number(li.unitPrice),
    }));
    this.submitError = '';
    this.submitSuccess = '';
    this.showSubmitModal = true;
  }

  closeSubmit() { this.showSubmitModal = false; this.selectedAppt = null; this.editingClaim = null; }

  addLineItem() {
    this.lineItems.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  removeLineItem(i: number) {
    this.lineItems.splice(i, 1);
    this.syncAmountFromLineItems();
  }

  lineItemsTotal(): number {
    return this.lineItems.reduce((sum, li) => sum + (li.quantity || 0) * (li.unitPrice || 0), 0);
  }

  /** Keeps the billed total in sync while line items are being edited — the
   * provider can still override it manually afterward (e.g. a discount). */
  syncAmountFromLineItems() {
    if (this.lineItems.length > 0) this.claimAmount = this.lineItemsTotal();
  }

  withdrawClaim(claim: Claim) {
    if (this.withdrawingId) return;
    this.withdrawingId = claim.id;
    this.http.delete(`${environment.apiUrl}/v1/providers/${this.providerId}/claims/${claim.id}`)
      .subscribe({
        next: () => { this.withdrawingId = ''; this.loadClaims(); },
        error: () => { this.withdrawingId = ''; },
      });
  }

  canModify(c: Claim): boolean {
    return c.status === 'Submitted';
  }

  patientBalance(): number {
    if (this.editingClaim) return Number(this.editingClaim.account.balance);
    return Number(this.selectedAppt?.patient?.savingsAccount?.balance ?? 0);
  }

  /** Max the HSA can pay out for this claim once the 5% fee is added on top. */
  hsaCoveredAmount(): number {
    const maxHsaCoverable = Math.max(0, this.patientBalance() / 1.05);
    return Math.min(this.claimAmount, maxHsaCoverable);
  }

  outOfPocketAmount(): number {
    return Math.max(0, this.claimAmount - this.hsaCoveredAmount());
  }

  hasShortfall(): boolean {
    return !!this.claimAmount && this.outOfPocketAmount() > 0;
  }

  submitClaim() {
    if (!this.selectedAppt && !this.editingClaim) return;
    if (!this.claimAmount || this.submitting) return;
    if (this.claimAmount <= 0) { this.submitError = 'Enter a valid amount'; return; }

    this.submitting = true;
    this.submitError = '';

    const validLineItems = this.lineItems
      .filter(li => li.description.trim() && li.unitPrice >= 0)
      .map(li => ({ description: li.description.trim(), quantity: li.quantity || 1, unitPrice: li.unitPrice }));

    const request = this.editingClaim
      ? this.http.put(`${environment.apiUrl}/v1/providers/${this.providerId}/claims/${this.editingClaim.id}`, {
          totalAmount: this.claimAmount,
          description: this.claimDescription || undefined,
          dateOfVisit: this.editingClaim.dateOfVisit,
          lineItems: validLineItems,
        })
      : this.http.post(`${environment.apiUrl}/v1/providers/${this.providerId}/claims`, {
          appointmentId: this.selectedAppt!.id,
          totalAmount: this.claimAmount,
          description: this.claimDescription || undefined,
          dateOfVisit: this.selectedAppt!.startUtc,
          lineItems: validLineItems,
        });

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.showSubmitModal = false;
        this.submitSuccess = this.editingClaim ? 'Claim updated successfully!' : 'Claim submitted successfully!';
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
      Withdrawn: 'Withdrawn',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    switch (s) {
      case 'Approved': case 'Paid': return 'badge-green';
      case 'Rejected': case 'Denied': return 'badge-red';
      case 'Withdrawn': return 'badge-grey';
      case 'InReview': return 'badge-blue';
      case 'Submitted': return 'badge-orange';
      default: return 'badge-grey';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}
