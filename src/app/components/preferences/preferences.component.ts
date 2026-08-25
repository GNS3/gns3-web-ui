import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { ControllerService } from '@services/controller.service';
import { SymbolService } from '@services/symbol.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from './common/delete-template-component/delete-template.component';

type TemplateViewMode = 'list' | 'grid';
type TemplateScope = 'all' | 'custom' | 'builtin';
type TemplateSortDirection = 'asc' | 'desc' | '';

type TemplateListItem = Template &
  Partial<{
    usage: string;
    console_type: string;
    aux_type: string;
    image: string;
    path: string;
    hda_disk_image: string;
    adapters: number;
    ethernet_adapters: number;
    serial_adapters: number;
    ports_mapping: unknown[];
    ram: number;
    memory: number;
    cpus: number;
  }>;

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    DeleteTemplateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesComponent implements OnInit {
  controllerId = '';
  controller: Controller;

  readonly templates = signal<TemplateListItem[]>([]);
  readonly loading = signal(true);
  readonly searchText = signal('');
  readonly selectedType = signal('all');
  readonly selectedScope = signal<TemplateScope>('all');
  readonly viewMode = signal<TemplateViewMode>('list');
  readonly selectedTemplate = signal<TemplateListItem | null>(null);
  readonly sortActive = signal('name');
  readonly sortDirection = signal<TemplateSortDirection>('asc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [5, 10, 25, 50, 100];
  readonly displayedColumns = ['name', 'template_type', 'category', 'compute_id', 'builtin', 'actions'];
  readonly symbolBlobUrls = signal<Map<string, string>>(new Map());

  readonly templateTypes = computed(() =>
    Array.from(
      new Set(
        this.templates()
          .map((template) => template.template_type)
          .filter(Boolean)
      )
    ).sort((a, b) => this.templateTypeLabel(a).localeCompare(this.templateTypeLabel(b)))
  );

  readonly filteredTemplates = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const type = this.selectedType();
    const scope = this.selectedScope();
    let templates = this.templates();

    if (scope === 'custom') {
      templates = templates.filter((template) => !template.builtin);
    } else if (scope === 'builtin') {
      templates = templates.filter((template) => template.builtin);
    }

    if (type !== 'all') {
      templates = templates.filter((template) => template.template_type === type);
    }

    if (search) {
      templates = templates.filter((template) =>
        [
          template.name,
          template.template_type,
          template.category,
          template.compute_id,
          template.usage,
          ...(template.tags || []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      );
    }

    const active = this.sortActive();
    const direction = this.sortDirection();
    if (!active || !direction) {
      return templates;
    }

    return [...templates].sort((left, right) => {
      const a = String(left[active as keyof TemplateListItem] ?? '').toLowerCase();
      const b = String(right[active as keyof TemplateListItem] ?? '').toLowerCase();
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) * (direction === 'asc' ? 1 : -1);
    });
  });

  readonly paginatedTemplates = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredTemplates().slice(start, start + this.pageSize());
  });

  readonly customTemplateCount = computed(() => this.templates().filter((template) => !template.builtin).length);
  readonly builtinTemplateCount = computed(() => this.templates().filter((template) => template.builtin).length);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private controllerService = inject(ControllerService);
  private templateService = inject(TemplateService);
  private symbolService = inject(SymbolService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id') ?? '';
    const numericControllerId = Number.parseInt(this.controllerId, 10);

    this.controllerService.get(numericControllerId).then(
      (controller: Controller) => {
        this.controller = controller;
        this.loadTemplates();
      },
      (err) => {
        this.loading.set(false);
        this.toasterService.error(err.error?.message || err.message || 'Failed to load controller');
        this.cd.markForCheck();
      }
    );
  }

  loadTemplates(): void {
    if (!this.controller) {
      return;
    }

    this.loading.set(true);
    this.templateService.list(this.controller).subscribe({
      next: (templates: TemplateListItem[]) => {
        this.templates.set(templates || []);
        this.loading.set(false);
        this.refreshSelectedTemplate();
        this.ensureValidPage();
        this.loadTemplateSymbols(templates || []);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.loading.set(false);
        this.toasterService.error(err.error?.message || err.message || 'Failed to load templates');
        this.cd.markForCheck();
      },
    });
  }

  setScope(scope: TemplateScope): void {
    this.selectedScope.set(scope);
    this.resetPage();
  }

  setSearch(value: string): void {
    this.searchText.set(value);
    this.resetPage();
  }

  setType(value: string): void {
    this.selectedType.set(value);
    this.resetPage();
  }

  setViewMode(mode: TemplateViewMode): void {
    this.viewMode.set(mode);
  }

  onSortByChange(active: string): void {
    this.sortActive.set(active);
    if (!this.sortDirection()) {
      this.sortDirection.set('asc');
    }
    this.resetPage();
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active || 'name');
    this.sortDirection.set(sort.direction);
    this.resetPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  selectTemplate(template: TemplateListItem): void {
    this.selectedTemplate.set(template);
  }

  closeDetails(): void {
    this.selectedTemplate.set(null);
  }

  templateTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      cloud: 'Cloud',
      docker: 'Docker',
      dynamips: 'Dynamips',
      ethernet_hub: 'Ethernet Hub',
      ethernet_switch: 'Ethernet Switch',
      iou: 'IOS on Unix',
      nat: 'NAT',
      qemu: 'QEMU',
      vpcs: 'VPCS',
    };
    return labels[type] || this.toTitleCase(type);
  }

  templateTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      cloud: 'cloud',
      docker: 'deployed_code',
      dynamips: 'router',
      ethernet_hub: 'device_hub',
      ethernet_switch: 'settings_ethernet',
      iou: 'lan',
      nat: 'public',
      qemu: 'memory',
      vpcs: 'computer',
    };
    return icons[type] || 'developer_board';
  }

  /**
   * Returns the theme-color modifier class for a template type badge so each
   * type is easily identifiable (maps to a distinct --mat-sys-* role).
   */
  typeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      cloud: 'templates-page__type-badge--cloud',
      docker: 'templates-page__type-badge--docker',
      dynamips: 'templates-page__type-badge--dynamips',
      ethernet_hub: 'templates-page__type-badge--ethernet-hub',
      ethernet_switch: 'templates-page__type-badge--ethernet-switch',
      iou: 'templates-page__type-badge--iou',
      nat: 'templates-page__type-badge--nat',
      qemu: 'templates-page__type-badge--qemu',
      vpcs: 'templates-page__type-badge--vpcs',
    };
    return classes[type] || '';
  }

  getSymbolSource(template: TemplateListItem): string | null {
    return template.symbol ? this.symbolBlobUrls().get(template.symbol) || null : null;
  }

  getResourceSummary(template: TemplateListItem): string {
    const parts: string[] = [];
    const ram = template.ram ?? template.memory;
    if (ram) parts.push(`${ram} MB RAM`);
    if (template.cpus) parts.push(`${template.cpus} CPU${template.cpus === 1 ? '' : 's'}`);
    const adapters = this.getAdapterCount(template);
    if (adapters !== null) parts.push(`${adapters} adapter${adapters === 1 ? '' : 's'}`);
    return parts.join(' · ') || 'Server defaults';
  }

  getAdapterCount(template: TemplateListItem): number | null {
    if (typeof template.adapters === 'number') return template.adapters;
    if (typeof template.ethernet_adapters === 'number' || typeof template.serial_adapters === 'number') {
      return (template.ethernet_adapters || 0) + (template.serial_adapters || 0);
    }
    if (Array.isArray(template.ports_mapping)) return template.ports_mapping.length;
    return null;
  }

  getImageName(template: TemplateListItem): string {
    return template.image || template.path || template.hda_disk_image || '';
  }

  canConfigure(template: TemplateListItem): boolean {
    return !template.builtin && !!this.getDetailsRoute(template);
  }

  canDuplicate(template: TemplateListItem): boolean {
    return !template.builtin && ['docker', 'dynamips', 'iou', 'qemu'].includes(template.template_type);
  }

  configureTemplate(template: TemplateListItem): void {
    const route = this.getDetailsRoute(template);
    if (route) {
      this.router.navigate(route);
    }
  }

  duplicateTemplate(template: TemplateListItem): void {
    if (!this.canDuplicate(template)) {
      return;
    }
    this.router.navigate([
      '/controller',
      this.controller.id,
      'preferences',
      template.template_type,
      'templates',
      template.template_id,
      'copy',
    ]);
  }

  deleteTemplate(template: TemplateListItem, deleteComponent: DeleteTemplateComponent): void {
    if (!template.builtin) {
      deleteComponent.deleteItem(template.name, template.template_id);
    }
  }

  /**
   * Removes a deleted template from local state instead of refetching the
   * whole list: the delete event only fires after the server confirmed the
   * deletion, and the signal -> computed -> trackBy chain updates the DOM
   * surgically (no full-table reload flicker).
   */
  onTemplateDeleted(templateId: string): void {
    this.templates.update((templates) => templates.filter((template) => template.template_id !== templateId));
    if (this.selectedTemplate()?.template_id === templateId) {
      this.closeDetails();
    }
    this.ensureValidPage();
  }

  trackTemplate(_index: number, template: TemplateListItem): string {
    return template.template_id;
  }

  private getDetailsRoute(template: TemplateListItem): (string | number)[] | null {
    const base: (string | number)[] = ['/controller', this.controller.id, 'preferences'];
    const routes: Record<string, (string | number)[]> = {
      cloud: [...base, 'builtin', 'cloud-nodes', template.template_id],
      docker: [...base, 'docker', 'templates', template.template_id],
      dynamips: [...base, 'dynamips', 'templates', template.template_id],
      ethernet_hub: [...base, 'builtin', 'ethernet-hubs', template.template_id],
      ethernet_switch: [...base, 'builtin', 'ethernet-switches', template.template_id],
      iou: [...base, 'iou', 'templates', template.template_id],
      qemu: [...base, 'qemu', 'templates', template.template_id],
      vpcs: [...base, 'vpcs', 'templates', template.template_id],
    };
    return routes[template.template_type] || null;
  }

  private loadTemplateSymbols(templates: TemplateListItem[]): void {
    const symbols = Array.from(new Set(templates.map((template) => template.symbol).filter(Boolean)));
    symbols.forEach((symbol) => {
      if (this.symbolBlobUrls().has(symbol)) {
        return;
      }
      this.symbolService.getSymbolBlobUrl(this.controller, `/symbols/${symbol}/raw`).subscribe({
        next: (blobUrl) => {
          this.symbolBlobUrls.update((current) => {
            const updated = new Map(current);
            updated.set(symbol, blobUrl);
            return updated;
          });
          this.cd.markForCheck();
        },
        error: () => {
          // The type-specific Material icon remains visible when a symbol cannot be loaded.
        },
      });
    });
  }

  private refreshSelectedTemplate(): void {
    const selectedId = this.selectedTemplate()?.template_id;
    if (selectedId) {
      this.selectedTemplate.set(this.templates().find((template) => template.template_id === selectedId) || null);
    }
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }

  private ensureValidPage(): void {
    const lastPage = Math.max(0, Math.ceil(this.filteredTemplates().length / this.pageSize()) - 1);
    if (this.pageIndex() > lastPage) {
      this.pageIndex.set(lastPage);
    }
  }

  private toTitleCase(value: string): string {
    return (value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }
}
