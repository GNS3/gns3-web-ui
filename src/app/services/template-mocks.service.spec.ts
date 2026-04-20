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
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getQemuTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('qemu');
    });

    it('should have builtin set to false', () => {
      expect(template.builtin).toBe(false);
    });

    it('should have correct category', () => {
      expect(template.category).toBe('guest');
    });

    it('should have correct compute_id', () => {
      expect(template.compute_id).toBe('local');
    });

    it('should have default settings', () => {
      expect(template.name).toBe('');
      expect(template.symbol).toBe('qemu_guest');
      expect(template.ram).toBe(256);
      expect(template.cpus).toBe(1);
      expect(template.adapters).toBe(4);
    });

    it('should have linked_clone enabled', () => {
      expect(template.linked_clone).toBe(true);
    });

    it('should have default options', () => {
      expect(template.options).toBe('-nographic');
      expect(template.console_type).toBe('telnet');
    });

    it('should have empty disk images', () => {
      expect(template.hda_disk_image).toBe('');
      expect(template.hdb_disk_image).toBe('');
      expect(template.hdc_disk_image).toBe('');
      expect(template.hdd_disk_image).toBe('');
    });

    it('should have empty bios/kernel images', () => {
      expect(template.bios_image).toBe('');
      expect(template.kernel_image).toBe('');
      expect(template.initrd).toBe('');
    });
  });

  describe('getVpcsTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getVpcsTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('vpcs');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('guest');
    });

    it('should have correct default_name_format', () => {
      expect(template.default_name_format).toBe('PC{0}');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('vpcs_guest');
    });

    it('should have base_script_file', () => {
      expect(template.base_script_file).toBe('vpcs_base_config.txt');
    });
  });

  describe('getVirtualBoxTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getVirtualBoxTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('virtualbox');
    });

    it('should have linked_clone set to false', () => {
      expect(template.linked_clone).toBe(false);
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('vbox_guest');
    });

    it('should have console_type none', () => {
      expect(template.console_type).toBe('none');
    });
  });

  describe('getCloudNodeTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getCloudNodeTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('cloud');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('cloud');
    });

    it('should have default_name_format Cloud{0}', () => {
      expect(template.default_name_format).toBe('Cloud{0}');
    });

    it('should have empty ports_mapping', () => {
      expect(template.ports_mapping).toEqual([]);
    });
  });

  describe('getEthernetHubTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getEthernetHubTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('ethernet_hub');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('switch');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('hub');
    });

    it('should have default_name_format Hub{0}', () => {
      expect(template.default_name_format).toBe('Hub{0}');
    });
  });

  describe('getEthernetSwitchTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getEthernetSwitchTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('ethernet_switch');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('switch');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('ethernet_switch');
    });

    it('should have default_name_format Switch{0}', () => {
      expect(template.default_name_format).toBe('Switch{0}');
    });

    it('should have telnet console type', () => {
      expect(template.console_type).toBe('telnet');
    });
  });

  describe('getIosTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getIosTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('dynamips');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('router');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('router');
    });

    it('should have auto_delete_disks enabled', () => {
      expect(template.auto_delete_disks).toBe(true);
    });

    it('should have mmap enabled', () => {
      expect(template.mmap).toBe(true);
    });

    it('should have sparsemem enabled', () => {
      expect(template.sparsemem).toBe(true);
    });

    it('should have default startup_config', () => {
      expect(template.startup_config).toBe('ios_base_startup-config.txt');
    });

    it('should have system_id', () => {
      expect(template.system_id).toBe('FTX0945W0MY');
    });
  });

  describe('getVmwareTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getVmwareTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('vmware');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('guest');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('vmware_guest');
    });

    it('should have linked_clone set to false', () => {
      expect(template.linked_clone).toBe(false);
    });
  });

  describe('getDockerTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getDockerTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('docker');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('guest');
    });

    it('should have compute_id vm', () => {
      expect(template.compute_id).toBe('vm');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('docker_guest');
    });

    it('should have default console settings', () => {
      expect(template.console_http_port).toBe(80);
      expect(template.console_http_path).toBe('/');
      expect(template.console_resolution).toBe('1024x768');
    });
  });

  describe('getIouTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await firstValueFrom(service.getIouTemplate());
    });

    it('should have correct template_type', () => {
      expect(template.template_type).toBe('iou');
    });

    it('should have correct category', () => {
      expect(template.category).toBe('switch');
    });

    it('should have compute_id vm', () => {
      expect(template.compute_id).toBe('vm');
    });

    it('should have correct symbol', () => {
      expect(template.symbol).toBe('multilayer_switch');
    });

    it('should have ethernet_adapters', () => {
      expect(template.ethernet_adapters).toBe(1);
    });

    it('should have l1_keepalives disabled', () => {
      expect(template.l1_keepalives).toBe(false);
    });

    it('should have use_default_iou_values enabled', () => {
      expect(template.use_default_iou_values).toBe(true);
    });

    it('should have default startup_config', () => {
      expect(template.startup_config).toBe('iou_l2_base_startup-config.txt');
    });
  });

  describe('list', () => {
    it('should return an Observable', () => {
      const result = service.list();
      expect(result).toBeTruthy();
    });

    it('should return empty array', async () => {
      const templates = await firstValueFrom(service.list());
      expect(templates).toEqual([]);
    });
  });
});
