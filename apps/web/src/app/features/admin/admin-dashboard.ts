import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private auth = inject(AuthService);
  userName = '';

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      this.userName = profile?.fullName?.split(' ')[0] ?? 'Admin';
    });
  }

  logout() {
    this.auth.logout();
  }
}