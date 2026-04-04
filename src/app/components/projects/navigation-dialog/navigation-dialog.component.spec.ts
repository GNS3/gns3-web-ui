import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ThemeService } from '@services/theme.service';
import { NavigationDialogComponent } from './navigation-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NavigationDialogComponent', () => {
  let component: NavigationDialogComponent;
  let fixture: ComponentFixture<NavigationDialogComponent>;
  let mockBottomSheetRef: any;
  let mockThemeService: any;

  beforeEach(async () => {
    mockBottomSheetRef = {
      dismiss: vi.fn(),
    };

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('dark'),
    };

    await TestBed.configureTestingModule({
      imports: [NavigationDialogComponent],
      providers: [
        { provide: MatBottomSheetRef, useValue: mockBottomSheetRef },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty projectMessage by default', () => {
      expect(component.projectMessage).toBe('');
    });

    it('should have isLightThemeEnabled as false by default', () => {
      expect(component.isLightThemeEnabled).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should enable light theme when actual theme is light', () => {
      mockThemeService.getActualTheme.mockReturnValue('light');

      component.ngOnInit();

      expect(component.isLightThemeEnabled).toBe(true);
    });

    it('should disable light theme when actual theme is dark', () => {
      mockThemeService.getActualTheme.mockReturnValue('dark');

      component.ngOnInit();

      expect(component.isLightThemeEnabled).toBe(false);
    });
  });

  describe('onNoClick', () => {
    it('should dismiss bottom sheet with false', () => {
      component.onNoClick();

      expect(mockBottomSheetRef.dismiss).toHaveBeenCalledWith(false);
    });
  });

  describe('onYesClick', () => {
    it('should dismiss bottom sheet with true', () => {
      component.onYesClick();

      expect(mockBottomSheetRef.dismiss).toHaveBeenCalledWith(true);
    });
  });

  describe('Template', () => {
    it('should display project message in title', () => {
      component.projectMessage = 'TestProject';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.title')?.textContent).toContain('TestProject');
    });

    it('should render the dialog wrapper', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.dialogWrapper')).toBeTruthy();
    });

    it('should have Yes and No buttons', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });
  });
});
