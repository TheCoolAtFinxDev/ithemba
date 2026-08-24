import { Component, Input, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Member {
  id: string;
  employeeRef: string;
  contributionAmount: string;
  status: 'Active' | 'Suspended' | 'Terminated';
  startDate: string;
  patient: { userProfile: { email: string; fullName: string } };
}

interface ContributionLine { employeeRef: string; amount: number | null; }

interface BulkRow {
  firstName: string; lastName: string; email: string; phoneNumber: string;
  employeeRef: string; contributionAmount: number;
}
interface BulkResultRow { row: number; employeeRef: string; outcome: 'linked' | 'invited' | 'error'; message?: string; }

const BULK_CSV_HEADERS = ['firstname', 'lastname', 'email', 'phonenumber', 'employeeref', 'contributionamount'];

@Component({
  selector: 'app-employer-employees',
  imports: [NgIf, NgFor, NgClass, FormsModule, DecimalPipe],
  templateUrl: './employer-employees.html',
})
export class EmployerEmployees implements OnInit {
  @Input() employerId = '';

  private http = inject(HttpClient);

  members: Member[] = [];
  loading = false;
  error = '';

  showAddModal = false;
  addPatientId = '';
  addEmployeeRef = '';
  addAmount: number | null = null;
  addLoading = false;
  addError = '';

  showBulkModal = false;
  bulkFileName = '';
  bulkRows: BulkRow[] = [];
  bulkParseErrors: string[] = [];
  bulkLoading = false;
  bulkError = '';
  bulkResult: { linked: number; invited: number; failed: number; results: BulkResultRow[] } | null = null;

  showUploadModal = false;
  uploadMonth = '';
  uploadRows: ContributionLine[] = [{ employeeRef: '', amount: null }];
  uploadPreview: any = null;
  uploadLoading = false;
  uploadError = '';

  ngOnInit() { this.load(); }

  load() {
    if (!this.employerId) return;
    this.loading = true;
    this.http.get<Member[]>(`${environment.apiUrl}/employers/${this.employerId}/members`)
      .subscribe({
        next: d => { this.members = d || []; this.loading = false; },
        error: () => { this.error = 'Could not load members.'; this.loading = false; },
      });
  }

  openAdd() {
    this.addPatientId = ''; this.addEmployeeRef = ''; this.addAmount = null;
    this.addError = ''; this.showAddModal = true;
  }

  submitAdd() {
    if (!this.addPatientId || !this.addEmployeeRef || !this.addAmount) {
      this.addError = 'All fields are required.'; return;
    }
    this.addLoading = true; this.addError = '';
    this.http.post(`${environment.apiUrl}/employers/${this.employerId}/members`, {
      patientId: this.addPatientId,
      employeeRef: this.addEmployeeRef,
      contributionAmount: this.addAmount,
    }).subscribe({
      next: () => { this.showAddModal = false; this.addLoading = false; this.load(); },
      error: e => { this.addError = e?.error?.message || 'Failed to add member.'; this.addLoading = false; },
    });
  }

  openBulk() {
    this.bulkFileName = ''; this.bulkRows = []; this.bulkParseErrors = [];
    this.bulkError = ''; this.bulkResult = null; this.bulkLoading = false;
    this.showBulkModal = true;
  }

  onBulkFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.bulkFileName = file.name;
    this.bulkResult = null; this.bulkError = '';
    const reader = new FileReader();
    reader.onload = () => this.parseBulkCsv(String(reader.result || ''));
    reader.readAsText(file);
  }

  private parseBulkCsv(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    this.bulkRows = []; this.bulkParseErrors = [];
    if (lines.length < 2) { this.bulkParseErrors.push('CSV needs a header row plus at least one employee row.'); return; }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const missing = BULK_CSV_HEADERS.filter(h => !headers.includes(h));
    if (missing.length) {
      this.bulkParseErrors.push(`Missing column(s): ${missing.join(', ')}. Expected header: firstName,lastName,email,phoneNumber,employeeRef,contributionAmount`);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(c => c.trim());
      const get = (name: string) => cells[headers.indexOf(name)] ?? '';
      const amount = Number(get('contributionamount'));

      const row: BulkRow = {
        firstName: get('firstname'), lastName: get('lastname'), email: get('email'),
        phoneNumber: get('phonenumber'), employeeRef: get('employeeref'), contributionAmount: amount,
      };

      if (!row.firstName || !row.lastName || !row.email || !row.phoneNumber || !row.employeeRef) {
        this.bulkParseErrors.push(`Row ${i + 1}: missing a required field`);
        continue;
      }
      if (!row.email.includes('@')) {
        this.bulkParseErrors.push(`Row ${i + 1}: invalid email "${row.email}"`);
        continue;
      }
      if (!amount || amount <= 0) {
        this.bulkParseErrors.push(`Row ${i + 1}: contribution amount must be a positive number`);
        continue;
      }
      this.bulkRows.push(row);
    }
  }

  submitBulk() {
    if (!this.bulkRows.length) { this.bulkError = 'No valid rows to enroll.'; return; }
    this.bulkLoading = true; this.bulkError = '';
    this.http.post<any>(`${environment.apiUrl}/employers/${this.employerId}/members/bulk`, { rows: this.bulkRows })
      .subscribe({
        next: res => { this.bulkResult = res; this.bulkLoading = false; this.load(); },
        error: e => { this.bulkError = e?.error?.message || 'Bulk enrollment failed.'; this.bulkLoading = false; },
      });
  }

  suspend(m: Member) {
    if (!confirm(`Suspend ${m.patient.userProfile.fullName}?`)) return;
    this.http.put(`${environment.apiUrl}/employers/${this.employerId}/members/${m.id}/suspend`, {})
      .subscribe({ next: () => this.load(), error: () => alert('Failed to suspend member.') });
  }

  terminate(m: Member) {
    if (!confirm(`Terminate ${m.patient.userProfile.fullName}? This cannot be undone.`)) return;
    this.http.delete(`${environment.apiUrl}/employers/${this.employerId}/members/${m.id}`)
      .subscribe({ next: () => this.load(), error: () => alert('Failed to terminate member.') });
  }

  addUploadRow() { this.uploadRows.push({ employeeRef: '', amount: null }); }
  removeUploadRow(i: number) { this.uploadRows.splice(i, 1); }

  openUpload() {
    const now = new Date();
    this.uploadMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.uploadRows = [{ employeeRef: '', amount: null }];
    this.uploadPreview = null; this.uploadError = '';
    this.showUploadModal = true;
  }

  confirming = false;

  private uploadPayload() {
    return {
      billingMonth: this.uploadMonth,
      contributions: this.uploadRows
        .filter(r => r.employeeRef && r.amount !== null)
        .map(r => ({ employeeRef: r.employeeRef, amount: r.amount })),
    };
  }

  previewUpload() {
    const payload = this.uploadPayload();
    if (!payload.contributions.length) { this.uploadError = 'Add at least one contribution line.'; return; }
    this.uploadLoading = true; this.uploadError = '';
    this.http.post<any>(`${environment.apiUrl}/employers/${this.employerId}/contributions/upload`, payload).subscribe({
      next: d => { this.uploadPreview = d; this.uploadLoading = false; },
      error: e => { this.uploadError = e?.error?.message || 'Preview failed.'; this.uploadLoading = false; },
    });
  }

  confirmUpload() {
    const payload = this.uploadPayload();
    this.confirming = true; this.uploadError = '';
    this.http.post<any>(`${environment.apiUrl}/employers/${this.employerId}/contributions/confirm`, payload).subscribe({
      next: () => { this.confirming = false; this.showUploadModal = false; this.load(); },
      error: e => { this.uploadError = e?.error?.message || 'Failed to confirm batch.'; this.confirming = false; },
    });
  }

  statusBadge(s: string) {
    if (s === 'Active') return 'badge bg-success';
    if (s === 'Suspended') return 'badge bg-warning text-dark';
    return 'badge bg-secondary';
  }
}
