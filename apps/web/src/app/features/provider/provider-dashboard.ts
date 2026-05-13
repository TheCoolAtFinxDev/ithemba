import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ProviderAppointments } from './appointments/provider-appointments';

@Component({
  selector: 'app-provider-dashboard',
  imports: [ProviderAppointments],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css',
})
export class ProviderDashboard implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  userName = '';
  activeSection = 'dashboard';

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile && !profile.provider) {
        this.router.navigate(['/provider/onboard']);
        return;
      }
      this.userName = profile?.fullName?.split(' ')[0] ?? 'Provider';
    });
  }

  setSection(section: string) { this.activeSection = section; }

  logout() { this.auth.logout(); }
}