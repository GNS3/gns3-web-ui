import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const mockData: ConfirmDialogData = {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title from data', () => {
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Delete Item');
  });

  it('should display message from data', () => {
    fixture.detectChanges();
    const p = fixture.nativeElement.querySelector('p');
    expect(p.textContent).toContain('Are you sure you want to delete this item?');
  });

  it('should display custom confirm button text', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmBtn = buttons[1];
    expect(confirmBtn.textContent.trim()).toBe('Delete');
  });

  it('should display custom cancel button text', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelBtn = buttons[0];
    expect(cancelBtn.textContent.trim()).toBe('Cancel');
  });

  it('should close dialog with true when Confirm button is clicked', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmBtn = buttons[1];
    confirmBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when Cancel button is clicked', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelBtn = buttons[0];
    cancelBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should use default Confirm text when confirmText not provided', async () => {
    const dataWithoutConfirmText: ConfirmDialogData = {
      title: 'Test',
      message: 'Test message',
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dataWithoutConfirmText },
      ],
    }).compileComponents();

    const testFixture = TestBed.createComponent(ConfirmDialogComponent);
    testFixture.detectChanges();
    const buttons = testFixture.nativeElement.querySelectorAll('button');
    const confirmBtn = buttons[1];
    expect(confirmBtn.textContent.trim()).toBe('Confirm');
  });

  it('should use default Cancel text when cancelText not provided', async () => {
    const dataWithoutCancelText: ConfirmDialogData = {
      title: 'Test',
      message: 'Test message',
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dataWithoutCancelText },
      ],
    }).compileComponents();

    const testFixture = TestBed.createComponent(ConfirmDialogComponent);
    testFixture.detectChanges();
    const buttons = testFixture.nativeElement.querySelectorAll('button');
    const cancelBtn = buttons[0];
    expect(cancelBtn.textContent.trim()).toBe('Cancel');
  });

  it('should display items list when items are provided', async () => {
    const dataWithItems: ConfirmDialogData = {
      title: 'Select Items',
      message: 'Choose items',
      items: [
        { name: 'item1', description: 'description 1' },
        { name: 'item2' },
      ],
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dataWithItems },
      ],
    }).compileComponents();

    const testFixture = TestBed.createComponent(ConfirmDialogComponent);
    testFixture.detectChanges();
    const liElements = testFixture.nativeElement.querySelectorAll('li');
    expect(liElements.length).toBe(2);
    expect(liElements[0].textContent).toContain('item1');
    expect(liElements[0].textContent).toContain('description 1');
    expect(liElements[1].textContent).toContain('item2');
  });
});
