import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  //const router = inject(Router);

  if (auth.isAuthenticated) return true;

  auth.login();
  return false;
};

export const roleGuard = (role: 'PATIENT' | 'PROVIDER' | 'ADMIN' | 'EMPLOYER'): CanActivateFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    auth.login();
    return false;
  }

  // The one-time post-login profile sync can fail on a transient blip (e.g.
  // an API restart mid-request), leaving isAuthenticated true but no profile
  // loaded. Without this, hasRole() would report false forever and strand
  // the user on /unauthorized despite having a valid, correctly-assigned role.
  if (!auth.profile) {
    await auth.loadProfile().catch(() => {});
  }

  if (auth.hasRole(role)) return true;

  router.navigate(['/unauthorized']);
  return false;
};
