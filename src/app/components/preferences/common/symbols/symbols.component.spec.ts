import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SymbolsComponent } from './symbols.component';
import { SymbolService } from '@services/symbol.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SymbolsComponent', () => {
  let fixture: ComponentFixture<SymbolsComponent>;
  let component: SymbolsComponent;
  let mockSymbolService: any;
  let mockDialog: any;
  let mockDialogConfigService: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockSymbols: Symbol[];

  const createMockSymbol = (overrides: Partial<Symbol> = {}): Symbol => ({
    builtin: false,
    filename: 'test.svg',
    symbol_id: 'test_symbol',
    raw: '/symbols/test/raw',
    theme: 'Router',
    ...overrides,
  });

  beforeEach(async () => {
    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '/',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      authToken: 'token',
      tokenExpired: false,
    };

    mockSymbols = [
      createMockSymbol({ symbol_id: 'router', builtin: true, theme: 'Router' }),
      createMockSymbol({ symbol_id: 'switch', builtin: true, theme: 'Switch' }),
      createMockSymbol({ symbol_id: 'custom_router', builtin: false, theme: 'Router' }),
      createMockSymbol({ symbol_id: 'custom_switch', builtin: false, theme: 'Switch' }),
      createMockSymbol({ symbol_id: 'cloud', builtin: true, theme: 'Cloud' }),
      createMockSymbol({ symbol_id: 'other', builtin: false, theme: 'Other' }),
    ];

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockDialogConfigService = {
      openConfig: vi.fn().mockReturnValue({ panelClass: ['base-dialog-panel'] }),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true)),
      }),
    };

    mockSymbolService = {
      list: vi.fn().mockReturnValue(of(mockSymbols)),
      delete: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [SymbolsComponent, MatDialogModule, ConfirmationDialogComponent],
      providers: [
        { provide: SymbolService, useValue: mockSymbolService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SymbolsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('symbol', 'router');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load symbols on ngOnInit', () => {
      expect(mockSymbolService.list).toHaveBeenCalledWith(mockController);
    });

    it('should set isSelected from symbol input', () => {
      expect(component.isSelected).toBe('router');
    });

    it('should populate symbols and filteredSymbols arrays', () => {
      expect(component.symbols).toEqual(mockSymbols);
      expect(component.filteredSymbols).toEqual(mockSymbols);
    });

    it('should group symbols by theme', () => {
      expect(component.symbolGroups.length).toBe(4);
      expect(component.symbolGroups.find((g) => g.theme === 'Router')?.symbols.length).toBe(2);
      expect(component.symbolGroups.find((g) => g.theme === 'Switch')?.symbols.length).toBe(2);
      expect(component.symbolGroups.find((g) => g.theme === 'Cloud')?.symbols.length).toBe(1);
      expect(component.symbolGroups.find((g) => g.theme === 'Other')?.symbols.length).toBe(1);
    });

    it('should sort symbol groups alphabetically', () => {
      const themes = component.symbolGroups.map((g) => g.theme);
      expect(themes).toEqual(['Cloud', 'Other', 'Router', 'Switch']);
    });
  });

  describe('setFilter()', () => {
    it('should show all symbols when filter is "all"', () => {
      component.setFilter('all');
      expect(component.filteredSymbols).toEqual(mockSymbols);
    });

    it('should show only builtin symbols when filter is "builtin"', () => {
      component.setFilter('builtin');
      expect(component.filteredSymbols).toEqual(mockSymbols.filter((s) => s.builtin));
      expect(component.filteredSymbols.length).toBe(3);
      expect(component.filteredSymbols.every((s) => s.builtin)).toBe(true);
    });

    it('should show only custom symbols when filter is "custom"', () => {
      component.setFilter('custom');
      expect(component.filteredSymbols).toEqual(mockSymbols.filter((s) => !s.builtin));
      expect(component.filteredSymbols.length).toBe(3);
      expect(component.filteredSymbols.every((s) => !s.builtin)).toBe(true);
    });

    it('should update symbol groups after filtering', () => {
      component.setFilter('builtin');
      expect(component.symbolGroups.length).toBe(3);
    });
  });

  describe('setSelected()', () => {
    it('should update isSelected when called', () => {
      component.setSelected('switch');
      expect(component.isSelected).toBe('switch');
    });

    it('should emit symbolChanged with the selected symbol_id', () => {
      const emitSpy = vi.spyOn(component.symbolChanged, 'emit');
      component.setSelected('custom_router');
      expect(emitSpy).toHaveBeenCalledWith('custom_router');
    });
  });

  describe('toggleTheme()', () => {
    it('should add theme to expandedThemes when not present', () => {
      component.expandedThemes.set([]);
      component.toggleTheme('Router');
      expect(component.expandedThemes()).toContain('Router');
    });

    it('should remove theme from expandedThemes when already present', () => {
      component.expandedThemes.set(['Router', 'Switch']);
      component.toggleTheme('Router');
      expect(component.expandedThemes()).not.toContain('Router');
      expect(component.expandedThemes()).toContain('Switch');
    });
  });

  describe('isThemeExpanded()', () => {
    it('should return true if theme is expanded', () => {
      component.expandedThemes.set(['Router']);
      expect(component.isThemeExpanded('Router')).toBe(true);
    });

    it('should return false if theme is not expanded', () => {
      component.expandedThemes.set(['Router']);
      expect(component.isThemeExpanded('Switch')).toBe(false);
    });
  });

  describe('zoom controls', () => {
    describe('zoomIn()', () => {
      it('should increase zoom level by 0.1', () => {
        component.zoomLevel.set(1.0);
        component.zoomIn();
        expect(component.zoomLevel()).toBe(1.1);
      });

      it('should not exceed 2.0', () => {
        component.zoomLevel.set(2.0);
        component.zoomIn();
        expect(component.zoomLevel()).toBe(2.0);
      });

      it('should cap at 2.0 when incrementing would exceed', () => {
        component.zoomLevel.set(1.95);
        component.zoomIn();
        expect(component.zoomLevel()).toBe(2.0);
      });
    });

    describe('zoomOut()', () => {
      it('should decrease zoom level by 0.1', () => {
        component.zoomLevel.set(1.0);
        component.zoomOut();
        expect(component.zoomLevel()).toBe(0.9);
      });

      it('should not go below 0.5', () => {
        component.zoomLevel.set(0.5);
        component.zoomOut();
        expect(component.zoomLevel()).toBe(0.5);
      });

      it('should cap at 0.5 when decrementing would go below', () => {
        component.zoomLevel.set(0.55);
        component.zoomOut();
        expect(component.zoomLevel()).toBe(0.5);
      });
    });

    describe('resetZoom()', () => {
      it('should reset zoom level to 1.0', () => {
        component.zoomLevel.set(1.5);
        component.resetZoom();
        expect(component.zoomLevel()).toBe(1.0);
      });
    });
  });

  describe('delete mode', () => {
    describe('toggleDeleteMode()', () => {
      it('should enter delete mode from normal mode', () => {
        component.isDeleteMode.set(false);
        component.toggleDeleteMode();
        expect(component.isDeleteMode()).toBe(true);
      });

      it('should set filter to custom symbols when entering delete mode', () => {
        component.isDeleteMode.set(false);
        component.toggleDeleteMode();
        expect(component.filteredSymbols.every((s) => !s.builtin)).toBe(true);
      });

      it('should exit delete mode when already in delete mode', () => {
        component.isDeleteMode.set(true);
        component.toggleDeleteMode();
        expect(component.isDeleteMode()).toBe(false);
      });

      it('should clear selectedForDeletion when exiting delete mode', () => {
        component.isDeleteMode.set(true);
        component.selectedForDeletion.set(new Set(['router', 'switch']));
        component.toggleDeleteMode();
        expect(component.selectedForDeletion().size).toBe(0);
      });
    });

    describe('toggleSelection()', () => {
      it('should add symbol_id to selectedForDeletion when not present', () => {
        component.selectedForDeletion.set(new Set());
        component.toggleSelection('router');
        expect(component.selectedForDeletion()).toContain('router');
      });

      it('should remove symbol_id from selectedForDeletion when already present', () => {
        component.selectedForDeletion.set(new Set(['router', 'switch']));
        component.toggleSelection('router');
        expect(component.selectedForDeletion()).not.toContain('router');
        expect(component.selectedForDeletion()).toContain('switch');
      });
    });

    describe('isSymbolSelected()', () => {
      it('should return true if symbol_id is selected', () => {
        component.selectedForDeletion.set(new Set(['router']));
        expect(component.isSymbolSelected('router')).toBe(true);
      });

      it('should return false if symbol_id is not selected', () => {
        component.selectedForDeletion.set(new Set(['router']));
        expect(component.isSymbolSelected('switch')).toBe(false);
      });
    });

    describe('selectAllVisible()', () => {
      it('should select all custom symbols', () => {
        component.filteredSymbols = mockSymbols.filter((s) => !s.builtin);
        component.selectAllVisible();
        expect(component.selectedForDeletion().size).toBe(3);
      });

      it('should only select non-builtin symbols', () => {
        component.filteredSymbols = mockSymbols;
        component.selectAllVisible();
        expect(component.selectedForDeletion().size).toBe(3);
      });
    });

    describe('clearSelection()', () => {
      it('should clear all selected symbols', () => {
        component.selectedForDeletion.set(new Set(['router', 'switch', 'cloud']));
        component.clearSelection();
        expect(component.selectedForDeletion().size).toBe(0);
      });
    });

    describe('hasSelectedSymbols()', () => {
      it('should return true when symbols are selected', () => {
        component.selectedForDeletion.set(new Set(['router']));
        expect(component.hasSelectedSymbols()).toBe(true);
      });

      it('should return false when no symbols are selected', () => {
        component.selectedForDeletion.set(new Set());
        expect(component.hasSelectedSymbols()).toBe(false);
      });
    });
  });

  describe('canDeleteSymbol()', () => {
    it('should return false for builtin symbols', () => {
      const builtinSymbol = createMockSymbol({ builtin: true });
      expect(component.canDeleteSymbol(builtinSymbol)).toBe(false);
    });

    it('should return true for custom symbols', () => {
      const customSymbol = createMockSymbol({ builtin: false });
      expect(component.canDeleteSymbol(customSymbol)).toBe(true);
    });
  });

  describe('getImageSourceForTemplate()', () => {
    it('should return correct image URL for symbol', () => {
      const result = component.getImageSourceForTemplate('router');
      expect(result).toContain(mockController.protocol);
      expect(result).toContain(mockController.host);
      expect(result).toContain(mockController.port.toString());
      expect(result).toContain('symbols/router/raw');
    });
  });

  describe('loadSymbols()', () => {
    it('should fetch symbols from SymbolService', () => {
      mockSymbolService.list.mockClear();
      component.loadSymbols();
      expect(mockSymbolService.list).toHaveBeenCalledWith(mockController);
    });

    it('should populate symbols and filteredSymbols on success', () => {
      const newSymbols = [
        createMockSymbol({ symbol_id: 'new_router' }),
        createMockSymbol({ symbol_id: 'new_switch' }),
      ];
      mockSymbolService.list.mockReturnValue(of(newSymbols));
      component.loadSymbols();
      expect(component.symbols).toEqual(newSymbols);
      expect(component.filteredSymbols).toEqual(newSymbols);
    });
  });
});
