import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AppointmentRow {
  id: string;
  status: string;
  startUtc: string;
  endUtc: string;
  reason: string | null;
  createdAt: string;
  patient: { userProfile: { fullName: string; email: string } };
  provider: { firstName: string; lastName: string; clinicName: string };
}

@Component({
  selector: 'app-admin-appointments',
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe, SlicePipe, UpperCasePipe],
  templateUrl: './admin-appointments.html',
  styleUrl: './admin-appointments.css',
})
export class AdminAppointments implements OnInit {
  private http = inject(HttpClient);

  appointments: AppointmentRow[] = [];
  loading = false;
  error = '';
  filterStatus = '';

  statuses = [
    { value: '', label: 'All' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'CheckedIn', label: 'Checked In' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'NoShow', label: 'No Show' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    const q = this.filterStatus ? `?status=${this.filterStatus}` : '';
    this.http.get<AppointmentRow[]>(`${environment.apiUrl}/admin/appointments${q}`).subscribe({
      next: data => { this.appointments = data; this.loading = false; },
      error: () => { this.error = 'Could not load appointments.'; this.loading = false; },
    });
  }

  statusClass(s: string): string {
    switch (s) {
      case 'Completed': return 'badge-green';
      case 'Cancelled': case 'NoShow': return 'badge-red';
      case 'CheckedIn': case 'InProgress': return 'badge-blue';
      case 'Confirmed': return 'badge-teal';
      default: return 'badge-grey';
    }
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      Requested: 'Requested', Confirmed: 'Confirmed', CheckedIn: 'Checked In',
      InProgress: 'In Progress', Completed: 'Completed', Cancelled: 'Cancelled', NoShow: 'No Show',
    };
    return map[s] ?? s;
  }
}
