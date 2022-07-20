import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Server } from '../models/server';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { getTestServer } from './testing';
import { VpcsService } from './vpcs.service';

describe('VpcsService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let controller: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, VpcsService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    controller = getTestServer();
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
      template_type: 'vpcs',
    };

    service.saveTemplate(controller, template).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/templates/1`);
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
      template_type: 'vpcs',
    };

    service.addTemplate(controller, template).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/templates`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(template);
  }));
});
