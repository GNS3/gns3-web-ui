import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AddVirtualBoxTemplateComponent } from './add-virtual-box-template.component';
import { VirtualBoxService } from '@services/virtual-box.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { VirtualBoxVm } from '@models/virtualBox/virtual-box-vm';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddVirtualBoxTemplateComponent', () => {
  let component: AddVirtualBoxTemplateComponent;
  let fixture: ComponentFixture<AddVirtualBoxTemplateComponent>;

  let mockControllerService: any;
  let mockVirtualBoxService: any;
  let mockTemplateMocksService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockVirtualBoxVm: VirtualBoxVm;
  let mockVirtualBoxTemplate: VirtualBoxTemplate;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: '',
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
    }) as Controller;

  const createMockVirtualBoxVm = (): VirtualBoxVm =>
    ({
      ram: 1024,
      vmname: 'TestVM',
    }) as VirtualBoxVm;

  const createMockVirtualBoxTemplate = (): VirtualBoxTemplate =>
    ({
      adapter_type: 'Intel PRO/1000 MT Desktop (82540EM)',
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      headless: false,
      linked_clone: false,
      name: '',
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      ram: 0,
      symbol: 'vbox_guest',
      template_id: '',
      template_type: 'virtualbox',
      usage: '',
      use_any_adapter: false,
      vmname: '',
      tags: [],
    });

  beforeEach(async () => {
    mockController = createMockController();
    mockVirtualBoxVm = createMockVirtualBoxVm();
    mockVirtualBoxTemplate = createMockVirtualBoxTemplate();

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

    mockVirtualBoxService = {
      addTemplate: vi.fn().mockReturnValue(of(mockVirtualBoxTemplate)),
      getVirtualMachines: vi.fn().mockReturnValue(of([mockVirtualBoxVm])),
    };

    mockTemplateMocksService = {
      getVirtualBoxTemplate: vi.fn().mockReturnValue(of(mockVirtualBoxTemplate)),
    };

    mockToasterService = {
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddVirtualBoxTemplateComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: VirtualBoxService, useValue: mockVirtualBoxService },
        { provide: TemplateMocksService, useValue: mockTemplateMocksService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddVirtualBoxTemplateComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have an empty vm model', () => {
      expect(component.vm()).toBe('');
    });

    it('should have linkedClone model set to false by default', () => {
      expect(component.linkedClone()).toBe(false);
    });

    it('should have virtualBoxTemplate signal initialized', () => {
      expect(component.virtualBoxTemplate()).toBeDefined();
    });

    it('should have virtualMachines signal initialized as empty array', () => {
      expect(component.virtualMachines()).toEqual([]);
    });

    it('should have selectedVM signal undefined initially', () => {
      expect(component.selectedVM()).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should show deprecation warning via toasterService.error', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'VirtualBox VM support is deprecated and will be removed in a future version, please use Qemu VMs instead'
      );
    });

    it('should fetch controller from route param controller_id', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should store controller when fetched', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.controller()).toEqual(mockController);
    });

    it('should fetch virtual machines from VirtualBoxService', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockVirtualBoxService.getVirtualMachines).toHaveBeenCalledWith(mockController);
    });

    it('should store virtual machines when fetched', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.virtualMachines()).toEqual([mockVirtualBoxVm]);
    });

    it('should fetch virtualbox template from TemplateMocksService', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockTemplateMocksService.getVirtualBoxTemplate).toHaveBeenCalled();
    });

    it('should store virtualbox template when fetched', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.virtualBoxTemplate()).toEqual(mockVirtualBoxTemplate);
    });

    it('should call markForCheck after fetching controller', async () => {
      const markForCheckSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(markForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('goBack', () => {
    it('should navigate to controller virtualbox templates page', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'virtualbox',
        'templates',
      ]);
    });

    it('should navigate correctly even when controller id is 0', async () => {
      const controllerWithZeroId = { ...mockController, id: 0 };
      mockControllerService.get.mockResolvedValue(controllerWithZeroId);

      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 0, 'preferences', 'virtualbox', 'templates']);
    });
  });

  describe('vm model', () => {
    it('should update when mat-select selection changes', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      component.vm.set(mockVirtualBoxVm);
      component.selectedVM.set(mockVirtualBoxVm);
      fixture.detectChanges();

      expect(component.vm()).toEqual(mockVirtualBoxVm);
      expect(component.selectedVM()).toEqual(mockVirtualBoxVm);
    });
  });

  describe('linkedClone model', () => {
    it('should update when checkbox changes', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      component.linkedClone.set(true);
      fixture.detectChanges();

      expect(component.linkedClone()).toBe(true);
    });

    it('should be false by default', () => {
      expect(component.linkedClone()).toBe(false);
    });
  });

  describe('addTemplate', () => {
    beforeEach(async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should not add template when vm is empty', () => {
      component.vm.set('');
      fixture.detectChanges();

      component.addTemplate();

      expect(mockVirtualBoxService.addTemplate).not.toHaveBeenCalled();
    });

    it('should call toasterService.error when vm is empty', () => {
      component.vm.set('');
      fixture.detectChanges();

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should add template when vm is selected', async () => {
      component.vm.set(mockVirtualBoxVm);
      component.selectedVM.set(mockVirtualBoxVm);
      component.linkedClone.set(false);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockVirtualBoxService.addTemplate).toHaveBeenCalledWith(mockController, expect.any(Object));
    });

    it('should set template properties from selected VM', async () => {
      component.vm.set(mockVirtualBoxVm);
      component.selectedVM.set(mockVirtualBoxVm);
      component.linkedClone.set(true);
      fixture.detectChanges();

      let capturedTemplate: VirtualBoxTemplate | undefined;
      mockVirtualBoxService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockVirtualBoxTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.name).toBe(mockVirtualBoxVm.vmname);
      expect(capturedTemplate?.vmname).toBe(mockVirtualBoxVm.vmname);
      expect(capturedTemplate?.ram).toBe(mockVirtualBoxVm.ram);
    });

    it('should set linked_clone from linkedClone model', async () => {
      component.vm.set(mockVirtualBoxVm);
      component.selectedVM.set(mockVirtualBoxVm);
      component.linkedClone.set(true);
      fixture.detectChanges();

      let capturedTemplate: VirtualBoxTemplate | undefined;
      mockVirtualBoxService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockVirtualBoxTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.linked_clone).toBe(true);
    });

    it('should set template_id to a uuid', async () => {
      component.vm.set(mockVirtualBoxVm);
      component.selectedVM.set(mockVirtualBoxVm);
      component.linkedClone.set(false);
      fixture.detectChanges();

      let capturedTemplate: VirtualBoxTemplate | undefined;
      mockVirtualBoxService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockVirtualBoxTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.template_id).toBeTruthy();
      expect(capturedTemplate?.template_id).not.toBe('');
    });

    it('should navigate to goBack after successful template addition', async () => {
      component.vm.set(mockVirtualBoxVm);
      component.selectedVM.set(mockVirtualBoxVm);
      component.linkedClone.set(false);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'virtualbox',
        'templates',
      ]);
    });
  });

  describe('template rendering', () => {
    it('should show back button and title when controller is loaded', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.virtualbox-add__back-btn')).toBeTruthy();
      expect(compiled.querySelector('.virtualbox-add__title')).toBeTruthy();
    });

    it('should show form card when virtualBoxTemplate is loaded', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.virtualbox-add__form-card')).toBeTruthy();
    });

    it('should show VM list select when virtualMachines are loaded', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-select')).toBeTruthy();
    });

    it('should show linked clone checkbox', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-checkbox')).toBeTruthy();
    });

    it('should show cancel and add template buttons', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.virtualbox-add__cancel-btn')).toBeTruthy();
      expect(compiled.querySelector('.virtualbox-add__submit-btn')).toBeTruthy();
    });
  });
});
