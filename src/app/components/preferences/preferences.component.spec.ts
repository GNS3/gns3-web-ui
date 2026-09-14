import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { ControllerService } from '@services/controller.service';
import { SymbolService } from '@services/symbol.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreferencesComponent } from './preferences.component';
import { CopyTemplateDialogComponent } from './common/copy-template-dialog/copy-template-dialog.component';

describe('PreferencesComponent', () => {
  let component: PreferencesComponent;
  let fixture: ComponentFixture<PreferencesComponent>;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  /** Query params served to the component — mutated in place so the stub closure sees updates. */
  let routeQueryParams: Record<string, string> = {};
  let mockTemplateService: {
    list: ReturnType<typeof vi.fn>;
    deleteTemplate: ReturnType<typeof vi.fn>;
    duplicate: ReturnType<typeof vi.fn>;
  };
  let mockToasterService: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const controller = {
    id: 1,
    name: 'Local controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
  } as Controller;

  const templates: Template[] = [
    {
      template_id: 'qemu-1',
      builtin: false,
      category: 'router',
      compute_id: 'local',
      default_name_format: 'Router-{0}',
      name: 'Edge Router',
      node_type: 'qemu',
      symbol: 'router.svg',
      template_type: 'qemu',
      tags: ['edge'],
    },
    {
      template_id: 'docker-1',
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      default_name_format: 'Web-{0}',
      name: 'Web Server',
      node_type: 'docker',
      symbol: 'docker.svg',
      template_type: 'docker',
      tags: ['server'],
    },
    {
      template_id: 'switch-1',
      builtin: true,
      category: 'switch',
      compute_id: 'local',
      default_name_format: 'Switch-{0}',
      name: 'Ethernet Switch',
      node_type: 'ethernet_switch',
      symbol: 'switch.svg',
      template_type: 'ethernet_switch',
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    Object.keys(routeQueryParams).forEach((key) => delete routeQueryParams[key]);

    mockTemplateService = {
      list: vi.fn().mockReturnValue(of(templates)),
      deleteTemplate: vi.fn().mockReturnValue(of({})),
      duplicate: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PreferencesComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('1'),
              },
              queryParamMap: {
                get: (key: string) => routeQueryParams[key] ?? null,
              },
            },
          },
        },
        { provide: ControllerService, useValue: { get: vi.fn().mockResolvedValue(controller) } },
        { provide: TemplateService, useValue: mockTemplateService },
        {
          provide: SymbolService,
          useValue: { getSymbolBlobUrl: vi.fn().mockReturnValue(of('blob:http://localhost/template-symbol')) },
        },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    // Filter setters sync to the URL via router.navigate — the stubbed
    // ActivatedRoute has no route tree, so keep navigation a no-op spy.
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('loads templates for the current controller', () => {
    expect(component.controllerId).toBe('1');
    expect(mockTemplateService.list).toHaveBeenCalledWith(controller);
    expect(component.templates()).toHaveLength(3);
    expect(component.loading()).toBe(false);
  });

  it('renders the unified Templates heading and toolbar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Templates');
    expect(compiled.querySelector('.templates-page__toolbar')).toBeTruthy();
    expect(compiled.querySelector('mat-table')).toBeTruthy();
  });

  it('defaults to list view and 25 templates per page', () => {
    expect(component.viewMode()).toBe('list');
    expect(component.pageSize()).toBe(25);
    expect(component.paginatedTemplates()).toHaveLength(3);
  });

  it('switches between list and grid view', () => {
    component.setViewMode('grid');
    fixture.detectChanges();

    expect(component.viewMode()).toBe('grid');
    expect(fixture.nativeElement.querySelectorAll('.templates-page__card')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.templates-page__card-tags-row dt')?.textContent).toContain('Tags');
    expect(fixture.nativeElement.querySelector('.templates-page__card-tags')?.textContent).toContain('edge');

    component.setViewMode('list');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-table')).toBeTruthy();
  });

  it('filters by search text, type, and ownership scope', () => {
    component.setSearch('server');
    expect(component.filteredTemplates().map((template) => template.name)).toEqual(['Web Server']);

    component.setSearch('');
    component.setType('qemu');
    expect(component.filteredTemplates().map((template) => template.name)).toEqual(['Edge Router']);

    component.setType('all');
    component.setScope('builtin');
    expect(component.filteredTemplates().map((template) => template.name)).toEqual(['Ethernet Switch']);
  });

  it('restores the filter state from URL query params', async () => {
    vi.useFakeTimers();
    try {
      Object.assign(routeQueryParams, {
        search: 'edge',
        type: 'qemu',
        scope: 'custom',
        sort: 'category',
        dir: 'desc',
        page: '1',
        size: '5',
        view: 'grid',
      });

      component.ngOnInit();
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(component.searchText()).toBe('edge');
      expect(component.selectedType()).toBe('qemu');
      expect(component.selectedScope()).toBe('custom');
      expect(component.sortActive()).toBe('category');
      expect(component.sortDirection()).toBe('desc');
      expect(component.pageSize()).toBe(5);
      expect(component.viewMode()).toBe('grid');
      // Only 1 template survives the filters, so page 1 is clamped back to page 0
      // by ensureValidPage — restoring must never land on an empty page.
      expect(component.pageIndex()).toBe(0);
      // Restoring is passive — it never rewrites the URL or history.
      expect(navigateSpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to defaults for invalid query param values', async () => {
    vi.useFakeTimers();
    try {
      Object.assign(routeQueryParams, {
        search: 'x',
        type: 'does-not-exist',
        scope: 'nope',
        sort: 'bogus',
        dir: 'sideways',
        page: 'abc',
        size: '7',
        view: 'diagram',
      });

      component.ngOnInit();
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(component.searchText()).toBe('x'); // free text — always kept
      expect(component.selectedType()).toBe('all'); // stale type dropped after templates load
      expect(component.selectedScope()).toBe('all');
      expect(component.sortActive()).toBe('name');
      expect(component.sortDirection()).toBe('asc');
      expect(component.pageIndex()).toBe(0);
      expect(component.pageSize()).toBe(25);
      expect(component.viewMode()).toBe('list');
    } finally {
      vi.useRealTimers();
    }
  });

  it('syncs filter changes to the URL with replaceUrl, omitting defaults', () => {
    component.setType('qemu');
    component.setScope('builtin');
    component.onPageChange({ pageIndex: 2, pageSize: 50 } as PageEvent);

    expect(navigateSpy).toHaveBeenCalled();
    const [commands, extras] = navigateSpy.mock.calls[navigateSpy.mock.calls.length - 1] as unknown[];
    expect(commands).toEqual([]);
    expect(extras).toMatchObject({ replaceUrl: true });
    expect((extras as { queryParams: object }).queryParams).toEqual({
      type: 'qemu',
      scope: 'builtin',
      page: 2,
      size: 50,
    });
  });

  it('debounces search-driven URL syncs into one update per typing burst', async () => {
    vi.useFakeTimers();
    try {
      component.setSearch('router');
      component.setSearch('router ');
      component.setSearch('router s');

      expect(navigateSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(300);

      expect(navigateSpy).toHaveBeenCalledTimes(1);
      const [, extras] = navigateSpy.mock.calls[0] as unknown[];
      expect((extras as { queryParams: { search: string } }).queryParams.search).toBe('router s');
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens and closes details for a selected template', () => {
    component.selectTemplate(templates[0]);
    fixture.detectChanges();

    expect(component.selectedTemplate()?.template_id).toBe('qemu-1');
    expect(fixture.nativeElement.querySelector('.templates-page__details')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.templates-page__tags > span')?.textContent).toContain('Tags');
    expect(fixture.nativeElement.querySelector('.templates-page__tags')?.textContent).toContain('edge');

    component.closeDetails();
    expect(component.selectedTemplate()).toBeNull();
  });

  it('uses existing type-specific configuration routes', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.configureTemplate(templates[0]);

    expect(navigate).toHaveBeenCalledWith(['/controller', 1, 'preferences', 'qemu', 'templates', 'qemu-1']);
  });

  it('only enables duplicate and destructive actions for supported custom templates', () => {
    expect(component.canDuplicate(templates[0])).toBe(true);
    expect(component.canConfigure(templates[0])).toBe(true);
    expect(component.canDuplicate(templates[2])).toBe(false);
    expect(component.canConfigure(templates[2])).toBe(false);
  });

  it('duplicates a template via the name dialog and appends the copy to local state', () => {
    const created = { ...templates[0], template_id: 'qemu-1-copy', name: 'Copy of Edge Router' };
    mockTemplateService.duplicate.mockReturnValue(of(created));
    const openSpy = vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of('Copy of Edge Router'),
    } as any);

    const listCallsBefore = mockTemplateService.list.mock.calls.length;
    component.duplicateTemplate(templates[0]);

    expect(openSpy).toHaveBeenCalledWith(CopyTemplateDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel'],
      data: { templateName: 'Edge Router' },
    });
    expect(mockTemplateService.duplicate).toHaveBeenCalledWith(controller, 'qemu-1', 'Copy of Edge Router');
    expect(component.templates()).toHaveLength(4);
    expect(component.templates()[component.templates().length - 1]?.name).toBe('Copy of Edge Router');
    expect(mockToasterService.success).toHaveBeenCalledWith('Template Copy of Edge Router created.');
    expect(mockTemplateService.list.mock.calls.length).toBe(listCallsBefore);
  });

  it('shows an error toaster when duplicating a template fails', () => {
    mockTemplateService.duplicate.mockReturnValue(throwError(() => ({ error: { message: 'Copy failed' } })));
    vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of('Copy of Edge Router'),
    } as any);

    component.duplicateTemplate(templates[0]);

    expect(mockToasterService.error).toHaveBeenCalledWith('Copy failed');
    expect(component.templates()).toHaveLength(3);
  });

  it('does not open the copy dialog for unsupported templates', () => {
    const openSpy = vi.spyOn(component['dialog'], 'open');

    component.duplicateTemplate(templates[2]);

    expect(openSpy).not.toHaveBeenCalled();
    expect(mockTemplateService.duplicate).not.toHaveBeenCalled();
  });

  it('delegates custom-template deletion to the existing confirmation workflow', () => {
    const deleteItem = vi.fn();

    component.deleteTemplate(templates[0], { deleteItem } as any);
    component.deleteTemplate(templates[2], { deleteItem } as any);

    expect(deleteItem).toHaveBeenCalledTimes(1);
    expect(deleteItem).toHaveBeenCalledWith('Edge Router', 'qemu-1');
  });

  it('removes a deleted template from local state without refetching the list', () => {
    const listCallsBefore = mockTemplateService.list.mock.calls.length;
    component.selectTemplate(templates[0]);

    component.onTemplateDeleted('qemu-1');
    fixture.detectChanges();

    expect(component.templates().map((template) => template.template_id)).toEqual(['docker-1', 'switch-1']);
    expect(component.filteredTemplates()).toHaveLength(2);
    expect(component.selectedTemplate()).toBeNull();
    expect(component.loading()).toBe(false);
    expect(mockTemplateService.list.mock.calls.length).toBe(listCallsBefore);
  });

  it('provides readable type labels and resource summaries', () => {
    expect(component.templateTypeLabel('ethernet_switch')).toBe('Ethernet Switch');
    expect(component.templateTypeLabel('custom_emulator')).toBe('Custom Emulator');
    expect(component.getResourceSummary({ ...templates[0], ram: 1024, cpus: 2, adapters: 4 } as any)).toBe(
      '1024 MB RAM · 2 CPUs · 4 adapters'
    );
  });
});
