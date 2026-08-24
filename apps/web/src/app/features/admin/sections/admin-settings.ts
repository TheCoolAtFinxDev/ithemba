import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Setting {
  key: string;
  value: string;
  description: string;
  updatedAt: string | null;
}

const SETTING_LABELS: Record<string, { label: string; suffix: string; icon: string }> = {
  registrationFee:        { label: 'Registration Fee',            suffix: 'ZAR', icon: 'bi-person-plus' },
  annualAdminFee:         { label: 'Annual Admin Fee',            suffix: 'ZAR', icon: 'bi-calendar-check' },
  transactionFeePercent:  { label: 'Transaction Fee',             suffix: '%',   icon: 'bi-percent' },
  minMonthlyContribution: { label: 'Min Monthly Contribution',    suffix: 'ZAR', icon: 'bi-arrow-down-circle' },
  maxMonthlyContribution: { label: 'Max Monthly Contribution',    suffix: 'ZAR', icon: 'bi-arrow-up-circle' },
  amlThreshold:           { label: 'AML Verification Threshold',  suffix: 'ZAR', icon: 'bi-shield-exclamation' },
};

@Component({
  selector: 'app-admin-settings',
  imports: [NgIf, NgFor, FormsModule, DecimalPipe],
  template: `
<div class="adm-page-header">
  <div>
    <div class="adm-page-header__title">Business Rules</div>
    <div class="adm-page-header__sub">Configurable fees and limits — changes apply immediately. All updates are audit-logged.</div>
  </div>
</div>

<div *ngIf="error" class="alert alert-danger py-2 px-3 mb-3" style="font-size:13px;border-radius:10px">{{ error }}</div>
<div *ngIf="loading" class="text-center py-5"><div class="spinner-border" style="color:#E53935"></div></div>

<div *ngIf="!loading" class="row g-3">
  <div *ngFor="let s of settings" class="col-md-6">
    <div class="ith-card p-4">
      <div class="d-flex align-items-start gap-3">
        <div style="width:40px;height:40px;background:#fdecea;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="bi {{ icon(s.key) }}" style="color:#E53935;font-size:16px"></i>
        </div>
        <div class="flex-grow-1">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">{{ label(s.key) }}</div>
          <div style="font-size:12px;color:#9e9e9e;margin-bottom:12px">{{ s.description }}</div>

          <div *ngIf="editKey !== s.key" class="d-flex justify-content-between align-items-center">
            <span style="font-size:28px;font-weight:800;color:#1a1a2e">
              {{ s.value }}<span style="font-size:14px;color:#9e9e9e;font-weight:500;margin-left:4px">{{ suffix(s.key) }}</span>
            </span>
            <button class="adm-action-btn adm-action-btn--grey" (click)="startEdit(s)">
              <i class="bi bi-pencil me-1"></i>Edit
            </button>
          </div>

          <div *ngIf="editKey === s.key">
            <div class="d-flex gap-2 mb-2">
              <div class="input-group" style="max-width:200px">
                <input type="number" class="form-control" style="border-radius:8px 0 0 8px"
                       [(ngModel)]="editValue" [min]="0" />
                <span class="input-group-text" style="font-weight:700;background:#f5f7fb;border-radius:0 8px 8px 0">
                  {{ suffix(s.key) }}
                </span>
              </div>
              <button class="btn" style="background:#E53935;color:#fff;border-radius:8px;font-weight:600;padding:6px 16px;font-size:13px"
                      [disabled]="saving" (click)="save(s.key)">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-1" style="width:12px;height:12px"></span>
                Save
              </button>
              <button class="adm-action-btn adm-action-btn--grey" (click)="cancelEdit()">Cancel</button>
            </div>
            <div *ngIf="saveError" class="text-danger" style="font-size:12px">{{ saveError }}</div>
          </div>

          <div *ngIf="s.updatedAt" style="font-size:11px;color:#b0b0b0;margin-top:8px">
            <i class="bi bi-clock me-1"></i>Last updated {{ formatDate(s.updatedAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div *ngIf="!loading" class="mt-4 p-3 rounded-3" style="background:#fff3e0;border:1px solid #ffe0b2">
  <p style="font-size:13px;color:#e65100;margin:0">
    <i class="bi bi-exclamation-triangle-fill me-2"></i>
    <strong>Changes are live immediately.</strong> Updating the transaction fee, for example, will affect every new claim approval from the moment you save. Existing pending claims that were submitted under a different fee will be recomputed at approval time using the current setting.
  </p>
</div>
  `,
})
export class AdminSettings implements OnInit {
  private http = inject(HttpClient);

  settings: Setting[] = [];
  loading = false;
  error = '';

  editKey = '';
  editValue = '';
  saving = false;
  saveError = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<Setting[]>(`${environment.apiUrl}/admin/settings`).subscribe({
      next: data => { this.settings = data; this.loading = false; },
      error: () => { this.error = 'Could not load settings.'; this.loading = false; },
    });
  }

  label(key: string): string { return SETTING_LABELS[key]?.label ?? key; }
  suffix(key: string): string { return SETTING_LABELS[key]?.suffix ?? ''; }
  icon(key: string): string   { return SETTING_LABELS[key]?.icon ?? 'bi-gear'; }

  startEdit(s: Setting) {
    this.editKey = s.key;
    this.editValue = s.value;
    this.saveError = '';
  }

  cancelEdit() { this.editKey = ''; this.editValue = ''; this.saveError = ''; }

  save(key: string) {
    if (!this.editValue.trim()) { this.saveError = 'Value is required'; return; }
    const num = parseFloat(this.editValue);
    if (isNaN(num) || num < 0) { this.saveError = 'Must be a valid positive number'; return; }

    this.saving = true;
    this.saveError = '';
    this.http.put(`${environment.apiUrl}/admin/settings/${key}`, { value: this.editValue }).subscribe({
      next: () => { this.saving = false; this.cancelEdit(); this.load(); },
      error: e => { this.saveError = e?.error?.message ?? 'Save failed'; this.saving = false; },
    });
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
