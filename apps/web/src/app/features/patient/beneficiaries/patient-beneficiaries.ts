import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Beneficiary {
  id: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string | null;
  gender: string | null;
  nationalId: string | null;
  phoneNumber: string | null;
}

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'Other'];

@Component({
  selector: 'app-patient-beneficiaries',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './patient-beneficiaries.html',
  styleUrl: './patient-beneficiaries.css',
})
export class PatientBeneficiaries implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  @Output() back = new EventEmitter<void>();

  patientId = '';
  beneficiaries: Beneficiary[] = [];
  loading = false;
  error = '';
  success = '';

  showModal = false;
  saving = false;
  removing = '';

  form = {
    fullName: '',
    relationship: 'Spouse',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    phoneNumber: '',
  };

  relationships = RELATIONSHIPS;

  ngOnInit() {
    this.auth.profile$.subscribe(p => {
      if (p?.patient?.id && !this.patientId) {
        this.patientId = p.patient.id;
        this.load();
      }
    });
  }

  load() {
    this.loading = true;
    this.http.get<Beneficiary[]>(`${environment.apiUrl}/patients/${this.patientId}/beneficiaries`)
      .subscribe({
        next: data => { this.beneficiaries = data || []; this.loading = false; },
        error: () => { this.error = 'Failed to load beneficiaries.'; this.loading = false; },
      });
  }

  openAdd() {
    this.form = { fullName: '', relationship: 'Spouse', dateOfBirth: '', gender: '', nationalId: '', phoneNumber: '' };
    this.error = '';
    this.success = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    if (!this.form.fullName.trim()) { this.error = 'Full name is required.'; return; }
    this.saving = true;
    this.error = '';
    const body: any = {
      fullName: this.form.fullName.trim(),
      relationship: this.form.relationship,
    };
    if (this.form.dateOfBirth) body.dateOfBirth = this.form.dateOfBirth;
    if (this.form.gender) body.gender = this.form.gender;
    if (this.form.nationalId.trim()) body.nationalId = this.form.nationalId.trim();
    if (this.form.phoneNumber.trim()) body.phoneNumber = this.form.phoneNumber.trim();

    this.http.post<Beneficiary>(`${environment.apiUrl}/patients/${this.patientId}/beneficiaries`, body)
      .subscribe({
        next: b => {
          this.beneficiaries.push(b);
          this.saving = false;
          this.showModal = false;
          this.success = `${b.fullName} added as beneficiary.`;
        },
        error: e => { this.error = e?.error?.message || 'Save failed.'; this.saving = false; },
      });
  }

  remove(id: string, name: string) {
    if (!confirm(`Remove ${name} as a beneficiary?`)) return;
    this.removing = id;
    this.http.delete(`${environment.apiUrl}/patients/${this.patientId}/beneficiaries/${id}`)
      .subscribe({
        next: () => {
          this.beneficiaries = this.beneficiaries.filter(b => b.id !== id);
          this.removing = '';
        },
        error: () => { this.error = 'Remove failed.'; this.removing = ''; },
      });
  }

  relationshipColor(rel: string): string {
    const map: Record<string, string> = {
      Spouse: '#9C27B0', Child: '#00B9D6', Parent: '#4A7C59',
      Sibling: '#FF9800', Grandparent: '#1565C0', Grandchild: '#E91E63',
    };
    return map[rel] ?? '#757575';
  }

  formatDob(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
