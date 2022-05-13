import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { SentryErrorHandler } from './sentry-error-handler';
import { ToasterErrorHandler } from './toaster-error-handler';

class MockedToasterErrorHandler extends ToasterErrorHandler {
  handleError(err: any): void {
    const toasterService = this.injector.get(ToasterService);
    toasterService.error(err.message);
  }
}

describe('ToasterErrorHandler', () => {
  let handler: ToasterErrorHandler;
  let toasterService: MockedToasterService;
  let settingsService: SettingsService;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ToasterService, useClass: MockedToasterService },
        { provide: SettingsService},
        SentryErrorHandler,
        ToasterErrorHandler,
      ],
    });

    handler = new MockedToasterErrorHandler(TestBed.inject(Injector));
    toasterService = TestBed.get(ToasterService);
    settingsService = TestBed.inject(SettingsService);
  });

  it('should call toaster with error message', () => {
    handler.handleError(new Error('message'));

    expect(toasterService.errors).toEqual(['message']);
  });
});
