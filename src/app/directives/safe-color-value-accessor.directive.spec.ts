import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SafeColorValueAccessor } from './safe-color-value-accessor.directive';

/** Minimal host rendering a reactive color input driven by the accessor under test. */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SafeColorValueAccessor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input type="color" [formControl]="ctrl" />`,
})
class HostComponent {
  readonly ctrl = new FormControl<string | null>(null);
}

describe('SafeColorValueAccessor', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  function colorInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type=color]');
  }

  it('shows the placeholder swatch for a null model instead of writing "" to the input', () => {
    expect(host.ctrl.value).toBeNull();
    expect(colorInput().value).toBe(SafeColorValueAccessor.PLACEHOLDER);
  });

  it('keeps the model null (server-picked default) while showing the placeholder', () => {
    colorInput(); // initial write already happened — the model must stay untouched
    expect(host.ctrl.value).toBeNull();
  });

  it('shows the placeholder for an empty-string model', () => {
    host.ctrl.setValue('');
    fixture.detectChanges();
    expect(colorInput().value).toBe(SafeColorValueAccessor.PLACEHOLDER);
  });

  it('falls back to the placeholder for a non-hex value', () => {
    host.ctrl.setValue('none');
    fixture.detectChanges();
    expect(colorInput().value).toBe(SafeColorValueAccessor.PLACEHOLDER);
  });

  it('writes a valid hex model to the input unchanged', () => {
    host.ctrl.setValue('#00ff88');
    fixture.detectChanges();
    expect(colorInput().value).toBe('#00ff88');
  });

  it('emits the picked color to the model on user input', () => {
    const input = colorInput();
    input.value = '#123456';
    input.dispatchEvent(new Event('input'));

    expect(host.ctrl.value).toBe('#123456');
  });
});
