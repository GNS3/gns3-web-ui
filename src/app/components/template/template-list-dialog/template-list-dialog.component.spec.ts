import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import {
  TemplateListDialogComponent,
  TemplateDatabase,
  TemplateDataSource,
  NodeAddedEvent,
} from './template-list-dialog.component';
import { TemplateService } from '@services/template.service';
import { ComputeService } from '@services/compute.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Template } from '@models/template';
import { NonNegativeValidator } from '../../../validators/non-negative-validator';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockController: Controller = {
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

const mockProject: Project = {
  project_id: 'proj1',
  name: 'Test Project',
  filename: 'test.gns3',
  status: 'opened',
  created_by: '',
  auto_close: true,
  auto_open: false,
  auto_start: false,
  scene_width: 2000,
  scene_height: 1000,
  zoom: 100,
  show_layers: false,
  snap_to_grid: false,
  show_grid: false,
  grid_size: 75,
  drawing_grid_size: 25,
  show_interface_labels: false,
  variables: [],
  path: '/path/to/project',
  readonly: false,
} as Project;

describe('TemplateListDialogComponent', () => {
  let component: TemplateListDialogComponent;
  let fixture: ComponentFixture<TemplateListDialogComponent>;
  let mockTemplateService: any;
  let mockComputeService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockNonNegativeValidator: any;
  let mockChangeDetectorRef: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockTemplateService = {
      list: vi.fn().mockReturnValue(of([])),
      newTemplateCreated: new Subject<Template>(),
    };

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockNonNegativeValidator = {
      get: Validators.nullValidator,
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TemplateListDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            controller: mockController,
            project: mockProject,
            allowTopologyDrop: true,
          },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ComputeService, useValue: mockComputeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: UntypedFormBuilder, useValue: new UntypedFormBuilder() },
        { provide: NonNegativeValidator, useValue: mockNonNegativeValidator },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateListDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should receive controller from dialog data', () => {
      expect(component.controller).toEqual(mockController);
    });

    it('should receive project from dialog data', () => {
      expect(component.project).toEqual(mockProject);
    });

    it('should show the compute field before a template is selected', () => {
      fixture.detectChanges();

      const labels = Array.from(fixture.nativeElement.querySelectorAll('mat-label')).map((label: Element) =>
        label.textContent?.trim()
      );
      expect(labels).toContain('Compute');
      expect(component.selectedComputeId()).toBe('local');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('getComputes', () => {
      it('should show error toaster when getComputes fails with error.error.message', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({ error: { message: 'Computes failed' } })));

        component.ngOnInit();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith('Computes failed');
      });

      it('should use err.message when error has no error.message', async () => {
        const error = new Error('Network error');
        mockComputeService.getComputes.mockReturnValue(throwError(() => error));

        component.ngOnInit();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
      });

      it('should use fallback message when error has no message', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({})));

        component.ngOnInit();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load computes');
      });

      it('should fallback to local only when getComputes fails', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({ error: { message: 'Computes failed' } })));

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.nodeComputes).toEqual([{ display: 'local', value: 'local' }]);
      });

      it('should call markForCheck when getComputes fails', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({ error: { message: 'Computes failed' } })));

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
        component.ngOnInit();
        fixture.detectChanges();

        expect(cdrSpy).toHaveBeenCalled();
      });
    });

    describe('templateService.list', () => {
      it('should show error toaster when list fails with error.error.message', async () => {
        mockTemplateService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));

        component.ngOnInit();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
      });

      it('should use fallback message when list error has no message', async () => {
        mockTemplateService.list.mockReturnValue(throwError(() => ({})));

        component.ngOnInit();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load templates');
      });

      it('should call markForCheck when list fails', async () => {
        mockTemplateService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
        component.ngOnInit();
        fixture.detectChanges();

        expect(cdrSpy).toHaveBeenCalled();
      });
    });
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have compareComputes method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).compareComputes).toBe('function');
    });

    it('should have filterTemplates method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).filterTemplates).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).onAddClick).toBe('function');
    });
  });

  describe('template selection', () => {
    const template = {
      template_id: 'template-1',
      name: 'Router',
      symbol: 'router.svg',
      template_type: 'qemu',
      compute_id: 'local',
    } as Template;

    it('should select a template', () => {
      component.selectTemplate(template);

      expect(component.selectedTemplate()).toBe(template);
    });

    it('should select a template and default its controller before dragging', () => {
      const templateWithoutCompute = { ...template, compute_id: undefined } as Template;
      const pointerEvent = { clientX: 100, clientY: 80 } as MouseEvent;

      component.onTemplatePointerDown(pointerEvent, templateWithoutCompute);

      expect(component.selectedTemplate()).toBe(templateWithoutCompute);
      expect(component.selectedComputeId()).toBe('local');
      expect(templateWithoutCompute.compute_id).toBeUndefined();
    });

    it('should emit a drag-start request for a valid quantity', () => {
      const emitSpy = vi.spyOn(component.templateDragStarted, 'emit');
      const event = {
        preventDefault: vi.fn(),
        currentTarget: document.createElement('button'),
        dataTransfer: { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: '' },
      } as any;
      component.configurationForm.get('numberOfNodes').setValue(4);

      component.onTemplateDragStart(event, template);

      expect(component.selectedTemplate()).toBe(template);
      expect(emitSpy).toHaveBeenCalledWith({ event, template, numberOfNodes: 4, computeId: 'local' });
      expect(event.dataTransfer.effectAllowed).toBe('copy');
    });

    it('should cancel template dragging when topology drops are unavailable', () => {
      const event = { preventDefault: vi.fn() } as any;
      const emitSpy = vi.spyOn(component.templateDragStarted, 'emit');
      component.data.allowTopologyDrop = false;

      component.onTemplateDragStart(event, template);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should reject a node count below one', () => {
      component.configurationForm.get('numberOfNodes').setValue(0);

      expect(component.configurationForm.invalid).toBe(true);
    });

    it('should request manual node creation without closing the palette', () => {
      const emitSpy = vi.spyOn(component.nodeAddRequested, 'emit');
      component.templates = [template];
      component.filteredTemplates = [template];
      component.selectTemplate(template);

      component.onAddClick();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ template, computeId: 'local', numberOfNodes: 1, x: 0, y: 0 })
      );
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('view mode', () => {
    // The view mode is read in the field initializer, so tests that verify
    // restoration need a fresh component built after localStorage is set up.
    const createFreshComponent = () => {
      if (fixture) fixture.destroy();
      fixture = TestBed.createComponent(TemplateListDialogComponent);
      component = fixture.componentInstance;
    };

    afterEach(() => {
      localStorage.removeItem('addNodesViewMode');
    });

    it('should default to grid view when no preference is stored', () => {
      localStorage.removeItem('addNodesViewMode');
      createFreshComponent();

      expect(component.viewMode()).toBe('grid');
    });

    it('should restore list view from the stored preference', () => {
      localStorage.setItem('addNodesViewMode', 'list');
      createFreshComponent();

      expect(component.viewMode()).toBe('list');
    });

    it('should fall back to grid view for unknown stored values', () => {
      localStorage.setItem('addNodesViewMode', 'bogus');
      createFreshComponent();

      expect(component.viewMode()).toBe('grid');
    });

    it('should toggle grid to list and persist the choice', () => {
      expect(component.viewMode()).toBe('grid');

      component.toggleViewMode();

      expect(component.viewMode()).toBe('list');
      expect(localStorage.getItem('addNodesViewMode')).toBe('list');
    });

    it('should toggle list back to grid', () => {
      component.toggleViewMode();
      component.toggleViewMode();

      expect(component.viewMode()).toBe('grid');
      expect(localStorage.getItem('addNodesViewMode')).toBe('grid');
    });
  });

  describe('exported types', () => {
    it('should export NodeAddedEvent interface', () => {
      const event: NodeAddedEvent = {
        template: {} as any,
        computeId: 'local',
        numberOfNodes: 1,
        x: 0,
        y: 0,
      };
      expect(event.template).toBeDefined();
      expect(event.computeId).toBe('local');
      expect(event.numberOfNodes).toBe(1);
    });

    it('should have TemplateDatabase class', () => {
      expect(typeof TemplateDatabase).toBe('function');
    });

    it('should have TemplateDataSource class', () => {
      expect(typeof TemplateDataSource).toBe('function');
    });
  });
});

describe('TemplateDataSource', () => {
  describe('prototype methods', () => {
    it('should have connect method', () => {
      expect(typeof (TemplateDataSource.prototype as any).connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(typeof (TemplateDataSource.prototype as any).disconnect).toBe('function');
    });

    it('should have filter getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(TemplateDataSource.prototype, 'filter')?.get).toBe('function');
    });

    it('should have filter setter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(TemplateDataSource.prototype, 'filter')?.set).toBe('function');
    });
  });
});

describe('TemplateDatabase', () => {
  describe('prototype', () => {
    it('should have data getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(TemplateDatabase.prototype, 'data')?.get).toBe('function');
    });
  });
});
