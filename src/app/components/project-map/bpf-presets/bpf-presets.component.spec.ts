import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { BpfPresetsComponent } from './bpf-presets.component';
import { BpfPreset, BpfPresetsService, CUSTOM_BPF_CATEGORY } from '@services/bpf-presets.service';
import { ToasterService } from '@services/toaster.service';
import {
  BpfRuleLibraryDialogComponent,
  BpfRuleLibraryDialogResult,
} from '../bpf-rule-library-dialog/bpf-rule-library-dialog.component';

describe('BpfPresetsComponent', () => {
  const error = vi.fn();
  let fixture: ComponentFixture<BpfPresetsComponent> | undefined;
  let dialogResult: Subject<BpfRuleLibraryDialogResult | undefined>;
  let openDialog: ReturnType<typeof vi.fn>;

  const selectPreset = (component: BpfPresetsComponent, preset: BpfPreset) =>
    component.onPresetSelected(preset);

  beforeEach(() => {
    vi.clearAllMocks();
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
    dialogResult = new Subject<BpfRuleLibraryDialogResult | undefined>();
    openDialog = vi.fn().mockReturnValue({ afterClosed: () => dialogResult.asObservable() });
    TestBed.configureTestingModule({
      providers: [
        { provide: ToasterService, useValue: { error } },
        { provide: MatDialog, useValue: { open: openDialog } },
      ],
    });
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
      fixture = undefined;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('autocomplete', () => {
    it('groups built-in rules by category and lists custom rules last', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);

      expect(fixture.componentInstance.presetGroups().map((group) => group.label)).toEqual([
        'Hosts & networks',
        'Protocols',
        'Ports & services',
        'Layer 2',
        'Flags & bytes',
      ]);

      TestBed.inject(BpfPresetsService).save('My SSH rule', 'tcp port 22');

      const groups = fixture.componentInstance.presetGroups();
      const customGroup = groups[groups.length - 1];
      expect(customGroup.label).toBe(CUSTOM_BPF_CATEGORY);
      expect(customGroup.presets).toEqual([
        { name: 'My SSH rule', expression: 'tcp port 22', category: CUSTOM_BPF_CATEGORY },
      ]);
    });

    it('filters rules by name, expression or category', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      const component = fixture.componentInstance;

      component.searchText.set('layer 2');
      expect(component.presetGroups().map((group) => group.label)).toEqual(['Layer 2']);

      // Name match (case-insensitive).
      component.searchText.set('SPANNING');
      expect(component.presetGroups()).toHaveLength(1);
      expect(component.presetGroups()[0].presets.map((preset) => preset.name)).toEqual(['Spanning Tree']);

      // Expression match.
      component.searchText.set('0x88cc');
      expect(component.presetGroups()[0].presets.map((preset) => preset.name)).toEqual(['LLDP']);

      component.searchText.set('no such rule');
      expect(component.presetGroups()).toEqual([]);
    });

    it('shows the picked rule name and emits its expression', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      selectPreset(fixture.componentInstance, {
        name: 'SSH',
        expression: 'tcp port 22',
        category: 'Ports & services',
      });

      expect(fixture.componentInstance.searchText()).toBe('SSH');
      expect(emit).toHaveBeenCalledWith('tcp port 22');
    });

    it('updates the search query from the search field', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

      input.value = 'tcp';
      input.dispatchEvent(new Event('input'));

      expect(fixture.componentInstance.searchText()).toBe('tcp');
    });

    it('formats the autocomplete display text', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      const component = fixture.componentInstance;

      expect(component.displayPreset({ name: 'SSH', expression: 'tcp port 22', category: 'Ports & services' })).toBe(
        'SSH'
      );
      expect(component.displayPreset(null)).toBe('');
    });
  });

  describe('select', () => {
    it('preserves a single marker expression without adding parentheses', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      fixture.componentInstance.select('tcp');

      expect(emit).toHaveBeenCalledWith('tcp');
    });

    it('converts multiline rules to a single OR expression for markers', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.componentRef.setInput('expression', 'arp');
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      fixture.componentInstance.select('tcp port 22\nudp port 53');

      expect(emit).toHaveBeenCalledWith('(tcp port 22) or (udp port 53)');
    });

    it('appends packet filter rules without changing existing expressions', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.componentRef.setInput('multiline', true);
      fixture.componentRef.setInput('expression', 'host 10.0.0.1');
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      fixture.componentInstance.select('tcp');

      expect(emit).toHaveBeenCalledWith('host 10.0.0.1\ntcp');
    });

    it('keeps separate packet filter rules intact', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.componentRef.setInput('multiline', true);
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      fixture.componentInstance.select('tcp port 22\nudp port 53');

      expect(emit).toHaveBeenCalledWith('tcp port 22\nudp port 53');
    });
  });

  describe('rule library dialog', () => {
    it('opens the library with the current expression and multiline mode', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.componentRef.setInput('expression', 'arp');
      fixture.componentRef.setInput('multiline', true);

      fixture.componentInstance.openLibrary();

      expect(openDialog).toHaveBeenCalledWith(
        BpfRuleLibraryDialogComponent,
        expect.objectContaining({ data: { currentExpression: 'arp', multiline: true } })
      );
    });

    it('applies the expression returned by the library', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.componentRef.setInput('expression', 'arp');
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      fixture.componentInstance.openLibrary();
      dialogResult.next({ expression: 'tcp port 22' });
      dialogResult.complete();

      expect(emit).toHaveBeenCalledWith('tcp port 22');
    });

    it('keeps the current expression when the library is dismissed', () => {
      fixture = TestBed.createComponent(BpfPresetsComponent);
      fixture.componentRef.setInput('expression', 'arp');
      const emit = vi.spyOn(fixture.componentInstance.expressionChange, 'emit');

      fixture.componentInstance.openLibrary();
      dialogResult.next(undefined);
      dialogResult.complete();

      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('rule storage', () => {
    it('persists new rules, updates in place and deletes them', () => {
      const service = TestBed.inject(BpfPresetsService);

      expect(service.save('SSH', 'tcp port 22')).toBe(true);
      expect(service.customBpfPresets()).toEqual([
        { name: 'SSH', expression: 'tcp port 22', category: CUSTOM_BPF_CATEGORY },
      ]);
      expect(JSON.parse(localStorage.getItem('gns3.bpf-presets')!)).toEqual([
        { name: 'SSH', expression: 'tcp port 22', category: CUSTOM_BPF_CATEGORY },
      ]);

      expect(service.save(' SSH ', ' tcp port 2222 ')).toBe(true);
      expect(service.customBpfPresets()).toEqual([
        { name: 'SSH', expression: 'tcp port 2222', category: CUSTOM_BPF_CATEGORY },
      ]);

      service.delete('SSH');
      expect(service.customBpfPresets()).toEqual([]);
      expect(JSON.parse(localStorage.getItem('gns3.bpf-presets')!)).toEqual([]);
    });

    it('rejects rules without a name or an expression', () => {
      const service = TestBed.inject(BpfPresetsService);

      expect(service.save('  ', 'tcp')).toBe(false);
      expect(service.save('SSH', '   ')).toBe(false);
      expect(service.customBpfPresets()).toEqual([]);
    });

    it('loads existing saved rules and assigns them the custom category', () => {
      localStorage.setItem('gns3.bpf-presets', JSON.stringify([{ name: 'SSH', expression: 'tcp port 22' }]));

      expect(TestBed.inject(BpfPresetsService).customBpfPresets()).toEqual([
        { name: 'SSH', expression: 'tcp port 22', category: CUSTOM_BPF_CATEGORY },
      ]);
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
        { name: 'SSH', expression: 'tcp port 2222', category: CUSTOM_BPF_CATEGORY },
      ]);
    });

    it('keeps the library intact and reports when storage fails', () => {
      const service = TestBed.inject(BpfPresetsService);
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Quota');
      });

      expect(service.save('TCP', 'tcp')).toBe(false);
      expect(service.customBpfPresets()).toEqual([]);
      expect(error).toHaveBeenCalledWith('Could not save custom BPF filters in this browser.');
    });
  });
});
