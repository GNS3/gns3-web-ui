import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, firstValueFrom } from 'rxjs';
import { AddIosTemplateComponent } from './add-ios-template.component';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { IosService } from '@services/ios.service';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { ProgressService } from 'app/common/progress/progress.service';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { IosImage } from '@models/images/ios-image';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddIosTemplateComponent', () => {
  let component: AddIosTemplateComponent;
  let fixture: ComponentFixture<AddIosTemplateComponent>;

  let mockControllerService: any;
  let mockIosService: any;
  let mockIosConfigurationService: any;
  let mockTemplateMocksService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockUploadServiceService: any;
  let mockProgressService: any;
  let mockMatSnackBar: any;
  let mockComputeService: any;

  let mockController: Controller;
  let mockIosTemplate: IosTemplate;
  let mockIosImages: IosImage[];

  const createMockIosTemplate = (): IosTemplate => ({
    auto_delete_disks: false,
    builtin: false,
    category: 'router',
    compute_id: 'local',
    console_auto_start: false,
    console_type: 'telnet',
    aux_type: '',
    default_name_format: '{name}',
    disk0: 0,
    disk1: 0,
    exec_area: 64,
    idlemax: 0,
    idlepc: '',
    idlesleep: 30,
    image: '',
    iomem: undefined,
    mac_addr: '',
    mmap: true,
    name: '',
    nvram: 256,
    platform: '',
    private_config: '',
    ram: 256,
    slot0: undefined,
    slot1: undefined,
    slot2: undefined,
    slot3: undefined,
    slot4: undefined,
    slot5: undefined,
    slot6: undefined,
    slot7: undefined,
    sparsemem: true,
    startup_config: '',
    symbol: 'router',
    system_id: '',
    template_id: '',
    template_type: 'iou',
    usage: '',
    tags: [],
  });

  beforeEach(async () => {
    mockController = {
      id: 1,
      authToken: 'test-token',
      name: 'Test Controller',
      location: 'local' as const,
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running' as const,
      protocol: 'http:' as const,
      username: 'admin',
      password: 'admin',
      tokenExpired: false,
    };

    mockIosTemplate = createMockIosTemplate();

    mockIosImages = [
      { filename: 'c3725-advipservicesk9-mz.124-15.T14.bin', filesize: 123456, md5sum: 'abc123', path: '/images/' },
      { filename: 'c7200-adventerprisek9-mz.152-4.M7.bin', filesize: 234567, md5sum: 'def456', path: '/images/' },
    ];

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockIosService = {
      getImages: vi.fn().mockReturnValue(of(mockIosImages)),
      getImagePath: vi.fn().mockReturnValue('/upload/path'),
      addTemplate: vi.fn().mockReturnValue(of(mockIosTemplate)),
      findIdlePC: vi.fn().mockReturnValue(of({ idlepc: '0x60487000' })),
    };

    mockIosConfigurationService = {
      getAvailablePlatforms: vi.fn().mockReturnValue(['c1700', 'c2600', 'c2691', 'c3725', 'c3745', 'c3600', 'c7200']),
      getPlatformsWithEtherSwitchRouterOption: vi.fn().mockReturnValue({
        c1700: false,
        c2600: true,
        c2691: true,
        c3725: true,
        c3745: true,
        c3600: true,
        c7200: false,
      }),
      getChassis: vi.fn().mockReturnValue({
        c1700: ['1720', '1721', '1750', '1751', '1760'],
        c2600: ['2610', '2611', '2620', '2621', '2610XM', '2611XM', '2620XM', '2621XM', '2650XM', '2651XM'],
        c3600: ['3620', '3640', '3660'],
      }),
      getDefaultRamSettings: vi.fn().mockReturnValue({
        c1700: 160,
        c2600: 160,
        c2691: 192,
        c3600: 192,
        c3725: 128,
        c3745: 256,
        c7200: 512,
      }),
      getAdapterMatrix: vi.fn().mockReturnValue({
        c1700: { '1760': { 0: ['C1700-MB-1FE'] } },
        c2600: { '2620': { 0: ['C2600-MB-1FE'], 1: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'] }, '2651XM': { 0: ['C2600-MB-2FE'], 1: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'] } },
        c3725: { '': { 0: ['GT96100-FE'], 1: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW'], 2: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW'] } },
        c3745: { '': { 0: ['GT96100-FE'], 1: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW'], 2: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW'], 3: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW'] } },
        c3600: { '3620': { 0: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'], 1: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'] }, '3640': { 0: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'], 1: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'], 2: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'], 3: ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'] }, '3660': { 0: ['Leopard-2FE'], 1: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW', 'NM-4T'], 2: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW', 'NM-4T'], 3: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW', 'NM-4T'], 4: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW', 'NM-4T'], 5: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW', 'NM-4T'], 6: ['NM-1FE-TX', 'NM-4E', 'NM-16ESW', 'NM-4T'] } },
        c7200: { '': { 0: ['C7200-IO-FE', 'C7200-IO-2FE', 'C7200-IO-GE-E'], 1: ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'], 2: ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'], 3: ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'], 4: ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'], 5: ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'], 6: ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'] } },
      }),
      getWicMatrix: vi.fn().mockReturnValue({
        c1700: { 0: ['WIC-1T', 'WIC-2T', 'WIC-1ENET'], 1: ['WIC-1T', 'WIC-2T', 'WIC-1ENET'] },
        c2600: { 0: ['WIC-1T', 'WIC-2T'], 1: ['WIC-1T', 'WIC-2T'], 2: ['WIC-1T', 'WIC-2T'] },
      }),
    };

    mockTemplateMocksService = {
      getIosTemplate: vi.fn().mockReturnValue(of(mockIosTemplate)),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    };

    mockUploadServiceService = {
      currentCancelItemDetails: of(false),
      processBarCount: vi.fn(),
    };

    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
    };

    mockMatSnackBar = {
      openFromComponent: vi.fn(),
    };

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [AddIosTemplateComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: IosService, useValue: mockIosService },
        { provide: IosConfigurationService, useValue: mockIosConfigurationService },
        { provide: TemplateMocksService, useValue: mockTemplateMocksService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: UploadServiceService, useValue: mockUploadServiceService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: MatSnackBar, useValue: mockMatSnackBar },
        { provide: ComputeService, useValue: mockComputeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddIosTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize isLocalComputerChosen to true', () => {
      expect(component.isLocalComputerChosen()).toBe(true);
    });

    it('should have empty imageName model signal', () => {
      expect(component.imageName()).toBe('');
    });

    it('should have empty templateName model signal', () => {
      expect(component.templateName()).toBe('');
    });

    it('should have empty platform model signal', () => {
      expect(component.platform()).toBe('');
    });

    it('should have empty chassis model signal', () => {
      expect(component.chassis()).toBe('');
    });

    it('should have empty memory model signal', () => {
      expect(component.memory()).toBe('');
    });

    it('should have empty idlepc model signal', () => {
      expect(component.idlepc()).toBe('');
    });

    it('should have ciscoUrl as constant', () => {
      expect(component.ciscoUrl).toBe('https://cfn.cloudapps.cisco.com/ITDIT/CFN/jsp/SearchBySoftware.jsp');
    });
  });

  describe('ngOnInit', () => {
    it('should extract controller_id from route params', () => {
      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
    });

    it('should fetch controller from ControllerService', () => {
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should set controller signal when fetched', () => {
      expect(component.controller()).toEqual(mockController);
    });

    it('should initialize uploader', () => {
      expect(component.uploader()).toBeDefined();
    });

    it('should configure uploader with onErrorItem callback', () => {
      expect(component.uploader().onErrorItem).toBeDefined();
    });

    it('should configure uploader with onSuccessItem callback', () => {
      expect(component.uploader().onSuccessItem).toBeDefined();
    });

    it('should configure uploader with onProgressItem callback', () => {
      expect(component.uploader().onProgressItem).toBeDefined();
    });

    it('should call getImages after controller loads', () => {
      expect(mockIosService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should load IOS template from mocks service', () => {
      expect(mockTemplateMocksService.getIosTemplate).toHaveBeenCalled();
    });

    it('should set platforms from iosConfigurationService', () => {
      expect(mockIosConfigurationService.getAvailablePlatforms).toHaveBeenCalled();
      expect(component.platforms().length).toBe(7);
    });

    it('should set platformsWithEtherSwitchRouterOption from iosConfigurationService', () => {
      expect(mockIosConfigurationService.getPlatformsWithEtherSwitchRouterOption).toHaveBeenCalled();
      expect(component.platformsWithEtherSwitchRouterOption()['c2600']).toBe(true);
    });

    it('should set chassisOptions from iosConfigurationService', () => {
      expect(mockIosConfigurationService.getChassis).toHaveBeenCalled();
      expect(component.chassisOptions()['c2600']).toBeDefined();
    });

    it('should set defaultRam from iosConfigurationService', () => {
      expect(mockIosConfigurationService.getDefaultRamSettings).toHaveBeenCalled();
      expect(component.defaultRam()['c7200']).toBe(512);
    });

    it('should set adapterMatrix from iosConfigurationService', () => {
      expect(mockIosConfigurationService.getAdapterMatrix).toHaveBeenCalled();
      expect(component.adapterMatrix()['c7200']).toBeDefined();
    });

    it('should set wicMatrix from iosConfigurationService', () => {
      expect(mockIosConfigurationService.getWicMatrix).toHaveBeenCalled();
      expect(component.wicMatrix()['c2600']).toBeDefined();
    });
  });

  describe('Computed signals for step completion', () => {
    it('should have imageStepCompleted return false when imageName is empty', () => {
      component.imageName.set('');
      fixture.detectChanges();
      expect(component.imageStepCompleted()).toBe(false);
    });

    it('should have imageStepCompleted return true when imageName is set', () => {
      component.imageName.set('c3725-advipservicesk9-mz.124-15.T14.bin');
      fixture.detectChanges();
      expect(component.imageStepCompleted()).toBe(true);
    });

    it('should have namePlatformStepCompleted return false when templateName is empty', () => {
      component.templateName.set('');
      component.platform.set('c7200');
      fixture.detectChanges();
      expect(component.namePlatformStepCompleted()).toBe(false);
    });

    it('should have namePlatformStepCompleted return false when platform is empty', () => {
      component.templateName.set('Test Template');
      component.platform.set('');
      fixture.detectChanges();
      expect(component.namePlatformStepCompleted()).toBe(false);
    });

    it('should have namePlatformStepCompleted return true when both templateName and platform are set', () => {
      component.templateName.set('Test Template');
      component.platform.set('c7200');
      fixture.detectChanges();
      expect(component.namePlatformStepCompleted()).toBe(true);
    });

    it('should have memoryStepCompleted return false when memory is empty', () => {
      component.memory.set('');
      fixture.detectChanges();
      expect(component.memoryStepCompleted()).toBe(false);
    });

    it('should have memoryStepCompleted return true when memory is set', () => {
      component.memory.set('512');
      fixture.detectChanges();
      expect(component.memoryStepCompleted()).toBe(true);
    });
  });

  describe('setControllerType', () => {
    it('should set isLocalComputerChosen to true when passed "local"', () => {
      component.setControllerType('local');
      expect(component.isLocalComputerChosen()).toBe(true);
    });
  });

  describe('getImages', () => {
    it('should fetch images from iosService', () => {
      component.getImages();
      fixture.detectChanges();

      expect(mockIosService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should update iosImages signal with fetched images', () => {
      component.getImages();
      fixture.detectChanges();

      expect(component.iosImages().length).toBe(2);
      expect(component.iosImages()[0].filename).toBe('c3725-advipservicesk9-mz.124-15.T14.bin');
    });
  });

  describe('onImageChosen', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set templateName from imageName (first part before dash)', () => {
      component.imageName.set('c3725-advipservicesk9-mz.124-15.T14.bin');
      component.onImageChosen();
      expect(component.templateName()).toBe('c3725');
    });

    it('should set platform to c3600 for c3620 images', () => {
      component.imageName.set('c3620-image.bin');
      component.onImageChosen();
      expect(component.platform()).toBe('c3600');
    });

    it('should set platform to c3600 for c3640 images', () => {
      component.imageName.set('c3640-image.bin');
      component.onImageChosen();
      expect(component.platform()).toBe('c3600');
    });

    it('should set platform to c3600 for c3660 images', () => {
      component.imageName.set('c3660-image.bin');
      component.onImageChosen();
      expect(component.platform()).toBe('c3600');
    });

    it('should set chassis to 3620 for c3620 images', () => {
      component.imageName.set('c3620-image.bin');
      component.onImageChosen();
      expect(component.chassis()).toBe('3620');
    });

    it('should set chassis to 3640 for c3640 images', () => {
      component.imageName.set('c3640-image.bin');
      component.onImageChosen();
      expect(component.chassis()).toBe('3640');
    });

    it('should set chassis to 3660 for c3660 images', () => {
      component.imageName.set('c3660-image.bin');
      component.onImageChosen();
      expect(component.chassis()).toBe('3660');
    });

    it('should set chassis to 1760 for c1700 images', () => {
      component.imageName.set('c1700-image.bin');
      component.onImageChosen();
      expect(component.chassis()).toBe('1760');
    });

    it('should set chassis to 2651XM for c2600 images', () => {
      component.imageName.set('c2600-image.bin');
      component.onImageChosen();
      expect(component.chassis()).toBe('2651XM');
    });

    it('should set platform directly for other image names', () => {
      component.imageName.set('c7200-image.bin');
      component.onImageChosen();
      expect(component.platform()).toBe('c7200');
    });

    it('should set memory from defaultRam based on platform', () => {
      component.imageName.set('c3725-image.bin');
      component.onImageChosen();
      expect(component.memory()).toBe('128');
    });

    it('should call fillDefaultSlots', () => {
      const fillDefaultSlotsSpy = vi.spyOn(component, 'fillDefaultSlots');
      component.onImageChosen();
      expect(fillDefaultSlotsSpy).toHaveBeenCalled();
    });
  });

  describe('onPlatformChosen', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear chassis on iosTemplate', () => {
      component.iosTemplate.update(t => ({ ...t, chassis: '3660' }));
      component.platform.set('c7200');
      component.onPlatformChosen();
      expect(component.iosTemplate().chassis).toBe('');
    });

    it('should reset network adapters to empty array then fill default slots when no chassis options', () => {
      component.networkAdaptersForTemplate.set(['NM-1FE-TX', 'NM-4E']);
      component.platform.set('c7200');
      component.onPlatformChosen();
      // fillDefaultSlots is called since c7200 has no chassis options, so adapters get populated
      expect(component.networkAdaptersForTemplate()[0]).toBe('C7200-IO-FE');
    });

    it('should reset wics to empty array', () => {
      component.wicsForTemplate.set(['WIC-1T', 'WIC-2T']);
      component.platform.set('c7200');
      component.onPlatformChosen();
      expect(component.wicsForTemplate()).toEqual([]);
    });

    it('should call fillDefaultSlots when platform has no chassis option', () => {
      const fillDefaultSlotsSpy = vi.spyOn(component, 'fillDefaultSlots');
      component.platform.set('c7200');
      component.onPlatformChosen();
      expect(fillDefaultSlotsSpy).toHaveBeenCalled();
    });
  });

  describe('onChassisChosen', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset network adapters to empty array', () => {
      component.networkAdaptersForTemplate.set(['NM-1FE-TX', 'NM-4E']);
      component.onChassisChosen();
      expect(component.networkAdaptersForTemplate()).toEqual([]);
    });

    it('should call fillDefaultSlots when platform has chassis options', () => {
      const fillDefaultSlotsSpy = vi.spyOn(component, 'fillDefaultSlots');
      component.platform.set('c2600');
      component.chassis.set('2651XM');
      component.onChassisChosen();
      expect(fillDefaultSlotsSpy).toHaveBeenCalled();
    });
  });

  describe('fillDefaultSlots', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not fill slots when platform is empty', () => {
      component.platform.set('');
      component.fillDefaultSlots();
      expect(component.networkAdaptersForTemplate()).toEqual([]);
    });

    it('should fill network adapters based on adapter matrix', () => {
      component.platform.set('c7200');
      component.chassis.set('');
      component.fillDefaultSlots();
      // C7200 has C7200-IO-FE in slot 0
      expect(component.networkAdaptersForTemplate()[0]).toBe('C7200-IO-FE');
    });
  });

  describe('onAdapterChange', () => {
    it('should update network adapter at specified index', () => {
      component.onAdapterChange(0, 'NM-1FE-TX');
      expect(component.networkAdaptersForTemplate()[0]).toBe('NM-1FE-TX');
    });

    it('should update network adapter at different indices independently', () => {
      component.onAdapterChange(0, 'NM-1FE-TX');
      component.onAdapterChange(1, 'NM-4E');
      component.onAdapterChange(2, 'NM-16ESW');
      expect(component.networkAdaptersForTemplate()).toEqual(['NM-1FE-TX', 'NM-4E', 'NM-16ESW']);
    });
  });

  describe('onWicChange', () => {
    it('should update wic at specified index', () => {
      component.onWicChange(0, 'WIC-1T');
      expect(component.wicsForTemplate()[0]).toBe('WIC-1T');
    });

    it('should update wics at different indices independently', () => {
      component.onWicChange(0, 'WIC-1T');
      component.onWicChange(1, 'WIC-2T');
      expect(component.wicsForTemplate()).toEqual(['WIC-1T', 'WIC-2T']);
    });
  });

  describe('addTemplate', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.controller.set(mockController);
    });

    it('should call toasterService.error when imageName is empty', () => {
      component.imageName.set('');
      component.templateName.set('Test');
      component.platform.set('c7200');
      component.memory.set('512');

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should call toasterService.error when templateName is empty', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('');
      component.platform.set('c7200');
      component.memory.set('512');

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should call toasterService.error when platform is empty', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test');
      component.platform.set('');
      component.memory.set('512');

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should call toasterService.error when memory is empty', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test');
      component.platform.set('c7200');
      component.memory.set('');

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should call iosService.addTemplate when all required fields are filled', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test Template');
      component.platform.set('c7200');
      component.memory.set('512');

      component.addTemplate();

      expect(mockIosService.addTemplate).toHaveBeenCalled();
    });

    it('should set template properties correctly before adding', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test Template');
      component.platform.set('c7200');
      component.memory.set('512');

      let capturedTemplate: IosTemplate | undefined;
      mockIosService.addTemplate = vi.fn().mockReturnValue(of(mockIosTemplate));

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      capturedTemplate = callArgs[1];

      expect(capturedTemplate.template_id).toBeTruthy();
      expect(capturedTemplate.image).toBe('c7200-image.bin');
      expect(capturedTemplate.name).toBe('Test Template');
      expect(capturedTemplate.platform).toBe('c7200');
      expect(capturedTemplate.ram).toBe(512);
    });

    it('should set compute_id to local', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test');
      component.platform.set('c7200');
      component.memory.set('512');

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      expect(callArgs[1].compute_id).toBe('local');
    });

    it('should set symbol and category to switch when isEtherSwitchRouter is true', () => {
      component.imageName.set('c2600-image.bin');
      component.templateName.set('Test Switch');
      component.platform.set('c2600');
      component.memory.set('160');
      component.isEtherSwitchRouter.set(true);

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      expect(callArgs[1].symbol).toBe('multilayer_switch');
      expect(callArgs[1].category).toBe('switch');
    });

    it('should set chassis when chassisOptions exist for platform', () => {
      component.imageName.set('c2600-image.bin');
      component.templateName.set('Test');
      component.platform.set('c2600');
      component.chassis.set('2651XM');
      component.memory.set('160');

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      expect(callArgs[1].chassis).toBe('2651XM');
    });

    it('should set idlepc when idlepc value exists', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test');
      component.platform.set('c7200');
      component.memory.set('512');
      component.idlepc.set('0x60487000');

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      expect(callArgs[1].idlepc).toBe('0x60487000');
    });

    it('should complete adapters data when network adapters are set', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test');
      component.platform.set('c7200');
      component.memory.set('512');
      component.networkAdaptersForTemplate.set(['C7200-IO-FE', 'PA-FE-TX']);

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      expect(callArgs[1].slot0).toBe('C7200-IO-FE');
      expect(callArgs[1].slot1).toBe('PA-FE-TX');
    });

    it('should complete wics data when wics are set', () => {
      component.imageName.set('c2600-image.bin');
      component.templateName.set('Test');
      component.platform.set('c2600');
      component.memory.set('160');
      component.wicsForTemplate.set(['WIC-1T', 'WIC-2T']);

      component.addTemplate();

      const callArgs = mockIosService.addTemplate.mock.calls[0];
      expect(callArgs[1].wic0).toBe('WIC-1T');
      expect(callArgs[1].wic1).toBe('WIC-2T');
    });

    it('should navigate to goBack after successful add', () => {
      component.imageName.set('c7200-image.bin');
      component.templateName.set('Test');
      component.platform.set('c7200');
      component.memory.set('512');

      component.addTemplate();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'dynamips',
        'templates',
      ]);
    });
  });

  describe('goBack', () => {
    it('should navigate to controller dynamips templates page', () => {
      component.controller.set(mockController);
      fixture.detectChanges();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'dynamips',
        'templates',
      ]);
    });
  });

  describe('cancelUploading', () => {
    it('should clear uploader queue', () => {
      const clearQueueSpy = vi.spyOn(component.uploader(), 'clearQueue');
      component.cancelUploading();

      expect(clearQueueSpy).toHaveBeenCalled();
    });

    it('should call processBarCount with null', () => {
      component.cancelUploading();

      expect(mockUploadServiceService.processBarCount).toHaveBeenCalledWith(null);
    });

    it('should call toasterService.warning', () => {
      component.cancelUploading();

      expect(mockToasterService.warning).toHaveBeenCalledWith('File upload cancelled');
    });
  });

  describe('findIdlePC', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.imageName.set('c7200-image.bin');
      component.platform.set('c7200');
      component.memory.set('512');
    });

    it('should call progressService.activate', () => {
      component.findIdlePC();

      expect(mockProgressService.activate).toHaveBeenCalled();
    });

    it('should call iosService.findIdlePC with correct data', () => {
      component.findIdlePC();

      expect(mockIosService.findIdlePC).toHaveBeenCalledWith(mockController, {
        image: 'c7200-image.bin',
        platform: 'c7200',
        ram: 512,
      });
    });

    it('should set idlepc signal when result has idlepc', () => {
      component.findIdlePC();
      fixture.detectChanges();

      expect(component.idlepc()).toBe('0x60487000');
    });

    it('should call toasterService.success with idlepc value', () => {
      component.findIdlePC();
      fixture.detectChanges();

      expect(mockToasterService.success).toHaveBeenCalledWith('Idle-PC value found: 0x60487000');
    });

    it('should call progressService.deactivate after success', () => {
      component.findIdlePC();
      fixture.detectChanges();

      expect(mockProgressService.deactivate).toHaveBeenCalled();
    });

    it('should call progressService.deactivate after error', () => {
      mockIosService.findIdlePC = vi.fn().mockReturnValue(of({ idlepc: null }));
      fixture.detectChanges();
      component.imageName.set('c7200-image.bin');
      component.platform.set('c7200');
      component.memory.set('512');

      component.findIdlePC();
      fixture.detectChanges();

      expect(mockProgressService.deactivate).toHaveBeenCalled();
    });

    it('should not call any toaster when idlepc is null', () => {
      mockIosService.findIdlePC = vi.fn().mockReturnValue(of({ idlepc: null }));
      fixture.detectChanges();
      component.imageName.set('c7200-image.bin');
      component.platform.set('c7200');
      component.memory.set('512');

      component.findIdlePC();
      fixture.detectChanges();

      // When idlepc is null, neither success nor error toaster is called
      expect(mockToasterService.success).not.toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from uploadServiceService.currentCancelItemDetails', () => {
      const unsubscribeSpy = vi.spyOn(component.subscription, 'unsubscribe');
      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
