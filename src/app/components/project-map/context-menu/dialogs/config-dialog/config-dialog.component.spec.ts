import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfigDialogComponent } from './config-dialog.component';

describe('ConfigDialogComponent', () => {
  let fixture: ComponentFixture<ConfigDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfigDialogComponent, MatDialogModule, MatButtonModule],
    })
      .overrideProvider(MatDialogRef, { useValue: mockDialogRef })
      .compileComponents();

    fixture = TestBed.createComponent(ConfigDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should display "Choose configuration file" title', () => {
    const title = fixture.nativeElement.querySelector('h1');
    expect(title.textContent).toContain('Choose configuration file');
  });

  it('should have two configuration option buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.config-options button');
    expect(buttons.length).toBe(2);
  });

  it('should have "Startup configuration" button', () => {
    const button = fixture.nativeElement.querySelector('button:nth-child(1)');
    expect(button.textContent).toContain('Startup configuration');
  });

  it('should have "Private configuration" button', () => {
    const button = fixture.nativeElement.querySelector('button:nth-child(2)');
    expect(button.textContent).toContain('Private configuration');
  });

  it('should have Cancel button', () => {
    const cancelButton = fixture.nativeElement.querySelector('button[color="accent"]');
    expect(cancelButton.textContent).toContain('Cancel');
  });

  describe('close()', () => {
    it('should close dialog with "startup-config" when clicking Startup configuration button', () => {
      const button = fixture.nativeElement.querySelector('button:nth-child(1)');
      button.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith('startup-config');
    });

    it('should close dialog with "private-config" when clicking Private configuration button', () => {
      const button = fixture.nativeElement.querySelector('button:nth-child(2)');
      button.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith('private-config');
    });
  });

  describe('onClose()', () => {
    it('should close dialog without data when clicking Cancel button', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[color="accent"]');
      cancelButton.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
