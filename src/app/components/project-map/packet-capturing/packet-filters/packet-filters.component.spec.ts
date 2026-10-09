import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PacketFiltersDialogComponent, FilterGroupView } from './packet-filters.component';
import { LinkService } from '@services/link.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { Controller } from '@models/controller';
import { Link } from '@models/link';
import { FilterDescription } from '@models/filter-description';
import { Filter } from '@models/filter';
import { ChangeDetectorRef } from '@angular/core';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockController: Controller = {
  id: 1,
  authToken: '',
  name: 'Test Controller',
  location: 'local',
  host: '192.168.1.100',
  port: 3080,
  path: '',
  ubridge_path: '',
  status: 'running',
  protocol: 'http:',
  username: '',
  password: '',
  tokenExpired: false,
};

const createMockLink = (filters?: Filter, kernelDatapath?: boolean): Link => ({
  link_id: 'link1',
  project_id: 'proj1',
  link_type: 'ethernet',
  capturing: true,
  capture_file_name: '',
  capture_file_path: '',
  nodes: [],
  suspend: false,
  wireshark: false,
  distance: 0,
  length: 0,
  filters,
  kernel_datapath: kernelDatapath,
  source: {} as any,
  target: {} as any,
  x: 0,
  y: 0,
  show_filters_icon: true,
});

// Realistic descriptors: `type` is the filters dict key, parameters carry
// the control kind (int/str/text) and the value ranges.
const mockFilterDescriptions: FilterDescription[] = [
  {
    type: 'frequency_drop',
    name: 'Frequency drop',
    description: 'Drop one packet every N packets.',
    parameters: [{ name: 'Frequency', type: 'int', minimum: -1, maximum: 32767, unit: 'packets' }],
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Delay packets in milliseconds.',
    parameters: [
      { name: 'Latency', type: 'int', minimum: 1, maximum: 32767, unit: 'ms' },
      { name: 'Jitter (-/+)', type: 'int', minimum: 0, maximum: 32767, unit: 'ms' },
      { name: 'Distribution', type: 'str', unit: 'uniform|normal|pareto|paretonormal' },
    ],
  },
  {
    type: 'bpf',
    name: 'Berkeley Packet Filter (BPF)',
    description: 'Drop packets matching a BPF expression. Put one expression per line.',
    parameters: [{ name: 'Filters', type: 'text' }],
  },
  {
    type: 'rate',
    name: 'Bandwidth limit',
    description: 'Shape the link to a maximum bandwidth.',
    parameters: [{ name: 'Rate', type: 'str', unit: 'e.g. 512kbit, 10mbit' }],
  },
  {
    type: 'window_drop',
    name: 'Time window drop',
    description: 'Drop packets with the given chance inside a time window.',
    parameters: [
      { name: 'Start', type: 'int', minimum: 0, maximum: 1000000000000, unit: 'ms' },
      { name: 'Outage', type: 'int', minimum: 1, maximum: 1000000000000, unit: 'ms' },
      { name: 'Chance', type: 'int', minimum: 0, maximum: 100, unit: '%' },
      { name: 'Period', type: 'int', minimum: 1, maximum: 1000000000000, unit: 'ms' },
      { name: 'Jitter', type: 'int', minimum: 0, maximum: 1000000000, unit: 'ms' },
    ],
  },
];

const allKernelOnlyDescriptions: FilterDescription[] = [
  'rate',
  'reorder',
  'gemodel',
  'duplicate',
  'seed',
  'limit',
  'quota',
  'window_drop',
].map((type) => ({ type, name: type, description: '', parameters: [{ name: 'Value', type: 'int', minimum: 0, maximum: 100 }] }));

const mockDialogRef = {
  close: vi.fn(),
};

