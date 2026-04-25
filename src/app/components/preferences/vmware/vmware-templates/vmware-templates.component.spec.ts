import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VmwareTemplatesComponent } from './vmware-templates.component';
import { VmwareService } from '@services/vmware.service';
import { ControllerService } from '@services/controller.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { of, firstValueFrom, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VmwareTemplatesComponent', () => {
  let component: VmwareTemplatesComponent;
  let fixture: ComponentFixture<VmwareTemplatesComponent>;
  let mockVmwareService: any;
  let mockControllerService: any;
  let mockActivatedRoute: any;
  let mockDialog: any;
  let mockSnackBar: any;
  let mockToasterService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    authToken: 'token',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    status: 'running',
    tokenExpired: false,
  };

  const mockVmwareTemplates: VmwareTemplate[] = [
    {
      template_id: '1',
      name: 'VMware VM 1',
      template_type: 'vmware',
      builtin: false,
      adapter_type: 'vmnet',
      adapters: 1,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}',
      first_port_name: 'e0',
      headless: false,
      linked_clone: false,
      on_close: 'power_off',
      port_name_format: 'eth{0}',
      port_segment_size: 1024,
      symbol: 'cloud',
      usage: '',
      use_any_adapter: false,
      vmx_path: '/path/to/vm',
    },
    {
      template_id: '2',
      name: 'VMware VM 2',
      template_type: 'vmware',
      builtin: false,
      adapter_type: 'vmnet',
      adapters: 2,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}',
      first_port_name: 'e0',
      headless: false,
      linked_clone: false,
      on_close: 'power_off',
      port_name_format: 'eth{0}',
      port_segment_size: 1024,
      symbol: 'cloud',
      usage: '',
      use_any_adapter: false,
      vmx_path: '/path/to/vm2',
    },
  ];

  beforeEach(async () => {
    mockVmwareService = {
      getTemplates: vi.fn().mockReturnValue(of(mockVmwareTemplates)),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(false)),
      }),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VmwareTemplatesComponent, DeleteTemplateComponent, EmptyTemplatesListComponent],
      providers: [
        { provide: VmwareService, useValue: mockVmwareService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: TemplateService, useValue: {} },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VmwareTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await firstValueFrom(mockVmwareService.getTemplates(mockController));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract controller_id from route params on ngOnInit', () => {
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should load controller from ControllerService', async () => {
    expect(component.controller).toEqual(mockController);
  });

  it('should fetch vmware templates on init after controller loads', () => {
    expect(mockVmwareService.getTemplates).toHaveBeenCalledWith(mockController);
  });

  it('should filter templates by template_type=vmware and builtin=false', () => {
    expect(component.vmwareTemplates).toEqual(mockVmwareTemplates);
  });

  it('should have empty vmwareTemplates array initially before async operations', () => {
    const newFixture = TestBed.createComponent(VmwareTemplatesComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.vmwareTemplates).toEqual([]);
  });

  it('should show vmware templates list when templates exist', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('.vmware-templates__list-item');
    expect(listItems.length).toBe(2);
  });

  it('should display template names in the list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const firstTemplateName = compiled.querySelector('.vmware-templates__list-name');
    expect(firstTemplateName?.textContent).toContain('VMware VM 1');
  });

  it('should show back button when controller is loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('.vmware-templates__back-btn');
    expect(backButton).toBeTruthy();
  });

  it('should show add button when controller is loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.vmware-templates__add-btn');
    expect(addButton).toBeTruthy();
  });

  it('should call getTemplates again after delete event', () => {
    mockVmwareService.getTemplates.mockClear();
    component.onDeleteEvent();
    expect(mockVmwareService.getTemplates).toHaveBeenCalledWith(mockController);
  });

  it('should filter out non-vmware templates', async () => {
    const mixedTemplates: VmwareTemplate[] = [
      ...mockVmwareTemplates,
      {
        template_id: '3',
        name: 'Non-VMware Template',
        template_type: 'docker',
        builtin: false,
        adapter_type: 'bridge',
        adapters: 1,
        category: 'guest',
        compute_id: 'local',
        console_auto_start: false,
        console_type: 'none',
        custom_adapters: [],
        default_name_format: '{name}',
        first_port_name: 'e0',
        headless: false,
        linked_clone: false,
        on_close: 'power_off',
        port_name_format: 'eth{0}',
        port_segment_size: 1024,
        symbol: 'cloud',
        usage: '',
        use_any_adapter: false,
        vmx_path: '/path/to/vm',
      },
    ];
    mockVmwareService.getTemplates.mockReturnValue(of(mixedTemplates));
    component.getTemplates();
    fixture.detectChanges();
    await firstValueFrom(mockVmwareService.getTemplates(mockController));
    fixture.detectChanges();
    expect(component.vmwareTemplates.length).toBe(2);
    expect(component.vmwareTemplates.every((t) => t.template_type === 'vmware')).toBe(true);
  });

  it('should filter out builtin templates', async () => {
    const templatesWithBuiltin: VmwareTemplate[] = [
      ...mockVmwareTemplates,
      {
        template_id: '3',
        name: 'Builtin VMware',
        template_type: 'vmware',
        builtin: true,
        adapter_type: 'vmnet',
        adapters: 1,
        category: 'guest',
        compute_id: 'local',
        console_auto_start: false,
        console_type: 'none',
        custom_adapters: [],
        default_name_format: '{name}',
        first_port_name: 'e0',
        headless: false,
        linked_clone: false,
        on_close: 'power_off',
        port_name_format: 'eth{0}',
        port_segment_size: 1024,
        symbol: 'cloud',
        usage: '',
        use_any_adapter: false,
        vmx_path: '/path/to/vm',
      },
    ];
    mockVmwareService.getTemplates.mockReturnValue(of(templatesWithBuiltin));
    component.getTemplates();
    fixture.detectChanges();
    await firstValueFrom(mockVmwareService.getTemplates(mockController));
    fixture.detectChanges();
    expect(component.vmwareTemplates.length).toBe(2);
    expect(component.vmwareTemplates.every((t) => !t.builtin)).toBe(true);
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(VmwareTemplatesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(VmwareTemplatesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getTemplates fails', async () => {
      mockVmwareService.getTemplates.mockReturnValue(
        throwError(() => ({ error: { message: 'Templates error' } }))
      );
      component.controller = mockController;

      component.getTemplates();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Templates error');
    });

    it('should use fallback message when getTemplates error has no message', async () => {
      mockVmwareService.getTemplates.mockReturnValue(throwError(() => ({})));
      component.controller = mockController;

      component.getTemplates();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load VMware templates');
    });
  });
});
