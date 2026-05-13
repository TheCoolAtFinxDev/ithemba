import { Component, inject, OnInit } from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { PatientAppointments } from './appointments/patient-appointments';
import { PatientAppointmentDetail } from './appointments/patient-appointment-detail';
import { PatientBook } from './book/patient-book';
import { PatientWallet } from './wallet/patient-wallet';
import { PatientClaims } from './claims/patient-claims';
import { environment } from '../../../environments/environment';

type View = 'home' | 'appointments' | 'appointment-detail' | 'book' | 'wallet' | 'claims';

@Component({
  selector: 'app-patient-dashboard',
  imports: [NgIf, DecimalPipe, PatientAppointments, PatientAppointmentDetail, PatientBook, PatientWallet, PatientClaims],
  templateUrl: './patient-dashboard.html',
  styleUrl: './patient-dashboard.css',
})
export class PatientDashboard implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  userName = '';
  activeView: View = 'home';
  activeTab: 'home' | 'appointments' | 'claims' = 'home';

  // appointment detail params
  selectedAppointmentId = '';

  // book params
  rescheduleApptId = '';
  preselectedProviderId = '';

  // wallet summary (home screen)
  walletBalance: number | null = null;
  private patientId = '';

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile) {
        if (!profile.patient) {
          this.router.navigate(['/patient/onboard']);
          return;
        }
        this.userName = profile.fullName?.split(' ')[0] ?? 'Patient';
        if (profile.patient?.id && !this.patientId) {
          this.patientId = profile.patient.id;
          this.loadWalletBalance();
        }
      }
    });
  }

  loadWalletBalance() {
    this.http.get<{ balance: string }>(`${environment.apiUrl}/patients/${this.patientId}/wallet`)
      .subscribe({ next: w => this.walletBalance = +(w?.balance ?? 0) });
  }

  setTab(tab: 'home' | 'appointments' | 'claims') {
    this.activeTab = tab;
    this.activeView = tab === 'home' ? 'home' : tab === 'appointments' ? 'appointments' : 'claims';
  }

  goToAppointments() {
    this.activeTab = 'appointments';
    this.activeView = 'appointments';
  }

  openDetail(id: string) {
    this.selectedAppointmentId = id;
    this.activeView = 'appointment-detail';
  }

  openBook() {
    this.rescheduleApptId = '';
    this.preselectedProviderId = '';
    this.activeView = 'book';
  }

  openReschedule(event: { apptId: string; providerId: string }) {
    this.rescheduleApptId = event.apptId;
    this.preselectedProviderId = event.providerId;
    this.activeView = 'book';
  }

  onBookDone() {
    this.rescheduleApptId = '';
    this.preselectedProviderId = '';
    this.activeTab = 'appointments';
    this.activeView = 'appointments';
  }

  backToAppointments() {
    this.activeView = 'appointments';
  }

  logout() {
    this.auth.logout();
  }
}
