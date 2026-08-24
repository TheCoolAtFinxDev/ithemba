import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

type Step = 'email' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private http = inject(HttpClient);
  private router = inject(Router);

  @ViewChild('otpInput') otpInputRef!: ElementRef<HTMLInputElement>;

  step: Step = 'email';
  loading = false;
  error = '';
  info = '';

  email = '';
  requestId = '';
  otpRaw = '';
  newPassword = '';
  confirmPassword = '';

  readonly slots = [0, 1, 2, 3, 4, 5];

  onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = raw;
    this.otpRaw = raw;
  }

  onOtpKeydown(event: KeyboardEvent) {
    if (!/^\d$/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }

  focusOtp() { this.otpInputRef?.nativeElement?.focus(); }

  async submitEmail() {
    this.error = '';
    if (!this.email || !this.email.includes('@')) { this.error = 'Enter a valid email address'; return; }

    this.loading = true;
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${environment.apiUrl}/auth/password-reset`, { email: this.email }),
      );
      this.requestId = res.requestId;
      this.info = res.message;
      this.step = 'reset';
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async submitReset() {
    this.error = '';
    if (this.otpRaw.length !== 6) { this.error = 'Enter the 6-digit code from your email'; return; }
    if (this.newPassword.length < 8) { this.error = 'Password must be at least 8 characters'; return; }
    if (this.newPassword !== this.confirmPassword) { this.error = 'Passwords do not match'; return; }

    this.loading = true;
    try {
      await lastValueFrom(
        this.http.post(`${environment.apiUrl}/auth/password-reset/${this.requestId}/verify`, {
          otp: this.otpRaw,
          newPassword: this.newPassword,
        }),
      );
      this.step = 'done';
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Could not reset your password. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  backToEmail() { this.error = ''; this.step = 'email'; }

  goLogin() { this.router.navigate(['/']); }
}
