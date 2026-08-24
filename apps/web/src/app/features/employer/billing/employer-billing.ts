import { Component, Input, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface BillingCycle {
  id: string;
  billingMonth: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  employeeCount: number;
  subtotal: string;
  platformFee: string;
  totalAmount: string;
  paymentMethod: string;
  golinkPaymentLink: string | null;
  status: string;
  paidAt: string | null;
  _count?: { lineItems: number };
}

interface LineItem {
  id: string;
  employeeName: string;
  employeeRef: string;
  contributionAmount: string;
  hsaCredited: boolean;
  hsaCreditedAt: string | null;
}

@Component({
  selector: 'app-employer-billing',
  imports: [NgIf, NgFor, NgClass, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './employer-billing.html',
})
export class EmployerBilling implements OnInit {
  @Input() employerId = '';

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  get isAdmin() { return this.auth.hasRole('ADMIN'); }

  confirming = false;
  confirmError = '';

  cycles: BillingCycle[] = [];
  loading = false;
  error = '';

  selectedCycle: BillingCycle | null = null;
  lineItems: LineItem[] = [];
  detailLoading = false;

  showGenerateModal = false;
  genMonth = '';
  genPaymentMethod = 'Manual';
  genLoading = false;
  genError = '';

  paymentMethods = ['Manual', 'Mpesa', 'EcoCash', 'Card', 'EFT', 'PaymentLink', 'Payslip'];

  ngOnInit() {
    const now = new Date();
    this.genMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.load();
  }

  load() {
    if (!this.employerId) return;
    this.loading = true;
    this.http.get<BillingCycle[]>(`${environment.apiUrl}/employers/${this.employerId}/billing`)
      .subscribe({
        next: d => { this.cycles = d || []; this.loading = false; },
        error: () => { this.error = 'Could not load billing history.'; this.loading = false; },
      });
  }

  openDetail(cycle: BillingCycle) {
    this.selectedCycle = cycle;
    this.detailLoading = true;
    this.http.get<any>(`${environment.apiUrl}/employers/${this.employerId}/billing/${cycle.id}`)
      .subscribe({
        next: d => { this.lineItems = d.lineItems || []; this.detailLoading = false; },
        error: () => { this.detailLoading = false; },
      });
  }

  closeDetail() { this.selectedCycle = null; this.lineItems = []; this.confirmError = ''; }

  confirmPayment() {
    if (!this.selectedCycle) return;
    this.confirming = true;
    this.confirmError = '';
    this.http.put(`${environment.apiUrl}/admin/employers/${this.employerId}/billing/${this.selectedCycle.id}/confirm`, {})
      .subscribe({
        next: () => { this.confirming = false; this.closeDetail(); this.load(); },
        error: e => { this.confirming = false; this.confirmError = e?.error?.message || 'Failed to confirm payment.'; },
      });
  }

  openGenerate() {
    this.genError = ''; this.showGenerateModal = true;
  }

  submitGenerate() {
    if (!this.genMonth) { this.genError = 'Select a billing month.'; return; }
    this.genLoading = true; this.genError = '';
    this.http.post(`${environment.apiUrl}/employers/${this.employerId}/billing/generate`, {
      billingMonth: this.genMonth,
      paymentMethod: this.genPaymentMethod,
    }).subscribe({
      next: () => { this.showGenerateModal = false; this.genLoading = false; this.load(); },
      error: e => { this.genError = e?.error?.message || 'Failed to generate invoice.'; this.genLoading = false; },
    });
  }

  statusClass(s: string) {
    if (s === 'Paid') return 'badge bg-success';
    if (s === 'Invoiced' || s === 'AwaitingPayment') return 'badge bg-warning text-dark';
    if (s === 'Overdue' || s === 'Failed') return 'badge bg-danger';
    return 'badge bg-secondary';
  }

  statusLabel(s: string) {
    const map: Record<string, string> = {
      Draft: 'Draft', Invoiced: 'Invoiced', AwaitingPayment: 'Awaiting Payment',
      Paid: 'Paid', Overdue: 'Overdue', Failed: 'Failed',
    };
    return map[s] ?? s;
  }
}
