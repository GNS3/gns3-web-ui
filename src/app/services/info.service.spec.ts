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
    describe('Cloud Node', () => {
      it('should return info for cloud node', () => {
        const cloudNode = { ...mockNode, node_type: 'cloud' as any, name: 'Cloud1' };
        const result = service.getInfoAboutNode(cloudNode, mockController);

        expect(result).toContain('Cloud Cloud1 is always on.');
      });

      it('should include controller info for cloud node', () => {
        const cloudNode = { ...mockNode, node_type: 'cloud' as any };
        const result = service.getInfoAboutNode(cloudNode, mockController);

        expect(result).toContain('Running on controller Test Controller with port 3080.');
        expect(result).toContain('Controller ID is 1.');
      });
    });

    describe('NAT Node', () => {
      it('should return info for NAT node', () => {
        const natNode = { ...mockNode, node_type: 'nat' as any, name: 'NAT1' };
        const result = service.getInfoAboutNode(natNode, mockController);

        expect(result).toContain('NAT NAT1 is always on.');
      });
    });

    describe('Ethernet Hub Node', () => {
      it('should return info for ethernet hub node', () => {
        const hubNode = { ...mockNode, node_type: 'ethernet-hub' as any, name: 'Hub1' };
        const result = service.getInfoAboutNode(hubNode, mockController);

        expect(result).toContain('Ethernet hub Hub1 is always on.');
      });
    });

    describe('Ethernet Switch Node', () => {
      it('should return info for ethernet switch node', () => {
        const switchNode = { ...mockNode, node_type: 'ethernet_switch' as any, name: 'Switch1' };
        const result = service.getInfoAboutNode(switchNode, mockController);

        expect(result).toContain('Ethernet switch Switch1 is always on.');
      });
    });

    describe('Frame Relay Switch Node', () => {
      it('should return info for frame relay switch node', () => {
        const frNode = { ...mockNode, node_type: 'frame_relay_switch' as any, name: 'FR1' };
        const result = service.getInfoAboutNode(frNode, mockController);

        expect(result).toContain('Frame relay switch FR1 is always on.');
      });
    });

    describe('ATM Switch Node', () => {
      it('should return info for ATM switch node', () => {
        const atmNode = { ...mockNode, node_type: 'atm_switch' as any, name: 'ATM1' };
        const result = service.getInfoAboutNode(atmNode, mockController);

        expect(result).toContain('ATM switch ATM1 is always on.');
      });
    });

    describe('Docker Node', () => {
      it('should return info for Docker node with status', () => {
        const dockerNode = { ...mockNode, node_type: 'docker' as any, name: 'Docker1', status: 'running' };
        const result = service.getInfoAboutNode(dockerNode, mockController);

        expect(result).toContain('Docker Docker1 is running.');
      });

      it('should show different status for Docker node', () => {
        const dockerNode = { ...mockNode, node_type: 'docker' as any, name: 'Docker2', status: 'stopped' };
        const result = service.getInfoAboutNode(dockerNode, mockController);

        expect(result).toContain('Docker Docker2 is stopped.');
      });
    });

    describe('Dynamips Node', () => {
      it('should return info for dynamips node', () => {
        const dynamipsNode = { ...mockNode, node_type: 'dynamips' as any, name: 'Dynamips1' };
        const result = service.getInfoAboutNode(dynamipsNode, mockController);

        expect(result).toContain('Dynamips Dynamips1 is always on.');
      });
    });

    describe('VirtualBox Node', () => {
      it('should return info for VirtualBox node with status', () => {
        const vbNode = { ...mockNode, node_type: 'virtualbox' as any, name: 'VB1', status: 'started' };
        const result = service.getInfoAboutNode(vbNode, mockController);

        expect(result).toContain('VirtualBox VM VB1 is started.');
      });
    });

    describe('VMware Node', () => {
      it('should return info for VMware node with status', () => {
        const vmwareNode = { ...mockNode, node_type: 'vmware' as any, name: 'VMware1', status: 'running' };
        const result = service.getInfoAboutNode(vmwareNode, mockController);

        expect(result).toContain('VMware VM VMware1 is running.');
      });
    });

    describe('QEMU Node', () => {
      it('should return info for QEMU node with status', () => {
        const qemuNode = { ...mockNode, node_type: 'qemu' as any, name: 'QEMU1', status: 'started' };
        const result = service.getInfoAboutNode(qemuNode, mockController);

        expect(result).toContain('QEMU VM QEMU1 is started.');
      });
    });

    describe('IOU Node', () => {
      it('should return info for IOU node', () => {
        const iouNode = { ...mockNode, node_type: 'iou' as any, name: 'IOU1' };
        const result = service.getInfoAboutNode(iouNode, mockController);

        expect(result).toContain('IOU IOU1 is always on.');
      });
    });

    describe('VPCS Node', () => {
      it('should return info for VPCS node with status', () => {
        const vpcsNode = { ...mockNode, node_type: 'vpcs' as any, name: 'VPCS1', status: 'started' };
        const result = service.getInfoAboutNode(vpcsNode, mockController);

        expect(result).toContain('Node VPCS1 is started.');
      });
    });

    describe('Controller Information', () => {
      it('should include controller name and port', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result).toContain('Running on controller Test Controller with port 3080.');
      });

      it('should include controller ID', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result).toContain('Controller ID is 1.');
      });

      it('should work with different controller ports', () => {
        const customController = { ...mockController, port: 8080, name: 'Custom Controller' };
        const result = service.getInfoAboutNode(mockNode, customController);

        expect(result).toContain('Running on controller Custom Controller with port 8080.');
      });
    });

    describe('Console Information', () => {
      it('should include console info when console_type is telnet', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result).toContain('Console is on port 5000 and type is telnet.');
      });

      it('should include console info when console_type is other types', () => {
        const nodeWithConsole = { ...mockNode, console_type: 'serial' };
        const result = service.getInfoAboutNode(nodeWithConsole, mockController);

        expect(result).toContain('Console is on port 5000 and type is serial.');
      });

      it('should not include console info when console_type is none', () => {
        const nodeWithoutConsole = { ...mockNode, console_type: 'none' };
        const result = service.getInfoAboutNode(nodeWithoutConsole, mockController);

        expect(result).not.toContain('Console is on port');
      });

      it('should not include console info when console_type is null', () => {
        const nodeWithoutConsole = { ...mockNode, console_type: 'null' };
        const result = service.getInfoAboutNode(nodeWithoutConsole, mockController);

        expect(result).not.toContain('Console is on port');
      });
    });

    describe('Ports Information', () => {
      it('should include all ports in info', () => {
        const result = service.getInfoAboutNode(mockNode, mockController);

        expect(result).toContain('Port eth0 is ethernet.');
        expect(result).toContain('Port eth1 is ethernet.');
        expect(result).toContain('Port serial0 is serial.');
      });

      it('should handle empty ports array', () => {
        const nodeWithoutPorts = { ...mockNode, ports: [] };
        const result = service.getInfoAboutNode(nodeWithoutPorts, mockController);

        // Should still have other info but no port info
        expect(result.length).toBeGreaterThan(0);
        // Verify controller info is present
        expect(result.some(item => item.includes('controller'))).toBe(true);
      });

      it('should handle ports with different link types', () => {
        const customPorts = [
          { name: 'gi0/0', link_type: 'gigabitethernet' } as Port,
          { name: 'fa0/0', link_type: 'fastethernet' } as Port,
        ];
        const nodeWithCustomPorts = { ...mockNode, ports: customPorts };
        const result = service.getInfoAboutNode(nodeWithCustomPorts, mockController);

        expect(result).toContain('Port gi0/0 is gigabitethernet.');
        expect(result).toContain('Port fa0/0 is fastethernet.');
      });
    });
  });

  describe('getInfoAboutPorts', () => {
    it('should return formatted port information', () => {
      const result = service.getInfoAboutPorts(mockPorts);

      expect(result).toContain('Ports:');
      expect(result).toContain('link_type: ethernet');
      expect(result).toContain('name: eth0');
      expect(result).toContain('name: eth1');
    });

    it('should handle empty ports array', () => {
      const result = service.getInfoAboutPorts([]);

      // When no ports, it just returns "Ports" without colon and spaces trimmed
      expect(result).toContain('Ports');
    });

    it('should handle single port', () => {
      const singlePort = [mockPorts[0]];
      const result = service.getInfoAboutPorts(singlePort);

      expect(result).toContain('link_type: ethernet');
      expect(result).toContain('name: eth0');
    });

    it('should format multiple ports correctly', () => {
      const result = service.getInfoAboutPorts(mockPorts);

      expect(result).toContain('ethernet');
      expect(result).toContain('serial');
    });

    it('should handle ports with special characters in names', () => {
      const specialPorts = [
        { name: 'gi0/0.1', link_type: 'gigabitethernet' } as Port,
        { name: 'fa0/0.100', link_type: 'fastethernet' } as Port,
      ];
      const result = service.getInfoAboutPorts(specialPorts);

      expect(result).toContain('gi0/0.1');
      expect(result).toContain('fa0/0.100');
    });
  });

  describe('getCommandLine', () => {
    describe('Unsupported Node Types', () => {
      it('should return unsupported message for cloud node', () => {
        const cloudNode = { ...mockNode, node_type: 'cloud' as any };
        const result = service.getCommandLine(cloudNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for NAT node', () => {
        const natNode = { ...mockNode, node_type: 'nat' as any };
        const result = service.getCommandLine(natNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for ethernet hub node', () => {
        const hubNode = { ...mockNode, node_type: 'ethernet_hub' as any };
        const result = service.getCommandLine(hubNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for ethernet switch node', () => {
        const switchNode = { ...mockNode, node_type: 'ethernet_switch' as any };
        const result = service.getCommandLine(switchNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for frame relay switch node', () => {
        const frNode = { ...mockNode, node_type: 'frame_relay_switch' as any };
        const result = service.getCommandLine(frNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for ATM switch node', () => {
        const atmNode = { ...mockNode, node_type: 'atm_switch' as any };
        const result = service.getCommandLine(atmNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for dynamips node', () => {
        const dynamipsNode = { ...mockNode, node_type: 'dynamips' as any };
        const result = service.getCommandLine(dynamipsNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
      });

      it('should return unsupported message for IOU node', () => {
        const iouNode = { ...mockNode, node_type: 'iou' as any };
        const result = service.getCommandLine(iouNode);

        expect(result).toBe('Command line information is not supported for this type of node.');
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

        expect(result).toBe('docker run -it ubuntu');
      });

      it('should return start message for Docker node when command line is empty', () => {
        const dockerNode = {
          ...mockNode,
          node_type: 'docker' as any,
          command_line: undefined,
        };
        const result = service.getCommandLine(dockerNode);

        expect(result).toBe('Please start the node in order to get the command line information.');
      });

      it('should return command line for VirtualBox node when available', () => {
        const vbNode = {
          ...mockNode,
          node_type: 'virtualbox' as any,
          command_line: 'VBoxHeadless --startvm vm1',
        };
        const result = service.getCommandLine(vbNode);

        expect(result).toBe('VBoxHeadless --startvm vm1');
      });

      it('should return command line for VMware node when available', () => {
        const vmwareNode = {
          ...mockNode,
          node_type: 'vmware' as any,
          command_line: 'vmrun -T ws start vm1',
        };
        const result = service.getCommandLine(vmwareNode);

        expect(result).toBe('vmrun -T ws start vm1');
      });

      it('should return command line for QEMU node when available', () => {
        const qemuNode = {
          ...mockNode,
          node_type: 'qemu' as any,
          command_line: 'qemu-system-x86_64 -m 2048',
        };
        const result = service.getCommandLine(qemuNode);

        expect(result).toBe('qemu-system-x86_64 -m 2048');
      });

      it('should return command line for VPCS node when available', () => {
        const vpcsNode = {
          ...mockNode,
          node_type: 'vpcs' as any,
          command_line: 'vpcs -p 5000',
        };
        const result = service.getCommandLine(vpcsNode);

        expect(result).toBe('vpcs -p 5000');
      });

      it('should return start message for supported nodes without command line', () => {
        const qemuNode = {
          ...mockNode,
          node_type: 'qemu' as any,
          command_line: undefined,
        };
        const result = service.getCommandLine(qemuNode);

        expect(result).toBe('Please start the node in order to get the command line information.');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle node with empty name', () => {
      const nodeWithEmptyName = { ...mockNode, name: '' };
      const result = service.getInfoAboutNode(nodeWithEmptyName, mockController);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle controller with special characters in name', () => {
      const controllerWithSpecialName = {
        ...mockController,
        name: 'Controller (Test) #1',
      };
      const result = service.getInfoAboutNode(mockNode, controllerWithSpecialName);

      // Check that controller info is in the result
      expect(result.some(item => item.includes('Controller (Test) #1'))).toBe(true);
    });

    it('should handle node with very long command line', () => {
      const longCommandLine = 'qemu-system-x86_64 ' + '-m 1024 '.repeat(100);
      const nodeWithLongCmd = {
        ...mockNode,
        command_line: longCommandLine,
      };
      const result = service.getCommandLine(nodeWithLongCmd);

      expect(result).toBe(longCommandLine);
    });

    it('should handle ports with null or undefined properties gracefully', () => {
      const portsWithIssues = [
        { name: 'eth0', link_type: null as any },
        { name: 'eth1', link_type: undefined as any },
      ];
      const nodeWithIssuePorts = { ...mockNode, ports: portsWithIssues };
      const result = service.getInfoAboutNode(nodeWithIssuePorts, mockController);

      // Should include port info even with null/undefined link_type
      expect(result.some(item => item.includes('Port eth0'))).toBe(true);
      expect(result.some(item => item.includes('Port eth1'))).toBe(true);
    });
  });
});
