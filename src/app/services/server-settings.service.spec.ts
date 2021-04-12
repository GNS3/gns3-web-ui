import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Server } from '../models/server';
import { QemuSettings } from '../models/settings/qemu-settings';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { ServerSettingsService } from './server-settings.service';

export class MockedServerSettingsService {
  getSettingsForQemu(server: Server) {
    return of([]);
  }

  updateSettingsForQemu(server: Server, qemuSettings: QemuSettings) {
    return of([]);
  }
}

describe('ServerSettingsService', () => {
  let httpServer: HttpServer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, ServerSettingsService],
    });

    httpServer = TestBed.get(HttpServer);
  });

  it('should be created', inject([ServerSettingsService], (service: ServerSettingsService) => {
    expect(service).toBeTruthy();
  }));
});
