import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EmployerBilling } from '../../employer/billing/employer-billing';
import { environment } from '../../../../environments/environment';

interface EmployerRow {
  id: string;
  name: string;
  registrationNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  platformFeePerSeat: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  verifiedAt: string | null;
  _count: { memberships: number; billingCycles: number };
}

interface BulkRow {
  firstName: string; lastName: string; email: string; phoneNumber: string;
  employeeRef: string; contributionAmount: number;
}
interface BulkResultRow { row: number; employeeRef: string; outcome: 'linked' | 'invited' | 'error'; message?: string; }

const BULK_CSV_HEADERS = ['firstname', 'lastname', 'email', 'phonenumber', 'employeeref', 'contributionamount'];

@Component({
  selector: 'app-admin-employers',
  imports: [NgIf, NgFor, NgClass, FormsModule, DecimalPipe, EmployerBilling],
  templateUrl: './admin-employers.html',
  styleUrl: './admin-employers.css',
})
export class AdminEmployers implements OnInit {
  private http = inject(HttpClient);

  employers: EmployerRow[] = [];
  loading = false;
  error = '';
  actionId = '';
  actionLoading = false;

  showCreateModal = false;
  creating = false;
  createError = '';
  created: { name: string; email: string; temporaryPassword: string } | null = null;

  form = {
    name: '',
    registrationNumber: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    platformFeePerSeat: 50,
  };
  contactEmailTaken = false;
  private contactEmailTimer: any;

  ngOnInit() { this.load(); }

  onContactEmailInput() {
    this.contactEmailTaken = false;
    clearTimeout(this.contactEmailTimer);
    const email = this.form.contactEmail.trim();
    if (!email || !email.includes('@')) return;
    this.contactEmailTimer = setTimeout(() => {
      this.http.get<{ exists: boolean }>(`${environment.apiUrl}/auth/users/exists?email=${encodeURIComponent(email)}`)
        .subscribe({ next: res => this.contactEmailTaken = res.exists, error: () => {} });
    }, 400);
  }

  load() {
    this.loading = true;
    this.error = '';
    this.http.get<EmployerRow[]>(`${environment.apiUrl}/admin/employers`).subscribe({
      next: data => { this.employers = data; this.loading = false; },
      error: () => { this.error = 'Could not load employers.'; this.loading = false; },
    });
  }

  openCreate() {
    this.form = { name: '', registrationNumber: '', contactFirstName: '', contactLastName: '', contactEmail: '', contactPhone: '', platformFeePerSeat: 50 };
    this.createError = '';
    this.created = null;
    this.contactEmailTaken = false;
    this.showCreateModal = true;
  }

  async submitCreate() {
    this.createError = '';
    if (!this.form.name.trim()) { this.createError = 'Company name is required'; return; }
    if (!this.form.contactFirstName.trim() || !this.form.contactLastName.trim()) { this.createError = 'Contact first and last name are required'; return; }
    if (!this.form.contactEmail.includes('@')) { this.createError = 'Valid contact email is required'; return; }
    if (this.contactEmailTaken) { this.createError = 'An account with this email already exists'; return; }
    if (!this.form.contactPhone.trim()) { this.createError = 'Contact phone is required'; return; }

    this.creating = true;
    this.http.post<any>(`${environment.apiUrl}/admin/employers`, this.form).subscribe({
      next: res => {
        this.creating = false;
        this.created = { name: res.name, email: res.contactEmail, temporaryPassword: res.temporaryPassword };
        this.load();
      },
      error: err => {
        this.creating = false;
        this.createError = err?.error?.message ?? 'Failed to create employer';
      },
    });
  }

  closeCreate() { this.showCreateModal = false; this.created = null; }

  verify(emp: EmployerRow) {
    this.actionId = emp.id;
    this.actionLoading = true;
    this.http.put(`${environment.apiUrl}/admin/employers/${emp.id}/verify`, {}).subscribe({
      next: () => { this.actionLoading = false; this.actionId = ''; this.load(); },
      error: () => { this.actionLoading = false; this.actionId = ''; },
    });
  }

  showBulkModal = false;
  bulkEmployerId = '';
  bulkFileName = '';
  bulkRows: BulkRow[] = [];
  bulkParseErrors: string[] = [];
  bulkLoading = false;
  bulkError = '';
  bulkResult: { linked: number; invited: number; failed: number; results: BulkResultRow[] } | null = null;

  openBulk() {
    this.bulkEmployerId = this.verified[0]?.id ?? '';
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
    if (!this.bulkEmployerId) { this.bulkError = 'Select an employer first.'; return; }
    if (!this.bulkRows.length) { this.bulkError = 'No valid rows to enroll.'; return; }
    this.bulkLoading = true; this.bulkError = '';
    this.http.post<any>(`${environment.apiUrl}/employers/${this.bulkEmployerId}/members/bulk`, { rows: this.bulkRows })
      .subscribe({
        next: res => { this.bulkResult = res; this.bulkLoading = false; this.load(); },
        error: e => { this.bulkError = e?.error?.message || 'Bulk enrollment failed.'; this.bulkLoading = false; },
      });
  }

  billingEmployer: EmployerRow | null = null;

  openBilling(emp: EmployerRow) { this.billingEmployer = emp; }
  closeBilling() { this.billingEmployer = null; }

  toggleActive(emp: EmployerRow) {
    const path = emp.isActive ? 'deactivate' : 'activate';
    this.actionId = emp.id;
    this.actionLoading = true;
    this.http.put(`${environment.apiUrl}/admin/employers/${emp.id}/${path}`, {}).subscribe({
      next: () => { this.actionLoading = false; this.actionId = ''; this.load(); },
      error: () => { this.actionLoading = false; this.actionId = ''; },
    });
  }

  get pending() { return this.employers.filter(e => !e.isVerified); }
  get verified() { return this.employers.filter(e => e.isVerified); }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
