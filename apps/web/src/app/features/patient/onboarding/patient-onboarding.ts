import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-patient-onboarding',
  imports: [FormsModule],
  templateUrl: './patient-onboarding.html',
  styleUrl: './patient-onboarding.css',
})
export class PatientOnboarding implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  currentStep = 1;
  loading = false;
  error = '';

  form = {
    phoneNumber: '',
    nationalId: '',
    dateOfBirth: '',
    addressLine1: '',
    city: '',
    district: '',
    autoDebitEnabled: false,
    debitSourceMpesaNumber: '',
  };

  errors: Record<string, string> = {};

  ngOnInit() {
    // If already onboarded, go to dashboard
    this.auth.profile$.subscribe(profile => {
      if (profile?.patient) {
        this.router.navigate(['/patient']);
      }
    });
  }

  nextStep() {
    if (this.validate()) {
      this.currentStep++;
    }
  }

  prevStep() {
    this.currentStep--;
    this.error = '';
  }

 validate(): boolean {
  this.errors = {};
  if (this.currentStep === 1) {
    if (!this.form.phoneNumber) {
      this.errors['phoneNumber'] = 'Phone number is required';
      return false;
    }
  }
  return true;
}

  async submit() {
    this.loading = true;
    this.error = '';

    try {
      const userId = this.auth.profile?.id;
      await this.http.post(
        `${environment.apiUrl}/v1/users/${userId}/patient/onboard`,
        {
          phoneNumber: this.form.phoneNumber,
          nationalId: this.form.nationalId || undefined,
          dateOfBirth: this.form.dateOfBirth || undefined,
          addressLine1: this.form.addressLine1 || undefined,
          city: this.form.city || undefined,
          district: this.form.district || undefined,
          autoDebitEnabled: this.form.autoDebitEnabled,
          debitSourceMpesaNumber: this.form.debitSourceMpesaNumber || undefined,
        }
      ).toPromise();

      // Reload profile and redirect to dashboard
      await this.auth.loadProfile();
      this.router.navigate(['/patient']);
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}