describe('PacketFiltersDialogComponent', () => {
  let component: PacketFiltersDialogComponent;
  let fixture: ComponentFixture<PacketFiltersDialogComponent>;
  let mockLinkService: any;
  let mockDialog: any;
  let mockDialogConfig: any;
  let mockDialogInstance: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  const group = (key: string): FilterGroupView => {
    const found = component.filterGroups?.find((g) => g.key === key);
    expect(found, `filter group ${key} should exist`).toBeTruthy();
    return found!;
  };

  const param = (key: string, name: string) => {
    const found = group(key).params.find((p) => p.name === name);
    expect(found, `param ${name} of ${key} should exist`).toBeTruthy();
    return found!;
  };

  const setParam = (key: string, name: string, value: number | string) => {
    param(key, name).value = value;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDialogInstance = {
      title: '',
      messages: [],
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        componentInstance: mockDialogInstance,
        close: vi.fn(),
      }),
    };

    mockDialogConfig = {
      openConfig: vi.fn().mockReturnValue({
        autoFocus: false,
        disableClose: true,
        panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      }),
    };

    mockLinkService = {
      getLink: vi.fn().mockReturnValue(of(createMockLink())),
      getAvailableFilters: vi.fn().mockReturnValue(of(mockFilterDescriptions)),
      updateLink: vi.fn().mockReturnValue(of(createMockLink())),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PacketFiltersDialogComponent],
      providers: [
        { provide: LinkService, useValue: mockLinkService },
        { provide: DialogConfigService, useValue: mockDialogConfig },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PacketFiltersDialogComponent);
    component = fixture.componentInstance;

    component.controller = mockController;
    component.link = createMockLink();
    component.project = {} as any;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have no filter groups before init', () => {
      expect(component.filterGroups).toBeUndefined();
    });

    it('should have no availableFilters before init', () => {
      expect(component.availableFilters).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should load link data and available filters on init', () => {
      component.ngOnInit();

      expect(mockLinkService.getLink).toHaveBeenCalledWith(
        component.controller,
        component.link.project_id,
        component.link.link_id
      );
      expect(mockLinkService.getAvailableFilters).toHaveBeenCalledWith(component.controller, component.link);
    });

    it('should build filter groups only after both requests resolve', () => {
      const linkSubject = new Subject<Link>();
      const filtersSubject = new Subject<FilterDescription[]>();
      mockLinkService.getLink.mockReturnValue(linkSubject.asObservable());
      mockLinkService.getAvailableFilters.mockReturnValue(filtersSubject.asObservable());

      component.ngOnInit();
      expect(component.filterGroups).toBeUndefined();

      linkSubject.next(createMockLink());
      expect(component.filterGroups).toBeUndefined();

      filtersSubject.next(mockFilterDescriptions);
      expect(component.filterGroups).toBeDefined();
      expect(component.filterGroups!.length).toBe(mockFilterDescriptions.length);
    });

    it('should default number params to 0 and string params to empty when link has no filters', () => {
      component.ngOnInit();

      expect(param('frequency_drop', 'Frequency').value).toBe(0);
      expect(param('delay', 'Latency').value).toBe(0);
      expect(param('delay', 'Distribution').value).toBe('');
      expect(param('bpf', 'Filters').value).toBe('');
      expect(param('rate', 'Rate').value).toBe('');
      expect(param('window_drop', 'Period').value).toBe(0);
    });

    it('should load existing filter values from link', () => {
      mockLinkService.getLink.mockReturnValue(
        of(
          createMockLink({
            delay: [100, 10, 'normal'],
            bpf: ['tcp port 80', 'host 10.0.0.1'],
            frequency_drop: [-1],
          })
        )
      );

      component.ngOnInit();

      expect(param('delay', 'Latency').value).toBe(100);
      expect(param('delay', 'Jitter (-/+)').value).toBe(10);
      expect(param('delay', 'Distribution').value).toBe('normal');
      // bpf is stored as a list of lines — joined into the multi-line textarea value
      expect(param('bpf', 'Filters').value).toBe('tcp port 80\nhost 10.0.0.1');
      expect(param('frequency_drop', 'Frequency').value).toBe(-1);
    });

    it('should derive control kinds from parameter descriptors', () => {
      component.ngOnInit();

      expect(param('frequency_drop', 'Frequency').kind).toBe('number');
      expect(param('frequency_drop', 'Frequency').minimum).toBe(-1);
      expect(param('frequency_drop', 'Frequency').maximum).toBe(32767);
      expect(param('delay', 'Distribution').kind).toBe('select');
      expect(param('delay', 'Distribution').options).toEqual(['uniform', 'normal', 'pareto', 'paretonormal']);
      expect(param('bpf', 'Filters').kind).toBe('textarea');
      expect(group('bpf').isWide).toBe(true);
      expect(param('rate', 'Rate').kind).toBe('text');
      expect(group('rate').isWide).toBe(false);
      // 3+ parameter groups get a full-width block so their params sit in one row
      expect(group('delay').isWide).toBe(true);
      expect(group('window_drop').isWide).toBe(true);
      expect(group('frequency_drop').isWide).toBe(false);
    });

    it('should populate availableFilters from API', () => {
      component.ngOnInit();

      expect(component.availableFilters).toEqual(mockFilterDescriptions);
    });

    it('should resolve to the empty state when available filters fail to load', () => {
      mockLinkService.getAvailableFilters.mockReturnValue(throwError(() => new Error('Failed to load available filters')));

      component.ngOnInit();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load available filters');
      expect(component.filterGroups).toEqual([]);
    });
  });

  describe('capability hint', () => {
    it('should stay silent when the server does not report kernel_datapath', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink(undefined, undefined)));

      component.ngOnInit();

      expect(component.capabilityHint).toBeNull();
    });

    it('should explain that relay links only offer the basic filters', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink(undefined, false)));

      component.ngOnInit();

      expect(component.capabilityHint).toBe(
        'This link runs on the uBridge relay; the extended impairment filters run on kernel-datapath links only.'
      );
    });

    it('should explain a compute uBridge capability gap on a kernel-datapath link', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink(undefined, true)));

      component.ngOnInit();

      expect(component.capabilityHint).toBe(
        "Some impairment filters are unavailable because the uBridge on the link's computes does not support them."
      );
    });

    it('should stay silent on a kernel-datapath link offering every kernel-only filter', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink(undefined, true)));
      mockLinkService.getAvailableFilters.mockReturnValue(of(allKernelOnlyDescriptions));

      component.ngOnInit();

      expect(component.capabilityHint).toBeNull();
    });
  });

  describe('onParamChange', () => {
    it('should update the param value and mark for check', () => {
      component.ngOnInit();
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.onParamChange(param('delay', 'Latency'), '250');

      expect(param('delay', 'Latency').value).toBe('250');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should reject a delay whose latency is below the minimum while jitter is set', () => {
      component.ngOnInit();

      setParam('delay', 'Latency', -5);
      setParam('delay', 'Jitter (-/+)', 5);

      expect(component.paramError(group('delay'), param('delay', 'Latency'))).toBe('Latency must be between 1 and 32767');
      expect(component.hasValidationErrors()).toBe(true);
    });

    it('should accept a jitter-only delay — latency 0 means "not set" even mid-array', () => {
      component.ngOnInit();

      setParam('delay', 'Latency', 0);
      setParam('delay', 'Jitter (-/+)', 5);

      expect(component.paramError(group('delay'), param('delay', 'Latency'))).toBeNull();
      expect(component.hasValidationErrors()).toBe(false);
    });

    it('should not freeze a link that already stores delay [0, 5]', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink({ delay: [0, 5] })));

      component.ngOnInit();
      component.onYesClick();

      expect(component.hasValidationErrors()).toBe(false);
      expect(mockLinkService.updateLink).toHaveBeenCalled();
      expect(component.link.filters!.delay).toEqual([0, 5]);
    });

    it('should reject a distribution chosen without jitter (server answers 409 otherwise)', () => {
      component.ngOnInit();

      setParam('delay', 'Latency', 100);
      setParam('delay', 'Distribution', 'normal');

      expect(component.paramError(group('delay'), param('delay', 'Jitter (-/+)'))).toBe('Set a jitter value to use a distribution');
      expect(component.hasValidationErrors()).toBe(true);
    });

    it('should reject a chance above the maximum', () => {
      component.ngOnInit();

      setParam('window_drop', 'Chance', 101);

      expect(component.paramError(group('window_drop'), param('window_drop', 'Chance'))).toBe('Chance must be between 0 and 100');
    });

    it('should reject a non-integer value', () => {
      component.ngOnInit();

      setParam('window_drop', 'Outage', '12.5');

      expect(component.paramError(group('window_drop'), param('window_drop', 'Outage'))).toBe('Enter a whole number');
    });

    it('should accept frequency_drop -1 (drop all) and window_drop Start 0', () => {
      component.ngOnInit();

      setParam('frequency_drop', 'Frequency', -1);
      setParam('window_drop', 'Start', 0);
      setParam('window_drop', 'Outage', 2000);
      setParam('window_drop', 'Chance', 100);

      expect(component.paramError(group('frequency_drop'), param('frequency_drop', 'Frequency'))).toBeNull();
      expect(component.paramError(group('window_drop'), param('window_drop', 'Start'))).toBeNull();
      expect(component.hasValidationErrors()).toBe(false);
    });
  });

  describe('payload building (via onYesClick)', () => {
    it('should send an empty filters object when everything is left at defaults', () => {
      component.ngOnInit();

      component.onYesClick();

      expect(component.link.filters).toEqual({});
      expect(mockLinkService.updateLink).toHaveBeenCalledWith(component.controller, component.link);
    });

    it('should truncate trailing zero parameters (window_drop single outage)', () => {
      component.ngOnInit();

      setParam('window_drop', 'Start', 0);
      setParam('window_drop', 'Outage', 2000);
      setParam('window_drop', 'Chance', 100);

      component.onYesClick();

      expect(component.link.filters!['window_drop']).toEqual([0, 2000, 100]);
    });

    it('should keep explicitly set trailing parameters', () => {
      component.ngOnInit();

      setParam('window_drop', 'Start', 100);
      setParam('window_drop', 'Outage', 2000);
      setParam('window_drop', 'Chance', 30);
      setParam('window_drop', 'Period', 5000);
      setParam('window_drop', 'Jitter', 250);

      component.onYesClick();

      expect(component.link.filters!['window_drop']).toEqual([100, 2000, 30, 5000, 250]);
    });

    it('should send bpf as a single multi-line string element', () => {
      component.ngOnInit();

      setParam('bpf', 'Filters', 'tcp port 80\nhost 10.0.0.1');

      component.onYesClick();

      expect(component.link.filters!.bpf).toEqual(['tcp port 80\nhost 10.0.0.1']);
    });

    it('should omit a whitespace-only bpf filter', () => {
      component.ngOnInit();

      setParam('bpf', 'Filters', '   ');

      component.onYesClick();

      expect(component.link.filters).toEqual({});
    });

    it('should send string params as strings', () => {
      component.ngOnInit();

      setParam('rate', 'Rate', '512kbit');
      setParam('delay', 'Latency', 50);
      setParam('delay', 'Jitter (-/+)', 5);
      setParam('delay', 'Distribution', 'normal');

      component.onYesClick();

      expect(component.link.filters!.rate).toEqual(['512kbit']);
      expect(component.link.filters!.delay).toEqual([50, 5, 'normal']);
    });

    it('should trim padded string values (a pasted tc rate)', () => {
      component.ngOnInit();

      setParam('rate', 'Rate', ' 512kbit ');

      component.onYesClick();

      expect(component.link.filters!.rate).toEqual(['512kbit']);
    });
  });

  describe('payload preservation (the PUT replaces the whole filters dict)', () => {
    it('should re-send the link filters unchanged when the catalog fails to load', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink({ delay: [100, 10], bpf: ['tcp port 80'] })));
      mockLinkService.getAvailableFilters.mockReturnValue(throwError(() => new Error('Failed to load available filters')));

      component.ngOnInit();
      component.onYesClick();

      expect(component.link.filters).toEqual({ delay: [100, 10], bpf: ['tcp port 80'] });
      expect(mockLinkService.updateLink).toHaveBeenCalled();
    });

    it('should keep active filters the catalog does not advertise', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink({ corrupt: [50], bpf: ['host 10.0.0.1'] })));

      component.ngOnInit();
      setParam('bpf', 'Filters', '   '); // cleared by the user

      component.onYesClick();

      expect(component.link.filters).toEqual({ corrupt: [50] });
    });
  });

  describe('onNoClick', () => {
    it('should close the dialog without applying changes', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onResetClick', () => {
    it('should reset filters to an empty object', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink({ bpf: ['custom'], corrupt: [50] })));
      component.ngOnInit();

      component.onResetClick();

      expect(component.link.filters).toEqual({});
    });

    it('should call updateLink and close dialog', () => {
      component.ngOnInit();

      component.onResetClick();

      expect(mockLinkService.updateLink).toHaveBeenCalledWith(component.controller, component.link);
      expect(mockToasterService.success).toHaveBeenCalledWith('Packet filters reset.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should do nothing before the dialog data has loaded', () => {
      component.onResetClick();

      expect(mockLinkService.updateLink).not.toHaveBeenCalled();
    });
  });

  describe('onYesClick', () => {
    it('should apply filters, show a success toast and close dialog', () => {
      component.ngOnInit();
      setParam('frequency_drop', 'Frequency', 10);

      component.onYesClick();

      expect(mockLinkService.updateLink).toHaveBeenCalledWith(component.controller, component.link);
      expect(mockToasterService.success).toHaveBeenCalledWith('Packet filters applied.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not send anything while validation errors are present', () => {
      component.ngOnInit();
      setParam('window_drop', 'Chance', 101);

      component.onYesClick();

      expect(mockLinkService.updateLink).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.isApplying()).toBe(false);
    });

    it('should refuse Cancel and Reset while the apply PUT is in flight', () => {
      component.ngOnInit();
      const pending = new Subject<Link>();
      mockLinkService.updateLink.mockReturnValue(pending.asObservable());

      component.onYesClick();
      expect(component.isApplying()).toBe(true);

      component.onNoClick();
      component.onResetClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(mockLinkService.updateLink).toHaveBeenCalledTimes(1); // the apply only

      pending.next(createMockLink());
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show an error toast and re-enable the dialog when apply fails', () => {
      mockLinkService.updateLink.mockReturnValue(throwError(() => new Error('Failed to apply filters')));
      component.ngOnInit();
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.onYesClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to apply filters');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.isApplying()).toBe(false);
      expect((mockDialogRef as any).disableClose).toBe(false);
    });
  });

  describe('Advanced filters collapse', () => {
    it('should split groups into basic and kernel-only advanced sets', () => {
      component.ngOnInit();

      expect(component.basicGroups.map((g) => g.key)).toEqual(['frequency_drop', 'delay', 'bpf']);
      expect(component.advancedGroups.map((g) => g.key)).toEqual(['rate', 'window_drop']);
      expect(component.showAdvanced()).toBe(false);
    });

    it('should not render the advanced toggle when no advanced filters are offered', () => {
      mockLinkService.getAvailableFilters.mockReturnValue(of(mockFilterDescriptions.slice(0, 3)));
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.packet-filters__advanced-toggle')).toBeNull();
      expect(compiled.querySelectorAll('.packet-filters__group-name').length).toBe(3);
    });

    it('should expand advanced groups on toggle and render them all', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.toggleAdvanced();
      fixture.detectChanges();

      expect(component.showAdvanced()).toBe(true);
      expect(cdrSpy).toHaveBeenCalled();
      const names = fixture.nativeElement.querySelectorAll('.packet-filters__group-name');
      expect(names.length).toBe(mockFilterDescriptions.length);
    });

    it('should expand via the toggle button click', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.packet-filters__advanced-button');
      expect(button.textContent).toContain('Show advanced filters (2)');
      button.click();
      fixture.detectChanges();

      expect(component.showAdvanced()).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('.packet-filters__group-name').length).toBe(5);
      expect(fixture.nativeElement.querySelector('.packet-filters__advanced-button').textContent).toContain('Hide advanced filters');
    });

    it('should auto-expand when the link already has an advanced filter active', () => {
      mockLinkService.getLink.mockReturnValue(of(createMockLink({ rate: ['512kbit'] })));

      component.ngOnInit();

      expect(component.showAdvanced()).toBe(true);
      expect(component.basicGroups.map((g) => g.key)).toEqual(['frequency_drop', 'delay', 'bpf']);
    });

    it('should keep collapsed advanced values in the apply payload', () => {
      component.ngOnInit();

      setParam('rate', 'Rate', '10mbit');
      expect(component.showAdvanced()).toBe(false); // value set while collapsed

      component.onYesClick();

      expect(component.link.filters!.rate).toEqual(['10mbit']);
    });

    it('should reveal a collapsed advanced group that blocks the apply', () => {
      component.ngOnInit();

      setParam('window_drop', 'Chance', 101);
      expect(component.showAdvanced()).toBe(false);

      component.onYesClick();

      expect(mockLinkService.updateLink).not.toHaveBeenCalled();
      expect(component.showAdvanced()).toBe(true);
    });
  });

  describe('onHelpClick', () => {
    // The MatDialog provider mock does not take effect in this harness (the
    // real service runs and fails on the missing overlay infrastructure), so
    // spy on the component's injected instances instead.
    const stubHelpDialog = () => {
      vi.spyOn(component['dialogConfig'], 'openConfig').mockReturnValue({ autoFocus: false, disableClose: true } as any);
      vi.spyOn(component['dialog'], 'open').mockReturnValue({ componentInstance: mockDialogInstance } as any);
    };

    it('should open the help dialog with the general conventions and every filter', () => {
      component.ngOnInit();
      stubHelpDialog();

      component.onHelpClick();

      expect(component['dialogConfig'].openConfig).toHaveBeenCalledWith('helpDialog', {
        autoFocus: false,
        disableClose: true,
      });
      expect(component['dialog'].open).toHaveBeenCalled();
      expect(mockDialogInstance.title).toBe('Help for filters');
      // general conventions entry + one entry per advertised filter
      expect(mockDialogInstance.messages.length).toBe(mockFilterDescriptions.length + 1);
      expect(mockDialogInstance.messages[0].name).toBe('How packet filters work');
      expect(mockDialogInstance.messages[0].description).toContain('disables a filter');
      expect(mockDialogInstance.messages[0].description).toContain('each direction of the link independently');
    });

    it('should include parameter ranges in the per-filter help text', () => {
      component.ngOnInit();
      stubHelpDialog();

      component.onHelpClick();

      const delay = mockDialogInstance.messages.find((m: any) => m.name === 'Delay');
      expect(delay.description).toContain('Delay packets in milliseconds.');
      expect(delay.description).toContain('- Latency (ms): 1 to 32767');
      expect(delay.description).toContain('- Distribution (uniform|normal|pareto|paretonormal)');

      const bpf = mockDialogInstance.messages.find((m: any) => m.name === 'Berkeley Packet Filter (BPF)');
      expect(bpf.description).toContain('- Filters: one expression per line');
    });

    it('should not open help before the filter catalog has settled', () => {
      const openSpy = vi.spyOn(component['dialog'], 'open');

      component.onHelpClick(); // availableFilters still undefined

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('Filter form interaction', () => {
    it('should render only basic groups until advanced filters are expanded', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('h1[mat-dialog-title]')).toBeTruthy();
      const names = compiled.querySelectorAll('.packet-filters__group-name');
      expect(names.length).toBe(3); // frequency_drop, delay, bpf — rate/window_drop stay collapsed
    });

    it('should keep filter descriptions out of the form (they live in Help)', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.packet-filters__group-description')).toBeNull();
    });

    it('should show the empty state when no filters are available', () => {
      mockLinkService.getAvailableFilters.mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.packet-filters__empty').textContent).toContain('No traffic filters are available for this link.');
    });

    it('should have Cancel button', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const cancelButton = compiled.querySelector('button');
      expect(cancelButton).toBeTruthy();
    });

    it('should render the validation message under the field (mat-error)', () => {
      component.ngOnInit();
      fixture.detectChanges();

      setParam('window_drop', 'Chance', 101);
      component.toggleAdvanced();
      fixture.detectChanges();

      const errors = fixture.nativeElement.querySelectorAll('mat-error');
      expect(errors.length).toBe(1);
      expect(errors[0].textContent?.trim()).toBe('Chance must be between 0 and 100');
    });

    it('should derive select options from the advertised unit vocabulary', () => {
      const custom: FilterDescription[] = [
        { type: 'netem', name: 'Netem', description: '', parameters: [{ name: 'Profile', type: 'str', unit: 'a|b|c' }] },
      ];
      mockLinkService.getAvailableFilters.mockReturnValue(of(custom));

      component.ngOnInit();

      expect(param('netem', 'Profile').kind).toBe('select');
      expect(param('netem', 'Profile').options).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Error handling', () => {
    it('should show error toast when getLink fails', () => {
      mockLinkService.getLink.mockReturnValue(throwError(() => new Error('Failed to load link filters')));
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.ngOnInit();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load link filters');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should show error toast when updateLink fails on onResetClick', () => {
      mockLinkService.updateLink.mockReturnValue(throwError(() => new Error('Failed to reset filters')));
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.ngOnInit();

      component.onResetClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to reset filters');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should resolve to an error state instead of spinning forever when getLink fails', () => {
      mockLinkService.getLink.mockReturnValue(throwError(() => new Error('Failed to load link filters')));

      component.ngOnInit();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load link filters');
      expect(component.linkLoadFailed).toBe(true);
      expect(component.filterGroups).toBeUndefined();

      component.onYesClick();
      component.onResetClick();
      expect(mockLinkService.updateLink).not.toHaveBeenCalled();
    });
  });
});
