import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-provider-onboarding',
  imports: [FormsModule],
  templateUrl: './provider-onboarding.html',
  styleUrl: './provider-onboarding.css',
})
export class ProviderOnboarding implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  currentStep = 1;
  loading = false;
  error = '';

  form = {
    firstName: '', lastName: '', clinicName: '', specialization: '',
    medicalLicenseNumber: '', phoneNumber: '', email: '',
    location: '', mpesaMerchantCode: '', about: '',
  };

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile?.provider) { this.router.navigate(['/provider']); }
      if (profile?.fullName) {
        const parts = profile.fullName.split(' ');
        this.form.firstName = parts[0] ?? '';
        this.form.lastName = parts.slice(1).join(' ') ?? '';
      }
    });
  }

  nextStep() { if (this.validate()) this.currentStep++; }
  prevStep() { this.currentStep--; this.error = ''; }

  validate(): boolean {
    if (this.currentStep === 1) {
      if (!this.form.firstName || !this.form.lastName) { this.error = 'First and last name are required'; return false; }
      if (!this.form.clinicName) { this.error = 'Clinic name is required'; return false; }
      if (!this.form.specialization) { this.error = 'Specialization is required'; return false; }
    }
    if (this.currentStep === 2) {
      if (!this.form.phoneNumber) { this.error = 'Phone number is required'; return false; }
    }
    this.error = '';
    return true;
  }

  async submit() {
    this.loading = true;
    this.error = '';
    try {
      const userId = this.auth.profile?.id;
      await this.http.post(`${environment.apiUrl}/v1/users/${userId}/provider/onboard`, this.form).toPromise();
      await this.auth.loadProfile();
      this.router.navigate(['/provider']);
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
