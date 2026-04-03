import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { of, Subject } from 'rxjs';
import { StyleEditorDialogComponent, ElementData } from './style-editor.component';
import { Drawing } from '../../../../cartography/models/drawing';
import { RectElement } from '../../../../cartography/models/drawings/rect-element';
import { EllipseElement } from '../../../../cartography/models/drawings/ellipse-element';
import { LineElement } from '../../../../cartography/models/drawings/line-element';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { RotationValidator } from '../../../../validators/rotation-validator';
import { QtDasharrayFixer } from '../../../../cartography/helpers/qt-dasharray-fixer';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StyleEditorDialogComponent', () => {
  let component: StyleEditorDialogComponent;
  let fixture: ComponentFixture<StyleEditorDialogComponent>;

  let mockDialogRef: any;
  let mockDrawingService: any;
  let mockToasterService: any;
  let mockDrawingToMapDrawingConverter: any;
  let mockMapDrawingToSvgConverter: any;
  let mockDrawingsDataSource: any;
  let mockNonNegativeValidator: any;
  let mockRotationValidator: any;

  let mockController: Controller;
  let mockProject: Project;
  let mockDrawing: Drawing;

  const createMockRectElement = (): RectElement => {
    const element = new RectElement();
    element.fill = '#ff0000';
    element.width = 100;
    element.height = 50;
    element.stroke = '#000000';
    element.stroke_width = 2;
    element.stroke_dasharray = 'none';
    element.rx = 5;
    element.ry = 5;
    return element;
  };

  const createMockEllipseElement = (): EllipseElement => {
    const element = new EllipseElement();
    element.fill = '#00ff00';
    element.width = 80;
    element.height = 40;
    element.stroke = '#0000ff';
    element.stroke_width = 3;
    element.stroke_dasharray = '5, 25';
    element.rx = 10;
    element.ry = 10;
    return element;
  };

  const createMockLineElement = (): LineElement => {
    const element = new LineElement();
    element.stroke = '#333333';
    element.stroke_width = 1;
    element.stroke_dasharray = '5, 25';
    element.x1 = 0;
    element.x2 = 100;
    element.y1 = 0;
    element.y2 = 100;
    return element;
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockToasterService = {
      warning: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
    };

    mockDrawingService = {
      update: vi.fn().mockReturnValue(of({})),
    };

    mockDrawingToMapDrawingConverter = {
      convert: vi.fn().mockReturnValue({}),
    };

    mockMapDrawingToSvgConverter = {
      convert: vi.fn().mockReturnValue('<svg></svg>'),
    };

    mockDrawingsDataSource = {
      update: vi.fn(),
    };

    mockNonNegativeValidator = {
      get: vi.fn().mockImplementation((control: UntypedFormControl) => {
        if (control.value === '' || control.value === null || control.value === undefined) {
          return null; // Required validator handles empty
        }
        if (+control.value < 0) {
          return { negativeValue: true };
        }
        return null;
      }),
    };

    mockRotationValidator = {
      get: vi.fn().mockImplementation((control: UntypedFormControl) => {
        if (control.value === '' || control.value === null || control.value === undefined) {
          return null;
        }
        const value = +control.value;
        if (value > -360 && value <= 360) {
          return null;
        }
        return { negativeValue: true };
      }),
    };

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local' as const,
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running' as const,
      protocol: 'http:' as const,
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockProject = {
      project_id: 'test-project-id',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened' as const,
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

    mockDrawing = {
      drawing_id: 'drawing-1',
      project_id: 'test-project-id',
      rotation: 45,
      svg: '<svg></svg>',
      locked: false,
      x: 100,
      y: 100,
      z: 1,
      element: createMockRectElement(),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: DrawingToMapDrawingConverter, useValue: mockDrawingToMapDrawingConverter },
        { provide: MapDrawingToSvgConverter, useValue: mockMapDrawingToSvgConverter },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: NonNegativeValidator, useValue: mockNonNegativeValidator },
        { provide: RotationValidator, useValue: mockRotationValidator },
        { provide: QtDasharrayFixer, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StyleEditorDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.project = mockProject;
    component.drawing = mockDrawing;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('form initialization', () => {
    it('should create form with borderWidth and rotation controls', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.formGroup).toBeDefined();
      expect(component.formGroup.get('borderWidth')).toBeDefined();
      expect(component.formGroup.get('rotation')).toBeDefined();
    });

    it('should have form controls with required and validator', () => {
      const borderWidthControl = component.formGroup.get('borderWidth');
      const rotationControl = component.formGroup.get('rotation');

      expect(borderWidthControl.hasError('required')).toBe(true);
      expect(rotationControl.hasError('required')).toBe(true);
    });
  });

  describe('ngOnInit with RectElement', () => {
    beforeEach(() => {
      component.drawing.element = createMockRectElement();
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should populate element data from drawing element', () => {
      expect(component.element.fill).toBe('#ff0000');
      expect(component.element.width).toBe(100);
      expect(component.element.height).toBe(50);
      expect(component.element.stroke).toBe('#000000');
      expect(component.element.stroke_width).toBe(2);
    });

    it('should set stroke_width to 0 when undefined', () => {
      const rectElement = new RectElement();
      rectElement.fill = '#fff';
      rectElement.width = 50;
      rectElement.height = 50;
      rectElement.stroke = '#000';
      rectElement.stroke_width = undefined;
      rectElement.stroke_dasharray = undefined;
      component.drawing.element = rectElement;
      component.ngOnInit();

      expect(component.element.stroke_width).toBe(0);
    });

    it('should populate rx and ry for rect elements', () => {
      expect(component.element.rx).toBe(5);
      expect(component.element.ry).toBe(5);
    });

    it('should set form borderWidth value from element stroke_width', () => {
      expect(component.formGroup.get('borderWidth').value).toBe(2);
    });

    it('should set form rotation value from drawing rotation', () => {
      expect(component.formGroup.get('rotation').value).toBe(45);
    });
  });

  describe('ngOnInit with EllipseElement', () => {
    beforeEach(() => {
      component.drawing.element = createMockEllipseElement();
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should populate element data from ellipse element', () => {
      expect(component.element.fill).toBe('#00ff00');
      expect(component.element.width).toBe(80);
      expect(component.element.height).toBe(40);
      expect(component.element.stroke).toBe('#0000ff');
      expect(component.element.stroke_width).toBe(3);
      expect(component.element.stroke_dasharray).toBe('5, 25');
    });

    it('should not have rx/ry for ellipse elements from form', () => {
      expect(component.element.rx).toBeUndefined();
      expect(component.element.ry).toBeUndefined();
    });
  });

  describe('ngOnInit with LineElement', () => {
    beforeEach(() => {
      component.drawing.element = createMockLineElement();
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should populate element data from line element', () => {
      expect(component.element.stroke).toBe('#333333');
      expect(component.element.stroke_width).toBe(1);
      expect(component.element.stroke_dasharray).toBe('5, 25');
    });

    it('should not have fill/width/height for line elements', () => {
      expect(component.element.fill).toBeUndefined();
      expect(component.element.width).toBeUndefined();
      expect(component.element.height).toBeUndefined();
    });
  });

  describe('borderTypes', () => {
    it('should have 6 border types defined', () => {
      expect(component.borderTypes.length).toBe(6);
    });

    it('should include solid, dash, dot, and other border styles', () => {
      const borderTypeNames = component.borderTypes.map((bt) => bt.name);
      expect(borderTypeNames).toContain('Solid');
      expect(borderTypeNames).toContain('Dash');
      expect(borderTypeNames).toContain('Dot');
      expect(borderTypeNames).toContain('Dash Dot');
      expect(borderTypeNames).toContain('Dash Dot Dot');
      expect(borderTypeNames).toContain('No border');
    });
  });

  describe('onNoClick', () => {
    it('should close dialog when called', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onYesClick', () => {
    it('should call drawingService.update with controller and drawing', () => {
      component.ngOnInit();
      fixture.detectChanges();

      component.onYesClick();

      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, component.drawing);
    });

    it('should close dialog after successful update', () => {
      component.ngOnInit();
      fixture.detectChanges();

      component.onYesClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('ElementData class', () => {
    it('should create an instance with all properties undefined', () => {
      const elementData = new ElementData();

      expect(elementData.fill).toBeUndefined();
      expect(elementData.width).toBeUndefined();
      expect(elementData.height).toBeUndefined();
      expect(elementData.stroke).toBeUndefined();
      expect(elementData.stroke_width).toBeUndefined();
      expect(elementData.stroke_dasharray).toBeUndefined();
      expect(elementData.rx).toBeUndefined();
      expect(elementData.ry).toBeUndefined();
    });
  });
});
