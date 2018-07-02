import { TestBed } from '@angular/core/testing';
import { ToasterService } from "./services/toaster.service";
import { MockedToasterService } from "./services/toaster.service.spec";
import { ToasterErrorHandler } from "./toaster-error-handler";
import { RavenErrorHandler } from "./raven-error-handler";


describe('ToasterErrorHandler', () => {
  let handler: ToasterErrorHandler;
  let toasterService: MockedToasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ToasterService, useClass: MockedToasterService },
        RavenErrorHandler,
        ToasterErrorHandler,
      ]
    });

    handler = TestBed.get(ToasterErrorHandler);
    toasterService = TestBed.get(ToasterService);
  });


  it('should call toaster with error message', () => {
    handler.handleError(new Error("message"));
    expect(toasterService.errors).toEqual(["message"]);
  });
});
