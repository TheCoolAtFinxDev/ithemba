import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-dashboard',
  imports: [],
  templateUrl: './patient-dashboard.html',
  styleUrl: './patient-dashboard.css',
})
export class PatientDashboard implements OnInit {
   private auth = inject(AuthService);
  private router = inject(Router);
  userName = '';

 ngOnInit() {
  this.auth.profile$.subscribe(profile => {
    if (profile) {
      // If not onboarded, redirect to onboarding
      if (!profile.patient) {
        this.router.navigate(['/patient/onboard']);
        return;
      }
      this.userName = profile.fullName?.split(' ')[0] ?? 'Patient';
    }
  });
}

  logout() {
    this.auth.logout();
  }
}