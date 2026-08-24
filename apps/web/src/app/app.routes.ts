import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Public
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing').then((m) => m.Landing),
  },

  // Self-registration (public)
  {
    path: 'register',
    loadComponent: () =>
      import('./features/registration/registration').then((m) => m.Registration),
  },

  // Self-service password reset (public)
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },

  // Patient portal
  {
    path: 'patient/onboard',
    canActivate: [authGuard, roleGuard('PATIENT')],
    loadComponent: () =>
      import('./features/patient/onboarding/patient-onboarding').then(
        (m) => m.PatientOnboarding,
      ),
  },
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard('PATIENT')],
    loadComponent: () =>
      import('./features/patient/patient-dashboard').then((m) => m.PatientDashboard),
  },

  // Provider portal
  {
    path: 'provider/onboard',
    canActivate: [authGuard, roleGuard('PROVIDER')],
    loadComponent: () =>
      import('./features/provider/onboarding/provider-onboarding').then(
        (m) => m.ProviderOnboarding,
      ),
  },
  {
    path: 'provider',
    canActivate: [authGuard, roleGuard('PROVIDER')],
    loadComponent: () =>
      import('./features/provider/provider-dashboard').then((m) => m.ProviderDashboard),
  },

  // Admin portal
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-dashboard').then((m) => m.AdminDashboard),
  },

  // Employer portal
  {
    path: 'employer',
    canActivate: [authGuard, roleGuard('EMPLOYER')],
    loadComponent: () =>
      import('./features/employer/employer-dashboard').then((m) => m.EmployerDashboard),
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
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/terms').then((m) => m.TermsPage),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal/privacy').then((m) => m.PrivacyPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];