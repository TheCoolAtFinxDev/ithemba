import { Component, inject, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-provider-appointments',
  imports: [],
  templateUrl: './provider-appointments.html',
  styleUrl: './provider-appointments.css',
})
export class ProviderAppointments implements OnInit {
  @Input() providerId = '';
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  appointments: any[] = [];
  filter = 'all';
  loading = true;

  get filteredAppointments() {
    if (this.filter === 'all') return this.appointments;
    return this.appointments.filter(a => a.status === this.filter);
  }

  ngOnInit() {
    this.auth.profile$.subscribe(profile => {
      if (profile?.provider?.id) {
        this.providerId = profile.provider.id;
        this.loadAppointments();
      }
    });
  }

  loadAppointments() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/v1/providers/${this.providerId}/appointments`)
      .subscribe({
        next: (data) => { this.appointments = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  setFilter(f: string) { this.filter = f; }

  formatDate(utc: string): string {
    return new Date(utc).toLocaleDateString('en-LS', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(utc: string): string {
    return new Date(utc).toLocaleTimeString('en-LS', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Requested: 'badge-requested',
      Scheduled: 'badge-scheduled',
      Confirmed: 'badge-confirmed',
      CheckedIn: 'bg-info text-white',
      InProgress: 'bg-primary text-white',
      Completed: 'badge-completed',
      CancelledByPatient: 'badge-cancelled',
      CancelledByProvider: 'badge-cancelled',
      NoShow: 'bg-secondary text-white',
    };
    return map[status] ?? 'bg-secondary text-white';
  }

  async providerAction(apt: any, action: string) {
    apt.loading = true;
    try {
      await this.http.put(
        `${environment.apiUrl}/v1/providers/${this.providerId}/appointments/${apt.id}/${action}`, {}
      ).toPromise();
      this.loadAppointments();
    } catch (e) {
      console.error(e);
      apt.loading = false;
    }
  }
}
