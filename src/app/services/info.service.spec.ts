import { describe, it, expect, beforeEach } from 'vitest';
import { InfoService } from './info.service';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';
import { Port } from '@models/port';

describe('InfoService', () => {
  let service: InfoService;
  let mockController: Controller;
  let mockNode: Node;
  let mockPorts: Port[];

  beforeEach(() => {
    service = new InfoService();

    // Mock Controller
    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    // Mock Ports
    mockPorts = [
      { name: 'eth0', link_type: 'ethernet', port_number: 0 } as Port,
      { name: 'eth1', link_type: 'ethernet', port_number: 1 } as Port,
      { name: 'serial0', link_type: 'serial', port_number: 0 } as Port,
    ];

    // Mock Node
    mockNode = {
      node_id: 'test-node-uuid',
      name: 'Test Node',
      node_type: 'qemu',
      status: 'started',
      console: 5000,
      console_type: 'telnet',
      command_line: 'qemu-system-x86_64 -m 1024',
      ports: mockPorts,
    } as Node;
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of InfoService', () => {
      expect(service).toBeInstanceOf(InfoService);
    });
  });

  describe('getInfoAboutNode', () => {
    describe('Always-On Node Types', () => {
      it.each([
        ['cloud', 'Cloud'],
        ['nat', 'NAT'],
        ['ethernet_hub', 'Ethernet hub'],
        ['ethernet_switch', 'Ethernet switch'],
        ['frame_relay_switch', 'Frame relay switch'],
        ['atm_switch', 'ATM switch'],
        ['dynamips', 'Dynamips router'],
        ['iou', 'IOU device'],
      ])('should report %s as always on', (nodeType, label) => {
        const node = { ...mockNode, node_type: nodeType };
        const result = service.getInfoAboutNode(node, mockController);

        expect(result.alwaysOn).toBe(true);
        expect(result.statusLabel).toBe('Always on');
        expect(result.nodeType).toBe(nodeType);
        expect(result.nodeTypeLabel).toBe(label);
      });

      it('should recognize ethernet hub with underscore spelling (regression)', () => {
        // GNS3 API emits 'ethernet_hub'; a legacy hyphen check silently matched nothing.
        const hubNode = { ...mockNode, node_type: 'ethernet_hub' as any, name: 'Hub1' };
        const result = service.getInfoAboutNode(hubNode, mockController);

        expect(result.alwaysOn).toBe(true);
        expect(result.nodeTypeLabel).toBe('Ethernet hub');
      });
    });

    describe('Status-Bearing Node Types', () => {
      it.each([
        ['docker', 'Docker container'],
        ['virtualbox', 'VirtualBox VM'],
        ['vmware', 'VMware VM'],
        ['qemu', 'QEMU VM'],
        ['vpcs', 'VPCS host'],
      ])('should report %s status', (nodeType, label) => {
        const node = { ...mockNode, node_type: nodeType, status: 'started' };
        const result = service.getInfoAboutNode(node, mockController);

        expect(result.alwaysOn).toBe(false);
        expect(result.status).toBe('started');
        expect(result.statusLabel).toBe('Started');
        expect(result.nodeTypeLabel).toBe(label);
      });

      it('should show stopped status', () => {
        const dockerNode = { ...mockNode, node_type: 'docker' as any, status: 'stopped' };
        const result = service.getInfoAboutNode(dockerNode, mockController);

        expect(result.statusLabel).toBe('Stopped');
      });

      it('should show suspended status', () => {
        const qemuNode = { ...mockNode, node_type: 'qemu' as any, status: 'suspended' };
        const result = service.getInfoAboutNode(qemuNode, mockController);

        expect(result.statusLabel).toBe('Suspended');
      });

      it('should fall back to the raw status string for unknown statuses', () => {
        const vmwareNode = { ...mockNode, node_type: 'vmware' as any, status: 'running' };
        const result = service.getInfoAboutNode(vmwareNode, mockController);

        expect(result.statusLabel).toBe('running');
      });
    });

    describe('Controller Information', () => {
      it('should include controller id, name and port', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result.controller).toEqual({ id: 1, name: 'Test Controller', port: 3080 });
      });

      it('should include node ID', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result.nodeId).toBe('test-node-uuid');
      });

      it('should work with different controllers', () => {
        const customController = { ...mockController, port: 8080, name: 'Custom Controller' };
        const result = service.getInfoAboutNode(mockNode, customController);

        expect(result.controller).toEqual({ id: 1, name: 'Custom Controller', port: 8080 });
      });
    });

    describe('Console Information', () => {
      it('should include console info when console_type is telnet', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result.console).toEqual({ port: 5000, type: 'telnet' });
      });

      it('should include console info when console_type is other types', () => {
        const nodeWithConsole = { ...mockNode, console_type: 'serial' };
        const result = service.getInfoAboutNode(nodeWithConsole, mockController);

        expect(result.console).toEqual({ port: 5000, type: 'serial' });
      });

      it('should not include console info when console_type is none', () => {
        const nodeWithoutConsole = { ...mockNode, console_type: 'none' };
        const result = service.getInfoAboutNode(nodeWithoutConsole, mockController);

        expect(result.console).toBeNull();
      });

      it('should not include console info when console_type is null', () => {
        const nodeWithoutConsole = { ...mockNode, console_type: 'null' };
        const result = service.getInfoAboutNode(nodeWithoutConsole, mockController);

        expect(result.console).toBeNull();
      });

      it('should not include console info when console_type is empty', () => {
        const nodeWithoutConsole = { ...mockNode, console_type: '' };
        const result = service.getInfoAboutNode(nodeWithoutConsole, mockController);

        expect(result.console).toBeNull();
      });
    });

    describe('Ports Information', () => {
      it('should map all ports', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result.ports).toEqual([
          { name: 'eth0', linkType: 'ethernet' },
          { name: 'eth1', linkType: 'ethernet' },
          { name: 'serial0', linkType: 'serial' },
        ]);
      });

      it('should handle empty ports array', () => {
        const nodeWithoutPorts = { ...mockNode, ports: [] };
        const result = service.getInfoAboutNode(nodeWithoutPorts, mockController);

        expect(result.ports).toEqual([]);
        expect(result.nodeId).toBe('test-node-uuid');
      });

      it('should handle ports with different link types', () => {
        const customPorts = [
          { name: 'gi0/0', link_type: 'gigabitethernet' } as Port,
          { name: 'fa0/0', link_type: 'fastethernet' } as Port,
        ];
        const nodeWithCustomPorts = { ...mockNode, ports: customPorts };
        const result = service.getInfoAboutNode(nodeWithCustomPorts, mockController);

        expect(result.ports).toEqual([
          { name: 'gi0/0', linkType: 'gigabitethernet' },
          { name: 'fa0/0', linkType: 'fastethernet' },
        ]);
      });
    });
  });

  describe('getCommandLine', () => {
    describe('Unsupported Node Types', () => {
      it.each([
        'cloud',
        'nat',
        'ethernet_hub',
        'ethernet_switch',
        'frame_relay_switch',
        'atm_switch',
        'dynamips',
        'iou',
      ])('should return unsupported info for %s node', (nodeType) => {
        const node = { ...mockNode, node_type: nodeType, command_line: 'ignored' };
        const result = service.getCommandLine(node);

        expect(result.kind).toBe('unsupported');
        expect(result.commandLine).toBe('');
        expect(result.message).toBe('Command line information is not supported for this type of node.');
      });
    });

    describe('Supported Node Types', () => {
      it('should return command line for Docker node when available', () => {
        const dockerNode = {
          ...mockNode,
          node_type: 'docker' as any,
          command_line: 'docker run -it ubuntu',
        };
        const result = service.getCommandLine(dockerNode);

        expect(result.kind).toBe('available');
        expect(result.commandLine).toBe('docker run -it ubuntu');
        expect(result.message).toBe('');
      });

      it('should return start message for Docker node when command line is empty', () => {
        const dockerNode = {
          ...mockNode,
          node_type: 'docker' as any,
          command_line: undefined,
        };
        const result = service.getCommandLine(dockerNode);

        expect(result.kind).toBe('not-running');
        expect(result.commandLine).toBe('');
        expect(result.message).toBe('Please start the node in order to get the command line information.');
      });

      it.each([
        ['virtualbox', 'VBoxHeadless --startvm vm1'],
        ['vmware', 'vmrun -T ws start vm1'],
        ['qemu', 'qemu-system-x86_64 -m 2048'],
        ['vpcs', 'vpcs -p 5000'],
      ])('should return command line for %s node when available', (nodeType, commandLine) => {
        const node = { ...mockNode, node_type: nodeType, command_line: commandLine };
        const result = service.getCommandLine(node);

        expect(result.kind).toBe('available');
        expect(result.commandLine).toBe(commandLine);
      });

      it('should return start message for supported nodes without command line', () => {
        const qemuNode = {
          ...mockNode,
          node_type: 'qemu' as any,
          command_line: undefined,
        };
        const result = service.getCommandLine(qemuNode);

        expect(result.kind).toBe('not-running');
        expect(result.message).toBe('Please start the node in order to get the command line information.');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle node with empty name', () => {
      const nodeWithEmptyName = { ...mockNode, name: '' };
      const result = service.getInfoAboutNode(nodeWithEmptyName, mockController);

      expect(result.nodeId).toBe('test-node-uuid');
      expect(result.nodeTypeLabel).toBe('QEMU VM');
    });

    it('should handle controller with special characters in name', () => {
      const controllerWithSpecialName = {
        ...mockController,
        name: 'Controller (Test) #1',
      };
      const result = service.getInfoAboutNode(mockNode, controllerWithSpecialName);

      expect(result.controller.name).toBe('Controller (Test) #1');
    });

    it('should handle node with very long command line', () => {
      const longCommandLine = 'qemu-system-x86_64 ' + '-m 1024 '.repeat(100);
      const nodeWithLongCmd = {
        ...mockNode,
        command_line: longCommandLine,
      };
      const result = service.getCommandLine(nodeWithLongCmd);

      expect(result.kind).toBe('available');
      expect(result.commandLine).toBe(longCommandLine);
    });

    it('should handle ports with null or undefined properties gracefully', () => {
      const portsWithIssues = [
        { name: 'eth0', link_type: null as any },
        { name: 'eth1', link_type: undefined as any },
      ];
      const nodeWithIssuePorts = { ...mockNode, ports: portsWithIssues } as unknown as Node;
      const result = service.getInfoAboutNode(nodeWithIssuePorts, mockController);

      expect(result.ports).toEqual([
        { name: 'eth0', linkType: '' },
        { name: 'eth1', linkType: '' },
      ]);
    });
  });
});
