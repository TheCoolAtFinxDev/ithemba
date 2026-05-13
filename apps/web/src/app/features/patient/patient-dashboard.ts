import { Component, inject, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { PatientAppointments } from './appointments/patient-appointments';
import { PatientAppointmentDetail } from './appointments/patient-appointment-detail';
import { PatientBook } from './book/patient-book';

type View = 'home' | 'appointments' | 'appointment-detail' | 'book' | 'claims';

@Component({
  selector: 'app-patient-dashboard',
  imports: [NgIf, PatientAppointments, PatientAppointmentDetail, PatientBook],
  templateUrl: './patient-dashboard.html',
  styleUrl: './patient-dashboard.css',
})
export class PatientDashboard implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  userName = '';
  activeView: View = 'home';
  activeTab: 'home' | 'appointments' | 'claims' = 'home';

  // appointment detail params
  selectedAppointmentId = '';

  // book params
  rescheduleApptId = '';
  preselectedProviderId = '';

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile) {
        if (!profile.patient) {
          this.router.navigate(['/patient/onboard']);
          return;
        }
        this.userName = profile.fullName?.split(' ')[0] ?? 'Patient';
      }
    });
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
