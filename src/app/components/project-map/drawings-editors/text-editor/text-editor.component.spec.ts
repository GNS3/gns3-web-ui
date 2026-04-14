import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TextEditorDialogComponent, StyleProperty } from './text-editor.component';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { FontFixer } from '../../../../cartography/helpers/font-fixer';
import { TextElement } from '../../../../cartography/models/drawings/text-element';
import { Label } from '../../../../cartography/models/label';
import { DrawingService } from '@services/drawing.service';
import { LinkService } from '@services/link.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { RotationValidator } from '../../../../validators/rotation-validator';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TextEditorDialogComponent', () => {
  let fixture: ComponentFixture<TextEditorDialogComponent>;
  let component: TextEditorDialogComponent;
  let mockDialogRef: any;
  let mockDrawingService: any;
  let mockNodeService: any;
  let mockLinkService: any;
  let mockToasterService: any;
  let mockNodesDataSource: any;
  let mockLinksDataSource: any;
  let mockDrawingsDataSource: any;
  let mockDrawingToMapDrawingConverter: any;
  let mockMapDrawingToSvgConverter: any;
  let mockFontFixer: any;
  let mockRotationValidator: any;

  const createTextElement = (): TextElement => {
    const element = new TextElement();
    element.height = 100;
    element.width = 100;
    element.text = 'Test Text';
    element.fill = '#000000';
    element.fill_opacity = 1;
    element.font_family = 'TypeWriter';
    element.font_size = 10;
    element.font_weight = 'normal';
    element.text_decoration = '';
    return element;
  };

  const createMockLabel = (
    style = 'font-family: Arial; font-size: 12; font-weight: normal; fill: #000; fill-opacity: 1;'
  ): any => ({
    text: 'Test Label',
    style,
    rotation: 0,
  });

  const createMockNode = (label: any): any => ({
    node_id: 'node1',
    name: 'Test Node',
    label,
  });

  const createMockLinkNode = (label: any): any => ({
    node_id: 'node1',
    adapter_number: 0,
    port_number: 0,
    label,
  });

  const createMockLink = (linkNode: any): any => ({
    link_id: 'link1',
    project_id: 'proj1',
    nodes: [linkNode],
    capture_file_name: '',
    capture_file_path: '',
    capturing: false,
    link_type: 'ethernet',
    suspend: false,
    distance: 0,
    length: 0,
    x: 0,
    y: 0,
  });

  const createMockDrawing = (element: TextElement): any => ({
    drawing_id: 'drawing1',
    project_id: 'proj1',
    rotation: 0,
    svg: '<svg></svg>',
    locked: false,
    x: 0,
    y: 0,
    z: 0,
    element,
  });

  const createMockController = (): any => ({
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    protocol: 'http:',
    username: '',
    password: '',
    authToken: '',
  });

  const createMockProject = (): any => ({
    project_id: 'proj1',
  });

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockDrawingService = {
      update: vi.fn().mockReturnValue({ subscribe: (fn: (d: any) => void) => fn({}) }),
    };

    mockNodeService = {
      updateLabel: vi.fn().mockReturnValue({ subscribe: (fn: (n: any) => void) => fn({}) }),
    };

    mockLinkService = {
      updateLink: vi.fn().mockReturnValue({ subscribe: (fn: (l: any) => void) => fn({}) }),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockNodesDataSource = {
      update: vi.fn(),
    };

    mockLinksDataSource = {
      update: vi.fn(),
    };

    mockDrawingsDataSource = {
      update: vi.fn(),
    };

    mockDrawingToMapDrawingConverter = {
      convert: vi.fn().mockReturnValue({}),
    };

    mockMapDrawingToSvgConverter = {
      convert: vi.fn().mockReturnValue('<svg></svg>'),
    };

    mockFontFixer = {
      fix: vi.fn().mockImplementation((font: any) => font),
    };

    mockRotationValidator = {
      get: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        TextEditorDialogComponent,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: NodeService, useValue: mockNodeService },
        { provide: LinkService, useValue: mockLinkService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: DrawingToMapDrawingConverter, useValue: mockDrawingToMapDrawingConverter },
        { provide: MapDrawingToSvgConverter, useValue: mockMapDrawingToSvgConverter },
        { provide: FontFixer, useValue: mockFontFixer },
        { provide: RotationValidator, useValue: mockRotationValidator },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextEditorDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Dialog Lifecycle', () => {
    it('should close dialog when onNoClick is called', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Drawing mode', () => {
    beforeEach(() => {
      component.drawing = createMockDrawing(createTextElement());
      component.controller = createMockController();
      component.project = createMockProject();
      fixture.detectChanges();
    });

    it('should initialize with drawing element data', () => {
      expect(component.element).toBeDefined();
      expect(component.isTextEditable).toBe(true);
    });

    it('should update drawing rotation when form value changes', () => {
      component.formGroup.patchValue({ rotation: '90' });
      component.onYesClick();
      expect(component.drawing?.rotation).toBe(90);
    });

    it('should update drawing element when element properties change', () => {
      const newText = 'Updated Text';
      component.element.text = newText;
      component.onYesClick();
      expect((component.drawing?.element as TextElement)?.text).toBe(newText);
    });

    it('should call drawingService.update when saving drawing', () => {
      component.onYesClick();
      expect(mockDrawingService.update).toHaveBeenCalled();
    });

    it('should close dialog after successful drawing update', () => {
      component.onYesClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Node label mode', () => {
    let mockLabel: any;
    let mockNode: any;

    beforeEach(() => {
      mockLabel = createMockLabel();
      mockNode = createMockNode(mockLabel);
      component.label = mockLabel;
      component.node = mockNode;
      component.controller = createMockController();
      component.project = createMockProject();
      fixture.detectChanges();
    });

    it('should not be editable in node label mode', () => {
      expect(component.isTextEditable).toBe(false);
    });

    it('should update node label style when saving', () => {
      component.onYesClick();
      expect(mockNodeService.updateLabel).toHaveBeenCalled();
    });

    it('should update node label rotation from form', () => {
      component.formGroup.patchValue({ rotation: '180' });
      component.onYesClick();
      expect(mockNode.label.rotation).toBe(180);
    });

    it('should close dialog after successful label update', () => {
      component.onYesClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Link node mode', () => {
    let mockLabel: Label;
    let mockLinkNode: any;
    let mockLink: any;

    beforeEach(() => {
      mockLabel = createMockLabel();
      mockLinkNode = createMockLinkNode(mockLabel);
      mockLink = createMockLink(mockLinkNode);
      component.linkNode = mockLinkNode;
      component.link = mockLink;
      component.controller = createMockController();
      component.project = createMockProject();
      fixture.detectChanges();
    });

    it('should be editable in link node mode', () => {
      expect(component.isTextEditable).toBe(true);
    });

    it('should update link label style when saving', () => {
      component.onYesClick();
      expect(mockLinkService.updateLink).toHaveBeenCalled();
    });

    it('should update link label rotation from form', () => {
      component.formGroup.patchValue({ rotation: '270' });
      component.onYesClick();
      expect(component.link.nodes[0].label.rotation).toBe(270);
    });

    it('should update link label text when element text changes', () => {
      component.element.text = 'Link Label Text';
      component.onYesClick();
      expect(component.link.nodes[0].label.text).toBe('Link Label Text');
    });

    it('should close dialog after successful link update', () => {
      component.onYesClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      component.drawing = createMockDrawing(createTextElement());
      component.controller = createMockController();
      component.project = createMockProject();
      fixture.detectChanges();
    });

    it('should show error when rotation form control is invalid', () => {
      component.formGroup.patchValue({ rotation: '' });
      component.formGroup.markAsTouched();
      fixture.detectChanges();
      expect(component.formGroup.valid).toBe(false);
    });

    it('should call toaster error when form is invalid on save', () => {
      component.formGroup.patchValue({ rotation: '' });
      component.onYesClick();
      expect(mockToasterService.error).toHaveBeenCalled();
    });
  });

  describe('getStyleFromTextElement', () => {
    beforeEach(() => {
      component.element = createTextElement();
      component.element.font_family = 'Arial';
      component.element.font_size = 14;
      component.element.font_weight = 'bold';
      component.element.fill = '#ff0000';
      component.element.fill_opacity = 0.5;
    });

    it('should return correctly formatted style string', () => {
      const style = component.getStyleFromTextElement();
      expect(style).toContain('font-family: Arial');
      expect(style).toContain('font-size: 14');
      expect(style).toContain('font-weight: bold');
      expect(style).toContain('fill: #ff0000');
      expect(style).toContain('fill-opacity: 0.5');
    });
  });

  describe('getTextElementFromLabel', () => {
    it('should parse label style into text element properties', () => {
      // Style format: properties separated by semicolons without space after semicolon
      component.label = createMockLabel(
        'font-family: Helvetica;font-size: 16;font-weight: 600;fill: #00ff00;fill-opacity: 0.8'
      );
      const textElement = component.getTextElementFromLabel();
      expect(textElement.font_family).toBe('Helvetica');
      expect(textElement.font_size).toBe(16);
      expect(textElement.font_weight).toBe('600');
      expect(textElement.fill).toBe('#00ff00');
      expect(textElement.fill_opacity).toBe(0.8);
    });

    it('should use default values for missing style properties', () => {
      component.label = createMockLabel('');
      const textElement = component.getTextElementFromLabel();
      expect(textElement.font_family).toBe('TypeWriter');
      expect(textElement.font_size).toBe(10);
      expect(textElement.font_weight).toBe('normal');
      expect(textElement.fill).toBe('#000000');
      expect(textElement.fill_opacity).toBe(1);
    });
  });

  describe('changeTextColor', () => {
    beforeEach(() => {
      component.drawing = createMockDrawing(createTextElement());
      component.controller = createMockController();
      component.project = createMockProject();
      fixture.detectChanges();
    });

    it('should be callable with a color value', () => {
      // changeTextColor updates the DOM textarea style via renderer
      // The method signature accepts a color string parameter
      expect(() => component.changeTextColor('#ff0000')).not.toThrow();
    });
  });

  describe('StyleProperty interface', () => {
    it('should allow creating StyleProperty with property and value', () => {
      const styleProperty: StyleProperty = { property: 'color', value: '#000' };
      expect(styleProperty.property).toBe('color');
      expect(styleProperty.value).toBe('#000');
    });
  });
});
