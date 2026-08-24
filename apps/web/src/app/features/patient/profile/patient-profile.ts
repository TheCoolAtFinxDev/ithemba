import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-patient-profile',
  imports: [NgIf, FormsModule],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  @Output() back = new EventEmitter<void>();
  @Output() logoutRequest = new EventEmitter<void>();

  fullName = '';
  email = '';
  initials = '';

  phone = '';
  nationalId = '';
  dateOfBirth = '';

  addressLine1 = '';
  city = '';
  district = '';

  loading = false;
  saving = false;
  savingAddress = false;
  error = '';
  success = '';
  addressError = '';
  addressSuccess = '';

  showLogoutConfirm = false;

  emailEnabled = true;
  smsEnabled = true;
  reminderAdvanceHours = 24;
  prefsLoading = false;
  prefsSaving = false;

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p) {
        this.fullName = p.fullName ?? '';
        this.email = p.email ?? '';
        this.initials = this.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        this.loadPatient();
        this.loadNotificationPreferences();
      }
    });
  }

  loadNotificationPreferences() {
    this.prefsLoading = true;
    this.http.get<{ emailEnabled: boolean; smsEnabled: boolean; reminderAdvanceHours?: number }>(`${environment.apiUrl}/patients/profile/notification-preferences`)
      .subscribe({
        next: data => {
          this.emailEnabled = data.emailEnabled;
          this.smsEnabled = data.smsEnabled;
          this.reminderAdvanceHours = data.reminderAdvanceHours ?? 24;
          this.prefsLoading = false;
        },
        error: () => { this.prefsLoading = false; },
      });
  }

  toggleNotificationPref(field: 'emailEnabled' | 'smsEnabled') {
    this[field] = !this[field];
    this.saveNotificationPrefs();
  }

  updateReminderAdvanceHours(value: string) {
    this.reminderAdvanceHours = Number(value);
    this.saveNotificationPrefs();
  }

  private saveNotificationPrefs() {
    this.prefsSaving = true;
    this.http.put(`${environment.apiUrl}/patients/profile/notification-preferences`, {
      emailEnabled: this.emailEnabled, smsEnabled: this.smsEnabled,
      reminderAdvanceHours: this.reminderAdvanceHours,
    }).subscribe({
      next: () => { this.prefsSaving = false; },
      error: () => { this.prefsSaving = false; },
    });
  }

  loadPatient() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/patients/profile`)
      .subscribe({
        next: data => {
          if (data) {
            this.phone = data.phoneNumber ?? '';
            this.nationalId = data.nationalId ?? '';
            this.dateOfBirth = data.dateOfBirth
              ? new Date(data.dateOfBirth).toISOString().split('T')[0]
              : '';
          }
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
  }

  saveProfile() {
    this.saving = true;
    this.error = '';
    this.success = '';
    const body: any = { phoneNumber: this.phone };
    if (this.nationalId) body.nationalId = this.nationalId;
    if (this.dateOfBirth) body.dateOfBirth = this.dateOfBirth;

    this.http.put(`${environment.apiUrl}/patients/profile`, body)
      .subscribe({
        next: () => { this.saving = false; this.success = 'Profile updated.'; },
        error: e => { this.error = e?.error?.message || 'Update failed.'; this.saving = false; },
      });
  }

  saveAddress() {
    this.savingAddress = true;
    this.addressError = '';
    this.addressSuccess = '';
    this.http.put(`${environment.apiUrl}/patients/profile/address`, {
      addressLine1: this.addressLine1,
      city: this.city,
      district: this.district,
      country: 'Lesotho',
    }).subscribe({
      next: () => { this.savingAddress = false; this.addressSuccess = 'Address saved.'; },
      error: e => { this.addressError = e?.error?.message || 'Save failed.'; this.savingAddress = false; },
    });
  }

  confirmLogout() { this.showLogoutConfirm = true; }
  cancelLogout() { this.showLogoutConfirm = false; }
  doLogout() { this.logoutRequest.emit(); }
}
