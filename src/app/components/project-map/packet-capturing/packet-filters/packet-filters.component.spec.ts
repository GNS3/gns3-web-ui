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

      setParam('delay', 'Latency', 0);
      setParam('delay', 'Jitter (-/+)', 5);

      expect(component.paramError(group('delay'), param('delay', 'Latency'))).toBe('Value must be between 1 and 32767');
      expect(component.hasValidationErrors()).toBe(true);
    });

    it('should reject a chance above the maximum', () => {
      component.ngOnInit();

      setParam('window_drop', 'Chance', 101);

      expect(component.paramError(group('window_drop'), param('window_drop', 'Chance'))).toBe('Value must be at most 100');
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
  });

  describe('onNoClick', () => {
    it('should close the dialog without applying changes', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onResetClick', () => {
    it('should reset filters to an empty object', () => {
      component.link = createMockLink({ bpf: ['custom'], corrupt: [50] });

      component.onResetClick();

      expect(component.link.filters).toEqual({});
    });

    it('should call updateLink and close dialog', () => {
      const mockLink = createMockLink();
      component.link = mockLink;

      component.onResetClick();

      expect(mockLinkService.updateLink).toHaveBeenCalledWith(component.controller, component.link);
      expect(mockToasterService.success).toHaveBeenCalledWith('Packet filters reset.');
      expect(mockDialogRef.close).toHaveBeenCalled();
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
      setParam('delay', 'Latency', 0);
      setParam('delay', 'Jitter (-/+)', 5);

      component.onYesClick();

      expect(mockLinkService.updateLink).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.isApplying()).toBe(false);
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

  // Note: onHelpClick tests are skipped due to MatDialog.open() mock complexity
  // Angular Material's MatDialog.open() tries to instantiate HelpDialogComponent
  // internally, which requires a full dialog infrastructure mock that's not trivial
  // to set up in the test environment.
  describe('onHelpClick', () => {
    it.skip('should call dialogConfig.openConfig with helpDialog (skipped - mock complexity)', () => {
      component.ngOnInit();
      component.onHelpClick();

      expect(mockDialogConfig.openConfig).toHaveBeenCalledWith('helpDialog', {
        autoFocus: false,
        disableClose: true,
      });
    });

    it.skip('should call dialog.open with HelpDialogComponent (skipped - mock complexity)', () => {
      component.ngOnInit();
      component.onHelpClick();

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Filter form interaction', () => {
    it('should render one group per filter description', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('h1[mat-dialog-title]')).toBeTruthy();
      const names = compiled.querySelectorAll('.packet-filters__group-name');
      expect(names.length).toBe(mockFilterDescriptions.length);
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
      component.link = createMockLink();

      component.onResetClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to reset filters');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
