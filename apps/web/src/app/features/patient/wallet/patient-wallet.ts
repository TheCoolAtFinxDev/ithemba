import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Wallet {
  id: string;
  balance: string;
  totalContributed: string;
  totalClaimed: string;
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: string;
  transactionDate: string;
  notes: string;
  mpesaTransactionCode: string | null;
  isSuccessful: boolean;
  status: 'Pending' | 'Processing' | 'Succeeded' | 'Failed';
}

@Component({
  selector: 'app-patient-wallet',
  imports: [NgIf, NgFor, NgClass, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './patient-wallet.html',
  styleUrl: './patient-wallet.css',
})
export class PatientWallet implements OnInit {
  @Output() back = new EventEmitter<void>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  wallet: Wallet | null = null;
  transactions: Transaction[] = [];
  loading = false;
  txLoading = false;
  error = '';

  showTopup = false;
  topupAmount = 500;
  topupPhone = '';
  topupRail: 'MPESA' | 'CPAY' = 'MPESA';
  topupLoading = false;
  topupError = '';
  topupSuccess = '';

  autoDebit: { mpesaNumber: string; amount: string; frequency: string; nextDebitDate: string; isActive: boolean } | null = null;
  autoDebitLoading = false;
  showAutoDebitModal = false;
  autoDebitForm = { mpesaNumber: '', amount: 500, frequency: 'Monthly' as 'Weekly' | 'Monthly' };
  autoDebitSaving = false;
  autoDebitError = '';

  private patientId = '';

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id && !this.patientId) {
        this.patientId = p.patient.id;
        this.loadWallet();
        this.loadTransactions();
        this.loadAutoDebit();
      }
    });
  }

  loadAutoDebit() {
    if (!this.patientId) return;
    this.autoDebitLoading = true;
    this.http.get<any>(`${environment.apiUrl}/patients/${this.patientId}/wallet/auto-debit`)
      .subscribe({
        next: data => { this.autoDebit = data; this.autoDebitLoading = false; },
        error: () => { this.autoDebitLoading = false; },
      });
  }

  openAutoDebitModal() {
    this.autoDebitForm = {
      mpesaNumber: this.autoDebit?.mpesaNumber ?? '',
      amount: this.autoDebit?.amount ? Number(this.autoDebit.amount) : 500,
      frequency: (this.autoDebit?.frequency as 'Weekly' | 'Monthly') ?? 'Monthly',
    };
    this.autoDebitError = '';
    this.showAutoDebitModal = true;
  }

  closeAutoDebitModal() { this.showAutoDebitModal = false; }

  submitAutoDebit() {
    if (!this.patientId || this.autoDebitSaving) return;
    if (!this.autoDebitForm.mpesaNumber.trim()) {
      this.autoDebitError = 'M-Pesa number is required';
      return;
    }
    if (this.autoDebitForm.amount < 500 || this.autoDebitForm.amount > 10000) {
      this.autoDebitError = 'Amount must be between R500 and R10,000';
      return;
    }
    this.autoDebitSaving = true;
    this.autoDebitError = '';
    this.http.post(`${environment.apiUrl}/patients/${this.patientId}/wallet/auto-debit`, this.autoDebitForm)
      .subscribe({
        next: () => { this.autoDebitSaving = false; this.showAutoDebitModal = false; this.loadAutoDebit(); },
        error: e => { this.autoDebitError = e?.error?.message || 'Could not save auto top-up.'; this.autoDebitSaving = false; },
      });
  }

  cancelAutoDebit() {
    if (!this.patientId || this.autoDebitLoading) return;
    this.autoDebitLoading = true;
    this.http.delete(`${environment.apiUrl}/patients/${this.patientId}/wallet/auto-debit`)
      .subscribe({
        next: () => { this.loadAutoDebit(); },
        error: () => { this.autoDebitLoading = false; },
      });
  }

  loadWallet() {
    if (!this.patientId || this.loading) return;
    this.loading = true;
    this.error = '';
    this.http.get<Wallet>(`${environment.apiUrl}/patients/${this.patientId}/wallet`)
      .subscribe({
        next: w => { this.wallet = w; this.loading = false; },
        error: () => { this.error = 'Could not load wallet.'; this.loading = false; },
      });
  }

  loadTransactions() {
    if (!this.patientId) return;
    this.txLoading = true;
    this.http.get<Transaction[]>(`${environment.apiUrl}/patients/${this.patientId}/wallet/transactions`)
      .subscribe({
        next: data => { this.transactions = data || []; this.txLoading = false; },
        error: () => { this.txLoading = false; },
      });
  }

  openTopup() {
    this.showTopup = true;
    this.topupAmount = 500;
    this.topupPhone = '';
    this.topupRail = 'MPESA';
    this.topupError = '';
    this.topupSuccess = '';
  }

  closeTopup() { this.showTopup = false; }

  submitTopup() {
    if (!this.patientId || this.topupLoading) return;
    if (this.topupAmount < 500 || this.topupAmount > 10000) {
      this.topupError = 'Amount must be between R500 and R10,000';
      return;
    }
    if (!this.topupPhone.trim()) {
      this.topupError = `Enter the phone number to charge via ${this.topupRail === 'MPESA' ? 'M-Pesa' : 'C-Pay'}`;
      return;
    }
    this.topupLoading = true;
    this.topupError = '';
    this.topupSuccess = '';

    this.http.post(`${environment.apiUrl}/patients/${this.patientId}/wallet/topup`, {
      amount: this.topupAmount,
      rail: this.topupRail,
      mpesaPhone: this.topupPhone,
    }).subscribe({
      next: () => {
        this.topupLoading = false;
        this.topupSuccess = `Check your phone (${this.topupPhone}) to approve the ${this.topupRail === 'MPESA' ? 'M-Pesa' : 'C-Pay'} payment.`;
        this.showTopup = false;
        this.loadWallet();
        this.loadTransactions();
      },
      error: e => {
        this.topupError = e?.error?.message || 'Top-up failed. Please try again.';
        this.topupLoading = false;
      },
    });
  }

  private isCredit(tx: Transaction): boolean {
    if (tx.transactionType === 'AdminAdjustment') return tx.notes?.startsWith('Credit') ?? false;
    return tx.transactionType === 'Deposit';
  }

  txIcon(type: string): string {
    switch (type) {
      case 'Deposit': return 'bi-arrow-down-circle-fill';
      case 'Debit': return 'bi-arrow-up-circle-fill';
      case 'ClaimPayment': return 'bi-file-medical-fill';
      case 'AdminAdjustment': return 'bi-sliders';
      default: return 'bi-circle-fill';
    }
  }

  txColor(type: string, tx?: Transaction): string {
    if (type === 'AdminAdjustment' && tx) return this.isCredit(tx) ? '#4A7C59' : '#E53935';
    return type === 'Deposit' ? '#4A7C59' : '#E53935';
  }

  txSign(type: string, tx?: Transaction): string {
    if (type === 'AdminAdjustment' && tx) return this.isCredit(tx) ? '+' : '-';
    return type === 'Deposit' ? '+' : '-';
  }

  txLabel(type: string): string {
    switch (type) {
      case 'Deposit': return 'Top-Up';
      case 'Debit': return 'Debit';
      case 'ClaimPayment': return 'Claim Payment';
      case 'AdminAdjustment': return 'Admin Adjustment';
      default: return type;
    }
  }

  isPending(tx: Transaction): boolean {
    return tx.status === 'Processing' || tx.status === 'Pending';
  }
}
