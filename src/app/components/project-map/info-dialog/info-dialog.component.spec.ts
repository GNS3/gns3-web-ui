import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { InfoDialogComponent } from './info-dialog.component';
import { InfoService } from '@services/info.service';
import { Node, Properties } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('InfoDialogComponent', () => {
  let fixture: ComponentFixture<InfoDialogComponent>;
  let mockDialogRef: any;
  let mockInfoService: any;

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
  });

  const createMockNode = (overrides: Partial<Node> = {}): Node => {
    const defaults: Node = {
      node_id: 'node-1',
      name: 'Test Router',
      status: 'running',
      console_host: '0.0.0.0',
      node_type: 'dynamips',
      project_id: 'proj1',
      command_line: 'telnet 127.0.0.1 5000',
      compute_id: 'local',
      height: 50,
      width: 80,
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

  const createMockController = (overrides: Partial<Controller> = {}): Controller => {
    const defaults: Controller = {
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
    };
    return Object.assign({}, defaults, overrides);
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockInfoService = {
      getInfoAboutNode: vi.fn().mockReturnValue(['Info line 1', 'Info line 2']),
      getCommandLine: vi.fn().mockReturnValue('telnet 127.0.0.1 5000'),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        InfoDialogComponent,
      ],
    })
      .overrideProvider(MatDialogRef, { useValue: mockDialogRef })
      .overrideProvider(InfoService, { useValue: mockInfoService })
      .compileComponents();

    fixture = TestBed.createComponent(InfoDialogComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should display node name in dialog title', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const titleEl = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(titleEl.textContent).toContain('Test Router');
    });

    it('should call infoService.getInfoAboutNode with node and controller', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(mockInfoService.getInfoAboutNode).toHaveBeenCalledWith(mockNode, mockController);
    });

    it('should call infoService.getCommandLine with node', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(mockInfoService.getCommandLine).toHaveBeenCalledWith(mockNode);
    });

    it('should populate infoList from infoService', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const infoTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(infoTabContent.textContent).toContain('Info line 1');
      expect(infoTabContent.textContent).toContain('Info line 2');
    });

    it('should display usage from node.usage', () => {
      const mockNode = createMockNode({ usage: 'Router usage info' });
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Click on Usage instructions tab
      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[1].click();
      fixture.detectChanges();

      const activeTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(activeTabContent.textContent).toContain('Router usage info');
    });

    it('should display commandLine from infoService', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Click on Command line tab
      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const activeTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(activeTabContent.textContent).toContain('telnet 127.0.0.1 5000');
    });
  });

  describe('when node has no usage', () => {
    it('should display default usage message', () => {
      const mockNode = createMockNode({ usage: '' });
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Click on Usage instructions tab
      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[1].click();
      fixture.detectChanges();

      const activeTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(activeTabContent.textContent).toContain('No usage information has been provided for this node.');
    });
  });

  describe('onCloseClick', () => {
    it('should close the dialog', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('.close-btn');
      closeButton.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('dynamips node type', () => {
    it('should show dynamips-specific info', () => {
      const mockNode = createMockNode({ node_type: 'dynamips', name: 'R1' });
      const mockController = createMockController();
      mockInfoService.getInfoAboutNode.mockReturnValue([
        `Dynamips R1 is always on.`,
        `Running on controller Main Controller with port 3080.`,
        `Controller ID is 1.`,
      ]);

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const infoTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(infoTabContent.textContent).toContain('Dynamips R1 is always on.');
    });
  });

  describe('vpcs node type', () => {
    it('should show vpcs-specific status info', () => {
      const mockNode = createMockNode({
        node_type: 'vpcs',
        name: 'PC1',
        status: 'started',
      });
      const mockController = createMockController();
      mockInfoService.getInfoAboutNode.mockReturnValue([`Node PC1 is started.`]);

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const infoTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(infoTabContent.textContent).toContain('Node PC1 is started.');
    });
  });

  describe('qemu node type', () => {
    it('should show qemu-specific info with status', () => {
      const mockNode = createMockNode({
        node_type: 'qemu',
        name: 'Ubuntu VM',
        status: 'running',
      });
      const mockController = createMockController();
      mockInfoService.getInfoAboutNode.mockReturnValue([`QEMU VM Ubuntu VM is running.`]);

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const infoTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(infoTabContent.textContent).toContain('QEMU VM Ubuntu VM is running.');
    });
  });

  describe('command line tab', () => {
    it('should show command line not supported message for dynamips', () => {
      const mockNode = createMockNode({ node_type: 'dynamips' });
      const mockController = createMockController();
      mockInfoService.getCommandLine.mockReturnValue(
        'Command line information is not supported for this type of node.'
      );

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Click on Command line tab
      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const activeTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(activeTabContent.textContent).toContain('Command line information is not supported');
    });

    it('should show command line not supported message when command_line is unavailable', () => {
      const mockNode = createMockNode({ node_type: 'vpcs' });
      const mockController = createMockController();
      mockInfoService.getCommandLine.mockReturnValue(
        'Please start the node in order to get the command line information.'
      );

      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Click on Command line tab
      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const activeTabContent = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active .textBox');
      expect(activeTabContent.textContent).toContain('Please start the node');
    });
  });
});
