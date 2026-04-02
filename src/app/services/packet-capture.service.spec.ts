import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PacketCaptureService } from './packet-capture.service';
import { ProtocolHandlerService } from './protocol-handler.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Link } from '@models/link';

describe('PacketCaptureService', () => {
  let service: PacketCaptureService;
  let mockProtocolHandlerService: any;
  let mockController: Controller;
  let mockProject: Project;
  let mockLink: Link;

  beforeEach(() => {
    mockProtocolHandlerService = {
      open: vi.fn(),
    };

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    } as Controller;

    mockProject = {
      project_id: 'project-123',
      name: 'Test Project',
    } as Project;

    mockLink = {
      link_id: 'link-456',
    } as Link;

    service = new PacketCaptureService(mockProtocolHandlerService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of PacketCaptureService', () => {
      expect(service).toBeInstanceOf(PacketCaptureService);
    });
  });

  describe('startCapture', () => {
    it('should call protocolHandlerService.open with correct URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      expect(mockProtocolHandlerService.open).toHaveBeenCalled();
      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('gns3+pcap://');
    });

    it('should include host in URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('localhost');
    });

    it('should include port in URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('3080');
    });

    it('should include project_id in URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('project_id=project-123');
    });

    it('should include link_id in URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('link_id=link-456');
    });

    it('should include project name in URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('project=Test Project');
    });

    it('should include capture name in URI', () => {
      service.startCapture(mockController, mockProject, mockLink, 'myCapture');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('name=myCapture');
    });

    it('should strip trailing colon from protocol', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('protocol=http');
      expect(uri).not.toContain('protocol=http:');
    });

    it('should handle https protocol', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      service.startCapture(httpsController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('protocol=https');
    });

    it('should call open exactly once', () => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      expect(mockProtocolHandlerService.open).toHaveBeenCalledTimes(1);
    });
  });
});
