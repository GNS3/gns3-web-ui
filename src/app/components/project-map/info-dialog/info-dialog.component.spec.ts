import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { Clipboard } from '@angular/cdk/clipboard';
import { InfoDialogComponent } from './info-dialog.component';
import { InfoService, NodeCommandLineInfo, NodeInfo } from '@services/info.service';
import { ToasterService } from '@services/toaster.service';
import { Node, Properties } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('InfoDialogComponent', () => {
  let fixture: ComponentFixture<InfoDialogComponent>;
  let mockDialogRef: any;
  let mockInfoService: any;
  let mockClipboard: any;
  let mockToasterService: any;

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

  const createMockNodeInfo = (overrides: Partial<NodeInfo> = {}): NodeInfo => ({
    status: 'started',
    statusLabel: 'Started',
    alwaysOn: false,
    nodeType: 'qemu',
    nodeTypeLabel: 'QEMU VM',
    nodeId: 'node-1',
    console: { port: 5000, type: 'telnet' },
    controller: { id: 1, name: 'Main Controller', port: 3080 },
    ports: [
      { name: 'eth0', linkType: 'ethernet' },
      { name: 'eth1', linkType: 'ethernet' },
    ],
    ...overrides,
  });

  const createMockCommandLineInfo = (overrides: Partial<NodeCommandLineInfo> = {}): NodeCommandLineInfo => ({
    kind: 'available',
    commandLine: 'telnet 127.0.0.1 5000',
    message: '',
    ...overrides,
  });

  const createFixture = (node: Node, controller: Controller): ComponentFixture<InfoDialogComponent> => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { node, controller } });
    const f = TestBed.createComponent(InfoDialogComponent);
    f.detectChanges();
    return f;
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockInfoService = {
      getInfoAboutNode: vi.fn().mockReturnValue(createMockNodeInfo()),
      getCommandLine: vi.fn().mockReturnValue(createMockCommandLineInfo()),
    };

    mockClipboard = {
      copy: vi.fn().mockReturnValue(true),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatTabsModule,
        HttpClientModule,
        MarkdownModule.forRoot(),
        InfoDialogComponent,
      ],
    })
      .overrideProvider(MatDialogRef, { useValue: mockDialogRef })
      .overrideProvider(InfoService, { useValue: mockInfoService })
      .overrideProvider(Clipboard, { useValue: mockClipboard })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .compileComponents();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('initialization', () => {
    it('should display node name in dialog title', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const titleEl = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(titleEl.textContent).toContain('Test Router');
    });

    it('should call infoService.getInfoAboutNode with node and controller', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      fixture = createFixture(mockNode, mockController);

      expect(mockInfoService.getInfoAboutNode).toHaveBeenCalledWith(mockNode, mockController);
    });

    it('should call infoService.getCommandLine with node', () => {
      const mockNode = createMockNode();
      fixture = createFixture(mockNode, createMockController());

      expect(mockInfoService.getCommandLine).toHaveBeenCalledWith(mockNode);
    });

    it('should render structured info rows on the General information tab', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const activeBody = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active');
      const values = Array.from(activeBody.querySelectorAll('.detail-row__value')).map((el: HTMLElement) =>
        el.textContent.trim()
      );
      expect(values.some((text) => text.includes('Started'))).toBe(true);
      expect(values.some((text) => text.includes('QEMU VM'))).toBe(true);
      expect(values.some((text) => text.includes('node-1'))).toBe(true);
      expect(values.some((text) => text.includes('telnet (port 5000)'))).toBe(true);
      expect(values.some((text) => text.includes('Main Controller (port 3080)'))).toBe(true);
    });

    it('should render a status dot keyed by node status', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const statusDot = fixture.nativeElement.querySelector('.status-dot');
      expect(statusDot.getAttribute('data-status')).toBe('started');
    });

    it('should render the ports table with name and link type', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const rows = Array.from(fixture.nativeElement.querySelectorAll('.info-dialog__ports-table tbody tr')) as HTMLElement[];
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('eth0');
      expect(rows[0].textContent).toContain('ethernet');
    });

    it('should omit the ports table when the node has no ports', () => {
      mockInfoService.getInfoAboutNode.mockReturnValue(createMockNodeInfo({ ports: [] }));
      fixture = createFixture(createMockNode(), createMockController());

      expect(fixture.nativeElement.querySelector('.info-dialog__ports-table')).toBeNull();
    });
  });

  describe('Usage instructions tab', () => {
    it('should render usage markdown', async () => {
      fixture = createFixture(createMockNode({ usage: '# Router usage info' }), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[1].click();
      fixture.detectChanges();
      // ngx-markdown's render() awaits parse() before inserting the compiled HTML.
      // The global setup installs fake timers, so flush them explicitly.
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      const usageEl = fixture.nativeElement.querySelector('app-markdown-viewer.info-dialog__usage');
      expect(usageEl).toBeTruthy();
      expect(usageEl.textContent).toContain('Router usage info');
    });

    it('should display default message when node has no usage', () => {
      fixture = createFixture(createMockNode({ usage: '' }), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[1].click();
      fixture.detectChanges();

      const activeBody = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active');
      expect(activeBody.textContent).toContain('No usage information has been provided for this node.');
      expect(activeBody.querySelector('app-markdown-viewer')).toBeNull();
    });
  });

  describe('Command line tab', () => {
    it('should render the command line in a code block with a copy button', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const codeBlock = fixture.nativeElement.querySelector('.info-dialog__code');
      expect(codeBlock.textContent).toContain('telnet 127.0.0.1 5000');
      expect(fixture.nativeElement.querySelector('.info-dialog__code-header button')).toBeTruthy();
    });

    it('should copy the command line and show a success toast', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const copyButton = fixture.nativeElement.querySelector('.info-dialog__code-header button');
      copyButton.click();

      expect(mockClipboard.copy).toHaveBeenCalledWith('telnet 127.0.0.1 5000');
      expect(mockToasterService.success).toHaveBeenCalledWith('Command line copied to clipboard');
    });

    it('should show an error toast when copying fails', () => {
      mockClipboard.copy.mockReturnValue(false);
      fixture = createFixture(createMockNode(), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const copyButton = fixture.nativeElement.querySelector('.info-dialog__code-header button');
      copyButton.click();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('should show the unsupported message without a copy button for unsupported node types', () => {
      mockInfoService.getCommandLine.mockReturnValue(
        createMockCommandLineInfo({
          kind: 'unsupported',
          commandLine: '',
          message: 'Command line information is not supported for this type of node.',
        })
      );
      fixture = createFixture(createMockNode(), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const activeBody = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active');
      expect(activeBody.textContent).toContain('Command line information is not supported');
      expect(fixture.nativeElement.querySelector('.info-dialog__code-header button')).toBeNull();
    });

    it('should show the start-node message when the command line is unavailable', () => {
      mockInfoService.getCommandLine.mockReturnValue(
        createMockCommandLineInfo({
          kind: 'not-running',
          commandLine: '',
          message: 'Please start the node in order to get the command line information.',
        })
      );
      fixture = createFixture(createMockNode(), createMockController());

      const tabLabels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
      tabLabels[2].click();
      fixture.detectChanges();

      const activeBody = fixture.nativeElement.querySelector('.mat-mdc-tab-body-active');
      expect(activeBody.textContent).toContain('Please start the node');
    });
  });

  describe('onClose', () => {
    it('should close the dialog from the footer Close button', () => {
      fixture = createFixture(createMockNode(), createMockController());

      const closeButton = fixture.nativeElement.querySelector('mat-dialog-actions button');
      closeButton.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
