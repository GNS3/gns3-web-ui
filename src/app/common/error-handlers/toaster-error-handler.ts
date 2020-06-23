import { RavenErrorHandler } from './raven-error-handler';
import { ToasterService } from '../../services/toaster.service';
import { SentryErrorHandler } from './sentry-error-handler';

export class ToasterErrorHandler extends SentryErrorHandler {
  handleError(err: any): void {
    super.handleError(err);
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
