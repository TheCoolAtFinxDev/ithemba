import { Component, inject, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ProviderAppointments } from './appointments/provider-appointments';
import { ProviderClaims } from './claims/provider-claims';
import { ProviderTimeoff } from './timeoff/provider-timeoff';
import { ProviderProfile } from './profile/provider-profile';
import { environment } from '../../../environments/environment';

interface Stats {
  todayCount: number;
  checkedIn: number;
  completedWeek: number;
  pendingClaims: number;
}

@Component({
  selector: 'app-provider-dashboard',
  imports: [NgIf, ProviderAppointments, ProviderClaims, ProviderTimeoff, ProviderProfile],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css',
})
export class ProviderDashboard implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  userName = '';
  providerInitials = '';
  activeSection = 'dashboard';
  providerId = '';
  stats: Stats = { todayCount: 0, checkedIn: 0, completedWeek: 0, pendingClaims: 0 };

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile && !profile.provider) {
        this.router.navigate(['/provider/onboard']);
        return;
      }
      const p = profile?.provider;
      this.userName = p?.firstName
        ? `${p.firstName} ${p.lastName ?? ''}`.trim()
        : profile?.fullName?.split(' ')[0] ?? 'Provider';
      this.providerInitials = this.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      if (profile?.provider?.id && !this.providerId) {
        this.providerId = profile.provider.id;
        this.loadStats();
      }
    });
  }

  loadStats() {
    this.http.get<any[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/appointments`)
      .subscribe({
        next: apts => {
          const now = new Date();
          const todayStr = now.toDateString();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          this.stats.todayCount = apts.filter(a =>
            new Date(a.startUtc).toDateString() === todayStr &&
            !['CancelledByPatient', 'CancelledByProvider', 'NoShow'].includes(a.status)
          ).length;

          this.stats.checkedIn = apts.filter(a =>
            ['CheckedIn', 'InProgress'].includes(a.status)
          ).length;

          this.stats.completedWeek = apts.filter(a =>
            a.status === 'Completed' && new Date(a.startUtc) >= weekAgo
          ).length;
        },
      });

    this.http.get<any[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/claims`)
      .subscribe({
        next: claims => {
          this.stats.pendingClaims = (claims || []).filter(c => c.status === 'Submitted').length;
        },
      });
  }

  setSection(section: string) { this.activeSection = section; }

  logout() { this.auth.logout(); }
}