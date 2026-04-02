import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateMocksService } from './template-mocks.service';
import { firstValueFrom } from 'rxjs';

describe('TemplateMocksService', () => {
  let service: TemplateMocksService;

  beforeEach(() => {
    service = new TemplateMocksService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of TemplateMocksService', () => {
      expect(service).toBeInstanceOf(TemplateMocksService);
    });
  });

  describe('getQemuTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getQemuTemplate();
      expect(result).toBeDefined();
    });

    it('should return QEMU template with correct template_type', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.template_type).toBe('qemu');
    });

    it('should return template with builtin set to false', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.builtin).toBe(false);
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.category).toBe('guest');
    });

    it('should return template with correct compute_id', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.compute_id).toBe('local');
    });

    it('should return template with default settings', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.name).toBe('');
      expect(template.symbol).toBe('qemu_guest');
      expect(template.ram).toBe(256);
      expect(template.cpus).toBe(1);
      expect(template.adapters).toBe(4);
    });

    it('should return template with linked_clone enabled', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.linked_clone).toBe(true);
    });

    it('should return template with default options', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.options).toBe('-nographic');
      expect(template.console_type).toBe('telnet');
    });

    it('should return template with empty disk images', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.hda_disk_image).toBe('');
      expect(template.hdb_disk_image).toBe('');
      expect(template.hdc_disk_image).toBe('');
      expect(template.hdd_disk_image).toBe('');
    });

    it('should return template with empty bios/kernel images', async () => {
      const template = await firstValueFrom(service.getQemuTemplate());
      expect(template.bios_image).toBe('');
      expect(template.kernel_image).toBe('');
      expect(template.initrd).toBe('');
    });
  });

  describe('getVpcsTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getVpcsTemplate();
      expect(result).toBeDefined();
    });

    it('should return VPCS template with correct template_type', async () => {
      const template = await firstValueFrom(service.getVpcsTemplate());
      expect(template.template_type).toBe('vpcs');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getVpcsTemplate());
      expect(template.category).toBe('guest');
    });

    it('should return template with correct default_name_format', async () => {
      const template = await firstValueFrom(service.getVpcsTemplate());
      expect(template.default_name_format).toBe('PC{0}');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getVpcsTemplate());
      expect(template.symbol).toBe('vpcs_guest');
    });

    it('should return template with base_script_file', async () => {
      const template = await firstValueFrom(service.getVpcsTemplate());
      expect(template.base_script_file).toBe('vpcs_base_config.txt');
    });
  });

  describe('getVirtualBoxTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getVirtualBoxTemplate();
      expect(result).toBeDefined();
    });

    it('should return VirtualBox template with correct template_type', async () => {
      const template = await firstValueFrom(service.getVirtualBoxTemplate());
      expect(template.template_type).toBe('virtualbox');
    });

    it('should return template with linked_clone set to false', async () => {
      const template = await firstValueFrom(service.getVirtualBoxTemplate());
      expect(template.linked_clone).toBe(false);
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getVirtualBoxTemplate());
      expect(template.symbol).toBe('vbox_guest');
    });

    it('should return template with console_type none', async () => {
      const template = await firstValueFrom(service.getVirtualBoxTemplate());
      expect(template.console_type).toBe('none');
    });
  });

  describe('getCloudNodeTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getCloudNodeTemplate();
      expect(result).toBeDefined();
    });

    it('should return Cloud template with correct template_type', async () => {
      const template = await firstValueFrom(service.getCloudNodeTemplate());
      expect(template.template_type).toBe('cloud');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getCloudNodeTemplate());
      expect(template.symbol).toBe('cloud');
    });

    it('should return template with default_name_format Cloud{0}', async () => {
      const template = await firstValueFrom(service.getCloudNodeTemplate());
      expect(template.default_name_format).toBe('Cloud{0}');
    });

    it('should return template with empty ports_mapping', async () => {
      const template = await firstValueFrom(service.getCloudNodeTemplate());
      expect(template.ports_mapping).toEqual([]);
    });
  });

  describe('getEthernetHubTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getEthernetHubTemplate();
      expect(result).toBeDefined();
    });

    it('should return Ethernet Hub template with correct template_type', async () => {
      const template = await firstValueFrom(service.getEthernetHubTemplate());
      expect(template.template_type).toBe('ethernet_hub');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getEthernetHubTemplate());
      expect(template.category).toBe('switch');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getEthernetHubTemplate());
      expect(template.symbol).toBe('hub');
    });

    it('should return template with default_name_format Hub{0}', async () => {
      const template = await firstValueFrom(service.getEthernetHubTemplate());
      expect(template.default_name_format).toBe('Hub{0}');
    });
  });

  describe('getEthernetSwitchTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getEthernetSwitchTemplate();
      expect(result).toBeDefined();
    });

    it('should return Ethernet Switch template with correct template_type', async () => {
      const template = await firstValueFrom(service.getEthernetSwitchTemplate());
      expect(template.template_type).toBe('ethernet_switch');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getEthernetSwitchTemplate());
      expect(template.category).toBe('switch');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getEthernetSwitchTemplate());
      expect(template.symbol).toBe('ethernet_switch');
    });

    it('should return template with default_name_format Switch{0}', async () => {
      const template = await firstValueFrom(service.getEthernetSwitchTemplate());
      expect(template.default_name_format).toBe('Switch{0}');
    });

    it('should return template with telnet console type', async () => {
      const template = await firstValueFrom(service.getEthernetSwitchTemplate());
      expect(template.console_type).toBe('telnet');
    });
  });

  describe('getIosTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getIosTemplate();
      expect(result).toBeDefined();
    });

    it('should return IOS template with correct template_type', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.template_type).toBe('dynamips');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.category).toBe('router');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.symbol).toBe('router');
    });

    it('should return template with auto_delete_disks enabled', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.auto_delete_disks).toBe(true);
    });

    it('should return template with mmap enabled', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.mmap).toBe(true);
    });

    it('should return template with sparsemem enabled', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.sparsemem).toBe(true);
    });

    it('should return template with default startup_config', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.startup_config).toBe('ios_base_startup-config.txt');
    });

    it('should return template with system_id', async () => {
      const template = await firstValueFrom(service.getIosTemplate());
      expect(template.system_id).toBe('FTX0945W0MY');
    });
  });

  describe('getVmwareTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getVmwareTemplate();
      expect(result).toBeDefined();
    });

    it('should return VMware template with correct template_type', async () => {
      const template = await firstValueFrom(service.getVmwareTemplate());
      expect(template.template_type).toBe('vmware');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getVmwareTemplate());
      expect(template.category).toBe('guest');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getVmwareTemplate());
      expect(template.symbol).toBe('vmware_guest');
    });

    it('should return template with linked_clone set to false', async () => {
      const template = await firstValueFrom(service.getVmwareTemplate());
      expect(template.linked_clone).toBe(false);
    });
  });

  describe('getDockerTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getDockerTemplate();
      expect(result).toBeDefined();
    });

    it('should return Docker template with correct template_type', async () => {
      const template = await firstValueFrom(service.getDockerTemplate());
      expect(template.template_type).toBe('docker');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getDockerTemplate());
      expect(template.category).toBe('guest');
    });

    it('should return template with compute_id vm', async () => {
      const template = await firstValueFrom(service.getDockerTemplate());
      expect(template.compute_id).toBe('vm');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getDockerTemplate());
      expect(template.symbol).toBe('docker_guest');
    });

    it('should return template with default console settings', async () => {
      const template = await firstValueFrom(service.getDockerTemplate());
      expect(template.console_http_port).toBe(80);
      expect(template.console_http_path).toBe('/');
      expect(template.console_resolution).toBe('1024x768');
    });
  });

  describe('getIouTemplate', () => {
    it('should return an Observable', () => {
      const result = service.getIouTemplate();
      expect(result).toBeDefined();
    });

    it('should return IOU template with correct template_type', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.template_type).toBe('iou');
    });

    it('should return template with correct category', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.category).toBe('switch');
    });

    it('should return template with compute_id vm', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.compute_id).toBe('vm');
    });

    it('should return template with correct symbol', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.symbol).toBe('multilayer_switch');
    });

    it('should return template with ethernet_adapters', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.ethernet_adapters).toBe(1);
    });

    it('should return template with l1_keepalives disabled', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.l1_keepalives).toBe(false);
    });

    it('should return template with use_default_iou_values enabled', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.use_default_iou_values).toBe(true);
    });

    it('should return template with default startup_config', async () => {
      const template = await firstValueFrom(service.getIouTemplate());
      expect(template.startup_config).toBe('iou_l2_base_startup-config.txt');
    });
  });

  describe('list', () => {
    it('should return an Observable', () => {
      const result = service.list();
      expect(result).toBeDefined();
    });

    it('should return empty array', async () => {
      const templates = await firstValueFrom(service.list());
      expect(templates).toEqual([]);
    });
  });

});
