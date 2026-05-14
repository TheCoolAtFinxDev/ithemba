import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

  userName = '';
  section = 'dashboard';
  stats: Stats | null = null;

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      this.userName = p?.fullName?.split(' ')[0] ?? 'Admin';
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
