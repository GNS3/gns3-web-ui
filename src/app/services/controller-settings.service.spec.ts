import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import{ Controller } from '../models/controller';
import { QemuSettings } from '../models/settings/qemu-settings';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { ControllerSettingsService } from './controller-settings.service';

export class MockedControllerSettingsService {
  getSettingsForQemu(controller:Controller ) {
    return of([]);
  }

  updateSettingsForQemu(controller:Controller , qemuSettings: QemuSettings) {
    return of([]);
  }
}

describe('ControllerSettingsService', () => {
  let httpServer: HttpServer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, ControllerSettingsService],
    });

    httpServer = TestBed.get(HttpServer);
  });

  it('should be created', inject([ControllerSettingsService], (service: ControllerSettingsService) => {
    expect(service).toBeTruthy();
  }));
});
