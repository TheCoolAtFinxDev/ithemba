import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const oauth = inject(OAuthService);
  const auth = inject(AuthService);
  const isApiCall = req.url.startsWith(environment.apiUrl);

  const attach = (request: HttpRequest<unknown>) => {
    const token = oauth.getAccessToken();
    return token && isApiCall
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  };

  return next(attach(req)).pipe(
    catchError((err: unknown) => {
      if (!isApiCall || !(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      // Access token expired — try a refresh and retry the request once.
      return from(oauth.refreshToken()).pipe(
        switchMap(() => next(attach(req))),
        catchError(() => {
          // Refresh token is gone too (expired/revoked) — the session is truly
          // dead. Force re-login instead of leaving the user staring at silently
          // failing API calls with no indication why.
          auth.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};
