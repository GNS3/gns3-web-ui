import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { TextEditedComponent } from './text-edited.component';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { ToasterService } from '@services/toaster.service';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingService } from '@services/drawing.service';
import { TextEditedDataEvent } from '../../../cartography/events/event-source';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Drawing } from '../../../cartography/models/drawing';
import { DrawingElement } from '../../../cartography/models/drawings/drawing-element';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TextEditedComponent', () => {
  let fixture: ComponentFixture<TextEditedComponent>;
  let component: TextEditedComponent;
  let mockDrawingsEventSource: any;
  let mockDrawingsDataSource: any;
  let mockDrawingService: any;
  let mockMapDrawingToSvgConverter: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let textEditedSubject: Subject<TextEditedDataEvent>;

  const mockController: Controller = {
    authToken: 'token',
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    status: 'stopped',
    protocol: 'http:',
    username: 'user',
    password: 'pass',
    tokenExpired: false,
  };

  const mockTextElement: TextElement = {
    height: 20,
    width: 100,
    fill: '#000000',
    fill_opacity: 1,
    font_family: 'Arial',
    font_size: 14,
    font_weight: 'normal',
    text: 'Hello',
    text_decoration: '',
  };

  const mockElement: DrawingElement = {
    height: 20,
    width: 100,
  };

  const mockDrawing: Drawing = {
    drawing_id: 'drawing1',
    project_id: 'proj1',
    svg: '<svg>old</svg>',
    x: 10,
    y: 20,
    z: 1,
    locked: false,
    rotation: 0,
    element: mockElement,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    textEditedSubject = new Subject<TextEditedDataEvent>();

    mockDrawingsEventSource = {
      textEdited: textEditedSubject,
      textSaved: { emit: vi.fn() },
    };

    mockDrawingsDataSource = {
      get: vi.fn().mockReturnValue(mockDrawing),
      update: vi.fn(),
    };

    mockDrawingService = {
      updateText: vi.fn().mockReturnValue(of(mockDrawing)),
    };

    mockMapDrawingToSvgConverter = {
      convert: vi.fn().mockReturnValue('<svg>converted</svg>'),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TextEditedComponent],
      providers: [
        { provide: DrawingsEventSource, useValue: mockDrawingsEventSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: MapDrawingToSvgConverter, useValue: mockMapDrawingToSvgConverter },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextEditedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controller', mockController);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    textEditedSubject.complete();
  });

  describe('ngOnInit', () => {
    it('should subscribe to textEdited event on init', () => {
      const subscribeSpy = vi.spyOn(mockDrawingsEventSource.textEdited, 'subscribe');
      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe('onTextEdited', () => {
    it('should subscribe to textEdited event on init', () => {
      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      textEditedSubject.next(event);

      expect(mockMapDrawingToSvgConverter.convert).toHaveBeenCalled();
      expect(mockDrawingsDataSource.get).toHaveBeenCalledWith('drawing1');
      expect(mockDrawingService.updateText).toHaveBeenCalledWith(mockController, mockDrawing, '<svg>converted</svg>');
    });

    it('should update drawingsDataSource and emit textSaved on successful update', () => {
      const updatedDrawing: Drawing = { ...mockDrawing, svg: '<svg>updated</svg>' };
      mockDrawingService.updateText.mockReturnValue(of(updatedDrawing));

      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      textEditedSubject.next(event);

      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(updatedDrawing);
      expect(mockDrawingsEventSource.textSaved.emit).toHaveBeenCalledWith(true);
    });

    it('should still call updateText even when drawing is not found in dataSource', () => {
      mockDrawingsDataSource.get.mockReturnValue(undefined);

      const event = new TextEditedDataEvent('unknown', 'New Text', mockTextElement);
      textEditedSubject.next(event);

      expect(mockDrawingService.updateText).toHaveBeenCalledWith(mockController, undefined, '<svg>converted</svg>');
    });
  });

  describe('error handling', () => {
    it('should display error message when updateText fails with error.error.message', async () => {
      const errorMessage = 'Failed to update text: drawing locked';
      const mockError = {
        error: { message: errorMessage },
      };
      mockDrawingService.updateText.mockReturnValue(throwError(() => mockError));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      component.onTextEdited(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display error message when updateText fails with err.message', async () => {
      const errorMessage = 'Network connection failed';
      const error = new Error(errorMessage);
      mockDrawingService.updateText.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      component.onTextEdited(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error message when error has no message', async () => {
      const error = {};
      mockDrawingService.updateText.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      component.onTextEdited(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update text drawing');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should not update data source when updateText fails', async () => {
      const error = new Error('Update failed');
      mockDrawingService.updateText.mockReturnValue(throwError(() => error));

      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      component.onTextEdited(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockDrawingsDataSource.update).not.toHaveBeenCalled();
    });

    it('should not emit textSaved when updateText fails', async () => {
      const error = new Error('Update failed');
      mockDrawingService.updateText.mockReturnValue(throwError(() => error));

      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      component.onTextEdited(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockDrawingsEventSource.textSaved.emit).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from textEdited', () => {
      const unsubscribeSpy = vi.spyOn(component['textEdited'], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not call updateText after component is destroyed', async () => {
      // Destroy the component (which unsubscribes)
      component.ngOnDestroy();

      // Clear previous calls
      vi.clearAllMocks();
      mockDrawingService.updateText.mockClear();

      // Emit event through the event source after destruction
      const event = new TextEditedDataEvent('drawing1', 'New Text', mockTextElement);
      textEditedSubject.next(event);
      await vi.runAllTimersAsync();

      // Should not call updateText since subscription is cancelled
      expect(mockDrawingService.updateText).not.toHaveBeenCalled();
    });
  });
});
