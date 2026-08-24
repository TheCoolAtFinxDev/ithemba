import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  roles: Array<{ role: { name: string } }>;
  patient: { id: string; isActive: boolean } | null;
  provider: { id: string; isActive: boolean; isVerified: boolean } | null;
}

interface PendingRegistrationRow {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  expiresAt: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  users: UserRow[] = [];
  loading = false;
  error = '';
  search = '';
  private searchTimer: any;

  actionUserId = '';
  actionLoading = false;
  actionError = '';

  showRoleModal = false;
  roleUserId = '';
  selectedRole = 'PATIENT';
  roles = ['PATIENT', 'PROVIDER', 'ADMIN', 'EMPLOYER'];

  showPending = false;
  pendingRegistrations: PendingRegistrationRow[] = [];
  pendingLoading = false;
  pendingActionId = '';

  showAdjustModal = false;
  adjustUser: UserRow | null = null;
  adjustAmount: number | null = null;
  adjustDirection: 'credit' | 'debit' = 'credit';
  adjustReason = '';
  adjustLoading = false;
  adjustError = '';

  showInviteModal = false;
  inviteLoading = false;
  inviteError = '';
  inviteSuccess = '';
  inviteResult: { message: string; temporaryPassword?: string } | null = null;
  invite = { firstName: '', lastName: '', email: '', phoneNumber: '', role: 'PATIENT' };
  inviteEmailTaken = false;
  private inviteEmailTimer: any;

