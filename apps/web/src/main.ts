import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

Sentry.init({ dsn: environment.sentryDsn, environment: environment.production ? 'production' : 'development' });

bootstrapApplication(App, appConfig).catch((err) => console.error(err));


