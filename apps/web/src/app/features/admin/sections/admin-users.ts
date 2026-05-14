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
  roles = ['PATIENT', 'PROVIDER', 'ADMIN'];

  ngOnInit() { this.load(); }
  ngOnDestroy() { clearTimeout(this.searchTimer); }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
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
