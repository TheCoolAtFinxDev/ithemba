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

export const roleGuard = (role: 'PATIENT' | 'PROVIDER' | 'ADMIN'): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    auth.login();
    return false;
  }

  if (auth.role?.toUpperCase() === role) return true;

  router.navigate(['/unauthorized']);
  return false;
};
