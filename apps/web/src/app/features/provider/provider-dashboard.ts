import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-provider-dashboard',
  imports: [],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css',
})
export class ProviderDashboard implements OnInit {
  private auth = inject(AuthService);
  userName = '';

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      this.userName = profile?.fullName?.split(' ')[0] ?? 'Provider';
    });
  }

  logout() {
    this.auth.logout();
  }
}