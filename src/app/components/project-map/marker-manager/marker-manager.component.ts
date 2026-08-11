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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  MarkerMap,
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
import { MarkerFormComponent } from './marker-form.component';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

interface DefinitionRow {
  name: string;
  bpf: string;
  tag: number | null;
  color: string | null;
  highlight_duration: number | null;
  direction: 'tx' | 'rx' | null;
  data_link_type: string;
  linkCount: number;
  paused: boolean;
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
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    CdkTextareaAutosize,
    ResizableDirective,
    ResizeHandleDirective,
    MarkerFormComponent,
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
  readonly linkError = signal<{ linkId: string | null; message: string } | null>(null);
  readonly activeTabIndex = signal(0);
  readonly editingDefinition = signal<string | null>(null);

  /** linkId currently showing its inline "add private marker" form (Links tab). */
  readonly addingToLink = signal<string | null>(null);
  /** Marker currently being edited: { linkId, name }. */
  readonly editingMarker = signal<{ linkId: string; name: string } | null>(null);
  /** LinkIds whose marker list is collapsed in the aggregate Links view. */
  readonly collapsedGroups = signal<Set<string>>(new Set());
  /** Definition name whose pause/resume request is in flight — guards double-fires + drives that row's spinner. */
  readonly togglingDefinition = signal<string | null>(null);
  /** `${linkId}/${name}` of the per-marker enable request in flight — guards + drives that row's spinner. */
  readonly togglingMarker = signal<string | null>(null);
  /** Definition name whose delete request is in flight — drives that row's spinner. */
  readonly deletingDefinition = signal<string | null>(null);
  /** Whether the definition create/update form is currently submitting. */
  readonly submittingDefinition = signal(false);
  /** `${linkId}/${name}` of the per-marker delete request in flight — drives that row's spinner. */
  readonly deletingMarker = signal<string | null>(null);
  /** linkId whose per-marker create form is currently submitting. */
  readonly submittingMarker = signal<string | null>(null);
  /** Whether the per-marker edit form is currently submitting. */
  readonly submittingEditMarker = signal(false);
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
    // `tag` is reserved for the upcoming traffic-replay feature. There's no UI for it
    // on definitions yet, so it stays null and submitDefinition()'s tag read is a no-op
    // until the field ships — kept here deliberately, not dead code.
    tag: new UntypedFormControl(null),
    color: new UntypedFormControl(null),
    highlight_duration: new UntypedFormControl(800, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    direction: new UntypedFormControl('both'),
    // `null` ⇒ Ethernet-only definition (serial links skipped). A WAN value makes the
    // definition also cover serial links of that encapsulation; Ethernet stays EN10MB.
    data_link_type: new UntypedFormControl(null),
  });

  readonly markerForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, notGlobalName]),
    bpf: new UntypedFormControl('', [Validators.required]),
    tag: new UntypedFormControl(null),
    color: new UntypedFormControl(null),
    highlight_duration: new UntypedFormControl(800, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    direction: new UntypedFormControl('both'),
    // `null` on Ethernet (picker hidden, backend defaults to DLT_EN10MB); seeded with the
    // first WAN encapsulation when the form opens on a serial link (see toggleAddMarker).
    data_link_type: new UntypedFormControl(null),
    capture_node_id: new UntypedFormControl(null),
  });

  readonly markerEditForm = new UntypedFormGroup({
    name: new UntypedFormControl({ value: '', disabled: true }, [Validators.required, notGlobalName]),
    bpf: new UntypedFormControl('', [Validators.required]),
    tag: new UntypedFormControl(null),
    color: new UntypedFormControl(null),
    highlight_duration: new UntypedFormControl(800, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    direction: new UntypedFormControl('both'),
    // Create-only on per-link markers — disabled in edit (recreate to switch encapsulation).
    data_link_type: new UntypedFormControl({ value: 'DLT_EN10MB', disabled: true }),
    capture_node_id: new UntypedFormControl({ value: null, disabled: true }),
  });

  /**
   * WAN encapsulations — the only options offered in the marker forms. Setting one
   * on a definition/per-link serial marker makes it decode serial traffic; leaving
   * it unset means Ethernet-only (the server's default DLT_EN10MB). Same values the
   * capture dialog uses (`start-capture.component.ts`). Cisco PPP is
   * `DLT_PPP_SERIAL` (50), not raw `DLT_PPP` (9).
   */
  readonly serialDataLinkTypes: readonly { label: string; value: string }[] = [
    { label: 'Cisco HDLC', value: 'DLT_C_HDLC' },
    { label: 'Cisco PPP', value: 'DLT_PPP_SERIAL' },
    { label: 'Frame Relay', value: 'DLT_FRELAY' },
    { label: 'ATM', value: 'DLT_ATM_RFC1483' },
  ];

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
  private dialog = inject(MatDialog);

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
    this.markerService.listDefinitions(controller, project.project_id).pipe(takeUntil(this.destroy$)).subscribe({
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
    this.markerService.aggregateList(controller, project.project_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (map: AggregateMarkerMap) => {
        this.linkGroups.set(this.buildGroups(map));
        this.markerRegistryService.rebuildFromAggregate(map);
        this.syncLinkMarkersFromAggregate(map);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.linkError.set({ linkId: null, message: err.error?.message || err.message || 'Failed to load markers' });
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
      direction: (d.direction as 'tx' | 'rx' | null) ?? null,
      // Normalize EN10MB → null so the picker shows "Ethernet only" (blank) for defaults.
      data_link_type: d.data_link_type && d.data_link_type !== 'DLT_EN10MB' ? d.data_link_type : null,
      linkCount: d.link_ids?.length ?? 0,
      paused: d.paused ?? false,
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

  /**
   * Write the aggregate map's authoritative per-link marker state back into the
   * cartography + map link objects.
   *
   * `marker.match` resolves the flash color from
   * `linksDataSource.get(id).markers[name].color` on demand (it does not
   * subscribe to changes), so a definition color edit that only refreshes the
   * legend registry leaves the stored link object stale → the flash falls back
   * to the default theme color until a full page reload. The aggregate view
   * (`GET /projects/{pid}/markers`) carries every marker field for every link,
   * so rebuilding each link's `markers` from it and mutating the stored objects
   * in place (no emit, no redraw) is enough: the next `marker.match` reads the
   * fresh color. Replacing (not merging) also drops markers removed by a
   * definition delete; private markers are preserved because the aggregate
   * includes them too.
   */
  private syncLinkMarkersFromAggregate(map: AggregateMarkerMap) {
    const byLink = new Map<string, MarkerMap>();
    for (const [key, entry] of Object.entries(map)) {
      const linkId = entry.link_id;
      if (!linkId) continue;
      const slashIdx = key.indexOf('/');
      const name = slashIdx >= 0 ? key.slice(slashIdx + 1) : key;
      let mm = byLink.get(linkId);
      if (!mm) {
        mm = {};
        byLink.set(linkId, mm);
      }
      // Strip the aggregate-only keys; keep every Marker field (bpf/color/dir/...).
      const { link_id: _linkId, node_id: _nodeId, ...marker } = entry;
      mm[name] = marker;
    }
    for (const [linkId, markers] of byLink) {
      const link = this.linksDataSource.get(linkId);
      if (link) link.markers = markers;
      const mapLink = this.mapLinksDataSource.get(linkId);
      if (mapLink) mapLink.markers = markers;
    }
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

  /** Endpoint nodes of a link — options for the per-link "Capture node" dropdown. */
  linkEndpoints(linkId: string): { id: string; name: string }[] {
    const link = this.linksDataSource.get(linkId);
    const nodes = link?.nodes;
    if (!nodes || nodes.length === 0) return [];
    return nodes.map((n) => {
      const node = this.nodesDataSource.get(n.node_id);
      return { id: n.node_id, name: node?.name ?? n.node_id };
    });
  }

  /** Resolve a node id to its display name (falls back to the raw id). */
  nodeName(nodeId: string): string {
    return this.nodesDataSource.get(nodeId)?.name ?? nodeId;
  }

  /** The protocol link_type of a link (`'ethernet'` / `'serial'`; defaults to ethernet). */
  linkTypeOf(linkId: string): string {
    return this.linksDataSource.get(linkId)?.link_type ?? 'ethernet';
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
    this.submittingDefinition.set(true);

    const v = this.definitionForm.getRawValue();
    const body: MarkerDefinitionCreateBody = { name: v.name.trim(), bpf: v.bpf.trim() };
    const tag = this.asNumber(v.tag);
    if (tag !== null) body.tag = tag;
    if (v.color) body.color = v.color;
    const hd = this.asNumber(v.highlight_duration);
    if (hd !== null) body.highlight_duration = hd;
    const dir = this.dirToBody(v.direction);
    if (dir) body.direction = dir;
    if (v.data_link_type) body.data_link_type = v.data_link_type;

    const editing = this.editingDefinition();
    // An encapsulation change re-fans-out the definition: every inherited copy is rebuilt
    // and capture restarts on each affected link (uBridge itself is unaffected). Confirm
    // with the user before sending the PUT so they can back out.
    const origDlt = editing ? this.definitions().find((d) => d.name === editing)?.data_link_type ?? null : null;
    const dltChanged = !!editing && origDlt !== (v.data_link_type ?? null);
    const done = () => {
      this.submittingDefinition.set(false);
      this.cancelEditDefinition();
      this.loadDefinitions();
      this.loadAggregate();
    };
    const fail = (err: any) => {
      this.submittingDefinition.set(false);
      this.defError.set(err.error?.message || err.message || 'Failed to save definition');
      this.cdr.markForCheck();
    };
    const runUpdate = () => {
      this.markerService.updateDefinition(controller, project.project_id, editing!, body).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => done(),
        error: fail,
      });
    };

    if (editing) {
      if (dltChanged) {
        const ref = this.dialog.open(ConfirmationDialogComponent, {
          data: {
            title: 'Confirm encapsulation change',
            message:
              'Changing the encapsulation rebuilds this definition’s markers and restarts capture on every link it applies to. uBridge itself is unaffected. Continue?',
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
          },
          panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
          autoFocus: false,
          restoreFocus: false,
        });
        ref.afterClosed().subscribe((ok: boolean) => {
          if (ok) {
            runUpdate();
          } else {
            this.submittingDefinition.set(false);
            this.cdr.markForCheck();
          }
        });
      } else {
        runUpdate();
      }
    } else {
      this.markerService.createDefinition(controller, project.project_id, body).pipe(takeUntil(this.destroy$)).subscribe({
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
      direction: this.dirFromMarker(row.direction),
      data_link_type: row.data_link_type ?? null,
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
    // Guard against double-fires while a delete is already in flight.
    if (this.deletingDefinition() === row.name) return;
    this.defError.set(null);
    this.deletingDefinition.set(row.name);
    this.markerService.deleteDefinition(controller, project.project_id, row.name).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.deletingDefinition.set(null);
        if (this.editingDefinition() === row.name) this.cancelEditDefinition();
        this.loadDefinitions();
        this.loadAggregate();
      },
      error: (err) => {
        this.deletingDefinition.set(null);
        this.defError.set(err.error?.message || err.message || 'Failed to delete definition');
        this.cdr.markForCheck();
      },
    });
  }

  // ---- private per-link marker create / delete (Links tab) ----

  /** Node selected in the left autocomplete — reset link selection. */
  onNodeSelect(nodeId: string | null) {
    this.selectedNodeId.set(nodeId);
    this.selectedLinkId.set(null);
    this.addingToLink.set(null);
    this.editingMarker.set(null);
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
    this.editingMarker.set(null);
    this.markerForm.reset();
    this.linkError.set(null);
    this.linkSearchText.set(linkId ? this.linkName(linkId) : '');
    this.cdr.markForCheck();
  }

  /**
   * `displayWith` for the node autocomplete — maps the selected value (node id) back to
   * its display name. Without this, mat-autocomplete writes the raw `[value]` (the UUID)
   * into the input; on repeat selection of the same option the signal doesn't notify
   * (equal value ⇒ no CD), so the `[value]` binding never overwrites it and the UUID sticks.
   */
  displayNode = (id: string | null): string => {
    if (!id) return '';
    return this.nodeOptions().find((o) => o.id === id)?.name ?? id;
  };

  /** `displayWith` for the link autocomplete — maps the selected link id to its display name. */
  displayLink = (id: string | null): string => {
    if (!id) return '';
    return this.linkName(id);
  };

  /** Clear autocomplete inputs and return to the aggregate view. */
  resetLinkSelect() {
    this.selectedNodeId.set(null);
    this.nodeSearchText.set('');
    this.selectedLinkId.set(null);
    this.addingToLink.set(null);
    this.editingMarker.set(null);
    this.linkSearchText.set('');
    this.linkError.set(null);
    this.cdr.markForCheck();
  }

  /** Whether a link group's marker list is collapsed in the aggregate view. */
  isGroupCollapsed(linkId: string): boolean {
    return this.collapsedGroups().has(linkId);
  }

  /** Whether a per-marker enable request is in flight for this marker (drives its spinner). */
  isTogglingMarker(linkId: string, name: string): boolean {
    return this.togglingMarker() === `${linkId}/${name}`;
  }

  /** Whether a per-marker delete request is in flight for this marker (drives its spinner). */
  isDeletingMarker(linkId: string, name: string): boolean {
    return this.deletingMarker() === `${linkId}/${name}`;
  }

  /**
   * Panel-level error (not scoped to a link) — e.g. an aggregate load failure. Shown at the
   * top of the Links panel. Per-link create/edit/delete errors are scoped via {@link groupError}
   * so they render next to the form that produced them, not up here.
   */
  panelError(): string | null {
    const err = this.linkError();
    return err && !err.linkId ? err.message : null;
  }

  /** Error message scoped to a specific link group's create/edit/delete action, or null. */
  groupError(linkId: string): string | null {
    const err = this.linkError();
    return err && err.linkId === linkId ? err.message : null;
  }

  /** Toggle a link group's collapsed state (click on its header). */
  toggleGroup(linkId: string) {
    const next = new Set(this.collapsedGroups());
    if (next.has(linkId)) next.delete(linkId);
    else next.add(linkId);
    this.collapsedGroups.set(next);
  }

  /** Ensure a group is expanded — used when opening its add/edit form so the form isn't hidden. */
  private expandGroup(linkId: string) {
    if (this.collapsedGroups().has(linkId)) {
      const next = new Set(this.collapsedGroups());
      next.delete(linkId);
      this.collapsedGroups.set(next);
    }
  }

  toggleAddMarker(linkId: string) {
    const opening = this.addingToLink() !== linkId;
    this.addingToLink.set(opening ? linkId : null);
    // Add and edit are mutually exclusive — opening the add form closes any open edit.
    this.editingMarker.set(null);
    if (opening) this.expandGroup(linkId);
    this.markerForm.reset();
    // A serial link needs a WAN encapsulation; default to the first one (Cisco HDLC),
    // matching the capture dialog's auto-select. Ethernet links leave it null (hidden).
    if (opening && this.linkTypeOf(linkId) === 'serial') {
      this.markerForm.get('data_link_type')?.setValue(this.serialDataLinkTypes[0]?.value ?? null);
    }
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
    this.submittingMarker.set(linkId);

    const v = this.markerForm.getRawValue();
    const body: MarkerWriteBody = { bpf: v.bpf.trim(), name: v.name.trim() };
    const tag = this.asNumber(v.tag);
    if (tag !== null) body.tag = tag;
    if (v.color) body.color = v.color;
    const hd = this.asNumber(v.highlight_duration);
    if (hd !== null) body.highlight_duration = hd;
    const dir = this.dirToBody(v.direction);
    if (dir) body.direction = dir;
    if (v.capture_node_id) body.capture_node_id = v.capture_node_id;
    if (v.data_link_type) body.data_link_type = v.data_link_type;

    this.markerService.create(controller, project.project_id, linkId, body).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submittingMarker.set(null);
        // Close the create form and return to the list — same behavior in the
        // selected-link and aggregate views. (The selected-link view previously
        // kept the form open via markerForm.reset().)
        this.toggleAddMarker(linkId);
        this.refreshLink(linkId);
        this.loadAggregate();
      },
      error: (err) => {
        this.submittingMarker.set(null);
        this.linkError.set({ linkId, message: err.error?.message || err.message || 'Failed to create marker' });
        this.cdr.markForCheck();
      },
    });
  }

  deleteMarker(linkId: string, name: string) {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    const key = `${linkId}/${name}`;
    if (this.deletingMarker() === key) return;
    this.linkError.set(null);
    this.deletingMarker.set(key);
    this.markerService.delete(controller, project.project_id, linkId, name).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.deletingMarker.set(null);
        this.refreshLink(linkId);
        this.loadAggregate();
      },
      error: (err) => {
        this.deletingMarker.set(null);
        this.linkError.set({ linkId, message: err.error?.message || err.message || 'Failed to delete marker' });
        this.cdr.markForCheck();
      },
    });
  }

  startEditMarker(linkId: string, marker: GroupMarker) {
    this.editingMarker.set({ linkId, name: marker.name });
    // Add and edit are mutually exclusive — opening an edit closes any open add form.
    this.addingToLink.set(null);
    this.expandGroup(linkId);
    this.linkError.set(null);
    this.markerEditForm.reset({
      name: marker.name,
      bpf: marker.bpf,
      tag: marker.tag ?? null,
      color: marker.color ?? null,
      highlight_duration: marker.highlight_duration ?? 800,
      direction: this.dirFromMarker(marker.direction),
      data_link_type: marker.data_link_type ?? 'DLT_EN10MB',
      capture_node_id: marker.capture_node_id ?? null,
    });
    this.markerEditForm.get('name')?.disable();
    // data_link_type is create-only on per-link markers — keep it disabled in edit.
    this.markerEditForm.get('data_link_type')?.disable();
    this.markerEditForm.get('capture_node_id')?.disable();
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
    this.submittingEditMarker.set(true);

    const v = this.markerEditForm.getRawValue();
    const body: MarkerWriteBody = { bpf: v.bpf.trim() };
    const tag = this.asNumber(v.tag);
    if (tag !== null) body.tag = tag;
    if (v.color) body.color = v.color;
    const hd = this.asNumber(v.highlight_duration);
    if (hd !== null) body.highlight_duration = hd;
    const dir = this.dirToBody(v.direction);
    if (dir) body.direction = dir;

    this.markerService.update(controller, project.project_id, linkId, editing.name, body).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submittingEditMarker.set(false);
        this.editingMarker.set(null);
        this.refreshLink(linkId);
        this.loadAggregate();
      },
      error: (err) => {
        this.submittingEditMarker.set(false);
        this.linkError.set({ linkId, message: err.error?.message || err.message || 'Failed to update marker' });
        this.cdr.markForCheck();
      },
    });
  }

  // ---- per-definition pause/resume (toggles every inherited copy of a rule) ----

  toggleDefinitionPaused(row: DefinitionRow) {
    if (this.togglingDefinition() === row.name) return;
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    const wantPaused = !row.paused;
    // Show the row's spinner while the request is in flight; don't touch the icon until
    // the server confirms (204) — the displayed state is always authoritative. We never
    // call loadDefinitions() here: it sets `loading` and flashes the "Loading…" block /
    // re-renders the whole list. The 204 confirms `paused`, so we set it locally on
    // success; loadAggregate refreshes the Links tab's inherited copies.
    this.togglingDefinition.set(row.name);
    const req$ = wantPaused
      ? this.markerService.pauseDefinition(controller, project.project_id, row.name)
      : this.markerService.resumeDefinition(controller, project.project_id, row.name);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.togglingDefinition.set(null);
        this.applyDefinitionPausedLocal(row.name, wantPaused);
        this.loadAggregate();
      },
      error: (err) => {
        this.togglingDefinition.set(null);
        this.defError.set(err.error?.message || err.message || 'Failed to toggle definition');
        this.cdr.markForCheck();
      },
    });
  }

  /** Optimistically set a definition's `paused` in the local {@link definitions} signal
   *  (pre-response) so the row's icon swaps instantly and no list reload is needed. */
  private applyDefinitionPausedLocal(name: string, paused: boolean) {
    const rows = this.definitions().map((r) => (r.name === name ? { ...r, paused } : r));
    this.definitions.set(rows);
  }

  // ---- per-marker enable/disable (server fast path: no rebuild, no pcap flush) ----

  toggleMarkerEnabled(linkId: string, marker: GroupMarker) {
    // Inherited markers are read-only — managed via the Definitions tab.
    if (marker.inherited_from) return;
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    // Guard against double-fires while a toggle is already in flight.
    if (this.isTogglingMarker(linkId, marker.name)) return;

    // `enabled` defaults to true when undefined; only an explicit `false` is "off".
    const nextEnabled = marker.enabled === false;
    // Show the row's spinner while in flight; flip the icon only after the server
    // confirms, so the displayed state is always authoritative.
    this.togglingMarker.set(`${linkId}/${marker.name}`);
    this.markerService
      .setEnabled(controller, project.project_id, linkId, marker.name, nextEnabled)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.togglingMarker.set(null);
          this.applyEnabledLocal(linkId, marker.name, nextEnabled);
          this.refreshLink(linkId);
          this.loadAggregate();
        },
        error: (err) => {
          this.togglingMarker.set(null);
          this.toasterService.error(err.error?.message || err.message || 'Failed to toggle marker');
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Optimistically set a marker's `enabled` in the local {@link linkGroups} signal
   * (pre-response). {@link selectedLinkGroup} recomputes from `linkGroups`, so both the
   * selected-link and aggregate views update together.
   */
  private applyEnabledLocal(linkId: string, name: string, enabled: boolean) {
    const groups = this.linkGroups().map((g) =>
      g.linkId !== linkId
        ? g
        : { ...g, markers: g.markers.map((m) => (m.name === name ? { ...m, enabled } : m)) }
    );
    this.linkGroups.set(groups);
  }

  /** Canonical 5-step refresh after a private-marker mutation on a single link. */
  private refreshLink(linkId: string) {
    const controller = this.controller();
    const project = this.project();
    if (!controller || !project) return;
    this.linkService.getLink(controller, project.project_id, linkId).pipe(takeUntil(this.destroy$)).subscribe({
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

  /**
   * Map a form direction value to the backend value. The form uses the `'both'` sentinel
   * because mat-select clears its selection model on `null` — a null-valued option never
   * displays in the trigger. `'both'` is sent as `'both'` on the wire (the server treats
   * it as "no direction filter", same as null/absent on GET).
   */
  private dirToBody(d: unknown): 'tx' | 'rx' | 'both' {
    return d === 'tx' || d === 'rx' ? d : 'both';
  }

  /** Map a stored/backend direction back to the form value (`null`/`undefined` → `'both'`). */
  private dirFromMarker(d: 'tx' | 'rx' | null | undefined): 'both' | 'tx' | 'rx' {
    return d === 'tx' || d === 'rx' ? d : 'both';
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
