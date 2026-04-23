import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UnisolateNodeActionComponent } from './unisolate-node-action.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('UnisolateNodeActionComponent', () => {
  let fixture: ComponentFixture<UnisolateNodeActionComponent>;
  let mockNodeService: { unisolate: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };

  const createMockProperties = (): Properties => ({
    adapter_type: '',
    adapters: 0,
    ethernet_adapters: 0,
    serial_adapters: 0,
    headless: false,
    linked_clone: false,
    on_close: '',
    aux: 0,
    ram: 0,
    system_id: '',
    nvram: 0,
    image: '',
    usage: '',
    use_any_adapter: false,
    vmname: '',
    ports_mapping: [],
    mappings: {},
    bios_image: '',
    boot_priority: '',
    cdrom_image: '',
    cpu_throttling: 0,
    cpus: 0,
    hda_disk_image: '',
    hda_disk_image_md5sum: '',
    hda_disk_interface: '',
    hdb_disk_image: '',
    hdb_disk_interface: '',
    hdc_disk_image: '',
    hdc_disk_interface: '',
    hdd_disk_image: '',
    hdd_disk_interface: '',
    initrd: '',
    kernel_command_line: '',
    kernel_image: '',
    mac_address: '',
    mac_addr: '',
    options: '',
    platform: '',
    disk0: 0,
    disk1: 0,
    idlepc: '',
    idlemax: 0,
    idlesleep: 0,
    exec_area: 0,
    mmap: false,
    sparsemem: false,
    auto_delete_disks: false,
    process_priority: '',
    qemu_path: '',
    environment: '',
    extra_hosts: '',
    start_command: '',
    replicate_network_connection_state: false,
    memory: 0,
    tpm: false,
    uefi: false,
    slot0: undefined,
    slot1: undefined,
    slot2: undefined,
    slot3: undefined,
    slot4: undefined,
    slot5: undefined,
    slot6: undefined,
    slot7: undefined,
    wic0: undefined,
    wic1: undefined,
    wic2: undefined,
    remote_console_host: undefined,
    remote_console_port: undefined,
    remote_console_http_path: undefined,
    use_default_iou_values: undefined,
    console_resolution: undefined,
    console_http_port: undefined,
    console_http_path: undefined,
    extra_volumes: undefined,
  });

  const createMockNode = (overrides: Partial<Node> = {}): Node => {
    const defaults: Node = {
      node_id: 'node-1',
      name: 'Test Node',
      status: 'running',
      console_host: '0.0.0.0',
      node_type: 'vpcs',
      project_id: 'proj1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 50,
      x: 100,
      y: 200,
      z: 1,
      port_name_format: 'eth{0}',
      port_segment_size: 0,
      first_port_name: '',
      label: { rotation: 0, style: '', text: '', x: 0, y: 0 },
      symbol: '',
      symbol_url: '',
      properties: createMockProperties(),
      console: 5000,
      console_auto_start: false,
      console_type: 'telnet',
      locked: false,
      node_directory: '',
      ports: [],
    };
    return Object.assign({}, defaults, overrides);
  };

  const createMockController = (): Controller => ({
    id: 1,
    authToken: '',
    name: 'Main Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = { unisolate: vi.fn().mockReturnValue(of({})) };
    mockToasterService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [UnisolateNodeActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnisolateNodeActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('unisolate', () => {
    it('should call nodeService.unisolate with controller and node', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      const successResponse = of(mockNode);
      mockNodeService.unisolate.mockReturnValue(successResponse);

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockNodeService.unisolate).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should not show error toast on success', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      const successResponse = of(mockNode);
      mockNodeService.unisolate.mockReturnValue(successResponse);

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should show error toast when unisolate fails', async () => {
      mockNodeService.unisolate.mockReturnValue(
        throwError(() => ({ error: { message: 'Unisolate failed' } }))
      );
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(fixture.componentInstance['cdr'], 'markForCheck');
      fixture.nativeElement.querySelector('button').click();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Unisolate failed');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback message when unisolate error has no message', async () => {
      mockNodeService.unisolate.mockReturnValue(throwError(() => ({})));
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to unisolate node');
    });
  });
});
