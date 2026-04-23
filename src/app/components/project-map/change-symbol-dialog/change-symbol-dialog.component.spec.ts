import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Component, EventEmitter, input } from '@angular/core';
import { ChangeSymbolDialogComponent } from './change-symbol-dialog.component';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

// Mock SymbolsComponent to avoid complex dependencies
@Component({
  selector: 'app-symbols',
  standalone: true,
  template: '<ng-content></ng-content>',
})
class MockSymbolsComponent {
  readonly controller = input<Controller>(undefined);
  readonly symbol = input<string>(undefined);
  readonly symbolChanged = new EventEmitter<string>();
}

describe('ChangeSymbolDialogComponent', () => {
  let component: ChangeSymbolDialogComponent;
  let fixture: ComponentFixture<ChangeSymbolDialogComponent>;
  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockCdr: any;
  let mockController: Controller;
  let mockNode: Node;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockNodeService = {
      updateSymbol: vi.fn().mockReturnValue(of(undefined)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockCdr = {
      markForCheck: vi.fn(),
    };

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
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
    } as Controller;

    mockNode = {
      node_id: 'node1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'vpcs',
      project_id: 'proj1',
      command_line: '',
      compute_id: 'compute1',
      height: 50,
      width: 80,
      x: 100,
      y: 200,
      z: 1,
      port_name_format: 'eth{0}',
      port_segment_size: 0,
      first_port_name: '',
      label: undefined,
      symbol: '/symbols/router.svg',
      symbol_url: '',
      properties: {
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
      },
      console: 0,
      console_auto_start: false,
      console_type: '',
      locked: false,
      node_directory: '',
      ports: [],
      custom_adapters: undefined,
      ethernet_adapters: undefined,
      serial_adapters: undefined,
    } as Node;

    await TestBed.configureTestingModule({
      imports: [ChangeSymbolDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    })
      .overrideComponent(ChangeSymbolDialogComponent, {
        set: {
          imports: [MockSymbolsComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChangeSymbolDialogComponent);
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
  });

  describe('ngOnInit', () => {
    it('should initialize symbol from node.symbol', () => {
      component.ngOnInit();

      expect(component.symbol).toBe(mockNode.symbol);
    });

    it('should call markForCheck after initialization', () => {
      const cdMarkForCheckSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.ngOnInit();

      expect(cdMarkForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('symbolChanged', () => {
    it('should update the symbol when a new symbol is chosen', () => {
      const newSymbol = '/symbols/switch.svg';

      component.symbolChanged(newSymbol);

      expect(component.symbol).toBe(newSymbol);
    });

    it('should call markForCheck when symbol changes', () => {
      const cdMarkForCheckSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.symbolChanged('/symbols/switch.svg');

      expect(cdMarkForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('onCloseClick', () => {
    it('should close the dialog', () => {
      component.onCloseClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onSelectClick', () => {
    it('should call nodeService.updateSymbol with correct parameters', () => {
      component.ngOnInit();

      component.onSelectClick();

      expect(mockNodeService.updateSymbol).toHaveBeenCalledWith(mockController, mockNode, mockNode.symbol);
    });

    it('should close the dialog after successful symbol update', () => {
      component.ngOnInit();

      component.onSelectClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when update fails with error.error.message', () => {
      mockNodeService.updateSymbol.mockReturnValue(
        throwError(() => ({ error: { message: 'Symbol update failed' } }))
      );
      component.ngOnInit();

      component.onSelectClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Symbol update failed');
    });

    it('should use fallback message when error has no message', () => {
      mockNodeService.updateSymbol.mockReturnValue(throwError(() => ({})));
      component.ngOnInit();

      component.onSelectClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update symbol');
    });

    it('should call markForCheck when update fails', () => {
      mockNodeService.updateSymbol.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );
      component.ngOnInit();

      component.onSelectClick();

      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('should not close dialog when update fails', () => {
      mockNodeService.updateSymbol.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );
      component.ngOnInit();

      component.onSelectClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
