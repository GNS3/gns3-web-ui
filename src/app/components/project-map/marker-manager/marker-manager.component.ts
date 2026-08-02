import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Subject, animationFrameScheduler, fromEvent } from 'rxjs';
import { auditTime, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';

import { Controller } from '@models/controller';
import { Project } from '@models/project';
import {
  AggregateMarkerEntry,
  AggregateMarkerMap,
  MarkerDefinitionCreateBody,
  MarkerDefinitionMap,
} from '@models/marker';
import { MarkerService, MarkerWriteBody } from '@services/marker.service';
import { LinkService } from '@services/link.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { MapLinksDataSource } from '../../../cartography/datasources/map-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { MarkerRegistryService } from '@services/marker-registry.service';
import { ToasterService } from '@services/toaster.service';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { WindowManagementService } from '@services/window-management.service';

interface DefinitionRow {
  name: string;
  bpf: string;
  tag: number | null;
  color: string | null;
  highlight_duration: number | null;
  linkCount: number;
}

interface LinkGroup {
  linkId: string;
  name: string;
  markers: GroupMarker[];
}

/** An aggregate marker with its resolved name (parsed from the `"{link_id}/{name}"` key). */
interface GroupMarker extends AggregateMarkerEntry {
  name: string;
}

/** A marker definition name may not start with the reserved `global` prefix. */
function notGlobalName(control: UntypedFormControl): { notGlobalName: true } | null {
  const v = control.value;
  if (typeof v === 'string' && v.trim().toLowerCase().startsWith('global')) {
    return { notGlobalName: true };
  }
  return null;
}

/**
 * Singleton floating panel that manages all traffic-insight markers in a project:
 *  - **Definitions tab** — project-level marker definitions (global rules). The backend
 *    fans each definition out to every capable link; editing syncs all copies, deleting
 *    clears them, new links inherit. Inherited markers are read-only per-link.
 *  - **Links tab** — flat aggregate view (`/markers`) grouped by link, with inherited
 *    badges (read-only) and private-marker create/delete.
 *
 * Window chrome is cloned from {@link NodeFileManagerInlineComponent} (drag + resize +
 * minimize via {@link WindowManagementService}); singleton like the AI-chat window.
 */
@Component({
  standalone: true,
  selector: 'app-marker-manager',
  templateUrl: './marker-manager.component.html',
  styleUrl: './marker-manager.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDividerModule,
    CdkTextareaAutosize,
    ResizableDirective,
    ResizeHandleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerManagerComponent implements OnInit, OnDestroy {
  private readonly DEFAULT_WIDTH = 800;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly DEFAULT_LEFT = '120px';
  private readonly DEFAULT_TOP = '80px';
  private readonly MIN_WIDTH = 560;
  private readonly MIN_HEIGHT = 400;
  private readonly WINDOW_ID = 'marker-manager';

  private destroy$ = new Subject<void>();
  readonly controller = input<Controller>();
  readonly project = input<Project>();
  readonly zIndex = input<number>(1000);

  @Output() closeWindow = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();

  public style: WindowStyle = {
    position: 'fixed',
    left: this.DEFAULT_LEFT,
    top: this.DEFAULT_TOP,
    width: `${this.DEFAULT_WIDTH}px`,
    height: `${this.DEFAULT_HEIGHT}px`,
  };

  public resizedWidth = this.DEFAULT_WIDTH;
  public resizedHeight = this.DEFAULT_HEIGHT;

  private isDraggingSignal = signal(false);
  private isResizingSignal = signal(false);
  private isMinimizedSignal = signal(false);

  readonly isDragging = this.isDraggingSignal.asReadonly();
  readonly isResizing = this.isResizingSignal.asReadonly();
  readonly isMinimized = this.isMinimizedSignal.asReadonly();

  // ---- data ----
  readonly definitions = signal<DefinitionRow[]>([]);
  readonly linkGroups = signal<LinkGroup[]>([]);
  readonly loading = signal(false);
  readonly defError = signal<string | null>(null);
  readonly linkError = signal<string | null>(null);
  readonly editingDefinition = signal<string | null>(null);
  /** linkId currently showing its inline "add private marker" form (Links tab). */
  readonly addingToLink = signal<string | null>(null);
  /** Marker currently being edited: { linkId, name }. */
  readonly editingMarker = signal<{ linkId: string; name: string } | null>(null);
  // ---- Node selector (first step in Links tab) ----
  /** Node options (id + display name). Built once from NodesDataSource. */
  readonly nodeOptions = signal<{ id: string; name: string }[]>([]);
  /** Current text in the searchable node input. */
  readonly nodeSearchText = signal('');
  /** Node options filtered by `nodeSearchText`. */
  readonly filteredNodeOptions = computed(() => {
    const filter = this.nodeSearchText().trim().toLowerCase();
    const all = this.nodeOptions();
    if (!filter) return all;
    return all.filter((o) => o.name.toLowerCase().includes(filter));
  });
  /** Currently selected node; resets link selection on change. */
  readonly selectedNodeId = signal<string | null>(null);

  // ---- Link selector (second step, filtered by selected node) ----
  /** Link selector options (id + display name). Built once from LinksDataSource. */
  readonly linkOptions = signal<{ id: string; name: string }[]>([]);
  /** Current text in the searchable link input (autocomplete filter). */
  readonly linkSearchText = signal('');
  /** Link options filtered by search text AND (optionally) selected node. */
  readonly filteredLinkOptions = computed(() => {
    const filter = this.linkSearchText().trim().toLowerCase();
    const node = this.selectedNodeId();
    let source = this.linkOptions();
    // If a node is selected, narrow to links connected to that node.
    if (node) {
      source = source.filter((o) => {
        const link = this.linksDataSource.get(o.id);
        return link?.nodes?.some((n) => n.node_id === node);
      });
    }
    if (!filter) return source;
    return source.filter((o) => o.name.toLowerCase().includes(filter));
  });
  /** Currently selected link in the Links tab dropdown; null = show all groups. */
  readonly selectedLinkId = signal<string | null>(null);
  /** When a link is selected, its group (synthetic if it has no markers yet). */
  readonly selectedLinkGroup = computed<LinkGroup | null>(() => {
    const sel = this.selectedLinkId();
    if (!sel) return null;
    const existing = this.linkGroups().find((g) => g.linkId === sel);
    return existing ?? { linkId: sel, name: this.linkName(sel), markers: [] };
  });

  // ---- forms ----
  readonly definitionForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, notGlobalName]),
    bpf: new UntypedFormControl('', [Validators.required]),
    tag: new UntypedFormControl(null),
    color: new UntypedFormControl(null),
    highlight_duration: new UntypedFormControl(800, [Validators.required, Validators.min(1)]),
  });

  readonly markerForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, notGlobalName]),
    bpf: new UntypedFormControl('', [Validators.required]),
    tag: new UntypedFormControl(null),
    color: new UntypedFormControl(null),
    highlight_duration: new UntypedFormControl(800, [Validators.required, Validators.min(1)]),
  });

  readonly markerEditForm = new UntypedFormGroup({
    name: new UntypedFormControl({ value: '', disabled: true }, [Validators.required, notGlobalName]),
    bpf: new UntypedFormControl('', [Validators.required]),
    tag: new UntypedFormControl(null),
    color: new UntypedFormControl(null),
    highlight_duration: new UntypedFormControl(800, [Validators.required, Validators.min(1)]),
  });

  private boundaryService = inject(WindowBoundaryService);
  private windowManagement = inject(WindowManagementService);
  private cdr = inject(ChangeDetectorRef);
  private markerService = inject(MarkerService);
  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private mapLinksDataSource = inject(MapLinksDataSource);
  private nodesDataSource = inject(NodesDataSource);
  private markerRegistryService = inject(MarkerRegistryService);
  private toasterService = inject(ToasterService);

  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;

  readonly windowWrapper = viewChild<ElementRef>('windowWrapper');

  constructor() {
    effect(() => {
      const id = this.WINDOW_ID;
      const minimized = this.windowManagement.minimizedWindows();
      const isMin = minimized.some((w) => w.id === id);
      if (isMin !== this.isMinimizedSignal()) {
        this.isMinimizedSignal.set(isMin);
      }
    });
  }

  ngOnInit() {
    const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });
    this.setupDragHandling();
    this.buildNodeOptions();
    this.buildLinkOptions();
    this.loadDefinitions();
    this.loadAggregate();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.windowManagement.restoreWindow(this.WINDOW_ID);
    this.closeWindow.emit();
  }

  toggleMinimize(): void {
    this.windowManagement.toggleMinimize(this.WINDOW_ID, 'marker');
    this.cdr.markForCheck();
  }

  onWindowFocus(): void {
    if (this.isMinimizedSignal()) {
      this.toggleMinimize();
      return;
    }
    this.windowFocused.emit();
    this.cdr.markForCheck();
  }

  // ---- loading ----

  loadDefinitions() {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.loading.set(true);
    this.markerService.listDefinitions(controller, project.project_id).subscribe({
      next: (map: MarkerDefinitionMap) => {
        this.definitions.set(this.toDefinitionRows(map));
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.defError.set(err.error?.message || err.message || 'Failed to load definitions');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private buildNodeOptions() {
    const nodes = this.nodesDataSource.getItems();
    const opts: { id: string; name: string }[] = [];
    for (const n of nodes) {
      if (!n) continue;
      opts.push({ id: n.node_id, name: n.name });
    }
    opts.sort((a, b) => a.name.localeCompare(b.name));
    this.nodeOptions.set(opts);
  }

  private buildLinkOptions() {
    const links = this.linksDataSource.getItems();
    const opts: { id: string; name: string }[] = [];
    for (const link of links) {
      if (!link) continue;
      opts.push({ id: link.link_id, name: this.linkName(link.link_id) });
    }
    opts.sort((a, b) => a.name.localeCompare(b.name));
    this.linkOptions.set(opts);
  }

  loadAggregate() {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.markerService.aggregateList(controller, project.project_id).subscribe({
      next: (map: AggregateMarkerMap) => {
        this.linkGroups.set(this.buildGroups(map));
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.linkError.set(err.error?.message || err.message || 'Failed to load markers');
        this.cdr.markForCheck();
      },
    });
  }

  private toDefinitionRows(map: MarkerDefinitionMap): DefinitionRow[] {
    return Object.entries(map).map(([name, d]) => ({
      name,
      bpf: d.bpf,
      tag: d.tag ?? null,
      color: d.color ?? null,
      highlight_duration: d.highlight_duration ?? null,
      linkCount: d.link_ids?.length ?? 0,
    }));
  }

  private buildGroups(map: AggregateMarkerMap): LinkGroup[] {
    const byLink = new Map<string, GroupMarker[]>();
    for (const [key, entry] of Object.entries(map)) {
      // key is "{link_id}/{name}" — link_id is a UUID (no '/'), so the name is the rest.
      const slashIdx = key.indexOf('/');
      const name = slashIdx >= 0 ? key.slice(slashIdx + 1) : key;
      const arr = byLink.get(entry.link_id) ?? [];
      arr.push({ ...entry, name });
      byLink.set(entry.link_id, arr);
    }
    const groups: LinkGroup[] = [];
    for (const [linkId, markers] of byLink) {
      groups.push({ linkId, name: this.linkName(linkId), markers });
    }
    groups.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }

  private linkName(linkId: string): string {
    const link = this.linksDataSource.get(linkId);
    const nodes = link?.nodes;
    if (!nodes || nodes.length < 2) return linkId.slice(0, 8);
    const src = this.nodesDataSource.get(nodes[0].node_id);
    const dst = this.nodesDataSource.get(nodes[1].node_id);
    if (!src || !dst) return linkId.slice(0, 8);
    const sLabel = nodes[0].label?.text ?? '';
    const dLabel = nodes[1].label?.text ?? '';
    return `${src.name} ${sLabel} → ${dst.name} ${dLabel}`.replace(/\s+/g, ' ').trim();
  }

  // ---- definitions CRUD ----

  submitDefinition() {
    if (this.definitionForm.invalid) {
      this.definitionForm.markAllAsTouched();
      return;
    }
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.defError.set(null);

    const v = this.definitionForm.getRawValue();
    const body: MarkerDefinitionCreateBody = { name: v.name.trim(), bpf: v.bpf.trim() };
    const tag = this.asNumber(v.tag);
    if (tag !== null) body.tag = tag;
    if (v.color) body.color = v.color;
    const hd = this.asNumber(v.highlight_duration);
    if (hd !== null) body.highlight_duration = hd;

    const editing = this.editingDefinition();
    const done = () => {
      this.toasterService.success(`Marker definition "${body.name}" ${editing ? 'updated' : 'created'}.`);
      this.cancelEditDefinition();
      this.loadDefinitions();
      // The fan-out emits link.updated → registry reconciles (legend/icons); also refresh
      // the Links tab so inherited markers appear/disappear immediately.
      this.loadAggregate();
    };
    const fail = (err: any) => {
      const message = err.error?.message || err.message || 'Failed to save definition';
      this.defError.set(message);
      this.toasterService.error(message);
      this.cdr.markForCheck();
    };

    if (editing) {
      this.markerService.updateDefinition(controller, project.project_id, editing, body).subscribe({
        next: () => done(),
        error: fail,
      });
    } else {
      this.markerService.createDefinition(controller, project.project_id, body).subscribe({
        next: () => done(),
        error: fail,
      });
    }
  }

  startEditDefinition(row: DefinitionRow) {
    this.editingDefinition.set(row.name);
    this.defError.set(null);
    this.definitionForm.reset({
      name: row.name,
      bpf: row.bpf,
      tag: row.tag,
      color: row.color,
      highlight_duration: row.highlight_duration,
    });
    // Name is immutable on update; disable to communicate that.
    this.definitionForm.get('name')?.disable();
    this.cdr.markForCheck();
  }

  cancelEditDefinition() {
    this.editingDefinition.set(null);
    this.definitionForm.reset();
    this.definitionForm.get('name')?.enable();
    this.defError.set(null);
    this.cdr.markForCheck();
  }

  deleteDefinition(row: DefinitionRow) {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.defError.set(null);
    this.markerService.deleteDefinition(controller, project.project_id, row.name).subscribe({
      next: () => {
        this.toasterService.success(`Marker definition "${row.name}" deleted.`);
        if (this.editingDefinition() === row.name) this.cancelEditDefinition();
        this.loadDefinitions();
        this.loadAggregate();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to delete definition';
        this.defError.set(message);
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  // ---- private per-link marker create / delete (Links tab) ----

  /** Node selected in the left autocomplete — reset link selection. */
  onNodeSelect(nodeId: string | null) {
    this.selectedNodeId.set(nodeId);
    this.selectedLinkId.set(null);
    this.linkSearchText.set('');
    this.markerForm.reset();
    this.linkError.set(null);
    // Update the input to show the node's display name instead of its id.
    if (nodeId) {
      const n = this.nodeOptions().find((o) => o.id === nodeId);
      if (n) this.nodeSearchText.set(n.name);
    } else {
      this.nodeSearchText.set('');
    }
    this.cdr.markForCheck();
  }

  onLinkSelect(linkId: string | null) {
    this.selectedLinkId.set(linkId);
    this.addingToLink.set(null);
    this.markerForm.reset();
    this.linkError.set(null);
    this.linkSearchText.set(linkId ? this.linkName(linkId) : '');
    this.cdr.markForCheck();
  }

  /** Clear autocomplete inputs and return to the aggregate view. */
  resetLinkSelect() {
    this.selectedNodeId.set(null);
    this.nodeSearchText.set('');
    this.selectedLinkId.set(null);
    this.linkSearchText.set('');
    this.linkError.set(null);
    this.cdr.markForCheck();
  }

  toggleAddMarker(linkId: string) {
    this.addingToLink.set(this.addingToLink() === linkId ? null : linkId);
    this.markerForm.reset();
    this.linkError.set(null);
    this.cdr.markForCheck();
  }

  submitMarker(linkId: string) {
    if (this.markerForm.invalid) {
      this.markerForm.markAllAsTouched();
      return;
    }
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.linkError.set(null);

    const v = this.markerForm.getRawValue();
    const body: MarkerWriteBody = { bpf: v.bpf.trim(), name: v.name.trim() };
    const tag = this.asNumber(v.tag);
    if (tag !== null) body.tag = tag;
    if (v.color) body.color = v.color;
    const hd = this.asNumber(v.highlight_duration);
    if (hd !== null) body.highlight_duration = hd;

    this.markerService.create(controller, project.project_id, linkId, body).subscribe({
      next: () => {
        this.toasterService.success(`Marker "${body.name}" created.`);
        if (this.selectedLinkId()) {
          this.markerForm.reset();
        } else {
          this.toggleAddMarker(linkId);
        }
        this.refreshLink(linkId);
        this.loadAggregate();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to create marker';
        this.linkError.set(message);
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  deleteMarker(linkId: string, name: string) {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.linkError.set(null);
    this.markerService.delete(controller, project.project_id, linkId, name).subscribe({
      next: () => {
        this.toasterService.success(`Marker "${name}" deleted.`);
        this.refreshLink(linkId);
        this.loadAggregate();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to delete marker';
        this.linkError.set(message);
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  startEditMarker(linkId: string, marker: GroupMarker) {
    this.editingMarker.set({ linkId, name: marker.name });
    this.linkError.set(null);
    this.markerEditForm.reset({
      name: marker.name,
      bpf: marker.bpf,
      tag: marker.tag ?? null,
      color: marker.color ?? null,
      highlight_duration: marker.highlight_duration ?? 800,
    });
    this.markerEditForm.get('name')?.disable();
    this.cdr.markForCheck();
  }

  cancelEditMarker() {
    this.editingMarker.set(null);
    this.cdr.markForCheck();
  }

  submitEditMarker(linkId: string) {
    if (this.markerEditForm.invalid) {
      this.markerEditForm.markAllAsTouched();
      return;
    }
    const editing = this.editingMarker();
    if (!editing) return;
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.linkError.set(null);

    const v = this.markerEditForm.getRawValue();
    const body: MarkerWriteBody = { bpf: v.bpf.trim() };
    const tag = this.asNumber(v.tag);
    if (tag !== null) body.tag = tag;
    if (v.color) body.color = v.color;
    const hd = this.asNumber(v.highlight_duration);
    if (hd !== null) body.highlight_duration = hd;

    this.markerService.update(controller, project.project_id, linkId, editing.name, body).subscribe({
      next: () => {
        this.toasterService.success(`Marker "${editing.name}" updated.`);
        this.editingMarker.set(null);
        this.refreshLink(linkId);
        this.loadAggregate();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to update marker';
        this.linkError.set(message);
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  /** Canonical 5-step refresh after a private-marker mutation on a single link. */
  private refreshLink(linkId: string) {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.linkService.getLink(controller, project.project_id, linkId).subscribe({
      next: (link) => {
        this.linksDataSource.update(link);
        const mapLink = this.mapLinksDataSource.get(linkId);
        if (mapLink) {
          mapLink.markers = link.markers;
          this.mapLinksDataSource.update(mapLink);
        }
        this.markerRegistryService.reconcileLink(link);
      },
      error: (err) =>
        this.toasterService.error(err.error?.message || err.message || 'Failed to refresh link'),
    });
  }

  private asNumber(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  // ---- window chrome (cloned from node-file-manager-inline) ----

  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < this.MIN_WIDTH || event.rectangle.height < this.MIN_HEIGHT)
    ) {
      return false;
    }
    return true;
  }

  onResizeStart(): void {
    this.isResizingSignal.set(true);
    this.setContentPointerEvents('none');
    this.cdr.markForCheck();
  }

  onResizeEnd(event: ResizeEvent): void {
    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width || this.resizedWidth,
      event.rectangle.height || this.resizedHeight,
      event.rectangle.left,
      event.rectangle.top
    );

    this.style = {
      position: 'fixed',
      left: `${constrained.left}px`,
      top: `${constrained.top}px`,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`,
    };

    this.resizedWidth = constrained.width;
    this.resizedHeight = constrained.height;

    this.isResizingSignal.set(false);
    this.setContentPointerEvents('');
    this.cdr.markForCheck();
  }

  private setupDragHandling(): void {
    const windowElement = this.windowWrapper()?.nativeElement;
    if (!windowElement) return;

    const headerElement = windowElement.querySelector('.marker-manager__header') as HTMLElement;
    if (!headerElement) return;

    const mouseDown$ = fromEvent<MouseEvent>(headerElement, 'mousedown');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    mouseDown$
      .pipe(
        takeUntil(this.destroy$),
        tap((e) => {
          e.preventDefault();
          this.isDraggingSignal.set(true);
          this.cdr.markForCheck();

          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.dragStartLeft = Number(this.style.left?.toString().split('px')[0]) || 0;
          this.dragStartTop = Number(this.style.top?.toString().split('px')[0]) || 0;

          this.setContentPointerEvents('none');
        }),
        switchMap(() =>
          mouseMove$.pipe(
            auditTime(0, animationFrameScheduler),
            takeUntil(
              mouseUp$.pipe(
                tap(() => {
                  this.onDragEnd();
                })
              )
            )
          )
        )
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        const dx = mouseMoveEvent.clientX - this.dragStartX;
        const dy = mouseMoveEvent.clientY - this.dragStartY;

        let newLeft = this.dragStartLeft + dx;
        let newTop = this.dragStartTop + dy;

        // Constrain drag to viewport (mirrors web-console-inline)
        const w = this.resizedWidth;
        const h = this.resizedHeight;
        const maxLeft = window.innerWidth - w;
        const topOffset = this.boundaryService.getConfigValue().topOffset || 0;
        const maxTop = window.innerHeight - h - topOffset;
        newLeft = Math.max(0, Math.min(maxLeft, newLeft));
        newTop = Math.max(topOffset, Math.min(maxTop, newTop));

        this.style = {
          position: 'fixed',
          left: `${newLeft}px`,
          top: `${newTop}px`,
          width: this.style.width,
          height: this.style.height,
        };

        this.cdr.markForCheck();
      });
  }

  private onDragEnd(): void {
    this.isDraggingSignal.set(false);
    this.setContentPointerEvents('');
    this.cdr.markForCheck();
  }

  private setContentPointerEvents(value: string): void {
    const windowElement = this.windowWrapper()?.nativeElement;
    if (!windowElement) return;
    const body = windowElement.querySelector('.marker-manager__body') as HTMLElement;
    if (body) {
      body.style.pointerEvents = value;
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.style = this.boundaryService.constrainWindowPosition(this.style);
  }
}
