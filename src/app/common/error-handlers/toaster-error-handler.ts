import { RavenErrorHandler } from './raven-error-handler';
import { ToasterService } from '../../services/toaster.service';

export class ToasterErrorHandler extends RavenErrorHandler {
  handleError(err: any): void {
    super.handleError(err);

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
