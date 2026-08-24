import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { environment } from '../../../../environments/environment';

const CSV_COLUMNS = ['email', 'firstName', 'lastName', 'clinicName', 'specialization', 'phoneNumber', 'location'] as const;
const CSV_EXAMPLE_ROW = [
  'dr.thabo@maseru-clinic.ls', 'Thabo', 'Mokoena', 'Maseru Medical Centre', 'General Practitioner', '+26650123456', 'Maseru CBD',
];

interface ProviderRow {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    clinicName: string;
    specialization: string;
    location: string;
    phoneNumber: string;
    about: string | null;
    isVerified: boolean;
    isActive: boolean;
    disbursementEnabled: boolean;
    ecocashNumber: string | null;
    bankAccountNumber: string | null;
    bankName: string | null;
  };
}

interface CsvRow {
  email: string; firstName: string; lastName: string;
  clinicName: string; specialization: string; phoneNumber: string; location: string;
  _error?: string;
}

interface ImportResult {
  created: number; total: number;
  errors: Array<{ email: string; error: string }>;
}

@Component({
  selector: 'app-admin-providers',
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './admin-providers.html',
  styleUrl: './admin-providers.css',
})
export class AdminProviders implements OnInit {
  private http = inject(HttpClient);

  providers: ProviderRow[] = [];
  loading = false;
  error = '';
  actionId = '';
  actionLoading = false;

  // ── Add single provider modal ──
  showAddModal = false;
  addLoading = false;
  addError = '';
  addSuccess: { name: string; email: string; temporaryPassword: string } | null = null;
  addForm = {
    email: '', firstName: '', lastName: '', clinicName: '',
    specialization: '', phoneNumber: '', location: '', about: '',
  };
  addEmailTaken = false;
  private addEmailTimer: any;

  onAddEmailInput() {
    this.addEmailTaken = false;
    clearTimeout(this.addEmailTimer);
    const email = this.addForm.email.trim();
    if (!email || !email.includes('@')) return;
    this.addEmailTimer = setTimeout(() => {
      this.http.get<{ exists: boolean }>(`${environment.apiUrl}/auth/users/exists?email=${encodeURIComponent(email)}`)
        .subscribe({ next: res => this.addEmailTaken = res.exists, error: () => {} });
    }, 400);
  }

  // ── Edit provider modal ──
  showEditModal = false;
  editLoading = false;
  editError = '';
  editingProviderId = '';
  editForm = {
    firstName: '', lastName: '', clinicName: '',
    specialization: '', phoneNumber: '', location: '', about: '',
  };

