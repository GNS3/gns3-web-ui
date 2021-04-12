import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { Server } from '../models/server';
import { CloudTemplate } from '../models/templates/cloud-template';
import { EthernetHubTemplate } from '../models/templates/ethernet-hub-template';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { BuiltInTemplatesService } from './built-in-templates.service';
import { HttpServer } from './http-server.service';
import { getTestServer } from './testing';

describe('BuiltInTemplatesService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, BuiltInTemplatesService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    expect(service).toBeTruthy();
  }));

  it('should update cloud template', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    const cloudtemplate = {
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      default_name_format: 'Cloud{0}',
      name: '',
      ports_mapping: [],
      remote_console_type: 'none',
      symbol: ':/symbols/cloud.svg',
      template_id: '1',
      template_type: 'cloud',
    } as CloudTemplate;

    service.saveTemplate(server, cloudtemplate).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates/1');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(cloudtemplate);
  }));

  it('should update ethernet hub template', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    let ethernethubtemplate: EthernetHubTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      default_name_format: 'Hub{0}',
      name: '',
      ports_mapping: [],
      symbol: ':/symbols/hub.svg',
      template_id: '2',
      template_type: 'ethernet_hub',
    };

    service.saveTemplate(server, ethernethubtemplate).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates/2');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(ethernethubtemplate);
  }));

  it('should update ethernet switch template', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    let ethernetswitchtemplate: EthernetHubTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      default_name_format: 'Hub{0}',
      name: '',
      ports_mapping: [],
      symbol: ':/symbols/hub.svg',
      template_id: '3',
      template_type: 'ethernet_hub',
    };

    service.saveTemplate(server, ethernetswitchtemplate).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates/3');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(ethernetswitchtemplate);
  }));

  it('should add cloud template', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    const cloudtemplate = {
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      default_name_format: 'Cloud{0}',
      name: '',
      ports_mapping: [],
      remote_console_type: 'none',
      symbol: ':/symbols/cloud.svg',
      template_id: '1',
      template_type: 'cloud',
    } as CloudTemplate;

    service.addTemplate(server, cloudtemplate).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(cloudtemplate);
  }));

  it('should add ethernet hub template', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    let ethernethubtemplate: EthernetHubTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      default_name_format: 'Hub{0}',
      name: '',
      ports_mapping: [],
      symbol: ':/symbols/hub.svg',
      template_id: '2',
      template_type: 'ethernet_hub',
    };

    service.addTemplate(server, ethernethubtemplate).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(ethernethubtemplate);
  }));

  it('should add ethernet switch template', inject([BuiltInTemplatesService], (service: BuiltInTemplatesService) => {
    let ethernetswitchtemplate: EthernetHubTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      default_name_format: 'Hub{0}',
      name: '',
      ports_mapping: [],
      symbol: ':/symbols/hub.svg',
      template_id: '3',
      template_type: 'ethernet_hub',
    };

    service.addTemplate(server, ethernetswitchtemplate).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(ethernetswitchtemplate);
  }));
});
