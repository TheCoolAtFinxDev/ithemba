import { Component, inject, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  clinicName: string;
  specialization: string;
  location: string;
}

interface Slot {
  startUtc: string;
  endUtc: string;
  label: string;
  isBooked: boolean;
}

@Component({
  selector: 'app-patient-book',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './patient-book.html',
  styleUrl: './patient-book.css',
})
export class PatientBook implements OnInit, OnDestroy {
  @Input() rescheduleApptId = '';
  @Input() preselectedProviderId = '';
  @Output() done = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  searchTerm = '';
  selectedDate = this.todayYmd();
  providers: Provider[] = [];
  selectedProviderId = '';
  selectedProvider: Provider | null = null;
  slots: Slot[] = [];
  pickedSlotIso = '';
  reason = '';
  loading = false;
  slotsLoading = false;
  error = '';
  private patientId = '';
  private searchTimer: any;

  get isReschedule() { return !!this.rescheduleApptId; }
  get availableSlots() { return this.slots.filter(s => !s.isBooked && new Date(s.startUtc) > new Date()); }

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id) this.patientId = p.patient.id;
    });
    this.loadProviders();
  }

  ngOnDestroy() { clearTimeout(this.searchTimer); }

  todayYmd(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  onSearchInput() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProviders(), 350);
  }

  loadProviders() {
    this.loading = true;
    this.error = '';
    const q = this.searchTerm ? `&query=${encodeURIComponent(this.searchTerm)}` : '';
    this.http.get<Provider[]>(`${environment.apiUrl}/v1/providers/profile/search?${q}`)
      .subscribe({
        next: data => { this.providers = data || []; this.loading = false; },
        error: () => { this.error = 'Could not load providers. Please try again.'; this.loading = false; },
      });
  }

  selectProvider(p: Provider) {
    this.selectedProviderId = p.id;
    this.selectedProvider = p;
    this.pickedSlotIso = '';
    this.slots = [];
    this.loadSlots();
  }

  onDateChange() {
    if (this.selectedProviderId) {
      this.pickedSlotIso = '';
      this.loadSlots();
    }
  }

  loadSlots() {
    if (!this.selectedProviderId) return;
    this.slotsLoading = true;
    this.error = '';
    this.http.get<{ slots: Slot[] }>(`${environment.apiUrl}/v1/providers/profile/slots?providerId=${this.selectedProviderId}&date=${this.selectedDate}`)
      .subscribe({
        next: res => { this.slots = res?.slots || []; this.slotsLoading = false; },
        error: () => { this.error = 'Could not load slots.'; this.slotsLoading = false; },
      });
  }

  pickSlot(slot: Slot) {
    if (!slot.isBooked) this.pickedSlotIso = slot.startUtc;
  }

  confirm() {
    if (!this.pickedSlotIso || !this.patientId) return;
    this.loading = true;
    this.error = '';
    const endIso = new Date(new Date(this.pickedSlotIso).getTime() + 30 * 60000).toISOString();

    if (this.isReschedule) {
      this.http.put(`${environment.apiUrl}/patients/${this.patientId}/appointments/${this.rescheduleApptId}/reschedule`, {
        startUtc: this.pickedSlotIso,
        endUtc: endIso,
      }).subscribe({
        next: () => { this.loading = false; this.done.emit(); },
        error: e => { this.error = e?.error?.message || 'Reschedule failed.'; this.loading = false; },
      });
    } else {
      this.http.post(`${environment.apiUrl}/patients/${this.patientId}/appointments`, {
        providerId: this.selectedProviderId,
        startUtc: this.pickedSlotIso,
        endUtc: endIso,
        reason: this.reason || undefined,
      }).subscribe({
        next: () => { this.loading = false; this.done.emit(); },
        error: e => { this.error = e?.error?.message || 'Booking failed.'; this.loading = false; },
      });
    }
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateLabel(ymd: string): string {
    const [y, m, d] = ymd.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
