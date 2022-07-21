import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import{ Controller } from '../models/controller';
import { VirtualBoxTemplate } from '../models/templates/virtualbox-template';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { getTestServer } from './testing';
import { VirtualBoxService } from './virtual-box.service';

describe('VirtualBoxService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let controller:Controller ;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, VirtualBoxService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    controller = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([VirtualBoxService], (service: VirtualBoxService) => {
    expect(service).toBeTruthy();
  }));

  it('should update virtual box template', inject([VirtualBoxService], (service: VirtualBoxService) => {
    const template: VirtualBoxTemplate = {
      adapter_type: 'Intel PRO/1000 MT Desktop (82540EM)',
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      headless: false,
      linked_clone: false,
      name: '',
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      ram: 0,
      symbol: ':/symbols/vbox_guest.svg',
      template_id: '1',
      template_type: 'virtualbox',
      usage: '',
      use_any_adapter: false,
      vmname: '',
    };

    service.saveTemplate(controller, template).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/templates/1`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(template);
  }));

  it('should add virtual box template', inject([VirtualBoxService], (service: VirtualBoxService) => {
    const template: VirtualBoxTemplate = {
      adapter_type: 'Intel PRO/1000 MT Desktop (82540EM)',
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      headless: false,
      linked_clone: false,
      name: '',
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      ram: 0,
      symbol: ':/symbols/vbox_guest.svg',
      template_id: '',
      template_type: 'virtualbox',
      usage: '',
      use_any_adapter: false,
      vmname: '',
    };

    service.addTemplate(controller, template).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/templates`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(template);
  }));

  it('should get available virtual machines', inject([VirtualBoxService], (service: VirtualBoxService) => {
    service.getVirtualMachines(controller).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/computes/${environment.compute_id}/virtualbox/vms`);
    expect(req.request.method).toEqual('GET');
  }));
});
