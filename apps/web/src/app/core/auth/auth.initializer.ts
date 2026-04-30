import { APP_INITIALIZER, Provider } from '@angular/core';
import { AuthService } from './auth.service';

export function initializeAuth(auth: AuthService): () => Promise<void> {
  return () => auth.init();
}

export const AUTH_INITIALIZER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeAuth,
  deps: [AuthService],
  multi: true,
};
