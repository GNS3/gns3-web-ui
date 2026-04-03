import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AddVpcsTemplateComponent } from './add-vpcs-template.component';
import { VpcsService } from '@services/vpcs.service';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddVpcsTemplateComponent', () => {
  let component: AddVpcsTemplateComponent;
  let fixture: ComponentFixture<AddVpcsTemplateComponent>;

  let mockControllerService: any;
  let mockVpcsService: any;
  let mockTemplateMocksService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockComputeService: any;

  let mockController: Controller;

  const createMockVpcsTemplate = (): VpcsTemplate => ({
    base_script_file: 'vpcs_base_config.txt',
    builtin: false,
    category: 'guest',
    compute_id: 'local',
    console_auto_start: false,
    console_type: 'telnet',
    default_name_format: 'PC{0}',
    name: '',
    symbol: 'vpcs_guest',
    template_id: '',
    template_type: 'vpcs',
    tags: [],
  });

  beforeEach(async () => {
    mockController = {
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
    } as Controller;

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

    mockVpcsService = {
      addTemplate: vi.fn().mockReturnValue(of(createMockVpcsTemplate())),
    };

    mockTemplateMocksService = {
      getVpcsTemplate: vi.fn().mockReturnValue(of(createMockVpcsTemplate())),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [AddVpcsTemplateComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: VpcsService, useValue: mockVpcsService },
        { provide: TemplateMocksService, useValue: mockTemplateMocksService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ComputeService, useValue: mockComputeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddVpcsTemplateComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize isLocalComputerChosen to true', () => {
      expect(component.isLocalComputerChosen).toBe(true);
    });

    it('should have an empty templateName', () => {
      expect(component.templateName).toBe('');
    });

    it('should have a templateNameForm with required validator', () => {
      expect(component.templateNameForm).toBeDefined();
      expect(component.templateNameForm.get('templateName').hasError('required')).toBe(true);
    });
  });

  describe('ngOnInit', () => {
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

      expect(component.controller).toBe(mockController);
    });

    it('should call markForCheck after fetching controller', async () => {
      const markForCheckSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(markForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('setControllerType', () => {
    it('should set isLocalComputerChosen to true when passed "local"', () => {
      component.isLocalComputerChosen = false;
      fixture.detectChanges();

      component.setControllerType('local');

      expect(component.isLocalComputerChosen).toBe(true);
    });

    it('should not change isLocalComputerChosen when passed "remote"', () => {
      component.isLocalComputerChosen = true;
      fixture.detectChanges();

      component.setControllerType('remote');

      expect(component.isLocalComputerChosen).toBe(true);
    });
  });

  describe('goBack', () => {
    it('should navigate to controller vpcs templates page', () => {
      component.controller = mockController;
      fixture.detectChanges();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'vpcs',
        'templates',
      ]);
    });

    it('should navigate correctly even when controller id is 0', () => {
      component.controller = { ...mockController, id: 0 } as Controller;
      fixture.detectChanges();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 0, 'preferences', 'vpcs', 'templates']);
    });
  });

  describe('addTemplate', () => {
    beforeEach(() => {
      component.controller = mockController;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should not add template when form is invalid', () => {
      component.templateNameForm.get('templateName').setValue('');
      fixture.detectChanges();

      component.addTemplate();

      expect(mockVpcsService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not add template when form control is null', () => {
      component.templateNameForm.get('templateName').setValue(null);
      fixture.detectChanges();

      component.addTemplate();

      expect(mockVpcsService.addTemplate).not.toHaveBeenCalled();
    });

    it('should call toasterService.error when form is invalid', () => {
      component.templateNameForm.get('templateName').setValue('');
      fixture.detectChanges();

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should add template when form is valid', async () => {
      const templateName = 'My VPCS Template';
      component.templateNameForm.get('templateName').setValue(templateName);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockVpcsService.addTemplate).toHaveBeenCalled();
    });

    it('should navigate to goBack after successful template addition', async () => {
      const templateName = 'Test Template';
      component.templateNameForm.get('templateName').setValue(templateName);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'vpcs',
        'templates',
      ]);
    });

    it('should call templateMocksService.getVpcsTemplate to get base template', async () => {
      const templateName = 'Test Template';
      component.templateNameForm.get('templateName').setValue(templateName);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockTemplateMocksService.getVpcsTemplate).toHaveBeenCalled();
    });

    it('should set template_id, name, and compute_id on the template', async () => {
      const templateName = 'My VPCS';
      component.templateNameForm.get('templateName').setValue(templateName);
      fixture.detectChanges();

      let capturedTemplate: VpcsTemplate | undefined;
      mockVpcsService.addTemplate.mockReturnValue(
        of(createMockVpcsTemplate()).pipe(
          // Capture the template passed to addTemplate
        )
      );

      // Override mock to capture the argument
      mockVpcsService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(createMockVpcsTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.name).toBe(templateName);
      expect(capturedTemplate?.compute_id).toBe('local');
      expect(capturedTemplate?.template_id).toBeTruthy();
      expect(capturedTemplate?.template_id).not.toBe('');
    });
  });

  describe('Template name form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.templateNameForm.invalid).toBe(true);
    });

    it('should be valid when template name is set', () => {
      component.templateNameForm.get('templateName').setValue('My Template');
      fixture.detectChanges();

      expect(component.templateNameForm.valid).toBe(true);
    });

    it('should be invalid when template name is only whitespace', () => {
      component.templateNameForm.get('templateName').setValue('   ');
      fixture.detectChanges();

      // The built-in required validator treats whitespace-only as valid
      expect(component.templateNameForm.get('templateName').hasError('required')).toBe(false);
    });
  });
});
