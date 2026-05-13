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
  topupLoading = false;
  topupError = '';
  topupSuccess = '';

  private patientId = '';

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id && !this.patientId) {
        this.patientId = p.patient.id;
        this.loadWallet();
        this.loadTransactions();
      }
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
    this.topupLoading = true;
    this.topupError = '';
    this.topupSuccess = '';

    this.http.post(`${environment.apiUrl}/patients/${this.patientId}/wallet/topup`, {
      amount: this.topupAmount,
      mpesaPhone: this.topupPhone || undefined,
    }).subscribe({
      next: () => {
        this.topupLoading = false;
        this.topupSuccess = `R${this.topupAmount.toFixed(2)} added to your wallet!`;
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

  txIcon(type: string): string {
    switch (type) {
      case 'Deposit': return 'bi-arrow-down-circle-fill';
      case 'Debit': return 'bi-arrow-up-circle-fill';
      case 'ClaimPayment': return 'bi-file-medical-fill';
      default: return 'bi-circle-fill';
    }
  }

  txColor(type: string): string {
    return type === 'Deposit' ? '#4A7C59' : '#E53935';
  }

  txSign(type: string): string {
    return type === 'Deposit' ? '+' : '-';
  }

  txLabel(type: string): string {
    switch (type) {
      case 'Deposit': return 'Top-Up';
      case 'Debit': return 'Debit';
      case 'ClaimPayment': return 'Claim Payment';
      default: return type;
    }
  }
}
