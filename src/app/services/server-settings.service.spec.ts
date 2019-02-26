import { TestBed, inject } from '@angular/core/testing';
import { ServerSettingsService } from './server-settings.service';
import { Server } from '../models/server';
import { QemuSettings } from '../models/settings/qemu-settings';
import { HttpServer } from './http-server.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { of } from 'rxjs';

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
            providers: [HttpServer, ServerSettingsService]
        });

        httpServer = TestBed.get(HttpServer);
    });

    it('should be created', inject([ServerSettingsService], (service: ServerSettingsService) => {
        expect(service).toBeTruthy();
    }));
});
