import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationTextEditorComponent } from './configuration-text-editor.component';

describe('Configuration editor', () => {
  let fixture: ComponentFixture<ConfigurationTextEditorComponent>;
  let component: ConfigurationTextEditorComponent;
  const textarea = () => fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const search = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const button = (label: string) =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const typeSearch = (query: string) => {
    search().value = query;
    search().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfigurationTextEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConfigurationTextEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', 'hostname R1\ninterface Gi0/1\n description Uplink\n');
    fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  it('starts at 14px, allows font changes within bounds, and keeps configuration bytes intact', () => {
    const original = component.value();
    expect(fixture.nativeElement.querySelector('.editor-surface').style.fontSize).toBe('14px');
    button('Increase font size').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.editor-surface').style.fontSize).toBe('15px');
    for (let i = 0; i < 30; i++) component.resizeFont(1);
    fixture.detectChanges();
    expect(button('Increase font size').disabled).toBe(true);
    for (let i = 0; i < 30; i++) component.resizeFont(-1);
    fixture.detectChanges();
    expect(button('Decrease font size').disabled).toBe(true);
    expect(component.value()).toBe(original);
  });

  it('numbers physical lines, including blank and trailing lines, without wrapping', () => {
    fixture.componentRef.setInput('value', 'one\n\nthree\n');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.line-gutter pre').textContent).toBe('1\n2\n3\n4');
    expect(textarea().wrap).toBe('off');
    textarea().value = 'one\ntwo';
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.value()).toBe('one\ntwo');
    expect(fixture.nativeElement.querySelector('.line-gutter pre').textContent).toBe('1\n2');
  });

  it('searches literal text case-insensitively, highlights all results, and wraps in both directions', () => {
    fixture.componentRef.setInput('value', 'Gi0/1 [up]\ngi0/1 [UP]\nGi0/2');
    fixture.detectChanges();
    typeSearch('[up]');
    expect(fixture.nativeElement.querySelectorAll('mark').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.match-count').textContent).toBe('1 / 2');
    expect(textarea().selectionStart).toBe(6);
    button('Next match').click();
    fixture.detectChanges();
    expect(textarea().selectionStart).toBe(17);
    expect(fixture.nativeElement.querySelectorAll('mark.active').length).toBe(1);
    button('Next match').click();
    fixture.detectChanges();
    expect(textarea().selectionStart).toBe(6);
    search().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true }));
    fixture.detectChanges();
    expect(textarea().selectionStart).toBe(17);
    expect(component.value()).toBe('Gi0/1 [up]\ngi0/1 [UP]\nGi0/2');
  });

  it('highlights only part of a very large result while still counting and reaching every match', () => {
    const lines = 40000;
    fixture.componentRef.setInput('value', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n'.repeat(lines));
    fixture.detectChanges();
    typeSearch('a');
    const count = () => fixture.nativeElement.querySelector('.match-count').textContent;
    const marks = () => fixture.nativeElement.querySelectorAll('mark').length;
    expect(count()).toBe(`1 / ${lines * 50}`);
    expect(marks()).toBeLessThanOrEqual(500);
    button('Previous match').click();
    fixture.detectChanges();
    expect(count()).toBe(`${lines * 50} / ${lines * 50}`);
    expect(marks()).toBeLessThanOrEqual(500);
    expect(fixture.nativeElement.querySelectorAll('mark.active').length).toBe(1);
    expect(textarea().selectionStart).toBe(component.value().length - 2);
    const shown = fixture.nativeElement.querySelector('.highlights').textContent;
    expect(shown).toBe(component.value() + ' ');
  });

  it('keeps search focus while typing and supports Ctrl/Cmd+F and Escape', () => {
    textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, cancelable: true }));
    expect(document.activeElement).toBe(search());
    typeSearch('interface');
    expect(document.activeElement).toBe(search());
    search().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();
    expect(component.query()).toBe('');
    expect(fixture.nativeElement.querySelectorAll('mark').length).toBe(0);
    expect(document.activeElement).toBe(textarea());
  });

  it('reports no matches and refreshes results and line numbers when a different config is loaded', () => {
    typeSearch('missing');
    expect(fixture.nativeElement.querySelector('.match-count').textContent).toBe('No matches');
    expect(button('Next match').disabled).toBe(true);
    fixture.componentRef.setInput('value', 'missing\n');
    fixture.detectChanges();
    button('Next match').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.match-count').textContent).toBe('1 / 1');
    expect(fixture.nativeElement.querySelector('.line-gutter pre').textContent).toBe('1\n2');
  });

  it('renders whitespace and HTML-like configuration text exactly, without interpreting markup', () => {
    const value = '<script>alert("config")</script>\n\t description  two spaces\n';
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    typeSearch('config');
    expect(fixture.nativeElement.querySelector('.highlights').textContent).toBe(value + ' ');
    expect(fixture.nativeElement.querySelector('.highlights script')).toBeNull();
  });

  it('synchronizes the gutter and search highlights when scrolling horizontally and vertically', () => {
    typeSearch('hostname');
    textarea().scrollTop = 63;
    textarea().scrollLeft = 100;
    textarea().dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.line-gutter pre').style.transform).toBe('translateY(-63px)');
    expect(fixture.nativeElement.querySelector('.highlights').style.transform).toBe('translate(-100px, -63px)');
  });

  it('allows searching and font changes in a read-only configuration without emitting edits', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const changed = vi.fn();
    component.value.subscribe(changed);
    expect(textarea().readOnly).toBe(true);
    expect(textarea().disabled).toBe(false);
    typeSearch('hostname');
    button('Increase font size').click();
    expect(textarea().selectionStart).toBe(0);
    expect(changed).not.toHaveBeenCalled();
  });

  it('renders no highlight mirror until a search is active', () => {
    expect(fixture.nativeElement.querySelector('.highlights')).toBeNull();
    typeSearch('hostname');
    expect(fixture.nativeElement.querySelector('.highlights')).not.toBeNull();
    typeSearch('');
    expect(fixture.nativeElement.querySelector('.highlights')).toBeNull();
  });

  it('waits for typing to pause before rebuilding highlights during a search', () => {
    typeSearch('hostname');
    expect(fixture.nativeElement.querySelectorAll('mark').length).toBe(1);
    textarea().value = 'hostname R1\nhostname R2\n';
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    // Stale highlights would be misaligned with the new text, so none are drawn yet.
    expect(fixture.nativeElement.querySelectorAll('mark').length).toBe(0);
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('mark').length).toBe(2);
  });
});
