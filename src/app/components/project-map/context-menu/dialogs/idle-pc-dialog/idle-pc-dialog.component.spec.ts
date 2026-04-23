import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdlePCDialogComponent } from './idle-pc-dialog.component';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('IdlePCDialogComponent', () => {
  let component: IdlePCDialogComponent;
  let fixture: ComponentFixture<IdlePCDialogComponent>;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockNode: Node;

  const createMockProperties = (): Properties => ({
    adapter_type: 'Ethernet',
    adapters: 1,
    ethernet_adapters: 1,
    serial_adapters: 0,
    headless: false,
    linked_clone: false,
    on_close: 'power_off',
    aux: 0,
    ram: 256,
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
    cpus: 1,
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
    memory: 256,
    tpm: false,
    uefi: false,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: '127.0.0.1',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      authToken: '',
      tokenExpired: false,
    };

    mockNode = {
      node_id: 'node1',
      name: 'Test Router',
      status: 'started',
      console_host: '127.0.0.1',
      node_type: 'dynamips',
      project_id: 'proj1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 80,
      x: 100,
      y: 200,
      z: 1,
      port_name_format: 'eth{0}',
      port_segment_size: 0,
      first_port_name: '',
      label: undefined,
      symbol: '',
      symbol_url: '',
      properties: createMockProperties(),
      console: 2100,
      console_auto_start: false,
      console_type: 'telnet',
      locked: false,
      node_directory: '',
      ports: [],
    };

    mockNodeService = {
      getIdlePCProposals: vi.fn().mockReturnValue(of([])),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [IdlePCDialogComponent, FormsModule, MatSelectModule, MatTooltipModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IdlePCDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty initial idlepcs array', () => {
      expect(component.idlepcs).toEqual([]);
    });

    it('should have empty initial idlePC', () => {
      expect(component.idlePC()).toBe('');
    });

    it('should not be computing initially', () => {
      expect(component.isComputing).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call onCompute when initialized', () => {
      mockNodeService.getIdlePCProposals.mockReturnValue(of([]));

      const computeSpy = vi.spyOn(component, 'onCompute');

      component.ngOnInit();

      expect(computeSpy).toHaveBeenCalled();
    });
  });

  describe('getTooltip', () => {
    it('should return the idle-pc tooltip text', () => {
      const tooltip = component.getTooltip();

      expect(tooltip).toContain('Best Idle-PC values are obtained when IOS is in idle state');
      expect(tooltip).toContain('Finding the right idle-pc value is a trial and error process');
    });
  });

  describe('onCompute', () => {
    it('should call nodeService.getIdlePCProposals with controller and node', () => {
      mockNodeService.getIdlePCProposals.mockReturnValue(of(['0x60c09aa0 [55]']));

      component.onCompute();

      expect(mockNodeService.getIdlePCProposals).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should process valid idle-pc values from API response', () => {
      const mockResponse = ['0x60c09aa0 [55]', '0x60c09bb0 [45]', '0x60c09cc0 [50]'];
      mockNodeService.getIdlePCProposals.mockReturnValue(of(mockResponse));

      component.onCompute();

      // Valid format: 0x[0-9a-f]{8}\s+\[(\d+)\]
      expect(component.idlepcs.length).toBe(3);
      expect(component.idlepcs[0].key).toBe('0x60c09aa0');
      expect(component.idlepcs[1].key).toBe('0x60c09bb0');
      expect(component.idlepcs[2].key).toBe('0x60c09cc0');
    });

    it('should mark values with count 50-60 with asterisk', () => {
      const mockResponse = ['0x60c09aa0 [55]', '0x60c09bb0 [45]'];
      mockNodeService.getIdlePCProposals.mockReturnValue(of(mockResponse));

      component.onCompute();

      expect(component.idlepcs[0].name).toBe('0x60c09aa0 [55]*'); // count 55, in range 50-60
      expect(component.idlepcs[1].name).toBe('0x60c09bb0 [45]'); // count 45, not in range
    });

    it('should select first idlepc as default when idlepcs has values', () => {
      const mockResponse = ['0x60c09aa0 [55]', '0x60c09bb0 [50]'];
      mockNodeService.getIdlePCProposals.mockReturnValue(of(mockResponse));

      component.onCompute();

      expect(component.idlePC()).toBe('0x60c09aa0');
    });

    it('should not select any idlepc when idlepcs is empty', () => {
      const mockResponse: string[] = [];
      mockNodeService.getIdlePCProposals.mockReturnValue(of(mockResponse));

      component.onCompute();

      expect(component.idlePC()).toBe('');
    });

    it('should filter out invalid idle-pc format entries', () => {
      const mockResponse = ['0x60c09aa0 [55]', 'invalid-format', '0xabc [not-a-number]', '0x60c09cc0 [50]'];
      mockNodeService.getIdlePCProposals.mockReturnValue(of(mockResponse));

      component.onCompute();

      expect(component.idlepcs.length).toBe(2);
      expect(component.idlepcs[0].key).toBe('0x60c09aa0');
      expect(component.idlepcs[1].key).toBe('0x60c09cc0');
    });

    it('should set isComputing to false after processing response', () => {
      mockNodeService.getIdlePCProposals.mockReturnValue(of(['0x60c09aa0 [55]']));

      component.onCompute();

      expect(component.isComputing).toBe(false);
    });

    it('should show error toast when getIdlePCProposals fails', async () => {
      mockNodeService.getIdlePCProposals.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to get proposals' } }))
      );

      component.onCompute();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to get proposals');
    });

    it('should use fallback message when getIdlePCProposals error has no message', async () => {
      mockNodeService.getIdlePCProposals.mockReturnValue(throwError(() => ({})));

      component.onCompute();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to compute idle-PC proposals');
    });

    it('should call markForCheck when getIdlePCProposals fails', async () => {
      mockNodeService.getIdlePCProposals.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );

      const cdrSpy = vi.spyOn(fixture.componentInstance['cd'], 'markForCheck');
      component.onCompute();
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should call dialogRef.close', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onApply', () => {
    it('should not update node when idlePC is empty', () => {
      component.idlePC.set('');

      component.onApply();

      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
      expect(mockToasterService.success).not.toHaveBeenCalled();
    });

    it('should not update node when idlePC is 0x0', () => {
      component.idlePC.set('0x0');

      component.onApply();

      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
      expect(mockToasterService.success).not.toHaveBeenCalled();
    });

    it('should update node properties with idlePC when value is valid', () => {
      component.idlePC.set('0x60c09aa0');
      mockNodeService.updateNode.mockReturnValue(of(mockNode));

      component.onApply();

      expect(mockNode.properties.idlepc).toBe('0x60c09aa0');
    });

    it('should call nodeService.updateNode with controller and node', () => {
      component.idlePC.set('0x60c09aa0');
      mockNodeService.updateNode.mockReturnValue(of(mockNode));

      component.onApply();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should show success toast after updating node', () => {
      component.idlePC.set('0x60c09aa0');
      mockNodeService.updateNode.mockReturnValue(of(mockNode));

      component.onApply();

      expect(mockToasterService.success).toHaveBeenCalledWith(
        `Node ${mockNode.name} updated with idle-PC value 0x60c09aa0`
      );
    });

    it('should show error toast when updateNode fails', async () => {
      component.idlePC.set('0x60c09aa0');
      mockNodeService.updateNode.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      const cdrSpy = vi.spyOn(fixture.componentInstance['cd'], 'markForCheck');
      component.onApply();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Update failed');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback message when updateNode error has no message', async () => {
      component.idlePC.set('0x60c09aa0');
      mockNodeService.updateNode.mockReturnValue(throwError(() => ({})));

      component.onApply();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node with idle-PC value');
    });
  });
});
