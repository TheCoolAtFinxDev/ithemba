import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  imports: [],
  templateUrl: './patient-dashboard.html',
  styleUrl: './patient-dashboard.css',
})
export class PatientDashboard implements OnInit {
  private auth = inject(AuthService);
  userName = '';

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      this.userName = profile?.fullName?.split(' ')[0] ?? 'Patient';
    });
  }

  logout() {
    this.auth.logout();
  }
}