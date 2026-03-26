import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ToasterErrorHandler } from './toaster-error-handler';

describe('ToasterErrorHandler', () => {
  let handler: ToasterErrorHandler;
  let toasterService: MockedToasterService;
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ToasterService, useClass: MockedToasterService },
        { provide: SettingsService },
        ToasterErrorHandler,
      ],
    });

    handler = TestBed.inject(ToasterErrorHandler);
    toasterService = TestBed.get(ToasterService);
    settingsService = TestBed.inject(SettingsService);
  });

  it('should call toaster with error message', () => {
    handler.handleError(new Error('message'));

    expect(toasterService.errors).toEqual(['message']);
  });
});
