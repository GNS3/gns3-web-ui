import { ToasterService } from '../../services/toaster.service';
import { Injectable } from "@angular/core";
import { SentryErrorHandler } from './sentry-error-handler';

@Injectable()
export class ToasterErrorHandler extends SentryErrorHandler {
  handleError(err: any): void {
    if (err.error && err.error.status && !(err.error.status === 403 || err.error.status === 404 || err.error.status === 409)) {
      super.handleError(err);
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
