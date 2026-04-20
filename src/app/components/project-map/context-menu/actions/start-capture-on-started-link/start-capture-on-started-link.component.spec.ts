import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StartCaptureOnStartedLinkActionComponent } from './start-capture-on-started-link.component';
import { PacketCaptureService } from '@services/packet-capture.service';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StartCaptureOnStartedLinkActionComponent', () => {
  let fixture: ComponentFixture<StartCaptureOnStartedLinkActionComponent>;
  let mockPacketCaptureService: { startCapture: ReturnType<typeof vi.fn> };

  const createMockLink = (overrides: Partial<Link> = {}): Link => {
    const defaults: Link = {
      capture_file_name: 'capture.pcap',
      capture_file_path: '/tmp/capture.pcap',
      capturing: false,
      link_id: 'link-1',
      link_type: 'ethernet',
      nodes: [],
      project_id: 'proj-1',
      suspend: false,
      wireshark: false,
      distance: 100,
      length: 100,
      source: {} as any,
      target: {} as any,
      x: 0,
      y: 0,
    };
    return Object.assign({}, defaults, overrides);
  };

  const createMockProject = (): Project => ({
    auto_close: false,
    auto_open: false,
    auto_start: false,
    drawing_grid_size: 25,
    filename: 'test.gns3',
    grid_size: 25,
    name: 'Test Project',
    path: '/path/to/project',
    project_id: 'proj-1',
    scene_height: 1000,
    scene_width: 1000,
    status: 'opened',
    readonly: false,
    show_interface_labels: false,
    show_layers: false,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
  });

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

  beforeEach(() => {
    mockPacketCaptureService = { startCapture: vi.fn() };

    TestBed.configureTestingModule({
      imports: [StartCaptureOnStartedLinkActionComponent],
      providers: [{ provide: PacketCaptureService, useValue: mockPacketCaptureService }],
    });

    fixture = TestBed.createComponent(StartCaptureOnStartedLinkActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('startCapture', () => {
    it('should show button only when link is capturing', () => {
      const mockLink = createMockLink({ capturing: false });
      const mockProject = createMockProject();
      const mockController = createMockController();

      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button')).toBeNull();

      const capturingLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', capturingLink);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
    });

    it('should call packetCaptureService.startCapture with correct parameters when button is clicked', () => {
      const mockLink = createMockLink({ capturing: true, capture_file_name: 'test.pcap' });
      const mockProject = createMockProject();
      const mockController = createMockController();

      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockPacketCaptureService.startCapture).toHaveBeenCalledWith(mockController, mockProject, mockLink, 'test');
    });

    it('should handle capture file names with multiple dots', () => {
      const mockLink = createMockLink({ capturing: true, capture_file_name: 'my.capture.file.pcap' });
      const mockProject = createMockProject();
      const mockController = createMockController();

      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockPacketCaptureService.startCapture).toHaveBeenCalledWith(mockController, mockProject, mockLink, 'my');
    });
  });
});
