import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { EmployerEmployees } from './employees/employer-employees';
import { EmployerBilling } from './billing/employer-billing';
import { environment } from '../../../environments/environment';

interface Employer {
  id: string;
  name: string;
  isVerified: boolean;
  platformFeePerSeat: string;
  _count?: { memberships: number };
}

@Component({
  selector: 'app-employer-dashboard',
  imports: [NgIf, DecimalPipe, EmployerEmployees, EmployerBilling],
  templateUrl: './employer-dashboard.html',
  styleUrl: './employer-dashboard.css',
})
export class EmployerDashboard implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  activeSection = 'dashboard';
  userName = '';
  initials = '';
  employer: Employer | null = null;
  loadingEmployer = true;
  notLinked = false;

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (!p) return;
      this.userName = p.fullName?.split(' ')[0] || 'Employer';
      this.initials = (p.fullName || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    });
    this.loadEmployer();
  }

  loadEmployer() {
    this.loadingEmployer = true;
    this.http.get<Employer>(`${environment.apiUrl}/employers/me`)
      .subscribe({
        next: e => { this.employer = e; this.loadingEmployer = false; },
        error: () => { this.notLinked = true; this.loadingEmployer = false; },
      });
  }

  setSection(s: string) { this.activeSection = s; }

  logout() { this.auth.logout(); }
}
