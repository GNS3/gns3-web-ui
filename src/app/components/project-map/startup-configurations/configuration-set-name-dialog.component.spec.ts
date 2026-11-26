import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationSetNameDialogComponent } from './configuration-set-name-dialog.component';

describe('Configuration set name', () => {
  let component: ConfigurationSetNameDialogComponent;
  let fixture: ComponentFixture<ConfigurationSetNameDialogComponent>;
  let dialog: { close: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    dialog = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ConfigurationSetNameDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Create configuration set', confirmLabel: 'Create set', names: ['Baseline'] },
        },
        { provide: MatDialogRef, useValue: dialog },
      ],
    });
    fixture = TestBed.createComponent(ConfigurationSetNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it.each(['', '   ', 'baseline', ' BASELINE ', 'x'.repeat(81), 'Lab\x00name'])('rejects invalid name %s', (name) => {
    component.name.setValue(name);
    component.submit();
    expect(component.name.invalid).toBe(true);
    expect(dialog.close).not.toHaveBeenCalled();
  });
  it('returns the trimmed name when submitted', () => {
    component.name.setValue('  After routing  ');
    component.submit();
    expect(dialog.close).toHaveBeenCalledWith('After routing');
  });
  it('creates the set through the button without allowing a browser form navigation', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '  Routing baseline  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const submitted = vi.fn((event: Event) => expect(event.defaultPrevented).toBe(true));
    form.addEventListener('submit', submitted);
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();
    expect(submitted).toHaveBeenCalledOnce();
    expect(dialog.close).toHaveBeenCalledExactlyOnceWith('Routing baseline');
  });
  it('handles native form submission, including Enter, without navigating', () => {
    component.name.setValue('Before changes');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    expect(form.dispatchEvent(event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.close).toHaveBeenCalledExactlyOnceWith('Before changes');
  });
});
