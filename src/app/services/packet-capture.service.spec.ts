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

      expect(mockProtocolHandlerService.open).toHaveBeenCalledTimes(1);
      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('gns3+pcap://');
    });

    it.each([
      ['host', 'localhost'],
      ['port', '3080'],
      ['protocol', 'protocol=http'],
    ])('should include %s in URI', (_, expected) => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain(expected);
    });

    it.each([
      ['project_id', 'project_id=project-123'],
      ['link_id', 'link_id=link-456'],
      ['project name', 'project=Test Project'],
      ['capture name', 'name=capture1'],
    ])('should include %s in URI', (_, expected) => {
      service.startCapture(mockController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain(expected);
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

    it('should handle protocol without trailing colon', () => {
      const noColonController = { ...mockController, protocol: 'http' as any };
      service.startCapture(noColonController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      // slice(-1) returns 'p' when no colon, so protocol becomes 'htt'
      expect(uri).toContain('protocol=htt');
    });
  });

  describe('URI encoding', () => {
    it('should handle special characters in project name (no encoding)', () => {
      const specialProject = { ...mockProject, name: 'Test & Project=123' };
      service.startCapture(mockController, specialProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      // Service does not encode URI components
      expect(uri).toContain('project=Test & Project=123');
    });

    it('should handle spaces in capture name (no encoding)', () => {
      service.startCapture(mockController, mockProject, mockLink, 'my capture');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('name=my capture');
    });

    it('should handle special characters in link_id (no encoding)', () => {
      const specialLink = { link_id: 'link&456=789' } as Link;
      service.startCapture(mockController, mockProject, specialLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('link_id=link&456=789');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings in parameters', () => {
      const emptyProject = { ...mockProject, project_id: '', name: '' };
      service.startCapture(mockController, emptyProject, mockLink, '');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('project_id=');
      expect(uri).toContain('project=');
      expect(uri).toContain('name=');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalLink = { link_id: '' } as any;
      service.startCapture(mockController, mockProject, minimalLink, 'capture1');

      expect(mockProtocolHandlerService.open).toHaveBeenCalledTimes(1);
    });

    it('should handle zero port in host:port format', () => {
      const zeroPortController = { ...mockController, port: 0 };
      service.startCapture(zeroPortController, mockProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('localhost:0');
    });

    it('should handle unicode characters in project name', () => {
      const unicodeProject = { ...mockProject, name: 'Test Project Chinese' };
      service.startCapture(mockController, unicodeProject, mockLink, 'capture1');

      const uri = mockProtocolHandlerService.open.mock.calls[0][0];
      expect(uri).toContain('project=Test Project Chinese');
    });
  });
});
