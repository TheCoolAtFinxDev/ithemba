import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { authConfig } from './auth.config';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  clinicName?: string;
  medicalLicenseNumber?: string;
  patient?: any;
  provider?: any;
  roles?: Array<{
    role: {
      name: string;
      permissions: Array<{
        permission: { resource: string; action: string; }
      }>;
    };
  }>;
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
  return this.profile?.roles?.[0]?.role?.name ?? 'PATIENT';
}

hasRole(roleName: string): boolean {
  return this.profile?.roles?.some((ur: any) => ur.role?.name === roleName) ?? false;
}

get permissions(): string[] {
  const perms: string[] = [];
  this.profile?.roles?.forEach(userRole => {
    userRole.role?.permissions?.forEach(rp => {
      perms.push(`${rp.permission.resource}:${rp.permission.action}`);
    });
  });
  return perms;
}

hasPermission(resource: string, action: string): boolean {
  return this.permissions.includes(`${resource}:${action}`);
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
    this.router.navigate(['/']);
  }

private async syncProfile(): Promise<void> {
  // WSO2 puts user claims in the ACCESS token, not the ID token.
  // Decode both and merge — access token wins for groups/email.
  const idClaims = this.claims; // from ID token via getIdentityClaims()
  const atRaw = this.oauth.getAccessToken();
  const atClaims: Record<string, any> = atRaw
    ? JSON.parse(atob(atRaw.split('.')[1]))
    : {};
  const claims = { ...idClaims, ...atClaims }; // access token claims take precedence

  const sub = atClaims['sub'] ?? null;

  // WSO2 sends group membership under 'groups'. Normalise to strip 'PRIMARY/' prefix.
  const rawGroups: string[] = claims['groups'] ?? claims['roles'] ?? [];
  const wso2Groups = rawGroups.map((g: string) => g.split('/').pop()!.toUpperCase());
  const role = wso2Groups.includes('ADMIN') ? 'ADMIN'
    : wso2Groups.includes('PROVIDER') ? 'PROVIDER'
    : wso2Groups.includes('EMPLOYER') ? 'EMPLOYER'
    : 'PATIENT';

  const fullName = [claims['given_name'], claims['family_name']]
    .filter(Boolean).join(' ') || claims['name'] || claims['username'] || 'User';

  const dto = {
    email: claims['email'] ?? claims['username'] ?? (sub ? `${sub}@wso2.local` : undefined),
    fullName,
    role,
  };

  try {
    await lastValueFrom(this.http
      .post<UserProfile>(`${environment.apiUrl}/auth/sync`, dto));

    // Load full profile including roles
    await this.loadProfile();
  } catch (e) {
    console.error('Profile sync failed', e);
  }
}

  async loadProfile(): Promise<void> {
    try {
      const profile = await lastValueFrom(this.http
        .get<UserProfile>(`${environment.apiUrl}/auth/me`));
      this._profile$.next(profile!);
    } catch (e) {
      console.error('Load profile failed', e);
    }
  }

  // private determineRole(claims: Record<string, any>): 'PATIENT' | 'PROVIDER' | 'ADMIN' {
  //   const role = claims['role'] ?? claims['groups']?.[0];
  //   if (role === 'PROVIDER') return 'PROVIDER';
  //   if (role === 'ADMIN') return 'ADMIN';
  //   return 'PATIENT';
  // }
}
