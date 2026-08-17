import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NewTemplateDialogComponent } from './new-template-dialog.component';
import { Appliance, Image, Version } from '@models/appliance';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { ApplianceService } from '@services/appliances.service';
import { ControllerService } from '@services/controller.service';
import { DockerService } from '@services/docker.service';
import { IosService } from '@services/ios.service';
import { IouService } from '@services/iou.service';
import { QemuService } from '@services/qemu.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from '../../../common/progress/progress.service';
import { UploadServiceService } from '../../../common/uploading-processbar/upload-service.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NewTemplateDialogComponent', () => {
  let component: NewTemplateDialogComponent;
  let fixture: ComponentFixture<NewTemplateDialogComponent>;
  let mockApplianceService: any;
  let mockTemplateService: any;
  let mockQemuService: any;
  let mockIosService: any;
  let mockIouService: any;
  let mockDockerService: any;
  let mockToasterService: any;
  let mockProgressService: any;
  let mockUploadServiceService: any;
  let mockDialog: any;
  let mockSnackBar: any;
  let mockRouter: any;
  let mockRoute: any;
  let mockControllerService: any;

  const mockController: Controller = {
    id: 1,
    authToken: 'test-token',
    name: 'Test Controller',
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
  } as Controller;

  const createMockAppliance = (): Appliance =>
    ({
      name: 'Test Appliance',
      registry_id: 'test-registry',
      symbol: 'test-symbol',
      category: 'router',
      vendor_name: 'Test Vendor',
      emulator: 'Qemu',
      images: [
        {
          filename: 'test-image.img',
          md5sum: 'abc123',
          filesize: 1000000,
          download_url: 'http://test.com/image.img',
          direct_download_url: 'http://test.com/image.img',
          checksum: 'abc123',
          version: '1.0',
        } as Image,
      ],
      qemu: {
        ram: 512,
        adapters: 1,
        adapter_type: 'e1000',
        boot_priority: 'c',
        console_type: 'vnc',
        hda_disk_interface: 'ide',
        hdb_disk_interface: 'ide',
        hdc_disk_interface: 'ide',
        hdd_disk_interface: 'ide',
        arch: 'x86_64',
        kvm: '',
      },
      usage: 'Test usage',
      default_name_format: '{name}-{0}',
      first_port_name: 'eth0',
      port_name_format: 'eth{0}',
      port_segment_size: 32,
      availability: '',
      builtin: false,
      description: '',
      documentation_url: '',
      maintainer: '',
      maintainer_email: '',
      product_name: '',
      product_url: '',
      registry_version: 1,
      status: '',
      vendor_url: '',
      versions: [
        {
          name: '1.0',
          images: { hda_disk_image: 'test-image.img' },
        } as Version,
      ],
    } as unknown as Appliance);

  const createDockerAppliance = (): Appliance =>
    ({
      ...createMockAppliance(),
      name: 'Docker Appliance',
      qemu: null,
      emulator: 'Docker',
      custom_adapters: [{ adapter_number: 0, adapter_type: 'e1000', port_name: 'mgmt0' }],
      docker: {
        adapters: 1,
        console_type: 'telnet',
        image: 'ubuntu:latest',
        start_command: '/sbin/init',
        environment: 'TERM=xterm',
        extra_hosts: 'router:192.0.2.1',
        extra_volumes: ['/etc/network'],
        extra_configs: [{ target: '/etc/gns3/startup.cfg', content: 'hostname docker-node' }],
        mac_address: '02:42:ac:11:00:02',
        cpus: 2,
        mem_limit: 1024,
        console_http_path: '/console',
        console_http_port: 8080,
        console_resolution: '1920x1080',
      },
    } as unknown as Appliance);

  const createDynamipsAppliance = (): Appliance =>
    ({
      ...createMockAppliance(),
      name: 'IOS Appliance',
      qemu: null,
      emulator: 'Dynamips',
      dynamips: {
        chassis: 'c3600',
        nvram: 128,
        platform: 'c3600',
        ram: 192,
        slot0: '',
        slot1: '',
        slot2: '',
        slot3: '',
        slot4: '',
        slot5: '',
        slot6: '',
        slot7: '',
        startup_config: '',
      },
    } as unknown as Appliance);

  const mockTemplate: Template = {
    template_id: 'tmpl1',
    name: 'Test Template',
    template_type: 'qemu',
  } as Template;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockDialogRefForOpen = {
      close: vi.fn(),
      componentInstance: {
        appliance: null as Appliance,
        confirmationMessage: '',
        controller: mockController,
      },
      afterClosed: vi.fn().mockReturnValue(of(null)),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(String(mockController.id)),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockApplianceService = {
      getAppliances: vi.fn().mockReturnValue(of([createMockAppliance()])),
      updateAppliances: vi.fn().mockReturnValue(of([createMockAppliance()])),
      getAppliance: vi.fn().mockReturnValue(of(createMockAppliance())),
      getUploadPath: vi.fn().mockReturnValue('http://test.com/upload'),
    };

    mockTemplateService = {
      list: vi.fn().mockReturnValue(of([mockTemplate])),
      newTemplateCreated: new Subject<Template>(),
    };

    mockQemuService = {
      getImages: vi.fn().mockReturnValue(of([])),
      addTemplate: vi.fn().mockReturnValue(of(mockTemplate)),
    };

    mockIosService = {
      getImages: vi.fn().mockReturnValue(of([])),
      addTemplate: vi.fn().mockReturnValue(of(mockTemplate)),
    };

    mockIouService = {
      getImages: vi.fn().mockReturnValue(of([])),
      addTemplate: vi.fn().mockReturnValue(of(mockTemplate)),
    };

    mockDockerService = {
      addTemplate: vi.fn().mockReturnValue(of(mockTemplate)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
    };

    mockUploadServiceService = {
      processBarCount: vi.fn(),
      currentCancelItemDetails: of(false),
      cancelFileUploading: vi.fn(),
      setMessage: vi.fn(),
      setComputing: vi.fn(),
      currentMessage: of(''),
      currentComputing: of(false),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRefForOpen),
    };

    mockSnackBar = {
      openFromComponent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NewTemplateDialogComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ApplianceService, useValue: mockApplianceService },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: QemuService, useValue: mockQemuService },
        { provide: IosService, useValue: mockIosService },
        { provide: IouService, useValue: mockIouService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: UploadServiceService, useValue: mockUploadServiceService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewTemplateDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    // The standalone component imports MatDialogModule, so the MatDialog mock
    // must be assigned directly (TestBed providers lose against the module).
    component.dialog = mockDialog as unknown as MatDialog;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default action set to install', () => {
      expect(component.action()).toBe('install');
    });

    it('should have default searchText as empty string', () => {
      expect(component.searchText()).toBe('');
    });

    it('should have default filters set to all', () => {
      expect(component.category()).toBe('all');
      expect(component.emulator()).toBe('all');
      expect(component.vendor()).toBe('all');
    });

    it('should start on the first step', () => {
      expect(component.selectedStepIndex()).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should load appliances from service', () => {
      expect(mockApplianceService.getAppliances).toHaveBeenCalledWith(mockController);
    });

    it('should load qemu images from service', () => {
      expect(mockQemuService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should load ios images from service', () => {
      expect(mockIosService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should load iou images from service', () => {
      expect(mockIouService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should mark appliances as loaded', () => {
      expect(component.isLoadingAppliances()).toBe(false);
    });

    it('should populate appliances', () => {
      expect(component.allAppliances().length).toBe(1);
      expect(component.allAppliances()[0].name).toBe('Test Appliance');
    });
  });

  describe('setAction', () => {
    it('should set action to import', () => {
      component.setAction('import');
      expect(component.action()).toBe('import');
    });

    it('should set action to install', () => {
      component.setAction('import');
      component.setAction('install');
      expect(component.action()).toBe('install');
    });

    it('should clear the selected appliance when switching methods', () => {
      component.selectAppliance(createMockAppliance());
      component.setAction('import');
      expect(component.applianceToInstall()).toBeNull();
    });

    it('should update the browse step title', () => {
      expect(component.browseStepTitle()).toBe('Choose appliance');
      component.setAction('import');
      expect(component.browseStepTitle()).toBe('Import appliance');
    });
  });

  describe('filteredAppliances', () => {
    beforeEach(() => {
      component.allAppliances.set([
        { ...createMockAppliance(), name: 'Router1', category: 'router', emulator: 'Qemu', vendor_name: 'Cisco' },
        {
          ...createMockAppliance(),
          name: 'Switch1',
          category: 'multilayer_switch',
          emulator: 'Dynamips',
          vendor_name: 'Cisco',
        },
        { ...createMockAppliance(), name: 'Firewall1', category: 'firewall', emulator: 'Docker', vendor_name: 'Ubuntu' },
      ]);
    });

    it('should filter appliances by search text', () => {
      component.searchText.set('Router');
      expect(component.filteredAppliances().length).toBe(1);
      expect(component.filteredAppliances()[0].name).toBe('Router1');
    });

    it('should filter appliances by category', () => {
      component.category.set('router');
      expect(component.filteredAppliances().length).toBe(1);
      expect(component.filteredAppliances()[0].category).toBe('router');
    });

    it('should filter appliances by emulator', () => {
      component.emulator.set('Docker');
      expect(component.filteredAppliances().length).toBe(1);
      expect(component.filteredAppliances()[0].name).toBe('Firewall1');
    });

    it('should filter appliances by vendor', () => {
      component.vendor.set('Cisco');
      expect(component.filteredAppliances().length).toBe(2);
    });

    it('should filter by both search text and category', () => {
      component.searchText.set('Router');
      component.category.set('router');
      expect(component.filteredAppliances().length).toBe(1);
    });

    it('should return all appliances when filters are all', () => {
      expect(component.filteredAppliances().length).toBe(3);
    });

    it('should sort appliances by name ascending by default', () => {
      const names = component.filteredAppliances().map((a) => a.name);
      expect(names).toEqual(['Firewall1', 'Router1', 'Switch1']);
    });

    it('should sort appliances by name descending when toggled', () => {
      component.toggleSortDirection();
      const names = component.filteredAppliances().map((a) => a.name);
      expect(names).toEqual(['Switch1', 'Router1', 'Firewall1']);
    });

    it('should sort appliances by vendor', () => {
      component.sortBy.set('vendor');
      const vendors = component.filteredAppliances().map((a) => a.vendor_name);
      expect(vendors).toEqual(['Cisco', 'Cisco', 'Ubuntu']);
    });

    it('should sort appliances by emulator', () => {
      component.sortBy.set('emulator');
      const emulators = component.filteredAppliances().map((a) => a.emulator);
      expect(emulators).toEqual(['Docker', 'Dynamips', 'Qemu']);
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      const appliances: Appliance[] = [];
      for (let i = 1; i <= 10; i++) {
        appliances.push({ ...createMockAppliance(), name: `Appliance ${i}` });
      }
      component.allAppliances.set(appliances);
    });

    it('should paginate appliances with the default page size', () => {
      expect(component.pageSize()).toBe(5);
      expect(component.pagedAppliances().length).toBe(5);
    });

    it('should return the second page', () => {
      component.pageIndex.set(1);
      expect(component.pagedAppliances().length).toBe(5);
    });

    it('should update page index and size on page event', () => {
      component.onPage({ pageIndex: 1, pageSize: 4, length: 10 } as any);
      expect(component.pageIndex()).toBe(1);
      expect(component.pageSize()).toBe(4);
      expect(component.pagedAppliances().length).toBe(4);
    });

    it('should reset the page index when filters change', () => {
      component.pageIndex.set(1);
      component.searchText.set('Appliance');
      fixture.detectChanges();
      expect(component.pageIndex()).toBe(0);
    });
  });

  describe('selectAppliance', () => {
    it('should set applianceToInstall', () => {
      const appliance = createMockAppliance();
      component.selectAppliance(appliance);
      expect(component.applianceToInstall()).toBe(appliance);
    });

    it('should prefill the template name with the appliance name', () => {
      component.selectAppliance(createMockAppliance());
      expect(component.templateNameControl.value).toBe('Test Appliance');
    });

    it('should reset version and image selections', () => {
      component.selectedVersion.set(createMockAppliance().versions[0]);
      component.selectedImage.set('test-image.img');
      component.selectAppliance(createMockAppliance());
      expect(component.selectedVersion()).toBeNull();
      expect(component.selectedImage()).toBeNull();
    });
  });

  describe('requiresImages and lastStepIndex', () => {
    it('should not require images without a selected appliance', () => {
      expect(component.requiresImages()).toBe(false);
    });

    it('should require images for qemu appliances', () => {
      component.applianceToInstall.set(createMockAppliance());
      expect(component.requiresImages()).toBe(true);
      expect(component.lastStepIndex()).toBe(3);
    });

    it('should not require images for docker appliances', () => {
      component.applianceToInstall.set(createDockerAppliance());
      expect(component.requiresImages()).toBe(false);
      expect(component.lastStepIndex()).toBe(2);
    });
  });

  describe('canAdvance', () => {
    it('should always allow advancing from the method step', () => {
      component.selectedStepIndex.set(0);
      expect(component.canAdvance()).toBe(true);
    });

    it('should require an appliance on the browse step', () => {
      component.selectedStepIndex.set(1);
      expect(component.canAdvance()).toBe(false);
      component.applianceToInstall.set(createMockAppliance());
      expect(component.canAdvance()).toBe(true);
    });

    it('should require ready files on the files step', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.selectedStepIndex.set(2);
      expect(component.canAdvance()).toBe(false);
    });

    it('should require a valid name on the review step for docker appliances', () => {
      component.applianceToInstall.set(createDockerAppliance());
      component.selectedStepIndex.set(2);
      component.nameValid.set(false);
      expect(component.canAdvance()).toBe(false);
      component.nameValid.set(true);
      expect(component.canAdvance()).toBe(true);
    });
  });

  describe('checkImageFromVersion', () => {
    it('should return false when no appliance is selected', () => {
      expect(component.checkImageFromVersion('test-image.img')).toBe(false);
    });

    it('should return false when no matching image found', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.qemuImages.set([]);
      expect(component.checkImageFromVersion('test-image.img')).toBe(false);
    });

    it('should return true when the checksum matches a controller image', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      expect(component.checkImageFromVersion('test-image.img')).toBe(true);
    });
  });

  describe('version helpers', () => {
    it('should list the images of a version in a stable order', () => {
      const version = {
        name: '1.0',
        images: { cdrom_image: 'c.iso', hda_disk_image: 'a.img', bios_image: 'b.bin' },
      } as Version;
      const images = component.getVersionImages(version);
      expect(images.map((i) => i.key)).toEqual(['bios_image', 'hda_disk_image', 'cdrom_image']);
    });

    it('should count the images of a version', () => {
      const version = { name: '1.0', images: { hda_disk_image: 'a.img', cdrom_image: 'c.iso' } } as Version;
      expect(component.getVersionImageCount(version)).toBe(2);
    });

    it('should count the ready images of a version', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      const version = component.applianceToInstall().versions[0];
      expect(component.getVersionReadyCount(version)).toBe(1);
    });

    it('should detect a complete version', () => {
      component.applianceToInstall.set(createMockAppliance());
      const version = component.applianceToInstall().versions[0];
      expect(component.isVersionComplete(version)).toBe(false);
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      expect(component.isVersionComplete(version)).toBe(true);
    });
  });

  describe('auto-selection effect', () => {
    it('should auto-select the first complete version for qemu appliances', () => {
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(createMockAppliance());
      fixture.detectChanges();
      expect(component.selectedVersion()?.name).toBe('1.0');
    });

    it('should auto-select the first ready image for dynamips appliances', () => {
      component.iosImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(createDynamipsAppliance());
      fixture.detectChanges();
      expect(component.selectedImage()).toBe('test-image.img');
    });

    it('should mark files as ready when a complete version is selected', () => {
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(createMockAppliance());
      fixture.detectChanges();
      expect(component.filesReady()).toBe(true);
    });
  });

  describe('getCategory', () => {
    it('should return switch for multilayer_switch category', () => {
      component.applianceToInstall.set({ ...createMockAppliance(), category: 'multilayer_switch' });
      expect(component.getCategory()).toBe('switch');
    });

    it('should return the category when not multilayer_switch', () => {
      component.applianceToInstall.set({ ...createMockAppliance(), category: 'router' });
      expect(component.getCategory()).toBe('router');
    });
  });

  describe('findControllerImageName', () => {
    it('should return original image name when no matching checksum found', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.qemuImages.set([]);
      expect(component.findControllerImageName('test-image.img')).toBe('test-image.img');
    });

    it('should return controller image name when checksum matches', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.qemuImages.set([{ filename: 'controller-image.img', checksum: 'abc123' } as Image]);
      expect(component.findControllerImageName('test-image.img')).toBe('controller-image.img');
    });

    it('should return original name when image_name is null', () => {
      expect(component.findControllerImageName(null as any)).toBeNull();
    });
  });

  describe('updateAppliances', () => {
    it('should call updateAppliances service', () => {
      component.updateAppliances();
      expect(mockApplianceService.updateAppliances).toHaveBeenCalledWith(mockController);
    });

    it('should activate progress service', () => {
      component.updateAppliances();
      expect(mockProgressService.activate).toHaveBeenCalled();
    });

    it('should show a success toast and deactivate progress', () => {
      component.updateAppliances();
      expect(mockProgressService.deactivate).toHaveBeenCalled();
      expect(mockToasterService.success).toHaveBeenCalledWith('Appliances are up-to-date.');
    });

    it('should show error toast when updateAppliances fails', () => {
      mockApplianceService.updateAppliances.mockReturnValue(throwError(() => new Error('Update failed')));
      component.updateAppliances();
      expect(mockProgressService.deactivate).toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Update failed');
      expect(component.isUpdatingAppliances()).toBe(false);
    });
  });

  describe('refreshImages', () => {
    it('should refresh qemu images', () => {
      mockQemuService.getImages.mockClear();
      component.refreshImages();
      expect(mockQemuService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should refresh ios images', () => {
      mockIosService.getImages.mockClear();
      component.refreshImages();
      expect(mockIosService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should refresh iou images', () => {
      mockIouService.getImages.mockClear();
      component.refreshImages();
      expect(mockIouService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should handle refreshImages errors gracefully', () => {
      mockQemuService.getImages.mockReturnValue(throwError(() => new Error('QEMU images failed')));
      component.refreshImages();
      expect(mockToasterService.error).toHaveBeenCalledWith('QEMU images failed');
    });
  });

  describe('onStepChange', () => {
    it('should update the selected step index', () => {
      component.onStepChange({ selectedIndex: 1 } as any);
      expect(component.selectedStepIndex()).toBe(1);
    });

    it('should refresh images automatically when entering the files step', () => {
      component.applianceToInstall.set(createMockAppliance());
      mockQemuService.getImages.mockClear();
      component.onStepChange({ selectedIndex: 2 } as any);
      expect(mockQemuService.getImages).toHaveBeenCalled();
    });

    it('should not refresh images on the files step for docker appliances', () => {
      component.applianceToInstall.set(createDockerAppliance());
      mockQemuService.getImages.mockClear();
      component.onStepChange({ selectedIndex: 2 } as any);
      expect(mockQemuService.getImages).not.toHaveBeenCalled();
    });
  });

  describe('onCloseClick', () => {
    it('should navigate back to the Templates page', () => {
      component.onCloseClick();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', mockController.id, 'preferences']);
    });
  });

  describe('goBack', () => {
    it('should navigate back to the Templates page using the loaded controller', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', mockController.id, 'preferences']);
    });

    it('should fall back to the route controller id when no controller is set', () => {
      component.controller = undefined;
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', mockController.id, 'preferences']);
    });
  });

  describe('showInfo', () => {
    it('should open the appliance info dialog', () => {
      component.showInfo(createMockAppliance());
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('addAppliance', () => {
    it('should parse the appliance file and set the appliance to install', async () => {
      const appliance = createMockAppliance();
      const file = new File([JSON.stringify(appliance)], 'appliance.gns3a', { type: 'application/json' });

      component.addAppliance({ target: { files: [file] } });

      // Wait for the FileReader onloadend callback to run. Fake timers are
      // active globally, so advance them (async version also flushes the
      // real async FileReader events between timer ticks).
      await vi.advanceTimersByTimeAsync(100);

      expect(component.applianceToInstall()?.name).toBe(appliance.name);
      expect(component.isImportingAppliance()).toBe(false);
      expect(mockToasterService.success).toHaveBeenCalledWith('Appliance imported successfully');
    });

    it('should pre-fill the template name from the imported appliance', async () => {
      const appliance = createMockAppliance();
      const file = new File([JSON.stringify(appliance)], 'appliance.gns3a', { type: 'application/json' });

      component.addAppliance({ target: { files: [file] } });
      await vi.advanceTimersByTimeAsync(100);

      expect(component.templateNameControl.value).toBe(appliance.name);
    });

    it('should show an error when the file is not valid JSON', async () => {
      const file = new File(['not a json'], 'appliance.gns3a', { type: 'application/octet-stream' });

      component.addAppliance({ target: { files: [file] } });
      await vi.advanceTimersByTimeAsync(100);

      expect(component.applianceToInstall()).toBeFalsy();
      expect(component.isImportingAppliance()).toBe(false);
      expect(mockToasterService.error).toHaveBeenCalledWith("'appliance.gns3a' is not a valid appliance file");
    });

    it('should show an error when the appliance has no supported emulator section', async () => {
      const appliance = { name: 'Broken Appliance' };
      const file = new File([JSON.stringify(appliance)], 'appliance.gns3a', { type: 'application/json' });

      component.addAppliance({ target: { files: [file] } });
      await vi.advanceTimersByTimeAsync(100);

      expect(component.applianceToInstall()).toBeFalsy();
      expect(component.isImportingAppliance()).toBe(false);
      expect(mockToasterService.error).toHaveBeenCalledWith('Template type not supported');
    });

    it('should do nothing when no file is selected', () => {
      component.addAppliance({ target: { files: [] } });

      expect(component.applianceToInstall()).toBeFalsy();
      expect(component.isImportingAppliance()).toBe(false);
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should show an error when the controller is not loaded yet', () => {
      component.controller = undefined;
      const file = new File(['{}'], 'appliance.gns3a', { type: 'application/octet-stream' });

      component.addAppliance({ target: { files: [file] } });

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Controller is not loaded yet. Please try again.'
      );
    });
  });

  describe('cancelUploading', () => {
    it('should clear uploaderImage queue', () => {
      component.cancelUploading();
      expect(mockUploadServiceService.processBarCount).toHaveBeenCalledWith(null);
    });

    it('should show warning toast', () => {
      component.cancelUploading();
      expect(mockToasterService.warning).toHaveBeenCalledWith('File upload cancelled');
    });

    it('should call cancelFileUploading', () => {
      component.cancelUploading();
      expect(mockUploadServiceService.cancelFileUploading).toHaveBeenCalledWith(false);
    });

    it('should clear the phase message on cancel', () => {
      component.cancelUploading();
      expect(mockUploadServiceService.setMessage).toHaveBeenCalledWith('');
    });

    it('should clear the computing flag on cancel', () => {
      component.cancelUploading();
      expect(mockUploadServiceService.setComputing).toHaveBeenCalledWith(false);
    });
  });

  describe('downloadImage', () => {
    it('should open window with direct_download_url when available and no compression', () => {
      const image = {
        direct_download_url: 'http://test.com/image.img',
        compression: null,
      } as Image;

      const windowOpen = vi.spyOn(window, 'open');
      component.downloadImage(image);

      expect(windowOpen).toHaveBeenCalledWith('http://test.com/image.img');
    });

    it('should call openConfirmationDialog when image has compression', () => {
      const image = {
        direct_download_url: 'http://test.com/image.img',
        compression: 'zip',
        download_url: 'http://test.com/image.img',
      } as Image;

      component.downloadImage(image);
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should call openConfirmationDialog when no direct_download_url', () => {
      const image = {
        download_url: 'http://test.com/image.img',
      } as Image;

      component.downloadImage(image);
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('downloadImageFromVersion', () => {
    it('should call downloadImage for matching image', () => {
      component.applianceToInstall.set(createMockAppliance());
      const downloadImageSpy = vi.spyOn(component, 'downloadImage');
      component.downloadImageFromVersion('test-image.img');
      expect(downloadImageSpy).toHaveBeenCalled();
    });
  });

  describe('openSnackBar', () => {
    it('should open snack bar with UploadingProcessbarComponent', () => {
      component.openSnackBar();
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled();
    });

    it('should pass panelClass and data to snackbar', () => {
      component.openSnackBar();
      expect(mockSnackBar.openFromComponent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          panelClass: 'uplaoding-file-snackabar',
          data: { upload_file_type: 'Image' },
        })
      );
    });
  });

  describe('refreshImagesUntilReady', () => {
    it('should stop polling once the uploaded image checksum is available', () => {
      mockQemuService.getImages.mockReturnValue(of([{ checksum: 'abc123' }]));
      component.applianceToInstall.set(createMockAppliance());
      mockQemuService.getImages.mockClear(); // ignore the initial load triggered by ngOnInit

      (component as any).refreshImagesUntilReady('test-image.img');

      expect(mockQemuService.getImages).toHaveBeenCalledTimes(1);
      expect(component.checkImageFromVersion('test-image.img')).toBe(true);
    });

    it('should retry until the checksum becomes available', async () => {
      let callCount = 0;
      mockQemuService.getImages.mockImplementation(() => {
        callCount++;
        return of(callCount === 1 ? [] : [{ checksum: 'abc123' }]);
      });
      component.applianceToInstall.set(createMockAppliance());
      mockQemuService.getImages.mockClear(); // ignore the initial load triggered by ngOnInit

      (component as any).refreshImagesUntilReady('test-image.img');
      await vi.runAllTimersAsync();

      expect(mockQemuService.getImages).toHaveBeenCalledTimes(2);
      expect(component.checkImageFromVersion('test-image.img')).toBe(true);
    });
  });

  describe('createTemplate', () => {
    beforeEach(async () => {
      component.templateNameControl.setValue('Brand new template');
      await vi.advanceTimersByTimeAsync(600);
    });

    it('should show an error when no appliance is selected', () => {
      component.applianceToInstall.set(null);
      component.createTemplate();
      expect(mockToasterService.error).toHaveBeenCalledWith('Please select an appliance first');
    });

    it('should create a qemu template from the selected version', () => {
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(createMockAppliance());
      fixture.detectChanges();

      component.createTemplate();

      expect(mockQemuService.addTemplate).toHaveBeenCalled();
      const template = mockQemuService.addTemplate.mock.calls[0][1];
      expect(template.name).toBe('Brand new template');
      expect(template.template_type).toBe('qemu');
      expect(template.hda_disk_image).toBe('test-image.img');
    });

    it('should emit newTemplateCreated, toast and close on success', () => {
      component.qemuImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(createMockAppliance());
      fixture.detectChanges();
      const emitted: Template[] = [];
      mockTemplateService.newTemplateCreated.subscribe((t: Template) => emitted.push(t));

      component.createTemplate();

      expect(emitted.length).toBe(1);
      expect(mockToasterService.success).toHaveBeenCalledWith('Template added');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', mockController.id, 'preferences']);
    });

    it('should show an error when the qemu version is not complete', () => {
      component.qemuImages.set([]);
      component.applianceToInstall.set(createMockAppliance());
      component.selectedVersion.set(createMockAppliance().versions[0]);

      component.createTemplate();

      expect(mockQemuService.addTemplate).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Please select a version with all required images');
    });

    it('should create a dynamips template from the selected image', () => {
      component.iosImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(createDynamipsAppliance());
      fixture.detectChanges();

      component.createTemplate();

      expect(mockIosService.addTemplate).toHaveBeenCalled();
      const template = mockIosService.addTemplate.mock.calls[0][1];
      expect(template.name).toBe('Brand new template');
      expect(template.template_type).toBe('dynamips');
      expect(template.image).toBe('test-image.img');
    });

    it('should create an iou template from the selected image', () => {
      const iouAppliance = {
        ...createDynamipsAppliance(),
        name: 'IOU Appliance',
        dynamips: null,
        emulator: 'Iou',
        iou: { ethernet_adapters: 2, nvram: 128, ram: 256, serial_adapters: 0, startup_config: '' },
      } as unknown as Appliance;
      component.iouImages.set([{ filename: 'test-image.img', checksum: 'abc123' } as Image]);
      component.applianceToInstall.set(iouAppliance);
      fixture.detectChanges();

      component.createTemplate();

      expect(mockIouService.addTemplate).toHaveBeenCalled();
      const template = mockIouService.addTemplate.mock.calls[0][1];
      expect(template.name).toBe('Brand new template');
      expect(template.template_type).toBe('iou');
      expect(template.path).toBe('test-image.img');
    });

    it('should create a docker template without requiring images', () => {
      component.applianceToInstall.set(createDockerAppliance());
      fixture.detectChanges();

      component.createTemplate();

      expect(mockDockerService.addTemplate).toHaveBeenCalled();
      const template = mockDockerService.addTemplate.mock.calls[0][1];
      expect(template.name).toBe('Brand new template');
      expect(template.template_type).toBe('docker');
      expect(template.image).toBe('ubuntu:latest');
      expect(template.start_command).toBe('/sbin/init');
      expect(template.environment).toBe('TERM=xterm');
      expect(template.extra_hosts).toBe('router:192.0.2.1');
      expect(template.extra_volumes).toEqual(['/etc/network']);
      expect(template.extra_configs).toEqual([
        { target: '/etc/gns3/startup.cfg', content: 'hostname docker-node' },
      ]);
      expect(template.custom_adapters).toEqual([
        { adapter_number: 0, adapter_type: 'e1000', port_name: 'mgmt0' },
      ]);
      expect(template.mac_address).toBe('02:42:ac:11:00:02');
      expect(template.cpus).toBe(2);
      expect(template.memory).toBe(1024);
      expect(template.console_http_path).toBe('/console');
      expect(template.console_http_port).toBe(8080);
      expect(template.console_resolution).toBe('1920x1080');
      expect(template.usage).toBe('Test usage');
    });

    it('should show error toast when template creation fails', () => {
      mockDockerService.addTemplate.mockReturnValue(throwError(() => new Error('Failed to add template')));
      component.applianceToInstall.set(createDockerAppliance());
      fixture.detectChanges();

      component.createTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to add template');
      expect(component.isCreating()).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('formatting helpers', () => {
    it('should format labels', () => {
      expect(component.formatLabel('multilayer_switch')).toBe('Multilayer Switch');
    });

    it('should map emulators to icons', () => {
      expect(component.emulatorIcon({ emulator: 'Docker' } as Appliance)).toBe('deployed_code');
      expect(component.emulatorIcon({ emulator: 'Qemu' } as Appliance)).toBe('desktop_windows');
      expect(component.emulatorIcon({ emulator: 'Dynamips' } as Appliance)).toBe('router');
      expect(component.emulatorIcon({ emulator: 'Iou' } as Appliance)).toBe('hub');
      expect(component.emulatorIcon({} as Appliance)).toBe('dns');
    });

    it('should return the selected version image names', () => {
      component.applianceToInstall.set(createMockAppliance());
      component.selectedVersion.set(createMockAppliance().versions[0]);
      expect(component.getSelectedVersionImageNames()).toBe('test-image.img');
    });
  });

  describe('template rendering', () => {
    it('should render the wizard page shell with the shared template-wizard classes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.template-wizard.new-template-wizard')).toBeTruthy();
      expect(compiled.querySelector('.template-wizard__back')).toBeTruthy();
      expect(compiled.querySelector('.template-wizard__stepper')).toBeTruthy();
      expect(compiled.querySelector('.template-wizard__actions')).toBeTruthy();
    });

    it('should render step labels with icons, titles and descriptions', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.template-wizard__step-label').length).toBeGreaterThanOrEqual(3);
      expect(compiled.querySelectorAll('.template-wizard__step-label-title').length).toBeGreaterThanOrEqual(3);
      expect(compiled.querySelectorAll('.template-wizard__step-label-description').length).toBeGreaterThanOrEqual(3);
    });

    it('should render both creation method options', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('.new-template-wizard__method-option');
      expect(options.length).toBe(2);
      expect(options[0].textContent).toContain('Install new appliance from the GNS controller');
      expect(options[1].textContent).toContain('Import an appliance file');
    });

    it('should render the appliance list with a row per appliance', () => {
      component.stepper().selectedIndex = 1;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('.new-template-wizard__appliance');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('Test Appliance');
    });
  });
});
