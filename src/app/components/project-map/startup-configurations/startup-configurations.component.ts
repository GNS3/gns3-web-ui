import { StartupMediaProfilesService } from '@services/startup-media-profiles.service';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { NodeSymbolResolverService } from '@services/node-symbol-resolver.service';
import { ProjectService } from '@services/project.service';
import { downloadConfigurationText, StartupConfigurationsService } from '@services/startup-configurations.service';
import {
  canCaptureConfiguration,
  nodeConfigCapabilities,
  startupBlocker,
  startupDeviceType,
  startupMediaProfileId,
  startupWarning,
} from '@services/configuration-capabilities';
import {
  configurationErrorMessage,
  captureFailureMessages,
  configurationErrorText,
  startupFailureDetail,
  STARTUP_WAITING_HINT,
  unwrapBlobError,
} from '@services/configuration-messages';
import {
  assignStartupSet,
  canEnableStartup,
  canToggleStartupEntry,
  hasSavedConfiguration,
  CONFIGURATION_FILE_PROBLEMS,
  configurationFileProblem,
  ConfigurationSet,
  importResultMessage,
  MAX_CONFIGURATION_SETS,
  MAX_SET_ARCHIVE_BYTES,
  STARTUP_DEFAULT_SET_ID,
  StartupDocument,
  startupEntryEnabled,
  StartupEntry,
  startupSetId,
  StartupStatus,
  startupToggleState,
} from '@models/startup-configuration';
import { ToasterService } from '@services/toaster.service';
import {
  catchError,
  EMPTY,
  exhaustMap,
  filter,
  finalize,
  forkJoin,
  Observable,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { Node } from '../../../cartography/models/node';
import { downloadBlob } from '../../../utils/file-download.util';
import { ConfigurationTextEditorComponent } from '../configuration-text-editor/configuration-text-editor.component';
import { StartupToggleComponent } from '../startup-toggle/startup-toggle.component';
import {
  ConfigurationSetNameData,
  ConfigurationSetNameDialogComponent,
} from './configuration-set-name-dialog.component';

@Component({
  standalone: true,
  selector: 'app-startup-configurations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ClipboardModule,
    ConfigurationTextEditorComponent,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    StartupToggleComponent,
  ],
  templateUrl: './startup-configurations.component.html',
  styleUrls: ['./startup-configurations.component.scss'],
})
export class StartupConfigurationsComponent implements OnInit {
  readonly data = inject<{ controller: Controller; project: Project }>(MAT_DIALOG_DATA);
  private service = inject(StartupConfigurationsService);
  private profiles = inject(StartupMediaProfilesService);
  private profileType = (id: string) => this.profiles.deviceType(this.data.controller, id);
  private projects = inject(ProjectService);
  private symbols = inject(NodeSymbolResolverService);
  private toaster = inject(ToasterService);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<StartupConfigurationsComponent>);
  private dialog = inject(MatDialog);
  readonly document = signal<StartupDocument | null>(null);
  readonly nodes = signal<Node[]>([]);
  private readonly nodesById = computed(() => new Map(this.nodes().map((node) => [node.node_id, node])));
  readonly status = signal<StartupStatus>({ jobs: [], nodes: {} });
  readonly viewing = signal('');
  readonly nodeId = signal('');
  readonly busy = signal(false);
  readonly dirty = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly statusError = signal('');
  readonly readOnly = !!this.data.project.readonly;
  /** A save, load or export is in flight: nothing else may start. */
  readonly blocked = computed(() => this.busy() || this.loading() || this.running());
  /** Limits and the protected set, shared with the template. */
  readonly defaultSetId = STARTUP_DEFAULT_SET_ID;
  readonly maxSets = MAX_CONFIGURATION_SETS;
  private pendingCaptures = new Set<string>();
  private refreshPending = false;
  /** The viewed node's entry as edited; replaced, never mutated. */
  readonly draft = signal<StartupEntry>({ device_type: null, content: '', enabled: false });
  restoreWarning(): string {
    return startupWarning(this.draft());
  }

  canCapture(): boolean {
    return canCaptureConfiguration(this.currentNode(), this.draft().device_type);
  }

  ngOnInit() {
    this.load();
    timer(0, 2000)
      .pipe(
        filter(() => !!this.document() && !this.loadError()),
        exhaustMap(() =>
          this.service.status(this.data.controller, this.data.project.project_id).pipe(
            catchError((error) => {
              this.statusError.set(this.errorMessage(error));
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (status) => {
          this.statusError.set('');
          const wasRunning = this.running();
          this.status.set(status);
          let completedCapture = false;
          for (const job of status.jobs) {
            if (job.status === 'running' || !this.pendingCaptures.delete(job.id)) continue;
            completedCapture = true;
            const failures = Object.entries(job.nodes).filter(([, result]) => result !== 'captured');
            if (failures.length || job.status !== 'finished' || !Object.keys(job.nodes).length) {
              const message = failures.length
                ? captureFailureMessages(job.nodes, (id) => this.nodeName(id)).join('; ')
                : 'Configuration export did not finish. Retry the export.';
              this.toaster.error(message);
            } else {
              this.toaster.success('Configuration export completed.');
            }
          }
          this.refreshPending ||= wasRunning || completedCapture;
          if (
            status.selection_revision !== undefined &&
            status.selection_revision !== this.document()?.selection_revision
          )
            this.refreshPending = true;
          if (status.revision !== undefined && status.revision !== this.document()?.revision)
            this.refreshPending = true;
          if (this.refreshPending && !this.running() && !this.dirty() && !this.busy() && !this.loading()) this.load();
        },
        error: (error) => this.error(error),
      });
  }

  currentSet(): ConfigurationSet | undefined {
    return this.document()?.sets.find((set) => set.id === this.viewing());
  }
  currentNode(): Node | undefined {
    return this.nodesById().get(this.nodeId());
  }
  private nodeName(id: string): string {
    return this.nodesById().get(id)?.name || id;
  }
  startupEntry(nodeId: string): StartupEntry | undefined {
    return nodeId === this.nodeId() ? this.draft() : this.currentSet()?.nodes[nodeId];
  }
  startupEnabled(nodeId: string): boolean {
    const entry = this.startupEntry(nodeId);
    return startupEntryEnabled(this.document(), nodeId, this.viewing(), entry);
  }
  assignedSetName(nodeId: string): string {
    const document = this.document();
    const set = document?.sets.find((set) => set.id === startupSetId(document, nodeId));
    const entry = set?.id === this.viewing() ? this.startupEntry(nodeId) : set?.nodes[nodeId];
    return set && startupEntryEnabled(document, nodeId, set.id, entry) ? set.name : 'None';
  }
  startupState(nodeId: string): 'unavailable' | 'off' | 'on' {
    return startupToggleState(this.startupEntry(nodeId), this.startupEnabled(nodeId));
  }
  startupDescription(nodeId: string): string {
    if (this.startupState(nodeId) === 'unavailable') {
      return 'No saved configuration in this set. Export or upload a configuration first.';
    }
    if (!this.canToggleStartup(nodeId)) {
      return (
        this.startupHint(nodeId) ||
        'This configuration cannot be applied. Export or upload a supported configuration first.'
      );
    }
    return this.startupEnabled(nodeId)
      ? 'Enabled for startup. Use Wipe node, then Start after changing the file or set. Ordinary restarts preserve guest saves.'
      : 'Not using this set at startup. Turn ON to assign it to this node.';
  }
  canToggleStartup(nodeId: string): boolean {
    return canToggleStartupEntry(this.startupEntry(nodeId), this.nodesById().get(nodeId), this.profileType);
  }
  /** Why a saved configuration cannot be switched ON for this node (device type, console), or ''. */
  startupHint(nodeId: string): string {
    const entry = this.startupEntry(nodeId);
    const blocker = hasSavedConfiguration(entry)
      ? startupBlocker(this.nodesById().get(nodeId), entry, this.profileType)
      : undefined;
    return blocker ? configurationErrorText(blocker, 'startup') : '';
  }
  canApplySet(): boolean {
    return this.nodes().some((node) => canEnableStartup(this.startupEntry(node.node_id), node, this.profileType));
  }
  setStartupForAll(enabled: boolean) {
    if (this.readOnly || this.blocked() || !this.currentSet() || (enabled && !this.canApplySet())) return;
    this.busy.set(true);
    this.saveSetChange(() => {
      const nodes = this.nodesById();
      const set = this.currentSet();
      // A plain loop: the project's lib target is ES2018, which has no Object.fromEntries.
      const entries: typeof set.nodes = {};
      for (const [id, entry] of Object.entries(set.nodes)) {
        entries[id] = {
          ...entry,
          enabled: enabled && nodes.has(id) && canEnableStartup(entry, nodes.get(id), this.profileType),
        };
      }
      this.document.update((document) => {
        const next = {
          ...document,
          selected: set.id,
          sets: document.sets.map((item) => (item.id === set.id ? { ...set, nodes: entries } : item)),
        };
        for (const id of nodes.keys()) assignStartupSet(next, id, entries[id]?.enabled ? set.id : null);
        return next;
      });
      this.readDraft();
      this.changed();
    })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: (error) => this.error(error) });
  }
  toggleStartup(nodeId: string) {
    if (this.readOnly || this.blocked() || !this.canToggleStartup(nodeId)) return;
    this.busy.set(true);
    this.saveSetChange(() => {
      const entry = { ...this.startupEntry(nodeId), enabled: !this.startupEnabled(nodeId) };
      this.updateEntry(nodeId, entry, true);
      if (nodeId === this.nodeId()) this.draft.set({ ...entry });
      this.changed();
    })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: (error) => this.error(error) });
  }
  running(): boolean {
    return this.status().jobs.some((job) => job.status === 'running');
  }
  /** A QEMU entry is replayed through the console, so it always carries the node's own console recipe. */
  private alignDeviceType() {
    const node = this.currentNode();
    const recipe = node?.node_type === 'qemu' ? startupDeviceType(node, this.profileType) : undefined;
    if (recipe && recipe !== this.draft().device_type)
      this.draft.update((draft) => ({ ...draft, device_type: recipe }));
  }
  /** Why the viewed node's configuration cannot be edited yet (no device type to store it under), or ''. */
  editBlockedHint(): string {
    const node = this.currentNode();
    if (!node || this.draft().device_type) return '';
    return configurationErrorText(
      startupBlocker(node, undefined, this.profileType) === 'device_type_unsupported'
        ? 'device_type_unsupported'
        : 'device_type_required',
      'startup',
    );
  }
  editContent(content: string) {
    this.draft.update((draft) => ({ ...draft, content }));
    this.changed();
  }

  changed() {
    this.alignDeviceType();
    if (!this.draft().content.trim() && this.draft().enabled)
      this.draft.update((draft) => ({ ...draft, enabled: false }));
    this.dirty.set(true);
  }
  load() {
    if (this.busy() || this.loading()) return;
    this.refreshPending = false;
    this.loading.set(true);
    this.loadError.set('');
    forkJoin({
      document: this.service.get(this.data.controller, this.data.project.project_id),
      nodes: this.projects
        .nodes(this.data.controller, this.data.project.project_id)
        .pipe(switchMap((nodes) => this.symbols.resolve(this.data.controller, nodes))),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ document, nodes }) => {
          this.nodes.set(
            nodes
              .filter((node) => nodeConfigCapabilities(node).supported)
              .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
          );
          if (!this.nodes().some((node) => node.node_id === this.nodeId()))
            this.nodeId.set(this.nodes()[0]?.node_id || '');
          this.document.set(document);
          if (!document.sets.some((set) => set.id === this.viewing())) this.viewing.set(document.selected);
          this.readDraft();
          this.dirty.set(false);
          if (nodes.some(startupMediaProfileId)) {
            this.profiles
              .list(this.data.controller)
              .pipe(
                catchError(() => EMPTY),
                takeUntilDestroyed(this.destroyRef),
              )
              .subscribe(() => {
                if (!this.draft().device_type) this.alignDeviceType();
              });
          }
        },
        error: (error) => this.loadError.set(this.errorMessage(error)),
      });
  }
  /**
   * Write the viewed node's draft into the viewed set. Only when something was
   * edited: merely clicking through nodes must not create empty set entries.
   */
  flushDraft() {
    const set = this.currentSet();
    if (this.dirty() && set && this.nodeId() && this.draft().device_type) this.updateEntry(this.nodeId(), this.draft());
  }

  private updateEntry(nodeId: string, entry: StartupEntry, assign = false) {
    this.document.update((document) => {
      const setId = this.viewing();
      const next = {
        ...document,
        sets: document.sets.map((set) =>
          set.id === setId ? { ...set, nodes: { ...set.nodes, [nodeId]: { ...entry } } } : set,
        ),
      };
      if (assign) assignStartupSet(next, nodeId, entry.enabled ? setId : null);
      return next;
    });
  }
  readDraft() {
    const saved = this.currentSet()?.nodes[this.nodeId()];
    this.draft.set(
      saved
        ? { ...saved }
        : { device_type: startupDeviceType(this.currentNode(), this.profileType) || null, content: '', enabled: false },
    );
  }
  selectNode(id: string) {
    this.flushDraft();
    this.nodeId.set(id);
    this.readDraft();
  }
  selectSet(id: string) {
    this.flushDraft();
    this.viewing.set(id);
    this.readDraft();
  }
  nameSet(operation: 'create' | 'copy' | 'rename') {
    if (operation === 'rename' && this.currentSet()?.id === STARTUP_DEFAULT_SET_ID) return;
    if (this.readOnly || this.blocked() || !this.currentSet()) return;
    if (operation !== 'rename' && this.document().sets.length >= MAX_CONFIGURATION_SETS) return;
    const current = this.currentSet();
    this.busy.set(true);
    this.askSetName({
      title:
        operation === 'create'
          ? 'Create configuration set'
          : operation === 'copy'
            ? 'Copy configuration set'
            : 'Rename configuration set',
      confirmLabel: operation === 'create' ? 'Create set' : operation === 'copy' ? 'Copy set' : 'Rename set',
      name: operation === 'rename' ? current.name : '',
      names: this.document()
        .sets.filter((set) => operation !== 'rename' || set.id !== current.id)
        .map((set) => set.name),
    })
      .pipe(
        switchMap((name: string | undefined) => {
          if (!name) return EMPTY;
          return this.saveSetChange(() => {
            if (operation === 'rename') {
              this.document.update((document) => ({
                ...document,
                sets: document.sets.map((set) => (set.id === current.id ? { ...set, name } : set)),
              }));
              this.changed();
            } else {
              this.addSet(operation === 'copy', name);
            }
          });
        }),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: (error) => this.error(error) });
  }
  private askSetName(data: ConfigurationSetNameData): Observable<string | undefined> {
    return this.dialog
      .open(ConfigurationSetNameDialogComponent, {
        panelClass: [
          'base-dialog-panel',
          'simple-dialog-panel',
          'dialog-small-panel',
          'configuration-set-name-dialog-panel',
        ],
        data,
      })
      .afterClosed();
  }
  addSet(clone: boolean, name: string) {
    this.flushDraft();
    const document = this.document();
    const set: ConfigurationSet = {
      id: crypto.randomUUID(),
      name,
      nodes: clone ? structuredClone(this.currentSet()?.nodes || {}) : {},
    };
    this.document.set({ ...document, sets: [...document.sets, set] });
    this.viewing.set(set.id);
    this.readDraft();
    this.changed();
  }
  deleteSet() {
    const document = this.document();
    const selected = this.currentSet();
    if (selected?.id === STARTUP_DEFAULT_SET_ID) return;
    if (this.readOnly || !document || !selected || document.sets.length < 2 || this.blocked()) return;
    const sets = document.sets.filter((set) => set.id !== selected.id);
    this.busy.set(true);
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-danger-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Delete configuration set?',
          message: `Delete "${selected.name}" and its saved node configurations?`,
          details: [
            'Nodes assigned to this set will have startup configurations disabled.',
            ...(document.selected === selected.id ? [`The project default will change to "${sets[0].name}".`] : []),
          ],
          confirmButtonText: 'Delete set',
          tone: 'danger',
        },
      })
      .afterClosed()
      .pipe(
        switchMap((confirmed: boolean) => {
          if (confirmed !== true) return EMPTY;
          return this.saveSetChange(() => {
            this.document.set({
              ...document,
              sets,
              selected: document.selected === selected.id ? sets[0].id : document.selected,
            });
            this.viewing.set(sets[0].id);
            this.readDraft();
            this.changed();
          });
        }),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: (error) => this.error(error) });
  }
  private persist(flushDraft = true) {
    if (flushDraft) this.flushDraft();
    return this.service.save(this.data.controller, this.data.project.project_id, this.document()).pipe(
      tap((document) => {
        this.document.set(document);
        this.dirty.set(false);
      }),
    );
  }
  private saveSetChange(change: () => void) {
    const document = this.document();
    const draft = this.draft();
    const viewing = this.viewing();
    const dirty = this.dirty();
    this.flushDraft();
    change();
    return this.persist(false).pipe(
      tap(() => this.readDraft()),
      catchError((error) => {
        this.document.set(document);
        this.viewing.set(viewing);
        this.draft.set(draft);
        this.dirty.set(dirty);
        return throwError(() => error);
      }),
    );
  }
  save() {
    if (this.readOnly || this.blocked()) return;
    this.busy.set(true);
    this.persist()
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: (error) => this.error(error) });
  }
  capture() {
    if (this.readOnly || this.blocked() || !this.currentSet() || !this.canCapture()) return;
    const setId = this.viewing();
    const nodeIds = [this.nodeId()];
    if (!nodeIds[0]) return;
    this.busy.set(true);
    this.persist()
      .pipe(
        switchMap(() => this.service.capture(this.data.controller, this.data.project.project_id, setId, nodeIds)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (job) => {
          this.pendingCaptures.add(job.id);
          this.status.update((status) => ({ ...status, jobs: [...status.jobs, job] }));
        },
        error: (error) => this.error(error),
      });
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      const file = input.files?.[0];
      if (!file || this.readOnly || this.blocked() || !this.currentSet() || this.editBlockedHint()) return;
      this.busy.set(true);
      let text: string;
      try {
        const early = configurationFileProblem(file.size);
        if (early) throw new Error(CONFIGURATION_FILE_PROBLEMS[early]);
        text = await file.text();
        const problem = configurationFileProblem(file.size, text);
        if (problem) throw new Error(CONFIGURATION_FILE_PROBLEMS[problem]);
      } catch (error) {
        this.busy.set(false);
        this.error(error);
        return;
      }
      // Same rollback as every other set change: a failed save restores the
      // document and the editor instead of showing the upload as if it was saved.
      this.saveSetChange(() => {
        this.draft.update((draft) => ({ ...draft, content: text }));
        this.alignDeviceType();
        const enabled = canEnableStartup(this.draft(), this.currentNode(), this.profileType);
        this.draft.update((draft) => ({ ...draft, enabled }));
        this.updateEntry(this.nodeId(), this.draft(), true);
        this.changed();
      })
        .pipe(
          finalize(() => this.busy.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () =>
            this.toaster.success(
              this.draft().enabled
                ? 'Configuration uploaded and selected for startup.'
                : 'Configuration uploaded. Startup is OFF; this file cannot be applied to the node.',
            ),
          error: (error) => this.error(error),
        });
    } finally {
      // Selecting the same file again must fire a new change event on every path.
      input.value = '';
    }
  }

  /**
   * Import a set from a ZIP archive made by "Export set". The server always
   * creates a NEW set (it never overwrites one), so the user must name it.
   */
  async importSet(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      const file = input.files?.[0];
      if (!file || this.readOnly || this.dirty() || this.blocked() || !this.document()) return;
      if (this.document().sets.length >= MAX_CONFIGURATION_SETS) {
        this.toaster.error(configurationErrorMessage(new Error('configuration_set_limit_reached'), 'sets'));
        return;
      }
      if (file.size > MAX_SET_ARCHIVE_BYTES) {
        this.toaster.error('The archive exceeds 24 MiB.');
        return;
      }
      this.busy.set(true);
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
      } catch (error) {
        this.busy.set(false);
        this.error(error);
        return;
      }
      this.askSetName({
        title: 'Import configuration set',
        confirmLabel: 'Import set',
        // The archive is imported as a new set; an existing name must not be reused.
        name: file.name.replace(/\.zip$/i, '').slice(0, 80),
        names: this.document().sets.map((set) => set.name),
      })
        .pipe(
          switchMap((name: string | undefined) =>
            name ? this.service.importSet(this.data.controller, this.data.project.project_id, bytes, name) : EMPTY,
          ),
          finalize(() => this.busy.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (result) => {
            this.toaster.success(importResultMessage(result));
            // The server created the set; show it once the document is reloaded.
            this.viewing.set(result.set.id);
            this.busy.set(false);
            this.load();
          },
          error: (error) => this.error(error),
        });
    } finally {
      input.value = '';
    }
  }

  /** Download the viewed set as a ZIP after warning that it can contain secrets. */
  exportSet() {
    const set = this.currentSet();
    if (this.blocked() || this.dirty() || !set) return;
    // The revision the user is looking at: a later edit is refused instead of exported unseen.
    const revision = this.document().revision;
    this.busy.set(true);
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-warning-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Export configuration set?',
          message: `Download "${set.name}" as a ZIP archive.`,
          details: [
            'The archive can contain device passwords, keys and other secrets from the saved configurations.',
            'Store it securely and do not share it publicly.',
            'The archive holds the saved set. Unsaved edits are not included.',
          ],
          confirmButtonText: 'Export set',
          tone: 'warning',
        },
      })
      .afterClosed()
      .pipe(
        switchMap((confirmed: boolean) =>
          confirmed === true
            ? this.service.exportSet(this.data.controller, this.data.project.project_id, set.id, revision)
            : EMPTY,
        ),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => downloadBlob(`${set.name}.zip`, blob),
        error: async (error) => this.error(await unwrapBlobError(error)),
      });
  }

  download() {
    downloadConfigurationText(this.currentNode()?.name || 'node', this.draft().device_type, this.draft().content);
  }

  nodeStatus(id: string): string {
    const job = [...this.status().jobs].reverse().find((job) => job.set_id === this.viewing() && job.nodes[id]);
    const result = job?.nodes[id];
    const operation = !result
      ? ''
      : job.operation === 'apply'
        ? `Apply: ${configurationErrorText(result, 'startup')}`
        : `Export: ${
            result === 'captured'
              ? 'saved to set'
              : result === 'console_unsafe_mode'
                ? 'exit configuration mode before exporting'
                : result.replace(/_/g, ' ')
          }`;
    // Only the raw result code is prettified: set and node names keep their underscores.
    return [this.startupStatus(id), operation].filter(Boolean).join(' · ');
  }
  /** Long explanation of a pending console apply, kept out of the short status line. */
  waitingHint(id: string): string {
    const application = this.status().nodes[id];
    return application?.set_id === this.viewing() && application.status === 'waiting_for_console'
      ? STARTUP_WAITING_HINT
      : '';
  }
  /** Plain-text description of where a failed apply stopped (masked by the server); '' when unknown. */
  failureDetail(id: string): string {
    const application = this.status().nodes[id];
    return application?.set_id === this.viewing() ? startupFailureDetail(application) : '';
  }
  private startupStatus(id: string): string {
    const document = this.document();
    if (!document) return '';
    if (this.viewing() !== startupSetId(document, id)) {
      return `Startup: ${this.assignedSetName(id)}. Enable this node to use the viewed set instead.`;
    }
    const application = this.status().nodes[id];
    if (application?.set_id === this.viewing()) {
      const mediaProfile = !!startupMediaProfileId(this.nodesById().get(id));
      // Where it stopped is shown once, by failureDetail().
      return `Startup: ${configurationErrorText(application.status, 'startup', { mediaProfile })}`;
    }
    const entry = this.startupEntry(id);
    if (!hasSavedConfiguration(entry)) return 'Startup: no saved configuration for this node.';
    if (!this.startupEnabled(id)) {
      return `Startup: OFF. ${this.startupHint(id) || 'Enable this node to restore its saved configuration.'}`;
    }
    return 'Startup: ON. To load this set, use Wipe node, then Start.';
  }

  cancel() {
    if (!this.blocked()) this.load();
  }
  close() {
    if (!this.busy() && !this.dirty()) this.dialogRef.close();
  }
  private error(error: any) {
    this.toaster.error(this.errorMessage(error));
  }
  private errorMessage(error: any): string {
    return configurationErrorMessage(error, 'sets');
  }
}
