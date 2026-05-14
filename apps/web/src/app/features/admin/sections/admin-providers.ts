import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
    isVerified: boolean;
    isActive: boolean;
  };
}

@Component({
  selector: 'app-admin-providers',
  imports: [NgIf, NgFor, NgClass],
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

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.http.get<any[]>(`${environment.apiUrl}/admin/users`)
      .subscribe({
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

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
