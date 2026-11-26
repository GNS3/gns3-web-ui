import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StartupToggleComponent } from './startup-toggle.component';

describe('StartupToggleComponent', () => {
  let fixture: ComponentFixture<StartupToggleComponent>;
  const button = () => fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(StartupToggleComponent);
    fixture.componentRef.setInput('label', 'Apply startup configuration for R1');
  });

  it.each([
    ['on', 'true', 'ON'],
    ['off', 'false', 'OFF'],
    ['unavailable', 'false', 'OFF'],
  ])('renders the %s state', (state, checked, text) => {
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    expect(button().getAttribute('data-state')).toBe(state);
    expect(button().getAttribute('aria-checked')).toBe(checked);
    expect(button().textContent?.trim()).toBe(text);
  });

  it('exposes the description as title and aria-description', () => {
    fixture.componentRef.setInput('state', 'off');
    fixture.componentRef.setInput('description', 'Not using this set');
    fixture.detectChanges();
    expect(button().title).toBe('Not using this set');
    expect(button().getAttribute('aria-description')).toBe('Not using this set');
  });

  it('emits toggled on click unless disabled', () => {
    fixture.componentRef.setInput('state', 'off');
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);
    fixture.detectChanges();
    button().click();
    expect(toggled).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    button().click();
    expect(toggled).toHaveBeenCalledTimes(1);
  });
});
