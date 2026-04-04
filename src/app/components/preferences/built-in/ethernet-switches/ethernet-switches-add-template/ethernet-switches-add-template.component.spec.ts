import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { EthernetSwitchesAddTemplateComponent } from './ethernet-switches-add-template.component';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { Controller } from '@models/controller';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EthernetSwitchesAddTemplateComponent', () => {
  let component: EthernetSwitchesAddTemplateComponent;
  let fixture: ComponentFixture<EthernetSwitchesAddTemplateComponent>;

  let mockBuiltInTemplatesService: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let addedTemplate: EthernetSwitchTemplate | undefined;

  const createMockEthernetSwitchTemplate = (): EthernetSwitchTemplate => ({
    builtin: false,
    category: 'switch',
    compute_id: 'local',
    console_type: 'none',
    default_name_format: 'Switch{0}',
    name: '',
    ports_mapping: [],
    symbol: 'ethernet_switch',
    template_id: '',
    template_type: 'ethernet_switch',
    tags: [],
    usage: '',
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
    };

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

    mockBuiltInTemplatesService = {
      addTemplate: vi.fn().mockReturnValue(of(createMockEthernetSwitchTemplate())),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EthernetSwitchesAddTemplateComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: BuiltInTemplatesService, useValue: mockBuiltInTemplatesService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EthernetSwitchesAddTemplateComponent);
    component = fixture.componentInstance;
    addedTemplate = undefined;
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

    it('should have a formGroup with templateName and numberOfPorts controls', () => {
      expect(component.formGroup).toBeDefined();
      expect(component.formGroup.get('templateName')).toBeDefined();
      expect(component.formGroup.get('numberOfPorts')).toBeDefined();
    });

    it('should have templateName control with required validator', () => {
      expect(component.formGroup.get('templateName').hasError('required')).toBe(true);
    });

    it('should have numberOfPorts control with required validator', () => {
      component.formGroup.get('numberOfPorts').setValue(null);
      fixture.detectChanges();

      expect(component.formGroup.get('numberOfPorts').hasError('required')).toBe(true);
    });

    it('should have default numberOfPorts value of 8', () => {
      expect(component.formGroup.get('numberOfPorts').value).toBe(8);
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
    it('should navigate to controller ethernet-switches preferences page', () => {
      component.controller = mockController;
      fixture.detectChanges();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'builtin',
        'ethernet-switches',
      ]);
    });

    it('should navigate correctly even when controller id is 0', () => {
      component.controller = { ...mockController, id: 0 };
      fixture.detectChanges();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 0, 'preferences', 'builtin', 'ethernet-switches']);
    });
  });

  describe('addTemplate', () => {
    beforeEach(() => {
      component.controller = mockController;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should not add template when form is invalid', () => {
      component.formGroup.get('templateName').setValue('');
      fixture.detectChanges();

      component.addTemplate();

      expect(mockBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not add template when templateName is null', () => {
      component.formGroup.get('templateName').setValue(null);
      fixture.detectChanges();

      component.addTemplate();

      expect(mockBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
    });

    it('should call toasterService.error when form is invalid', () => {
      component.formGroup.get('templateName').setValue('');
      fixture.detectChanges();

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should add template when form is valid', async () => {
      const templateName = 'My Ethernet Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockBuiltInTemplatesService.addTemplate).toHaveBeenCalled();
    });

    it('should navigate to goBack after successful template addition', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'builtin',
        'ethernet-switches',
      ]);
    });

    it('should call toasterService.success after successful template addition', async () => {
      const templateName = 'Success Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockToasterService.success).toHaveBeenCalledWith('Template added successfully');
    });

    it('should create template with correct template_type', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.template_type).toBe('ethernet_switch');
    });

    it('should create template with correct category', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.category).toBe('switch');
    });

    it('should create template with compute_id as local', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.compute_id).toBe('local');
    });

    it('should create template with symbol as ethernet_switch', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.symbol).toBe('ethernet_switch');
    });

    it('should create template with default_name_format as Switch{0}', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.default_name_format).toBe('Switch{0}');
    });

    it('should create template with console_type as none', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.console_type).toBe('none');
    });

    it('should create template with builtin as false', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.builtin).toBe(false);
    });

    it('should generate a non-empty template_id using uuid', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.template_id).toBeTruthy();
      expect(addedTemplate?.template_id).not.toBe('');
    });
  });

  describe('addTemplate with ports', () => {
    beforeEach(() => {
      component.controller = mockController;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should create 8 ports mapping when numberOfPorts is 8 (default)', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(8);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping.length).toBe(8);
    });

    it('should create correct ports mapping with Ethernet names', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(4);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping[0].name).toBe('Ethernet0');
      expect(addedTemplate?.ports_mapping[1].name).toBe('Ethernet1');
      expect(addedTemplate?.ports_mapping[2].name).toBe('Ethernet2');
      expect(addedTemplate?.ports_mapping[3].name).toBe('Ethernet3');
    });

    it('should create ports with correct port_number values', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(3);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping[0].port_number).toBe(0);
      expect(addedTemplate?.ports_mapping[1].port_number).toBe(1);
      expect(addedTemplate?.ports_mapping[2].port_number).toBe(2);
    });

    it('should create ports with ethertype 0x8100', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(2);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping[0].ethertype).toBe('0x8100');
      expect(addedTemplate?.ports_mapping[1].ethertype).toBe('0x8100');
    });

    it('should create ports with type access', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(2);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping[0].type).toBe('access');
      expect(addedTemplate?.ports_mapping[1].type).toBe('access');
    });

    it('should create ports with vlan 1', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(2);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping[0].vlan).toBe(1);
      expect(addedTemplate?.ports_mapping[1].vlan).toBe(1);
    });

    it('should create 0 ports when numberOfPorts is 0', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(0);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping.length).toBe(0);
    });

    it('should create 16 ports when numberOfPorts is 16', async () => {
      const templateName = 'Test Switch';
      component.formGroup.get('templateName').setValue(templateName);
      component.formGroup.get('numberOfPorts').setValue(16);
      fixture.detectChanges();

      mockBuiltInTemplatesService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        addedTemplate = template;
        return of(createMockEthernetSwitchTemplate());
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(addedTemplate?.ports_mapping.length).toBe(16);
      expect(addedTemplate?.ports_mapping[15].name).toBe('Ethernet15');
    });
  });

  describe('Form validation', () => {
    it('should be invalid when templateName is empty', () => {
      component.formGroup.get('templateName').setValue('');
      fixture.detectChanges();

      expect(component.formGroup.invalid).toBe(true);
    });

    it('should be valid when templateName is set', () => {
      component.formGroup.get('templateName').setValue('My Switch');
      fixture.detectChanges();

      expect(component.formGroup.valid).toBe(true);
    });

    it('should be valid when numberOfPorts is set to 0', () => {
      component.formGroup.get('templateName').setValue('My Switch');
      component.formGroup.get('numberOfPorts').setValue(0);
      fixture.detectChanges();

      expect(component.formGroup.valid).toBe(true);
    });
  });
});
