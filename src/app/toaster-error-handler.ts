import { RavenErrorHandler } from "./raven-error-handler";
import { ToasterService } from "./services/toaster.service";


export class ToasterErrorHandler extends RavenErrorHandler {

  handleError(err: any): void {
    super.handleError(err);

    const toasterService = this.injector.get(ToasterService);
    const error = err.originalError || err;
    toasterService.error(error.message);
  }

}
