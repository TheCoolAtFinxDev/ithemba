import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'ithemba_reg';

type Step = 'info' | 'email-otp' | 'sms-otp' | 'done';

@Component({
  selector: 'app-registration',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class Registration implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('emailOtpInput') emailOtpInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('phoneOtpInput') phoneOtpInputRef!: ElementRef<HTMLInputElement>;

  step: Step = 'info';
  role: 'PATIENT' | 'PROVIDER' | 'EMPLOYER' = 'PATIENT';
  loading = false;
  error = '';
  pendingId = '';

  info = { firstName: '', lastName: '', email: '', phoneNumber: '', companyName: '' };
  emailTaken = false;
  private emailCheckTimer: any;

  inviteToken = '';
  inviteEmployerName = '';
  inviteError = '';

  emailOtpRaw = '';
  phoneOtpRaw  = '';

  readonly slots = [0, 1, 2, 3, 4, 5];

  get emailOtpValue() { return this.emailOtpRaw; }
  get phoneOtpValue()  { return this.phoneOtpRaw;  }

  ngOnInit() {
    const r = this.route.snapshot.queryParamMap.get('role');
    if (r === 'PROVIDER') this.role = 'PROVIDER';
    else if (r === 'EMPLOYER') this.role = 'EMPLOYER';

    const pid = this.route.snapshot.queryParamMap.get('pid');
    if (pid) {
      this.pendingId = pid;
      this.step = 'email-otp';
      return;
    }

    const invite = this.route.snapshot.queryParamMap.get('invite');
    if (invite) {
      this.loadInvite(invite);
      return;
    }

    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.pendingId && new Date(state.expiresAt) > new Date()) {
          this.pendingId = state.pendingId;
          this.info = state.info ?? this.info;
          this.step = 'email-otp';
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {}
  }

  setRole(r: 'PATIENT' | 'PROVIDER' | 'EMPLOYER') {
    if (this.inviteToken) return;
    this.role = r;
  }

  private async loadInvite(token: string) {
    this.loading = true;
    try {
      const res: any = await lastValueFrom(this.http.get(`${environment.apiUrl}/auth/register/invite/${token}`));
      this.inviteToken = token;
      this.inviteEmployerName = res.employerName;
      this.role = 'PATIENT';
      this.info = { firstName: res.firstName, lastName: res.lastName, email: res.email, phoneNumber: res.phoneNumber, companyName: '' };
    } catch (err: any) {
      this.inviteError = err?.error?.message ?? 'This invite link is no longer valid. You can still register below.';
    } finally {
      this.loading = false;
    }
  }

  onEmailInput() {
    this.emailTaken = false;
    clearTimeout(this.emailCheckTimer);
    const email = this.info.email.trim();
    if (!email || !email.includes('@')) return;
    this.emailCheckTimer = setTimeout(async () => {
      try {
        const res: any = await lastValueFrom(
          this.http.get(`${environment.apiUrl}/auth/users/exists?email=${encodeURIComponent(email)}`)
        );
        this.emailTaken = !!res?.exists;
      } catch {}
    }, 400);
  }

  onOtpInput(field: 'email' | 'phone', event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = raw;
    if (field === 'email') this.emailOtpRaw = raw;
    else this.phoneOtpRaw = raw;
  }

  onOtpKeydown(event: KeyboardEvent) {
    if (!/^\d$/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }

  focusEmailOtp() { this.emailOtpInputRef?.nativeElement?.focus(); }
  focusPhoneOtp()  { this.phoneOtpInputRef?.nativeElement?.focus();  }

  async submitInfo() {
    this.error = '';
    if (!this.info.firstName || !this.info.lastName) { this.error = 'First and last name are required'; return; }
    if (!this.info.email || !this.info.email.includes('@')) { this.error = 'Valid email is required'; return; }
    if (!this.info.phoneNumber) { this.error = 'Phone number is required'; return; }
    if (this.emailTaken) { this.error = 'An account with this email already exists'; return; }
    if (this.role === 'EMPLOYER' && !this.info.companyName.trim()) {
      this.error = 'Company name is required';
      return;
    }

    this.loading = true;
    try {
      const body: any = { ...this.info, role: this.role };
      if (this.role !== 'EMPLOYER') delete body.companyName;
      const res: any = await lastValueFrom(this.http.post(`${environment.apiUrl}/auth/register`, body));
      this.pendingId = res.pendingId;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        pendingId: res.pendingId, expiresAt: res.expiresAt, info: this.info,
      }));
      this.step = 'email-otp';
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  nextToSms() {
    this.error = '';
    if (this.emailOtpValue.length !== 6) { this.error = 'Enter the 6-digit email code first'; return; }
    this.step = 'sms-otp';
  }

  backToEmail() { this.error = ''; this.step = 'email-otp'; }

  async submitVerify() {
    this.error = '';
    if (this.phoneOtpValue.length !== 6) { this.error = 'Enter the 6-digit SMS code'; return; }

    this.loading = true;
    try {
      await lastValueFrom(this.http.post(
        `${environment.apiUrl}/auth/register/${this.pendingId}/verify`,
        { emailOtp: this.emailOtpValue, phoneOtp: this.phoneOtpValue },
      ));
      sessionStorage.removeItem(SESSION_KEY);
      this.step = 'done';
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Incorrect code. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async resend() {
    this.error = '';
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${environment.apiUrl}/auth/register/${this.pendingId}/resend`, {})
      );
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...JSON.parse(saved), expiresAt: res.expiresAt }));
      }
      this.emailOtpRaw = '';
      this.phoneOtpRaw  = '';
      this.step = 'email-otp';
      this.error = 'New codes sent to your email and phone.';
    } catch (err: any) {
      this.error = err?.error?.message ?? 'Could not resend codes';
    }
  }

  goLogin() { this.router.navigate(['/']); }

  get roleTitle(): string {
    if (this.role === 'EMPLOYER') return 'Employer account created!';
    if (this.role === 'PROVIDER') return 'Provider account created!';
    return 'Account created!';
  }

  get doneMessage(): string {
    if (this.role === 'EMPLOYER') {
      return 'Your employer account is pending verification by the iThemba team. You can log in now to explore your employer dashboard.';
    }
    if (this.role === 'PROVIDER') {
      return 'Your provider account is pending verification. You can log in and complete your profile while the team reviews your application.';
    }
    return 'You can now log in and start your health savings journey.';
  }
}
