import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { EditStyleActionComponent } from './edit-style-action.component';
import { DrawingToMapDrawingConverter } from '../../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../../../validators/non-negative-validator';
import { RotationValidator } from '../../../../../validators/rotation-validator';
import { QtDasharrayFixer } from '../../../../../cartography/helpers/qt-dasharray-fixer';
import { Drawing } from '../../../../../cartography/models/drawing';
import { EllipseElement } from '../../../../../cartography/models/drawings/ellipse-element';
import { ImageElement } from '../../../../../cartography/models/drawings/image-element';
import { TextElement } from '../../../../../cartography/models/drawings/text-element';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditStyleActionComponent', () => {
  let fixture: ComponentFixture<EditStyleActionComponent>;
  let mockDialogRef: any;

  const createMockDrawing = (element: EllipseElement | ImageElement | TextElement): Drawing => ({
    drawing_id: 'drawing-1',
    project_id: 'proj-1',
    rotation: 0,
    svg: '',
    locked: false,
    x: 100,
    y: 100,
    z: 0,
    element,
  });

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: {
        drawing: undefined,
        element: { stroke_width: 0 },
      },
      afterClosed: vi.fn(),
    };

    const mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    await TestBed.configureTestingModule({
      imports: [EditStyleActionComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DrawingToMapDrawingConverter, useValue: { convert: vi.fn() } },
        { provide: MapDrawingToSvgConverter, useValue: { convert: vi.fn() } },
        { provide: DrawingsDataSource, useValue: { update: vi.fn() } },
        { provide: DrawingService, useValue: { update: vi.fn() } },
        { provide: ToasterService, useValue: { warning: vi.fn(), error: vi.fn(), success: vi.fn() } },
        { provide: NonNegativeValidator, useValue: { get: vi.fn() } },
        { provide: RotationValidator, useValue: { get: vi.fn() } },
        { provide: QtDasharrayFixer, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditStyleActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('button visibility', () => {
    it('should show button when drawing is a non-image element', () => {
      const ellipse = new EllipseElement();
      ellipse.width = 100;
      ellipse.height = 100;
      const mockDrawing = createMockDrawing(ellipse);
      fixture.componentRef.setInput('drawing', mockDrawing);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Edit style');
    });

    it('should show button when drawing is a TextElement', () => {
      const text = new TextElement();
      text.width = 100;
      text.height = 20;
      const mockDrawing = createMockDrawing(text);
      fixture.componentRef.setInput('drawing', mockDrawing);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Edit style');
    });

    it('should hide button when drawing is an ImageElement', () => {
      const image = new ImageElement();
      image.width = 100;
      image.height = 100;
      image.data = 'base64data';
      const mockDrawing = createMockDrawing(image);
      fixture.componentRef.setInput('drawing', mockDrawing);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });

    it('should hide button when drawing is undefined', () => {
      fixture.componentRef.setInput('drawing', undefined);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });
  });

  describe('isImageDrawing', () => {
    it('should be false when drawing element is EllipseElement', () => {
      const ellipse = new EllipseElement();
      ellipse.width = 100;
      ellipse.height = 100;
      const mockDrawing = createMockDrawing(ellipse);
      fixture.componentRef.setInput('drawing', mockDrawing);
      fixture.detectChanges();

      expect(fixture.componentInstance.isImageDrawing).toBe(false);
    });

    it('should be false when drawing element is TextElement', () => {
      const text = new TextElement();
      text.width = 100;
      text.height = 20;
      const mockDrawing = createMockDrawing(text);
      fixture.componentRef.setInput('drawing', mockDrawing);
      fixture.detectChanges();

      expect(fixture.componentInstance.isImageDrawing).toBe(false);
    });

    it('should be true when drawing element is ImageElement', () => {
      const image = new ImageElement();
      image.width = 100;
      image.height = 100;
      image.data = 'base64data';
      const mockDrawing = createMockDrawing(image);
      fixture.componentRef.setInput('drawing', mockDrawing);
      fixture.detectChanges();

      expect(fixture.componentInstance.isImageDrawing).toBe(true);
    });
  });
});
