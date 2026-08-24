import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

// Only reports unexpected/server errors — routine 4xx (validation, not-found,
// business-rule rejections) are expected control flow, not incidents.
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isClientError = exception instanceof HttpException && exception.getStatus() < 500;
    if (!isClientError) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
