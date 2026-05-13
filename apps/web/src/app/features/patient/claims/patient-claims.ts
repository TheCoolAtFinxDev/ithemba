import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Claim {
  id: string;
  claimNumber: string;
  status: string;
  totalAmount: string;
  dateOfVisit: string;
  description: string | null;
  createdAt: string;
  provider: { firstName: string; lastName: string; clinicName: string };
  appointment: { startUtc: string } | null;
}

@Component({
  selector: 'app-patient-claims',
  imports: [NgIf, NgFor, NgClass, DecimalPipe, DatePipe],
  templateUrl: './patient-claims.html',
  styleUrl: './patient-claims.css',
})
export class PatientClaims implements OnInit {
  @Output() back = new EventEmitter<void>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  claims: Claim[] = [];
  loading = false;
  error = '';
  private patientId = '';

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id && !this.patientId) {
        this.patientId = p.patient.id;
        this.load();
      }
    });
  }

  load() {
    if (!this.patientId || this.loading) return;
    this.loading = true;
    this.error = '';
    this.http.get<Claim[]>(`${environment.apiUrl}/patients/${this.patientId}/claims`)
      .subscribe({
        next: data => { this.claims = data || []; this.loading = false; },
        error: () => { this.error = 'Could not load claims.'; this.loading = false; },
      });
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
}
