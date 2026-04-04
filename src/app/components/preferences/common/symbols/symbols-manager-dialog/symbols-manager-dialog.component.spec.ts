import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SymbolsManagerDialogComponent } from './symbols-manager-dialog.component';
import { SymbolService } from '@services/symbol.service';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SymbolsManagerDialogComponent', () => {
  let component: SymbolsManagerDialogComponent;
  let fixture: ComponentFixture<SymbolsManagerDialogComponent>;
  let mockDialogRef: any;
  let mockSymbolService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: '127.0.0.1',
    port: 3080,
    protocol: 'http:',
    location: 'local',
    username: 'admin',
    password: 'admin',
    authToken: 'token',
    tokenExpired: false,
    path: '/',
    ubridge_path: '',
    status: 'running',
  };

  const mockDialogData = { controller: mockController };

  const mockSymbols: Symbol[] = [
    { builtin: false, filename: 'router.svg', symbol_id: 'router', raw: '<svg></svg>' },
    { builtin: false, filename: 'switch.svg', symbol_id: 'switch', raw: '<svg></svg>' },
    { builtin: true, filename: 'computer.svg', symbol_id: 'computer', raw: '<svg></svg>' },
  ];

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockSymbolService = {
      list: vi.fn().mockReturnValue(of(mockSymbols)),
      add: vi.fn(),
      addFile: vi.fn(),
      delete: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [SymbolsManagerDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SymbolService, useValue: mockSymbolService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SymbolsManagerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize controller from dialog data', () => {
    expect(component.controller()).toEqual(mockController);
  });

  it('should set activeTab to 0 by default', () => {
    expect(component.activeTab()).toBe(0);
  });

  it('should load custom symbols on initialization (non-builtin only)', () => {
    // Component loads symbols in constructor, filtering out builtin symbols
    expect(component.customSymbols().length).toBe(2);
    expect(component.customSymbols()[0].symbol_id).toBe('router');
    expect(component.customSymbols()[1].symbol_id).toBe('switch');
  });

  it('should initialize selectedForDeletion as empty Set', () => {
    expect(component.selectedForDeletion().size).toBe(0);
  });

  it('should initialize uploadStatus as empty string', () => {
    expect(component.uploadStatus()).toBe('');
  });

  it('should initialize uploadSuccess as false', () => {
    expect(component.uploadSuccess()).toBe(false);
  });

  describe('onCloseClick', () => {
    it('should close the dialog', () => {
      component.onCloseClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onTabChange', () => {
    it('should set activeTab to the given index', () => {
      component.onTabChange(1);
      expect(component.activeTab()).toBe(1);
    });

    it('should call loadCustomSymbols when switching to Manage tab (index 1)', () => {
      mockSymbolService.list.mockReturnValue(of(mockSymbols));
      const loadCustomSymbolsSpy = vi.spyOn(component, 'loadCustomSymbols' as any);
      component.onTabChange(1);
      expect(loadCustomSymbolsSpy).toHaveBeenCalled();
    });

    it('should not call loadCustomSymbols when switching to Add tab (index 0)', () => {
      const loadCustomSymbolsSpy = vi.spyOn(component, 'loadCustomSymbols' as any);
      component.onTabChange(0);
      expect(loadCustomSymbolsSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadCustomSymbols', () => {
    it('should load custom symbols and filter out builtin symbols', () => {
      mockSymbolService.list.mockReturnValue(of(mockSymbols));
      component.loadCustomSymbols();
      expect(mockSymbolService.list).toHaveBeenCalledWith(mockController);
      expect(component.customSymbols().length).toBe(2);
      expect(component.customSymbols()[0].symbol_id).toBe('router');
      expect(component.customSymbols()[1].symbol_id).toBe('switch');
    });

    it('should not load symbols if controller is undefined', () => {
      // The loadCustomSymbols guard checks if controller() is falsy
      // Since controller is set in constructor from dialog data, we test the guard behavior
      // by calling loadCustomSymbols after resetting controller
      component.controller.set(undefined as any);
      component.loadCustomSymbols();
      // Guard should prevent the service call
      expect(mockSymbolService.list).toHaveBeenCalledTimes(1); // Called once in constructor
    });
  });

  describe('getImageSource', () => {
    it('should return correct image URL for symbol', () => {
      const imageUrl = component.getImageSource('router');
      expect(imageUrl).toContain('127.0.0.1');
      expect(imageUrl).toContain('3080');
      expect(imageUrl).toContain('router');
    });

    it('should return empty string if controller is undefined', () => {
      component.controller.set(undefined as any);
      const imageUrl = component.getImageSource('router');
      expect(imageUrl).toBe('');
    });
  });

  describe('toggleSelection', () => {
    it('should add symbol to selection if not already selected', () => {
      component.toggleSelection('router');
      expect(component.selectedForDeletion().has('router')).toBe(true);
    });

    it('should remove symbol from selection if already selected', () => {
      component.toggleSelection('router');
      component.toggleSelection('router');
      expect(component.selectedForDeletion().has('router')).toBe(false);
    });

    it('should handle multiple symbols', () => {
      component.toggleSelection('router');
      component.toggleSelection('switch');
      expect(component.selectedForDeletion().size).toBe(2);
    });
  });

  describe('isSymbolSelected', () => {
    it('should return true if symbol is selected', () => {
      component.selectedForDeletion.set(new Set(['router']));
      expect(component.isSymbolSelected('router')).toBe(true);
    });

    it('should return false if symbol is not selected', () => {
      component.selectedForDeletion.set(new Set(['router']));
      expect(component.isSymbolSelected('switch')).toBe(false);
    });
  });

  describe('selectAllCustom', () => {
    it('should select all custom symbols', () => {
      component.customSymbols.set(mockSymbols.filter((s) => !s.builtin));
      component.selectAllCustom();
      expect(component.selectedForDeletion().size).toBe(2);
      expect(component.selectedForDeletion().has('router')).toBe(true);
      expect(component.selectedForDeletion().has('switch')).toBe(true);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      component.selectedForDeletion.set(new Set(['router', 'switch']));
      component.clearSelection();
      expect(component.selectedForDeletion().size).toBe(0);
    });
  });

  describe('hasSelectedSymbols', () => {
    it('should return true when symbols are selected', () => {
      component.selectedForDeletion.set(new Set(['router']));
      expect(component.hasSelectedSymbols()).toBe(true);
    });

    it('should return false when no symbols are selected', () => {
      component.selectedForDeletion.set(new Set());
      expect(component.hasSelectedSymbols()).toBe(false);
    });
  });

  describe('deleteSelectedSymbols', () => {
    it('should delete selected symbols', () => {
      component.customSymbols.set(mockSymbols.filter((s) => !s.builtin));
      component.selectedForDeletion.set(new Set(['router', 'switch']));
      mockSymbolService.delete.mockReturnValue(of({}));

      component.deleteSelectedSymbols();

      expect(mockSymbolService.delete).toHaveBeenCalledTimes(2);
      expect(mockSymbolService.delete).toHaveBeenCalledWith(mockController, 'router');
      expect(mockSymbolService.delete).toHaveBeenCalledWith(mockController, 'switch');
    });

    it('should not call delete if no symbols are selected', () => {
      component.deleteSelectedSymbols();
      expect(mockSymbolService.delete).not.toHaveBeenCalled();
    });

    it('should clear selection after deletion', () => {
      component.customSymbols.set(mockSymbols.filter((s) => !s.builtin));
      component.selectedForDeletion.set(new Set(['router']));
      mockSymbolService.delete.mockReturnValue(of({}));

      component.deleteSelectedSymbols();

      expect(component.selectedForDeletion().size).toBe(0);
    });

    it('should emit symbolsUpdated event after deletion', () => {
      component.customSymbols.set(mockSymbols.filter((s) => !s.builtin));
      component.selectedForDeletion.set(new Set(['router']));
      mockSymbolService.delete.mockReturnValue(of({}));

      const symbolsUpdatedSpy = vi.spyOn(component.symbolsUpdated, 'emit');
      component.deleteSelectedSymbols();

      expect(symbolsUpdatedSpy).toHaveBeenCalled();
    });
  });

  describe('uploadSymbolFile', () => {
    let mockEvent: any;

    beforeEach(() => {
      mockEvent = {
        target: {
          files: [new File(['test'], 'router.svg', { type: 'image/svg+xml' })],
          value: 'test',
        },
      };
    });

    it('should handle SVG file upload', () => {
      mockSymbolService.add.mockReturnValue(of({}));
      const fileReaderSpy = vi.spyOn(FileReader.prototype, 'readAsText');

      component.uploadSymbolFile(mockEvent);

      expect(component.uploadStatus()).toContain('Uploading router.svg...');
      expect(component.uploadSuccess()).toBe(false);
    });

    it('should handle PNG file upload', () => {
      const pngFile = new File(['test'], 'router.png', { type: 'image/png' });
      mockEvent.target.files = [pngFile];
      mockEvent.target.value = 'test';
      mockSymbolService.addFile.mockReturnValue(of({}));

      component.uploadSymbolFile(mockEvent);

      expect(mockSymbolService.addFile).toHaveBeenCalled();
    });

    it('should handle JPG file upload', () => {
      const jpgFile = new File(['test'], 'router.jpg', { type: 'image/jpeg' });
      mockEvent.target.files = [jpgFile];
      mockEvent.target.value = 'test';
      mockSymbolService.addFile.mockReturnValue(of({}));

      component.uploadSymbolFile(mockEvent);

      expect(mockSymbolService.addFile).toHaveBeenCalled();
    });

    it('should handle unknown file type as binary', () => {
      const txtFile = new File(['test'], 'router.txt', { type: 'text/plain' });
      mockEvent.target.files = [txtFile];
      mockEvent.target.value = 'test';
      mockSymbolService.addFile.mockReturnValue(of({}));

      component.uploadSymbolFile(mockEvent);

      expect(mockSymbolService.addFile).toHaveBeenCalled();
    });

    it('should return early if no file is selected', () => {
      mockEvent.target.files = [undefined];
      component.uploadSymbolFile(mockEvent);
      expect(component.uploadStatus()).toBe('');
    });

    it('should reset the file input value', () => {
      mockSymbolService.add.mockReturnValue(of({}));
      component.uploadSymbolFile(mockEvent);
      expect(mockEvent.target.value).toBe('');
    });
  });

  describe('template rendering', () => {
    it('should display Symbols Manager title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent).toContain('Symbols Manager');
    });

    it('should have Add Symbol tab', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Add Symbol');
    });

    it('should have Manage Symbols tab', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Manage Symbols');
    });

    it('should have Close button in mat-dialog-actions', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dialogActions = compiled.querySelector('mat-dialog-actions');
      const closeButton = dialogActions?.querySelector('button');
      expect(closeButton?.textContent).toContain('Close');
    });
  });
});
