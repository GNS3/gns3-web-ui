import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HttpConsoleActionComponent } from './http-console-action.component';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ToasterService } from '@services/toaster.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('HttpConsoleActionComponent', () => {
  let fixture: ComponentFixture<HttpConsoleActionComponent>;
  let mockNodeConsoleService: { openConsoleForNode: ReturnType<typeof vi.fn> };
  let mockVncConsoleService: { openVncConsole: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockMapSettingsService: { logConsoleSubject: { next: ReturnType<typeof vi.fn> } };

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    authToken: 'test-token',
    status: 'running',
    tokenExpired: false,
  };

  const createMockNode = (overrides: Partial<Node> = {}): Node => {
    const defaults: Node = {
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      console: 3080,
      console_type: 'telnet',
      console_auto_start: false,
      node_type: 'vpcs',
      project_id: 'proj-1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 50,
      x: 0,
      y: 0,
      z: 0,
      label: { text: '', x: 0, y: 0, style: '', rotation: 0 },
      locked: false,
      first_port_name: '',
      port_name_format: '',
      port_segment_size: 1,
      ports: [],
      properties: {} as any,
      symbol: '',
      symbol_url: '',
      node_directory: '',
    };
    return Object.assign({}, defaults, overrides);
  };

  beforeEach(async () => {
    mockNodeConsoleService = { openConsoleForNode: vi.fn() };
    mockVncConsoleService = { openVncConsole: vi.fn() };
    mockToasterService = { error: vi.fn() };
    mockMapSettingsService = { logConsoleSubject: { next: vi.fn() } };

    await TestBed.configureTestingModule({
      imports: [HttpConsoleActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(NodeConsoleService, { useValue: mockNodeConsoleService })
      .overrideProvider(VncConsoleService, { useValue: mockVncConsoleService })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .overrideProvider(MapSettingsService, { useValue: mockMapSettingsService })
      .compileComponents();

    fixture = TestBed.createComponent(HttpConsoleActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  describe('button visibility', () => {
    it('should show button when nodes is provided', () => {
      fixture.componentRef.setInput('nodes', [createMockNode()]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Web console');
    });

    it('should show button when nodes is empty array', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should show button when nodes is undefined', () => {
      fixture.componentRef.setInput('nodes', undefined);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });
  });

  describe('openConsole', () => {
    describe('VNC console', () => {
      it('should open VNC console for started node with vnc console type', () => {
        const node = createMockNode({ console_type: 'vnc', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, node, false);
      });

      it('should not open VNC console for stopped node with vnc console type', () => {
        const node = createMockNode({ console_type: 'vnc', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockVncConsoleService.openVncConsole).not.toHaveBeenCalled();
      });
    });

    describe('HTTP/HTTPS console', () => {
      it('should open HTTP console in popup window for started node', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '192.168.1.1',
          console: 80,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const popupWindow = { focus: vi.fn() };
        const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(popupWindow as any);

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.1:80', 'Console-Test Node', 'width=1024,height=768');
      });

      it('should open HTTPS console in popup window for started node', () => {
        const node = createMockNode({
          console_type: 'https',
          console_host: '192.168.1.1',
          console: 443,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const popupWindow = { focus: vi.fn() };
        const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(popupWindow as any);

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(windowOpenSpy).toHaveBeenCalledWith('https://192.168.1.1:443', 'Console-Test Node', 'width=1024,height=768');
      });

      it('should replace 0.0.0.0 console_host with controller host', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '0.0.0.0',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const popupWindow = { focus: vi.fn() };
        const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(popupWindow as any);

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.100:8080', 'Console-Test Node', 'width=1024,height=768');
      });

      it('should replace :: console_host with controller host', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '::',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const popupWindow = { focus: vi.fn() };
        const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(popupWindow as any);

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.100:8080', 'Console-Test Node', 'width=1024,height=768');
      });

      it('should replace IPv6 loopback with controller host', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '0:0:0:0:0:0:0:0',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const popupWindow = { focus: vi.fn() };
        const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(popupWindow as any);

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.100:8080', 'Console-Test Node', 'width=1024,height=768');
      });

      it('should not open HTTP console for stopped node', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '192.168.1.1',
          console: 80,
          status: 'stopped',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const windowOpenSpy = vi.spyOn(window, 'open');

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(windowOpenSpy).not.toHaveBeenCalled();
      });
    });

    describe('Telnet console', () => {
      it('should open telnet console in widget for started node', () => {
        const node = createMockNode({ console_type: 'telnet', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockMapSettingsService.logConsoleSubject.next).toHaveBeenCalledWith(true);
        // Verify setTimeout was called with 500ms delay (actual callback verification not possible without fake timers)
        // The actual openConsoleForNode call happens after 500ms delay via setTimeout
      });

      it('should not open telnet console for stopped node', () => {
        const node = createMockNode({ console_type: 'telnet', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockNodeConsoleService.openConsoleForNode).not.toHaveBeenCalled();
      });
    });

    describe('unsupported console type', () => {
      it('should show error for unsupported console type on started node', () => {
        const node = createMockNode({ console_type: 'ssh', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith("Console type 'ssh' is not supported for node Test Node.");
      });
    });

    describe('nodes with console_type none', () => {
      it('should skip nodes with console_type none', () => {
        const node = createMockNode({ console_type: 'none', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockVncConsoleService.openVncConsole).not.toHaveBeenCalled();
        expect(mockToasterService.error).not.toHaveBeenCalled();
      });
    });

    describe('stopped nodes notification', () => {
      it('should show error with node names when multiple stopped nodes are selected', () => {
        const startedNode = createMockNode({ name: 'StartedNode', status: 'started', console_type: 'vnc' });
        const stoppedNode = createMockNode({ name: 'StoppedNode', status: 'stopped', console_type: 'telnet' });
        const stoppedNode2 = createMockNode({ name: 'StoppedNode2', status: 'stopped', console_type: 'vnc' });
        fixture.componentRef.setInput('nodes', [startedNode, stoppedNode, stoppedNode2]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Please start the following nodes if you want to open consoles for them: StoppedNode StoppedNode2 '
        );
      });

      it('should show error when all nodes are stopped', () => {
        const node1 = createMockNode({ name: 'Node1', status: 'stopped', console_type: 'vnc' });
        const node2 = createMockNode({ name: 'Node2', status: 'stopped', console_type: 'telnet' });
        fixture.componentRef.setInput('nodes', [node1, node2]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Please start the following nodes if you want to open consoles for them: Node1 Node2 '
        );
      });

      it('should not show stopped nodes error when only started nodes are present', () => {
        const node1 = createMockNode({ name: 'Node1', status: 'started', console_type: 'vnc' });
        const node2 = createMockNode({ name: 'Node2', status: 'started', console_type: 'telnet' });
        fixture.componentRef.setInput('nodes', [node1, node2]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).not.toHaveBeenCalled();
      });
    });

    describe('mixed console types', () => {
      it('should handle multiple nodes with different console types', () => {
        const vncNode = createMockNode({ name: 'VNCNode', console_type: 'vnc', status: 'started' });
        const httpNode = createMockNode({ name: 'HTTPNode', console_type: 'http', status: 'started', console_host: '192.168.1.1', console: 80 });
        const telnetNode = createMockNode({ name: 'TelnetNode', console_type: 'telnet', status: 'started' });
        fixture.componentRef.setInput('nodes', [vncNode, httpNode, telnetNode]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        const popupWindow = { focus: vi.fn() };
        const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(popupWindow as any);

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, vncNode, false);
        expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.1:80', 'Console-HTTPNode', 'width=1024,height=768');
        expect(mockMapSettingsService.logConsoleSubject.next).toHaveBeenCalledWith(true);
        // Telnet console uses setTimeout with 500ms delay, which triggers openConsoleForNode after the delay
      });
    });
  });
});
