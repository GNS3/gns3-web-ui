import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToasterService } from '@services/toaster.service';

@Injectable()
export class ToasterErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  extractError(error) {
    // Try to unwrap Angular error stack frames.
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

  handleError(err: any): void {
    let extractedError = this.extractError(err) || 'Handled unknown error';

    if (
      err.error &&
      err.error.status &&
      !(err.error.status === 400 || err.error.status === 403 || err.error.status === 404 || err.error.status === 409)
    ) {
      console.error(extractedError);
    }

    if (!err) return;

    const toasterService = this.injector.get(ToasterService);
    if (err.error && err.error.message) {
      toasterService.error(err.error.message);
    } else if (err.message) {
      toasterService.error(err.message);
    } else if (err.error) {
      toasterService.error(err.error);
    }
  }
}
