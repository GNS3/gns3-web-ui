import { ToasterService } from '../../services/toaster.service';
import { RavenErrorHandler } from './raven-error-handler';

export class ToasterErrorHandler extends RavenErrorHandler {
  handleError(err: any): void {
    super.handleError(err);

    const toasterService = this.injector.get(ToasterService);
    toasterService.error(err.message);
  }
}
