import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BpfPresetsComponent } from './bpf-presets.component';
import { BpfPresetsService } from '@services/bpf-presets.service';
import { ToasterService } from '@services/toaster.service';

describe('Shared BPF presets', () => {
  const error = vi.fn();
  beforeEach(() => {
    // Own the storage mock: other suites and DOM environments may replace
    // localStorage with an object that does not use Storage.prototype.
    const items = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => items.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        items.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        items.delete(key);
      }),
    });
    TestBed.configureTestingModule({ providers: [{ provide: ToasterService, useValue: { error } }] });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shares saved filters across control instances and persists updates and deletion', () => {
    const first = TestBed.createComponent(BpfPresetsComponent);
    const second = TestBed.createComponent(BpfPresetsComponent);
    first.componentRef.setInput('expression', 'tcp port 22');
    first.componentInstance.bpfPresetName.setValue('SSH');
    first.componentInstance.save();
    expect(second.componentInstance.presets.customBpfPresets()).toEqual([{ name: 'SSH', expression: 'tcp port 22' }]);
    const service = TestBed.inject(BpfPresetsService);
    service.save('SSH', 'tcp port 2222');
    expect(JSON.parse(localStorage.getItem('gns3.bpf-presets')!)).toEqual([
      { name: 'SSH', expression: 'tcp port 2222' },
    ]);
    service.delete('SSH');
    expect(second.componentInstance.presets.customBpfPresets()).toEqual([]);
  });

  it('replaces marker expressions and converts multiline rules to a single OR expression', () => {
    const fixture = TestBed.createComponent(BpfPresetsComponent);
    fixture.componentRef.setInput('expression', 'arp');
    const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');
    fixture.componentInstance.select('tcp port 22\nudp port 53');
    expect(emit).toHaveBeenCalledWith('(tcp port 22) or (udp port 53)');
  });

  it('appends packet filter rules without changing existing expressions', () => {
    const fixture = TestBed.createComponent(BpfPresetsComponent);
    fixture.componentRef.setInput('multiline', true);
    fixture.componentRef.setInput('expression', 'host 10.0.0.1');
    const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');
    fixture.componentInstance.select('tcp');
    expect(emit).toHaveBeenCalledWith('host 10.0.0.1\ntcp');
  });

  it('loads existing saved presets', () => {
    localStorage.setItem('gns3.bpf-presets', JSON.stringify([{ name: 'SSH', expression: 'tcp port 22' }]));
    expect(TestBed.inject(BpfPresetsService).customBpfPresets()).toHaveLength(1);
  });

  it('ignores malformed saved data', () => {
    localStorage.setItem('gns3.bpf-presets', '{invalid');
    expect(TestBed.inject(BpfPresetsService).customBpfPresets()).toEqual([]);
  });

  it('normalizes saved names and rejects invalid or duplicate entries', () => {
    localStorage.setItem(
      'gns3.bpf-presets',
      JSON.stringify([
        null,
        { name: ' ', expression: 'tcp' },
        { name: 'Bad', expression: 42 },
        { name: ' SSH ', expression: 'tcp port 22' },
        { name: 'SSH', expression: ' tcp port 2222 ' },
      ])
    );
    expect(TestBed.inject(BpfPresetsService).customBpfPresets()).toEqual([
      { name: 'SSH', expression: 'tcp port 2222' },
    ]);
  });

  it('saves on Enter without submitting the surrounding marker form', () => {
    const fixture = TestBed.createComponent(BpfPresetsComponent);
    fixture.componentRef.setInput('expression', 'tcp');
    fixture.componentInstance.bpfPresetName.setValue('TCP');
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('input').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.presets.customBpfPresets()).toEqual([{ name: 'TCP', expression: 'tcp' }]);
  });

  it('preserves a single marker expression without adding parentheses', () => {
    const fixture = TestBed.createComponent(BpfPresetsComponent);
    const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');
    fixture.componentInstance.select('tcp');
    expect(emit).toHaveBeenCalledWith('tcp');
  });

  it('preserves a formatted marker expression when saving it for use in either dialog', () => {
    const fixture = TestBed.createComponent(BpfPresetsComponent);
    fixture.componentRef.setInput('expression', 'tcp and\nport 22');
    fixture.componentInstance.bpfPresetName.setValue('SSH');
    fixture.componentInstance.save();
    expect(fixture.componentInstance.presets.customBpfPresets()).toEqual([
      { name: 'SSH', expression: 'tcp and port 22' },
    ]);
  });

  it('keeps separate packet-filter rules intact when saving', () => {
    const fixture = TestBed.createComponent(BpfPresetsComponent);
    fixture.componentRef.setInput('multiline', true);
    fixture.componentRef.setInput('expression', 'tcp port 22\nudp port 53');
    fixture.componentInstance.bpfPresetName.setValue('SSH and DNS');
    fixture.componentInstance.save();
    expect(fixture.componentInstance.presets.customBpfPresets()).toEqual([
      { name: 'SSH and DNS', expression: 'tcp port 22\nudp port 53' },
    ]);
  });

  it('keeps the library intact when storage fails', () => {
    const service = TestBed.inject(BpfPresetsService);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota');
    });
    expect(service.save('TCP', 'tcp')).toBe(false);
    expect(service.customBpfPresets()).toEqual([]);
    expect(error).toHaveBeenCalled();
  });
});
