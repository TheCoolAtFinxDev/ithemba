import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AdminUsers } from './sections/admin-users';
import { AdminClaims } from './sections/admin-claims';
import { AdminProviders } from './sections/admin-providers';
import { environment } from '../../../environments/environment';

interface Stats {
  patients: number;
  providers: number;
  appointments: number;
  claims: number;
  pendingClaims: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [NgIf, NgClass, AdminUsers, AdminClaims, AdminProviders],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  userName = '';
  adminInitials = '';
  section = 'dashboard';
  stats: Stats | null = null;

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p && !this.auth.hasRole('ADMIN')) {
        this.router.navigate(['/unauthorized']);
        return;
      }
      this.userName = p?.fullName?.split(' ')[0] ?? 'Admin';
      this.adminInitials = (p?.fullName ?? 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    });
    this.loadStats();
  }

  setSection(s: string) { this.section = s; }

  loadStats() {
    this.http.get<Stats>(`${environment.apiUrl}/admin/stats`)
      .subscribe({ next: s => this.stats = s });
  }

  logout() { this.auth.logout(); }
}
