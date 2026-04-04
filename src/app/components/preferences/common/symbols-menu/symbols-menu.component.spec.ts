import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SymbolsMenuComponent } from './symbols-menu.component';
import { SymbolsComponent } from '../symbols/symbols.component';
import { MatButtonModule } from '@angular/material/button';
import { Controller } from '@models/controller';
import { SymbolService } from '@services/symbol.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockSymbolService = {
  list: vi.fn().mockReturnValue({ subscribe: (cb: (data: any) => void) => cb([]) }),
  get: vi.fn(),
  delete: vi.fn(),
};

const mockDialog = {
  open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue({ subscribe: (cb: (result: boolean) => void) => cb(true) }) }),
};

const mockDialogConfigService = {
  openConfig: vi.fn(),
};

describe('SymbolsMenuComponent', () => {
  let component: SymbolsMenuComponent;
  let fixture: ComponentFixture<SymbolsMenuComponent>;

  let mockController: Controller;
  let symbolChangedEmitterSpy: any;

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

    await TestBed.configureTestingModule({
      imports: [SymbolsMenuComponent, MatButtonModule],
      providers: [
        { provide: SymbolService, useValue: mockSymbolService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SymbolsMenuComponent);
    component = fixture.componentInstance;
    symbolChangedEmitterSpy = vi.spyOn(component.symbolChangedEmitter, 'emit');
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('default values', () => {
    it('should have controller input as undefined by default', () => {
      expect(component.controller()).toBeUndefined();
    });

    it('should have symbol input as undefined by default', () => {
      expect(component.symbol()).toBeUndefined();
    });

    it('should have chosenSymbol signal initialized to empty string', () => {
      expect(component.chosenSymbol()).toBe('');
    });
  });

  describe('symbolChanged()', () => {
    it('should update chosenSymbol signal when symbolChanged is called', () => {
      component.symbolChanged('router');
      expect(component.chosenSymbol()).toBe('router');

      component.symbolChanged('switch');
      expect(component.chosenSymbol()).toBe('switch');
    });
  });

  describe('chooseSymbol()', () => {
    it('should emit chosenSymbol value via symbolChangedEmitter', () => {
      component.symbolChanged('router');
      symbolChangedEmitterSpy.mockClear();

      component.chooseSymbol();

      expect(symbolChangedEmitterSpy).toHaveBeenCalledWith('router');
      expect(symbolChangedEmitterSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit empty string when chosenSymbol is still empty', () => {
      expect(component.chosenSymbol()).toBe('');

      component.chooseSymbol();

      expect(symbolChangedEmitterSpy).toHaveBeenCalledWith('');
      expect(symbolChangedEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelChooseSymbol()', () => {
    it('should emit original symbol() value via symbolChangedEmitter', () => {
      component.symbolChanged('router');
      symbolChangedEmitterSpy.mockClear();

      component.cancelChooseSymbol();

      expect(symbolChangedEmitterSpy).toHaveBeenCalledWith(undefined);
      expect(symbolChangedEmitterSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit the original symbol even after symbolChanged was called', () => {
      fixture.componentRef.setInput('symbol', 'original_symbol');
      fixture.detectChanges();

      component.symbolChanged('new_symbol');
      symbolChangedEmitterSpy.mockClear();

      component.cancelChooseSymbol();

      expect(symbolChangedEmitterSpy).toHaveBeenCalledWith('original_symbol');
      expect(symbolChangedEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('template bindings', () => {
    it('should render Cancel button that calls cancelChooseSymbol()', () => {
      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      expect(cancelButton).toBeTruthy();

      cancelButton.triggerEventHandler('click');
      fixture.detectChanges();

      expect(symbolChangedEmitterSpy).toHaveBeenCalledWith(undefined);
      expect(symbolChangedEmitterSpy).toHaveBeenCalledTimes(1);
    });

    it('should render Choose symbol button that calls chooseSymbol()', () => {
      const chooseButton = fixture.debugElement.query(By.css('.top-button:not(.cancel-button)'));
      expect(chooseButton).toBeTruthy();

      component.symbolChanged('router');
      fixture.detectChanges();

      symbolChangedEmitterSpy.mockClear();
      chooseButton.triggerEventHandler('click');
      fixture.detectChanges();

      expect(symbolChangedEmitterSpy).toHaveBeenCalledWith('router');
      expect(symbolChangedEmitterSpy).toHaveBeenCalledTimes(1);
    });

    it('should display Symbol selection heading', () => {
      const heading = fixture.debugElement.query(By.css('h1'));
      expect(heading.nativeElement.textContent.trim()).toBe('Symbol selection');
    });
  });

  describe('app-symbols integration', () => {
    it('should pass controller input to app-symbols', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const symbolsComponent = fixture.debugElement.query(By.directive(SymbolsComponent));
      expect(symbolsComponent).toBeTruthy();

      const symbolsInstance = symbolsComponent.componentInstance as SymbolsComponent;
      expect(symbolsInstance.controller()).toEqual(mockController);
    });

    it('should pass symbol input to app-symbols', () => {
      fixture.componentRef.setInput('symbol', 'test_symbol');
      fixture.detectChanges();

      const symbolsComponent = fixture.debugElement.query(By.directive(SymbolsComponent));
      const symbolsInstance = symbolsComponent.componentInstance as SymbolsComponent;
      expect(symbolsInstance.symbol()).toBe('test_symbol');
    });

    it('should update chosenSymbol when symbolChanged event is emitted from app-symbols', () => {
      const symbolsComponent = fixture.debugElement.query(By.directive(SymbolsComponent));
      const symbolsInstance = symbolsComponent.componentInstance as SymbolsComponent;

      symbolsInstance.symbolChanged.emit('emitted_symbol');
      fixture.detectChanges();

      expect(component.chosenSymbol()).toBe('emitted_symbol');
    });
  });

  describe('inputs reactivity', () => {
    it('should react to controller input changes', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.controller()).toEqual(mockController);

      const newController: Controller = { ...mockController, id: 2, name: 'New Controller' };
      fixture.componentRef.setInput('controller', newController);
      fixture.detectChanges();

      expect(component.controller()).toEqual(newController);
    });

    it('should react to symbol input changes', () => {
      fixture.componentRef.setInput('symbol', 'first_symbol');
      fixture.detectChanges();

      expect(component.symbol()).toBe('first_symbol');

      fixture.componentRef.setInput('symbol', 'second_symbol');
      fixture.detectChanges();

      expect(component.symbol()).toBe('second_symbol');
    });
  });
});
