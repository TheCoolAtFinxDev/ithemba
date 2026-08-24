// Must be imported before any other module — see main.ts. No-ops safely if
// SENTRY_DSN is unset (e.g. local dev without a Sentry project configured).
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
});