  // ── CSV import modal ──
  showCsvModal = false;
  csvFile: File | null = null;
  csvRows: CsvRow[] = [];
  csvParseError = '';
  csvImporting = false;
  csvResult: ImportResult | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.http.get<any[]>(`${environment.apiUrl}/admin/users`).subscribe({
      next: data => {
        this.providers = (data || []).filter((u: any) => !!u.provider);
        this.loading = false;
      },
      error: () => { this.error = 'Could not load providers.'; this.loading = false; },
    });
  }

  verify(row: ProviderRow) {
    this.actionId = row.provider.id;
    this.actionLoading = true;
    this.http.post(`${environment.apiUrl}/admin/providers/${row.provider.id}/verify`, {})
      .subscribe({
        next: () => { this.actionLoading = false; this.actionId = ''; this.load(); },
        error: () => { this.actionLoading = false; this.actionId = ''; },
      });
  }

  // ── Edit provider ────────────────────────────────────────────
  openEdit(row: ProviderRow) {
    this.editingProviderId = row.provider.id;
    this.editForm = {
      firstName: row.provider.firstName,
      lastName: row.provider.lastName,
      clinicName: row.provider.clinicName,
      specialization: row.provider.specialization,
      phoneNumber: row.provider.phoneNumber,
      location: row.provider.location,
      about: row.provider.about ?? '',
    };
    this.editError = '';
    this.showEditModal = true;
  }

  closeEdit() { this.showEditModal = false; }

  submitEdit() {
    const f = this.editForm;
    if (!f.firstName || !f.lastName || !f.clinicName || !f.specialization || !f.phoneNumber || !f.location) {
      this.editError = 'All required fields must be filled';
      return;
    }
    this.editLoading = true;
    this.editError = '';
    this.http.put(`${environment.apiUrl}/admin/providers/${this.editingProviderId}`, f).subscribe({
      next: () => { this.editLoading = false; this.showEditModal = false; this.load(); },
      error: err => {
        this.editLoading = false;
        this.editError = err?.error?.message ?? 'Failed to update provider';
      },
    });
  }

  // ── Activate / deactivate ──────────────────────────────────────
  setActive(row: ProviderRow, active: boolean) {
    const verb = active ? 'reactivate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${verb} Dr ${row.provider.firstName} ${row.provider.lastName}?`)) return;

    this.actionId = row.provider.id;
    this.actionLoading = true;
    this.http.post(`${environment.apiUrl}/admin/providers/${row.provider.id}/${active ? 'activate' : 'deactivate'}`, {})
      .subscribe({
        next: () => { this.actionLoading = false; this.actionId = ''; this.load(); },
        error: () => { this.actionLoading = false; this.actionId = ''; },
      });
  }

  hasPayoutDetails(row: ProviderRow) {
    return !!(row.provider.ecocashNumber || (row.provider.bankAccountNumber && row.provider.bankName));
  }

  toggleDisbursement(row: ProviderRow) {
    const enabled = !row.provider.disbursementEnabled;
    this.actionId = row.provider.id;
    this.actionLoading = true;
    this.http.post(`${environment.apiUrl}/admin/providers/${row.provider.id}/disbursement`, { enabled })
      .subscribe({
        next: () => { this.actionLoading = false; this.actionId = ''; this.load(); },
        error: () => { this.actionLoading = false; this.actionId = ''; },
      });
  }

  // ── Add provider ──────────────────────────────────────────────
  openAdd() {
    this.addForm = { email: '', firstName: '', lastName: '', clinicName: '', specialization: '', phoneNumber: '', location: '', about: '' };
    this.addError = '';
    this.addSuccess = null;
    this.addEmailTaken = false;
    this.showAddModal = true;
  }

  closeAdd() { this.showAddModal = false; this.addSuccess = null; }

  submitAdd() {
    const f = this.addForm;
    if (!f.email || !f.firstName || !f.lastName || !f.clinicName || !f.specialization || !f.phoneNumber || !f.location) {
      this.addError = 'All required fields must be filled';
      return;
    }
    if (this.addEmailTaken) {
      this.addError = 'An account with this email already exists';
      return;
    }
    this.addLoading = true;
    this.addError = '';
    this.http.post<any>(`${environment.apiUrl}/admin/providers/create`, f).subscribe({
      next: res => {
        this.addLoading = false;
        this.addSuccess = { name: `${res.firstName} ${res.lastName}`, email: res.userProfileId ?? f.email, temporaryPassword: res.temporaryPassword };
        this.load();
      },
      error: err => {
        this.addLoading = false;
        this.addError = err?.error?.message ?? 'Failed to create provider';
      },
    });
  }

  // ── CSV import ────────────────────────────────────────────────
  openCsv() {
    this.csvFile = null;
    this.csvRows = [];
    this.csvParseError = '';
    this.csvResult = null;
    this.showCsvModal = true;
  }

  closeCsv() { this.showCsvModal = false; }

  downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([[...CSV_COLUMNS], CSV_EXAMPLE_ROW]);
    sheet['!cols'] = CSV_COLUMNS.map(() => ({ wch: 22 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Providers');
    XLSX.writeFile(workbook, 'ithemba-provider-import-template.xlsx');
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.csvFile = file;
    this.csvParseError = '';
    this.csvRows = [];

    const isExcel = /\.xlsx?$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isExcel) {
        const workbook = XLSX.read(e.target?.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });
        this.parseMatrix(matrix.filter(row => row.some(cell => `${cell}`.trim())));
      } else {
        const text = (e.target?.result as string) ?? '';
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
        this.parseMatrix(lines.map(line => line.split(',').map(v => v.trim())));
      }
    };
    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }

  private parseMatrix(rows: string[][]) {
    if (rows.length < 2) { this.csvParseError = 'File must have a header row and at least one data row'; return; }

    const headers = rows[0].map(h => `${h}`.trim().toLowerCase());
    const required = CSV_COLUMNS.map(c => c.toLowerCase());
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      this.csvParseError = `Missing columns: ${missing.join(', ')}. Expected: ${CSV_COLUMNS.join(', ')}`;
      return;
    }

    this.csvRows = rows.slice(1).map(vals => {
      const get = (key: string) => `${vals[headers.indexOf(key)] ?? ''}`.trim();
      return {
        email: get('email'), firstName: get('firstname'), lastName: get('lastname'),
        clinicName: get('clinicname'), specialization: get('specialization'),
        phoneNumber: get('phonenumber'), location: get('location'),
      };
    });
  }

  submitCsv() {
    if (!this.csvRows.length) return;
    this.csvImporting = true;
    this.csvResult = null;
    this.http.post<ImportResult>(`${environment.apiUrl}/admin/providers/import-csv`, { rows: this.csvRows }).subscribe({
      next: res => {
        this.csvImporting = false;
        this.csvResult = res;
        this.load();
      },
      error: err => {
        this.csvImporting = false;
        this.csvParseError = err?.error?.message ?? 'Import failed';
      },
    });
  }

  get pending() { return this.providers.filter(p => !p.provider.isVerified); }
  get verified() { return this.providers.filter(p => p.provider.isVerified); }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
