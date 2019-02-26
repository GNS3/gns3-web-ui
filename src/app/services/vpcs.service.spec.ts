import { TestBed, inject } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { getTestServer } from './testing';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { VpcsService } from './vpcs.service';
import { VpcsTemplate } from '../models/templates/vpcs-template';

describe('VpcsService', () => {
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;
    let httpServer: HttpServer;
    let server: Server;

    beforeEach(() => {
        TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, AppTestingModule],
        providers: [HttpServer, VpcsService]
        });

        httpClient = TestBed.get(HttpClient);
        httpTestingController = TestBed.get(HttpTestingController);
        httpServer = TestBed.get(HttpServer);
        server = getTestServer();
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', inject([VpcsService], (service: VpcsService) => {
        expect(service).toBeTruthy();
    }));

    it('should update vpcs template', inject([VpcsService], (service: VpcsService) => {
        const template: VpcsTemplate = {
            base_script_file: 'vpcs_base_config.txt',
            builtin: false,
            category: 'guest',
            compute_id: 'local',
            console_auto_start: false,
            console_type: 'telnet',
            default_name_format: 'PC{0}',
            name: '',
            symbol: ':/symbols/vpcs_guest.svg',
            template_id: '1',
            template_type: 'vpcs'
        }

        service.saveTemplate(server, template).subscribe();

        const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates/1');
        expect(req.request.method).toEqual('PUT');
        expect(req.request.body).toEqual(template);
    }));

    it('should add vpcs template', inject([VpcsService], (service: VpcsService) => {
        const template: VpcsTemplate = {
            base_script_file: 'vpcs_base_config.txt',
            builtin: false,
            category: 'guest',
            compute_id: 'local',
            console_auto_start: false,
            console_type: 'telnet',
            default_name_format: 'PC{0}',
            name: '',
            symbol: ':/symbols/vpcs_guest.svg',
            template_id: '',
            template_type: 'vpcs'
        }

        service.addTemplate(server, template).subscribe();

        const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(template);
    }));
});
