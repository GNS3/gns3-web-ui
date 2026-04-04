import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, EventEmitter, output, input } from '@angular/core';
import { TemplateSymbolDialogComponent, TemplateSymbolDialogData } from './template-symbol-dialog.component';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock SymbolsComponent to avoid complex dependencies
@Component({
  selector: 'app-symbols',
  standalone: true,
  template: '<ng-content></ng-content>',
})
class MockSymbolsComponent {
  readonly controller = input<Controller>(undefined);
  readonly symbol = input<string>(undefined);
  readonly symbolChanged = new EventEmitter<string>();
}

describe('TemplateSymbolDialogComponent', () => {
  let component: TemplateSymbolDialogComponent;
  let fixture: ComponentFixture<TemplateSymbolDialogComponent>;
  let mockDialogRef: any;
  let mockController: Controller;

  const createMockController = (): Controller =>
    ({
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
    } as Controller);

  beforeEach(async () => {
    mockController = createMockController();

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TemplateSymbolDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            controller: mockController,
            symbol: 'router',
          } as TemplateSymbolDialogData,
        },
      ],
    })
      .overrideComponent(TemplateSymbolDialogComponent, {
        set: {
          imports: [MockSymbolsComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TemplateSymbolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with controller from dialog data', () => {
      expect(component.controller).toBe(mockController);
    });

    it('should initialize with symbol from dialog data', () => {
      expect(component.symbol).toBe('router');
    });
  });

  describe('ngOnInit', () => {
    it('should call markForCheck', () => {
      const cdMarkForCheckSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.ngOnInit();
      expect(cdMarkForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('symbolChanged', () => {
    it('should update the symbol when a new symbol is chosen', () => {
      component.symbolChanged('switch');
      expect(component.symbol).toBe('switch');
    });

    it('should call markForCheck after updating symbol', () => {
      const cdMarkForCheckSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.symbolChanged('cloud');
      expect(cdMarkForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('onCloseClick', () => {
    it('should close dialog without result', () => {
      component.onCloseClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onSelectClick', () => {
    it('should close dialog with the current symbol', () => {
      component.symbol = 'router';
      component.onSelectClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith('router');
    });

    it('should close dialog with updated symbol after symbolChanged', () => {
      component.symbolChanged('switch');
      component.onSelectClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith('switch');
    });
  });

  describe('Template', () => {
    it('should display "Select symbol" title', () => {
      const title = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(title.textContent).toContain('Select symbol');
    });

    it('should have Cancel button', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[color="accent"]');
      expect(cancelButton.textContent).toContain('Cancel');
    });

    it('should have Choose symbol button', () => {
      const chooseButton = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(chooseButton.textContent).toContain('Choose symbol');
    });

    it('should have app-symbols component', () => {
      const symbolsComponent = fixture.nativeElement.querySelector('app-symbols');
      expect(symbolsComponent).toBeTruthy();
    });

    it('should call onCloseClick when Cancel is clicked', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[color="accent"]');
      cancelButton.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should call onSelectClick when Choose symbol is clicked', () => {
      const chooseButton = fixture.nativeElement.querySelector('button[color="primary"]');
      chooseButton.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith('router');
    });
  });

  describe('TemplateSymbolDialogData interface', () => {
    it('should accept valid dialog data structure', () => {
      const data: TemplateSymbolDialogData = {
        controller: mockController,
        symbol: 'test-symbol',
      };
      expect(data.controller).toBe(mockController);
      expect(data.symbol).toBe('test-symbol');
    });
  });
});
