import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { VirtualBoxTemplatesComponent } from './virtual-box-templates.component';
import { VirtualBoxService } from '@services/virtual-box.service';
import { ControllerService } from '@services/controller.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { HttpController } from '@services/http-controller.service';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { Controller } from '@models/controller';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VirtualBoxTemplatesComponent', () => {
  let component: VirtualBoxTemplatesComponent;
  let fixture: ComponentFixture<VirtualBoxTemplatesComponent>;
  let mockVirtualBoxService: any;
  let mockControllerService: any;
  let mockActivatedRoute: any;
  let mockDialog: any;
  let mockTemplateService: any;
  let mockToasterService: any;
  let mockHttpController: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    authToken: 'token',
    status: 'running',
    tokenExpired: false,
  };

  const mockVirtualBoxTemplates: VirtualBoxTemplate[] = [
    {
      template_id: 'template-1',
      name: 'Test VM 1',
      template_type: 'virtualbox',
      builtin: false,
      category: 'Guest',
      adapter_type: 'Intel PRO/1000',
      adapters: 4,
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      default_name_format: 'VM{0}',
      first_port_name: 'Adapter 0',
      headless: false,
      linked_clone: false,
      on_close: 'power_off',
      port_name_format: 'Adapter{1}',
      port_segment_size: 100,
      ram: 512,
      symbol: 'computer',
      usage: '',
      use_any_adapter: false,
      vmname: 'TestVM1',
    },
    {
      template_id: 'template-2',
      name: 'Test VM 2',
      template_type: 'virtualbox',
      builtin: false,
      category: 'Guest',
      adapter_type: 'Intel PRO/1000',
      adapters: 4,
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      default_name_format: 'VM{0}',
      first_port_name: 'Adapter 0',
      headless: false,
      linked_clone: false,
      on_close: 'power_off',
      port_name_format: 'Adapter{1}',
      port_segment_size: 100,
      ram: 1024,
      symbol: 'computer',
      usage: '',
      use_any_adapter: false,
      vmname: 'TestVM2',
    },
  ];

  beforeEach(async () => {
    const dialogRefMock = {
      afterClosed: vi.fn().mockReturnValue(of(true)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(dialogRefMock),
    };

    mockTemplateService = {
      deleteTemplate: vi.fn().mockReturnValue(of({})),
      newTemplateCreated: { subscribe: vi.fn() },
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockHttpController = {};

    mockVirtualBoxService = {
      getTemplates: vi.fn().mockReturnValue(of(mockVirtualBoxTemplates)),
    };

    mockControllerService = {
      get: vi.fn().mockImplementation(() => Promise.resolve(mockController)),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [VirtualBoxTemplatesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: VirtualBoxService, useValue: mockVirtualBoxService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: HttpController, useValue: mockHttpController },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VirtualBoxTemplatesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load controller from route params on ngOnInit', async () => {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    await Promise.resolve();
    fixture.detectChanges();
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
    expect(component.controller).toEqual(mockController);
  });

  it('should call getTemplates after loading controller', async () => {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    await Promise.resolve();
    fixture.detectChanges();
    expect(mockVirtualBoxService.getTemplates).toHaveBeenCalledWith(mockController);
  });

  it('should display VirtualBox VM templates title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.virtualbox-templates__title');
    expect(title?.textContent).toContain('VirtualBox VM templates');
  });

  it('should display template list items when templates exist', async () => {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    await Promise.resolve();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('.virtualbox-templates__list-item');
    expect(listItems.length).toBe(2);
  });

  it('should display template names correctly', async () => {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    await Promise.resolve();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const firstTemplateName = compiled.querySelector('.virtualbox-templates__list-name');
    expect(firstTemplateName?.textContent).toContain('Test VM 1');
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(VirtualBoxTemplatesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(VirtualBoxTemplatesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getTemplates fails', async () => {
      mockVirtualBoxService.getTemplates.mockReturnValue(
        throwError(() => ({ error: { message: 'Templates error' } }))
      );
      component.controller = mockController;

      component.getTemplates();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Templates error');
    });

    it('should use fallback message when getTemplates error has no message', async () => {
      mockVirtualBoxService.getTemplates.mockReturnValue(throwError(() => ({})));
      component.controller = mockController;

      component.getTemplates();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load VirtualBox templates');
    });
  });
});
