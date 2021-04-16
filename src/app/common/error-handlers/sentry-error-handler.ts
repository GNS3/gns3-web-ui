import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable, Injector } from '@angular/core';
import * as Sentry from '@sentry/browser';
import { BrowserOptions, init } from '@sentry/browser';
import { environment } from '../../../environments/environment';

const config = {
  dsn: 'https://d8be3a98530f49eb90968ff396db326c@o19455.ingest.sentry.io/842726',
};
init(config as BrowserOptions);

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor(@Inject(Injector) protected injector: Injector) {}

  extractError(error) {
    // Try to unwrap zone.js error.
    // https://github.com/angular/angular/blob/master/packages/core/src/util/errors.ts
    if (error && error.ngOriginalError) {
      error = error.ngOriginalError;
    }

    // We can handle messages and Error objects directly.
    if (typeof error === 'string' || error instanceof Error) {
      return error;
    }

    // If it's http module error, extract as much information from it as we can.
    if (error instanceof HttpErrorResponse) {
      // The `error` property of http exception can be either an `Error` object, which we can use directly...
      if (error.error instanceof Error) {
        return error.error;
      }

      // ... or an`ErrorEvent`, which can provide us with the message but no stack...
      if (error.error instanceof ErrorEvent) {
        return error.error.message;
      }

      // ...or the request body itself, which we can use as a message instead.
      if (typeof error.error === 'string') {
        return `Server returned code ${error.status} with body "${error.error}"`;
      }

      // If we don't have any detailed information, fallback to the request message itself.
      return error.message;
    }

    // Skip if there's no error, and let user decide what to do with it.
    return null;
  }

  handleError(error) {
    let extractedError = this.extractError(error) || 'Handled unknown error';

    // Capture handled exception and send it to Sentry.
    const eventId = Sentry.captureException(extractedError);

    // When in development mode, log the error to console for immediate feedback.
    if (!environment.production) {
      console.error(extractedError);
    }

    // Optionally show user dialog to provide details on what happened.
    // Sentry.showReportDialog({ eventId });
  }
}
