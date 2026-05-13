import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Public
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing').then((m) => m.Landing),
  },

  // Patient portal
  {
  path: 'patient/onboard',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/patient/onboarding/patient-onboarding').then(
      (m) => m.PatientOnboarding,
    ),
},
  {
    path: 'patient',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/patient/patient-dashboard').then((m) => m.PatientDashboard),
  },
  
  // Provider portal
  {
  path: 'provider/onboard',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/provider/onboarding/provider-onboarding').then(
      (m) => m.ProviderOnboarding,
    ),
},
  {
    path: 'provider',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/provider/provider-dashboard').then((m) => m.ProviderDashboard),
  },

  // Admin portal
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard').then((m) => m.AdminDashboard),
  },

  // Legacy routes
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'appointments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/appointments/appointments').then((m) => m.Appointments),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized').then((m) => m.Unauthorized),
  },
  {
    path: '**',
    redirectTo: '',
  },
];