import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface HourSlot {
  dayOfWeek: number;
  dayName: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  clinicName: string;
  specialization: string;
  phoneNumber: string;
  email: string;
  about: string | null;
  location: string;
  isVerified: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-provider-profile',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.css',
})
export class ProviderProfile implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  providerId = '';
  profile: ProfileData | null = null;
  hours: HourSlot[] = [];

  profileLoading = false;
  hoursLoading = false;
  hoursSaving = false;
  profileSaving = false;

  profileError = '';
  hoursError = '';
  profileSuccess = '';
  hoursSuccess = '';

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.provider?.id && !this.providerId) {
        this.providerId = p.provider.id;
        this.loadProfile();
        this.loadHours();
      }
    });
  }

  loadProfile() {
    this.profileLoading = true;
    this.http.get<any>(`${environment.apiUrl}/v1/providers/profile/Me`)
      .subscribe({
        next: data => {
          if (data) {
            this.profile = {
              firstName: data.firstName,
              lastName: data.lastName,
              clinicName: data.clinicName,
              specialization: data.specialization,
              phoneNumber: data.phoneNumber,
              email: data.email,
              about: data.about,
              location: data.location,
              isVerified: data.isVerified,
            };
          }
          this.profileLoading = false;
        },
        error: () => { this.profileLoading = false; },
      });
  }

  loadHours() {
    this.hoursLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/v1/providers/profile/hours`)
      .subscribe({
        next: data => {
          const map = new Map((data || []).map(h => [h.dayOfWeek, h]));
          this.hours = DAYS.map((name, i) => {
            const existing = map.get(i);
            return {
              dayOfWeek: i,
              dayName: name,
              isAvailable: existing?.isAvailable ?? (i >= 1 && i <= 5),
              startTime: existing?.startTime ?? '09:00',
              endTime: existing?.endTime ?? '17:00',
            };
          });
          this.hoursLoading = false;
        },
        error: () => { this.hoursLoading = false; },
      });
  }

  saveProfile() {
    if (!this.profile) return;
    this.profileSaving = true;
    this.profileError = '';
    this.profileSuccess = '';
    this.http.put(`${environment.apiUrl}/v1/providers/profile/update`, {
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      clinicName: this.profile.clinicName,
      specialization: this.profile.specialization,
      phoneNumber: this.profile.phoneNumber,
      about: this.profile.about,
      location: this.profile.location,
    }).subscribe({
      next: () => { this.profileSaving = false; this.profileSuccess = 'Profile updated successfully!'; },
      error: e => { this.profileError = e?.error?.message || 'Update failed.'; this.profileSaving = false; },
    });
  }

  saveHours() {
    this.hoursSaving = true;
    this.hoursError = '';
    this.hoursSuccess = '';
    this.http.put(`${environment.apiUrl}/v1/providers/profile/hours`, {
      hours: this.hours.map(h => ({
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        isAvailable: h.isAvailable,
      })),
    }).subscribe({
      next: () => { this.hoursSaving = false; this.hoursSuccess = 'Working hours saved!'; },
      error: e => { this.hoursError = e?.error?.message || 'Save failed.'; this.hoursSaving = false; },
    });
  }
}
