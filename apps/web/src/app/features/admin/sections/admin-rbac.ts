import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Permission { id: string; resource: string; action: string; description: string | null; }
interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{ permission: Permission }>;
}

@Component({
  selector: 'app-admin-rbac',
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './admin-rbac.html',
  styleUrl: './admin-rbac.css',
})
export class AdminRbac implements OnInit {
  private http = inject(HttpClient);

  roles: RoleRow[] = [];
  allPermissions: Permission[] = [];
  loading = false;
  error = '';

  showAddRole = false;
  newRoleName = '';
  newRoleDesc = '';
  addRoleLoading = false;
  addRoleError = '';

  showAssignModal = false;
  assignRole: RoleRow | null = null;
  selectedPermId = '';
  assignLoading = false;
  assignError = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    Promise.all([
      this.http.get<RoleRow[]>(`${environment.apiUrl}/admin/roles`).toPromise(),
      this.http.get<Permission[]>(`${environment.apiUrl}/admin/permissions`).toPromise(),
    ]).then(([roles, perms]) => {
      this.roles = roles ?? [];
      this.allPermissions = perms ?? [];
      this.loading = false;
    }).catch(() => { this.error = 'Could not load roles.'; this.loading = false; });
  }

  openAddRole() { this.newRoleName = ''; this.newRoleDesc = ''; this.addRoleError = ''; this.showAddRole = true; }

  submitAddRole() {
    if (!this.newRoleName.trim()) { this.addRoleError = 'Role name is required'; return; }
    this.addRoleLoading = true;
    this.http.post(`${environment.apiUrl}/admin/roles`, { name: this.newRoleName.toUpperCase(), description: this.newRoleDesc || undefined }).subscribe({
      next: () => { this.addRoleLoading = false; this.showAddRole = false; this.load(); },
      error: e => { this.addRoleError = e?.error?.message ?? 'Failed'; this.addRoleLoading = false; },
    });
  }

  openAssign(role: RoleRow) {
    this.assignRole = role;
    this.selectedPermId = '';
    this.assignError = '';
    this.showAssignModal = true;
  }

  submitAssign() {
    if (!this.selectedPermId || !this.assignRole) return;
    this.assignLoading = true;
    this.http.post(`${environment.apiUrl}/admin/roles/${this.assignRole.id}/permissions`, { permissionId: this.selectedPermId }).subscribe({
      next: () => { this.assignLoading = false; this.showAssignModal = false; this.load(); },
      error: e => { this.assignError = e?.error?.message ?? 'Failed'; this.assignLoading = false; },
    });
  }

  unassignedPerms(role: RoleRow): Permission[] {
    const assigned = new Set(role.permissions.map(rp => rp.permission.id));
    return this.allPermissions.filter(p => !assigned.has(p.id));
  }

  roleColor(name: string): string {
    switch (name) {
      case 'ADMIN': return '#E53935';
      case 'PROVIDER': return '#4A7C59';
      case 'EMPLOYER': return '#1565C0';
      default: return '#00B9D6';
    }
  }
}
