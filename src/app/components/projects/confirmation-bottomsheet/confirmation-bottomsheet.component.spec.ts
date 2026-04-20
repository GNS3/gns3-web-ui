import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { ConfirmationBottomSheetComponent } from './confirmation-bottomsheet.component';
import { ThemeService } from '@services/theme.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfirmationBottomSheetComponent', () => {
  let fixture: ComponentFixture<ConfirmationBottomSheetComponent>;
  let mockBottomSheetRef: { dismiss: ReturnType<typeof vi.fn> };
  let mockThemeService: { getActualTheme: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockBottomSheetRef = { dismiss: vi.fn() };
    mockThemeService = { getActualTheme: vi.fn().mockReturnValue('dark') };

    await TestBed.configureTestingModule({
      imports: [ConfirmationBottomSheetComponent],
      providers: [
        { provide: MatBottomSheetRef, useValue: mockBottomSheetRef },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { message: 'Test message' } },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationBottomSheetComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('ngOnInit', () => {
    it('should set message from injected data', () => {
      expect(fixture.componentInstance.message()).toBe('Test message');
    });

    it('should set isLightThemeEnabled to true when theme is light', async () => {
      mockThemeService.getActualTheme.mockReturnValue('light');

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ConfirmationBottomSheetComponent],
        providers: [
          { provide: MatBottomSheetRef, useValue: mockBottomSheetRef },
          { provide: MAT_BOTTOM_SHEET_DATA, useValue: { message: 'Test message' } },
          { provide: ThemeService, useValue: mockThemeService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ConfirmationBottomSheetComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.isLightThemeEnabled()).toBe(true);
    });

    it('should set isLightThemeEnabled to false when theme is dark', () => {
      expect(fixture.componentInstance.isLightThemeEnabled()).toBe(false);
    });
  });

  describe('onNoClick', () => {
    it('should dismiss bottom sheet with false', () => {
      fixture.componentInstance.onNoClick();
      expect(mockBottomSheetRef.dismiss).toHaveBeenCalledWith(false);
    });
  });

  describe('onYesClick', () => {
    it('should dismiss bottom sheet with true', () => {
      fixture.componentInstance.onYesClick();
      expect(mockBottomSheetRef.dismiss).toHaveBeenCalledWith(true);
    });
  });
});
