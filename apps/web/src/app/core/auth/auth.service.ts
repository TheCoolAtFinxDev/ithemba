import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { authConfig } from './auth.config';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'PATIENT' | 'PROVIDER' | 'ADMIN';
  clinicName?: string;
  medicalLicenseNumber?: string;
  patient?: any;
  provider?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private oauth = inject(OAuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  private _profile$ = new BehaviorSubject<UserProfile | null>(null);
  profile$ = this._profile$.asObservable();

  private _loading$ = new BehaviorSubject<boolean>(true);
  loading$ = this._loading$.asObservable();

  get profile(): UserProfile | null {
    return this._profile$.value;
  }

  get isAuthenticated(): boolean {
    return this.oauth.hasValidAccessToken();
  }

  get token(): string {
    return this.oauth.getAccessToken();
  }

  get claims(): Record<string, any> {
    return (this.oauth.getIdentityClaims() as Record<string, any>) ?? {};
  }

  get role(): string {
    return this.profile?.role ?? 'PATIENT';
  }

 async init(): Promise<void> {
  this.oauth.configure(authConfig);

  try {
    await this.oauth.loadDiscoveryDocument(
      'https://identity.golink.co.ls/oauth2/oidcdiscovery/.well-known/openid-configuration'
    );
    await this.oauth.tryLogin();
  } catch (e) {
    console.error('OIDC discovery failed', e);
  }

  if (this.oauth.hasValidAccessToken()) {
    await this.syncProfile();
  }

  this._loading$.next(false);
  this.oauth.setupAutomaticSilentRefresh();
}

  login(): void {
    this.oauth.initCodeFlow();
  }

  logout(): void {
    this.oauth.logOut();
    this._profile$.next(null);
    this.router.navigate(['/login']);
  }

private async syncProfile(): Promise<void> {
  const claims = this.claims;
  const sub = this.oauth.getAccessToken() 
    ? JSON.parse(atob(this.oauth.getAccessToken().split('.')[1]))['sub'] 
    : null;

  console.log('Claims:', JSON.stringify(claims));
  console.log('Sub from token:', sub);

  const dto = {
    email: claims['email'] ?? claims['username'] ?? (sub ? `${sub}@wso2.local` : undefined),
    fullName: claims['name'] ?? claims['given_name'] ?? 'User',
    role: this.determineRole(claims),
  };

  console.log('Sync DTO:', JSON.stringify(dto));

  try {
    const profile = await this.http
      .post<UserProfile>(`${environment.apiUrl}/auth/sync`, dto)
      .toPromise();
    this._profile$.next(profile!);
  } catch (e) {
    console.error('Profile sync failed', e);
  }
}

  async loadProfile(): Promise<void> {
    try {
      const profile = await this.http
        .get<UserProfile>(`${environment.apiUrl}/auth/me`)
        .toPromise();
      this._profile$.next(profile!);
    } catch (e) {
      console.error('Load profile failed', e);
    }
  }

  private determineRole(claims: Record<string, any>): 'PATIENT' | 'PROVIDER' | 'ADMIN' {
    const role = claims['role'] ?? claims['groups']?.[0];
    if (role === 'PROVIDER') return 'PROVIDER';
    if (role === 'ADMIN') return 'ADMIN';
    return 'PATIENT';
  }
}
