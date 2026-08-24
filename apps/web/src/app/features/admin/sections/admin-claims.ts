import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface LineItem { description: string; quantity: number; unitPrice: number; }

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
  provider: { firstName: string; lastName: string; clinicName: string };
  account: { balance: string; patient: { userProfile: { fullName: string; email: string } } };
  lineItems: LineItem[];
}

@Component({
  selector: 'app-admin-claims',
  imports: [NgIf, NgFor, NgClass, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './admin-claims.html',
  styleUrl: './admin-claims.css',
})
export class AdminClaims implements OnInit {
  private http = inject(HttpClient);

  claims: Claim[] = [];
  loading = false;
  error = '';
  filterStatus = '';

  showModal = false;
  modalAction: 'approve' | 'reject' = 'approve';
  modalClaim: Claim | null = null;
  modalNotes = '';
  actionLoading = false;
  actionError = '';

  statuses = [
    { value: '', label: 'All' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'InReview', label: 'In Review' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  exporting = false;

  ngOnInit() { this.load(); }

  exportCsv() {
    if (this.exporting) return;
    this.exporting = true;
    const q = this.filterStatus ? `?status=${this.filterStatus}` : '';
    this.http.get(`${environment.apiUrl}/admin/claims/export${q}`, { responseType: 'blob' })
      .subscribe({
        next: blob => {
          this.exporting = false;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => { this.exporting = false; },
      });
  }

  load() {
    this.loading = true;
    this.error = '';
    const q = this.filterStatus ? `?status=${this.filterStatus}` : '';
    this.http.get<Claim[]>(`${environment.apiUrl}/admin/claims${q}`)
      .subscribe({
        next: data => { this.claims = data || []; this.loading = false; },
        error: () => { this.error = 'Could not load claims.'; this.loading = false; },
      });
  }

  pendingCount(): number {
    return this.claims.filter(c => ['Submitted', 'InReview'].includes(c.status)).length;
  }

  openApprove(c: Claim) {
    this.modalClaim = c;
    this.modalAction = 'approve';
    this.modalNotes = '';
    this.actionError = '';
    this.showModal = true;
  }

  openReject(c: Claim) {
    this.modalClaim = c;
    this.modalAction = 'reject';
    this.modalNotes = '';
    this.actionError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.modalClaim = null; }

  confirm() {
    if (!this.modalClaim || this.actionLoading) return;
    this.actionLoading = true;
    this.actionError = '';
    const url = `${environment.apiUrl}/admin/claims/${this.modalClaim.id}/${this.modalAction}`;
    this.http.put(url, { notes: this.modalNotes || undefined })
      .subscribe({
        next: () => { this.actionLoading = false; this.showModal = false; this.load(); },
        error: e => { this.actionError = e?.error?.message || 'Action failed.'; this.actionLoading = false; },
      });
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
      case 'InReview': return 'badge-blue';
      case 'Submitted': return 'badge-orange';
      case 'Withdrawn': return 'badge-grey';
      default: return 'badge-grey';
    }
  }

  canAction(s: string): boolean {
    return ['Submitted', 'InReview'].includes(s);
  }

  // Live preview of how approval will split the claim against the patient's
  // *current* balance (this is recomputed authoritatively on the backend too).
  previewHsaCovered(c: Claim): number {
    const balance = Number(c.account?.balance ?? 0);
    const maxHsaCoverable = Math.max(0, balance / 1.05);
    return Math.min(Number(c.totalAmount), maxHsaCoverable);
  }

  previewOutOfPocket(c: Claim): number {
    return Math.max(0, Number(c.totalAmount) - this.previewHsaCovered(c));
  }

  previewFee(c: Claim): number {
    return this.previewHsaCovered(c) * 0.05;
  }
}