  ngOnInit() { this.load(); }
  ngOnDestroy() { clearTimeout(this.searchTimer); clearTimeout(this.inviteEmailTimer); }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
  }

  onInviteEmailInput() {
    this.inviteEmailTaken = false;
    clearTimeout(this.inviteEmailTimer);
    const email = this.invite.email.trim();
    if (!email || !email.includes('@')) return;
    this.inviteEmailTimer = setTimeout(() => {
      this.http.get<{ exists: boolean }>(`${environment.apiUrl}/auth/users/exists?email=${encodeURIComponent(email)}`)
        .subscribe({ next: res => this.inviteEmailTaken = res.exists, error: () => {} });
    }, 400);
  }

  load() {
    this.loading = true;
    this.error = '';
    const q = this.search ? `?search=${encodeURIComponent(this.search)}` : '';
    this.http.get<UserRow[]>(`${environment.apiUrl}/admin/users${q}`)
      .subscribe({
        next: data => { this.users = data || []; this.loading = false; },
        error: () => { this.error = 'Could not load users.'; this.loading = false; },
      });
  }

  primaryRole(u: UserRow): string {
    return u.roles?.[0]?.role?.name ?? 'PATIENT';
  }

  isLocked(u: UserRow): boolean {
    if (u.patient && !u.patient.isActive) return true;
    if (u.provider && !u.provider.isActive) return true;
    return false;
  }

  toggleLock(u: UserRow) {
    const action = this.isLocked(u) ? 'unlock' : 'lock';
    this.actionUserId = u.id;
    this.actionLoading = true;
    this.actionError = '';
    this.http.post(`${environment.apiUrl}/admin/users/${u.id}/${action}`, {})
      .subscribe({
        next: () => { this.actionLoading = false; this.actionUserId = ''; this.load(); },
        error: e => { this.actionError = e?.error?.message || 'Action failed'; this.actionLoading = false; this.actionUserId = ''; },
      });
  }

  openRoleModal(u: UserRow) {
    this.roleUserId = u.id;
    this.selectedRole = this.primaryRole(u);
    this.showRoleModal = true;
  }

  closeRoleModal() { this.showRoleModal = false; }

  assignRole() {
    if (!this.roleUserId || this.actionLoading) return;
    this.actionLoading = true;
    this.http.post(`${environment.apiUrl}/admin/users/${this.roleUserId}/roles`, { roleName: this.selectedRole })
      .subscribe({
        next: () => { this.actionLoading = false; this.showRoleModal = false; this.load(); },
        error: e => { this.actionError = e?.error?.message || 'Failed'; this.actionLoading = false; },
      });
  }

  openInviteModal() {
    this.invite = { firstName: '', lastName: '', email: '', phoneNumber: '', role: 'PATIENT' };
    this.inviteError = '';
    this.inviteSuccess = '';
    this.inviteResult = null;
    this.inviteEmailTaken = false;
    this.showInviteModal = true;
  }

  closeInviteModal() { this.showInviteModal = false; }

  submitInvite() {
    if (!this.invite.firstName || !this.invite.lastName || !this.invite.email || !this.invite.phoneNumber) {
      this.inviteError = 'All fields are required';
      return;
    }
    if (this.inviteEmailTaken) {
      this.inviteError = 'An account with this email already exists';
      return;
    }
    this.inviteLoading = true;
    this.inviteError = '';
    this.http.post(`${environment.apiUrl}/admin/users/invite`, this.invite)
      .subscribe({
        next: (res: any) => {
          this.inviteLoading = false;
          this.inviteSuccess = res?.message ?? 'Account created';
          this.inviteResult = res;
          this.load();
        },
        error: e => {
          this.inviteLoading = false;
          this.inviteError = e?.error?.message ?? 'Failed to create account';
        },
      });
  }

  togglePending() {
    this.showPending = !this.showPending;
    if (this.showPending && this.pendingRegistrations.length === 0) this.loadPending();
  }

  loadPending() {
    this.pendingLoading = true;
    this.http.get<PendingRegistrationRow[]>(`${environment.apiUrl}/auth/register/admin/pending`)
      .subscribe({
        next: data => { this.pendingRegistrations = data || []; this.pendingLoading = false; },
        error: () => { this.pendingLoading = false; },
      });
  }

  forceVerifyPhone(reg: PendingRegistrationRow) {
    if (this.pendingActionId) return;
    this.pendingActionId = reg.id;
    this.http.post(`${environment.apiUrl}/auth/register/${reg.id}/admin-verify-phone`, {})
      .subscribe({
        next: () => { this.pendingActionId = ''; this.loadPending(); },
        error: () => { this.pendingActionId = ''; },
      });
  }

  openAdjustModal(u: UserRow) {
    this.adjustUser = u;
    this.adjustAmount = null;
    this.adjustDirection = 'credit';
    this.adjustReason = '';
    this.adjustError = '';
    this.showAdjustModal = true;
  }

  closeAdjustModal() { this.showAdjustModal = false; this.adjustUser = null; }

  submitAdjust() {
    if (!this.adjustUser?.patient) return;
    if (!this.adjustAmount || this.adjustAmount <= 0) {
      this.adjustError = 'Enter a valid amount';
      return;
    }
    if (!this.adjustReason.trim()) {
      this.adjustError = 'A reason is required';
      return;
    }
    const amount = this.adjustDirection === 'credit' ? this.adjustAmount : -this.adjustAmount;
    this.adjustLoading = true;
    this.adjustError = '';
    this.http.post(`${environment.apiUrl}/admin/patients/${this.adjustUser.patient.id}/wallet/adjust`, {
      amount, reason: this.adjustReason.trim(),
    }).subscribe({
      next: () => { this.adjustLoading = false; this.showAdjustModal = false; this.load(); },
      error: e => { this.adjustError = e?.error?.message || 'Adjustment failed'; this.adjustLoading = false; },
    });
  }

  verifyProvider(u: UserRow) {
    if (!u.provider) return;
    this.actionUserId = u.id;
    this.actionLoading = true;
    this.http.post(`${environment.apiUrl}/admin/providers/${u.provider.id}/verify`, {})
      .subscribe({
        next: () => { this.actionLoading = false; this.actionUserId = ''; this.load(); },
        error: e => { this.actionError = e?.error?.message || 'Failed'; this.actionLoading = false; this.actionUserId = ''; },
      });
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
