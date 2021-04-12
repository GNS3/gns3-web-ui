import { TestBed, inject } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { getTestServer } from './testing';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { QemuService } from './qemu.service';
import { QemuTemplate } from '../models/templates/qemu-template';

describe('QemuService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, QemuService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([QemuService], (service: QemuService) => {
    expect(service).toBeTruthy();
  }));

  it('should update qemu template', inject([QemuService], (service: QemuService) => {
    const template: QemuTemplate = {
      adapter_type: 'e1000',
      adapters: 4,
      bios_image: '',
      boot_priority: 'c',
      builtin: false,
      category: 'guest',
      cdrom_image: '',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      cpu_throttling: 0,
      cpus: 1,
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      hda_disk_image: '',
      hda_disk_interface: 'ide',
      hdb_disk_image: '',
      hdb_disk_interface: 'ide',
      hdc_disk_image: '',
      hdc_disk_interface: 'ide',
      hdd_disk_image: '',
      hdd_disk_interface: 'ide',
      initrd: '',
      kernel_command_line: '',
      kernel_image: '',
      legacy_networking: false,
      linked_clone: true,
      mac_address: '',
      name: '',
      on_close: 'power_off',
      options: '-nographic',
      platform: '',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      process_priority: 'normal',
      qemu_path: '',
      ram: 256,
      symbol: ':/symbols/qemu_guest.svg',
      template_id: '1',
      template_type: 'qemu',
      usage: '',
    };

    service.saveTemplate(server, template).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates/1');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(template);
  }));

  it('should add qemu template', inject([QemuService], (service: QemuService) => {
    const template: QemuTemplate = {
      adapter_type: 'e1000',
      adapters: 4,
      bios_image: '',
      boot_priority: 'c',
      builtin: false,
      category: 'guest',
      cdrom_image: '',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      cpu_throttling: 0,
      cpus: 1,
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      hda_disk_image: '',
      hda_disk_interface: 'ide',
      hdb_disk_image: '',
      hdb_disk_interface: 'ide',
      hdc_disk_image: '',
      hdc_disk_interface: 'ide',
      hdd_disk_image: '',
      hdd_disk_interface: 'ide',
      initrd: '',
      kernel_command_line: '',
      kernel_image: '',
      legacy_networking: false,
      linked_clone: true,
      mac_address: '',
      name: '',
      on_close: 'power_off',
      options: '-nographic',
      platform: '',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      process_priority: 'normal',
      qemu_path: '',
      ram: 256,
      symbol: ':/symbols/qemu_guest.svg',
      template_id: '',
      template_type: 'qemu',
      usage: '',
    };

    service.addTemplate(server, template).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/templates');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(template);
  }));
});
