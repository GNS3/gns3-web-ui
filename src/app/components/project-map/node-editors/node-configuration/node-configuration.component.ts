import { StartupMediaProfilesService } from '@services/startup-media-profiles.service';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Controller } from '@models/controller';
import { downloadConfigurationText, StartupConfigurationsService } from '@services/startup-configurations.service';
import {
  canCaptureConfiguration,
  configurationExportDriver,
  startupBlocker,
  startupDeviceType,
  isCaptureOnlyDriver,
  startupWarning,
} from '@services/configuration-capabilities';
import {
  configurationErrorMessage,
  configurationErrorText,
  ConfigurationErrorContext,
  startupFailureDetail,
} from '@services/configuration-messages';
import {
  assignStartupSet,
  canEnableStartup,
  canToggleStartupEntry,
  hasSavedConfiguration,
  StartupDocument,
  nextStartDescription,
  startupEntryEnabled,
  startupSetId,
  startupToggleState,
} from '@models/startup-configuration';
import { ToasterService } from '@services/toaster.service';
import { catchError, defer, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { Node } from '../../../../cartography/models/node';
import { StartupMediaProfileSelectComponent } from '@components/startup-media-profile-select/startup-media-profile-select.component';
import { ConfigurationTextEditorComponent } from '../../configuration-text-editor/configuration-text-editor.component';
import { StartupToggleComponent } from '../../startup-toggle/startup-toggle.component';

@Component({
  selector: 'app-node-configuration',
  standalone: true,
  imports: [
    ConfigurationTextEditorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    StartupMediaProfileSelectComponent,
    StartupToggleComponent,
  ],
  templateUrl: './node-configuration.component.html',
  styleUrl: './node-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeConfigurationComponent implements OnInit {
  readonly controller = input.required<Controller>();
  readonly node = input.required<Node>();
  readonly disabled = input(false);
  /**
   * The QEMU startup media profile id ('' = console delivery), bound by the node configurator to the value it
   * saves in the node properties. Blockers, hints and notes use this pending value, not the saved node.
   */
  readonly mediaProfile = model('');
  /** The Netmiko device type the configurator is about to save; the saved node's one when not given. */
  readonly netmikoDeviceType = input<string | null | undefined>(undefined);
  pendingDeviceType() {
    const pending = this.netmikoDeviceType();
    return pending === undefined ? this.node().netmiko_device_type : pending;
  }
  private service = inject(StartupConfigurationsService);
  private profiles = inject(StartupMediaProfilesService);
  private profileType = (id: string) => this.profiles.deviceType(this.controller(), id);
  private toaster = inject(ToasterService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef, { optional: true });
  private destroyRef = inject(DestroyRef);
  readonly document = signal<StartupDocument | null>(null);
  readonly setId = signal('');
  readonly content = signal('');
  readonly busy = signal(false);
  readonly loadError = signal('');
  readonly result = signal('');
  /** Set while a choice is pending confirmation, so the select can be reverted by data, not by poking the control. */
  private readonly pendingSetId = signal<string | null>(null);
  readonly selectedSetId = computed(() => this.pendingSetId() ?? this.setId());
  readonly currentSet = computed(() => this.document()?.sets.find((set) => set.id === this.setId()));
  /**
   * The node as it will be once the pending profile is saved. A method, not a computed: the configurator mutates
   * the same node object in place, which a cached signal would not notice.
   */
  pendingNode(): Node {
    const node = this.node();
    return node.node_type === 'qemu'
      ? {
          ...node,
          netmiko_device_type: this.pendingDeviceType(),
          properties: { ...node.properties, startup_media_profile: this.mediaProfile().trim() || null },
        }
      : node;
  }
  readonly saved = computed(() => this.currentSet()?.nodes[this.node().node_id]);
  readonly dirty = computed(() => this.content() !== (this.saved()?.content || ''));
  // The entry's device type: the profile's type for a boot media node, the node's own console recipe for other QEMU nodes.
  readonly driver = computed(() => this.currentDriver());
  /** Why the saved configuration cannot be started on this node (device type, console), or ''. */
  readonly startupHint = computed(() => {
    const blocker = hasSavedConfiguration(this.saved())
      ? startupBlocker(this.pendingNode(), this.saved(), this.profileType)
      : undefined;
    return blocker ? configurationErrorText(blocker, 'startup') : '';
  });
  readonly restoreWarning = computed(() => startupWarning({ device_type: this.driver(), content: this.content() }));
  readonly unavailable = computed(() => this.disabled() || this.busy() || !this.document() || !!this.loadError());
  readonly startupEnabled = computed(() =>
    startupEntryEnabled(this.document(), this.node().node_id, this.setId(), this.saved()),
  );
  readonly nextStart = computed(() => nextStartDescription(this.document(), this.node().node_id));
  readonly toggleState = computed(() => startupToggleState(this.saved(), this.startupEnabled()));
  readonly toggleTooltip = computed(() =>
    hasSavedConfiguration(this.saved())
      ? this.startupHint() || 'Use this set for this node at startup'
      : 'Save or fetch a configuration first',
  );
  readonly canToggleStartup = computed(
    () => !this.unavailable() && canToggleStartupEntry(this.saved(), this.pendingNode(), this.profileType),
  );
  private readonly runningDriver = computed(() =>
    this.node().node_type === 'qemu' ? configurationExportDriver(this.node().netmiko_device_type) : this.driver(),
  );
  readonly canFetch = computed(
    () => !!this.runningDriver() && !this.unavailable() && canCaptureConfiguration(this.node(), this.runningDriver()),
  );
  readonly canApply = computed(
    () =>
      !this.unavailable() &&
      !this.dirty() &&
      hasSavedConfiguration(this.saved()) &&
      this.node().status === 'started' &&
      // Live apply replays the text through the console; Viptela and PAN-OS can only be delivered as boot media.
      !isCaptureOnlyDriver(this.runningDriver()) &&
      !isCaptureOnlyDriver(this.saved()?.device_type) &&
      ['telnet', 'ssh'].includes(this.node().console_type) &&
      !this.node().locked &&
      !!configurationExportDriver(this.runningDriver()) &&
      (this.node().node_type !== 'qemu' || this.runningDriver() === this.saved()?.device_type),
  );

  constructor() {
    effect(() => {
      if (this.dialogRef) this.dialogRef.disableClose = this.dirty() || this.busy() || this.disabled();
    });
    this.destroyRef.onDestroy(() => {
      if (this.dialogRef) this.dialogRef.disableClose = false;
    });
  }
  /**
   * Saving calls this directly rather than `driver`: the parent configurator mutates the same node object when it
   * applies General settings, which a cached signal would not notice.
   */
  private currentDriver() {
    return this.node().node_type === 'qemu'
      ? startupDeviceType(this.pendingNode(), this.profileType)
      : this.saved()?.device_type || startupDeviceType(this.node());
  }
  ngOnInit() {
    this.load();
  }
  load() {
    if (this.busy() || this.dirty()) return;
    this.busy.set(true);
    this.loadError.set('');
    this.service
      .get(this.controller(), this.node().project_id)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (document) => this.accept(document),
        error: (error) => {
          // One message, shown inline with a Retry button and once as a toast.
          const message = configurationErrorMessage(error);
          this.loadError.set(message);
          this.toaster.error(message);
        },
      });
  }
  private accept(document: StartupDocument) {
    this.document.set(document);
    const assigned = startupSetId(document, this.node().node_id);
    if (assigned && document.sets.some((set) => set.id === assigned)) this.setId.set(assigned);
    else if (!document.sets.some((set) => set.id === this.setId())) this.setId.set(document.selected);
    this.content.set(this.saved()?.content || '');
  }
  canLeave(): boolean {
    if (!this.busy() && !this.dirty()) return true;
    this.toaster.error(
      this.busy()
        ? 'Wait for the configuration operation to finish.'
        : 'Save or discard the configuration edits before closing.',
    );
    return false;
  }
  chooseSet(event: MatSelectChange) {
    const next = event.value;
    // Show the requested set; clearing this restores the current one if the change is declined or fails.
    this.pendingSetId.set(next);
    this.confirmDiscard(
      () => {
        const document = structuredClone(this.document());
        const entry = document.sets.find((set) => set.id === next)?.nodes[this.node().node_id];
        if (entry) entry.enabled = canEnableStartup(entry, this.pendingNode(), this.profileType);
        assignStartupSet(document, this.node().node_id, next);
        this.busy.set(true);
        this.service
          .save(this.controller(), this.node().project_id, document)
          .pipe(
            finalize(() => this.busy.set(false)),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe({
            next: (saved) => {
              this.setId.set(next);
              this.accept(saved);
              this.result.set('Startup set changed for this node.');
              this.pendingSetId.set(null);
            },
            error: (error) => {
              this.pendingSetId.set(null);
              this.error(error);
            },
          });
      },
      () => this.pendingSetId.set(null),
    );
  }
  discard() {
    if (!this.busy()) this.content.set(this.saved()?.content || '');
  }
  private confirmDiscard(action: () => void, declined: () => void = () => undefined) {
    if (this.unavailable()) {
      declined();
      return;
    }
    if (!this.dirty()) {
      action();
      return;
    }
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
        data: {
          title: 'Discard configuration edits?',
          message: 'Your unsaved configuration edits will be replaced.',
          confirmButtonText: 'Discard edits',
          tone: 'warning',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) action();
        else declined();
      });
  }
  fetch() {
    if (!this.canFetch()) return;
    this.confirmDiscard(() => {
      this.busy.set(true);
      this.result.set('Fetching configuration…');
      this.service
        .captureNode(this.controller(), this.node(), this.setId())
        .pipe(
          finalize(() => this.busy.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (document) => {
            this.accept(document);
            this.result.set('Fetched and saved to this set.');
          },
          error: (error) => this.error(error),
        });
    });
  }
  toggleStartup() {
    if (!this.canToggleStartup()) return;
    const document = structuredClone(this.document());
    const selected = document.sets.find((set) => set.id === this.setId());
    selected.nodes[this.node().node_id].enabled = !this.startupEnabled();
    assignStartupSet(document, this.node().node_id, selected.nodes[this.node().node_id].enabled ? this.setId() : null);
    this.busy.set(true);
    this.service
      .save(this.controller(), this.node().project_id, document)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.document.set(saved);
          this.result.set(`Startup configuration ${this.startupEnabled() ? 'enabled' : 'disabled'} in this set.`);
        },
        error: (error) => this.error(error),
      });
  }
  save() {
    if (this.unavailable() || !this.dirty() || !this.currentDriver()) return;
    this.saveChanges().subscribe();
  }
  saveBeforeApply(): Observable<boolean> {
    return defer(() => {
      if (this.busy()) {
        this.toaster.error('Wait for the configuration operation to finish.');
        return of(false);
      }
      if (!this.dirty()) return of(true);
      if (!this.document() || this.loadError() || !this.currentDriver()) {
        this.toaster.error('Unable to save configuration edits. Check the Configuration tab before applying.');
        return of(false);
      }
      return this.saveChanges();
    });
  }
  private saveChanges(): Observable<boolean> {
    const document = structuredClone(this.document());
    const selected = document.sets.find((set) => set.id === this.setId());
    const entry = { device_type: this.currentDriver(), content: this.content(), enabled: false };
    // An existing entry keeps its ON/OFF choice; a new one starts ON only if this node can restore it.
    entry.enabled =
      !!entry.content.trim() &&
      (this.saved() ? this.startupEnabled() : canEnableStartup(entry, this.pendingNode(), this.profileType));
    selected.nodes[this.node().node_id] = entry;
    assignStartupSet(document, this.node().node_id, selected.nodes[this.node().node_id].enabled ? this.setId() : null);
    this.busy.set(true);
    return this.service.save(this.controller(), this.node().project_id, document).pipe(
      tap((saved) => {
        this.accept(saved);
        this.result.set('Saved to this set.');
        // The parent may close synchronously after saving node settings.
        this.busy.set(false);
      }),
      map(() => true),
      catchError((error) => {
        this.error(error);
        this.busy.set(false);
        return of(false);
      }),
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }
  apply() {
    if (!this.canApply()) return;
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
        data: {
          title: 'Apply configuration to node?',
          message: `Apply the saved configuration to ${this.node().name}?`,
          note: 'This merges settings into the device configuration and saves or commits the changes. Settings absent from this file remain.',
          confirmButtonText: 'Apply to node',
          tone: 'warning',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed || !this.canApply()) return;
        this.busy.set(true);
        this.result.set('Applying configuration…');
        this.service
          .apply(this.controller(), this.node(), this.setId(), this.document().revision)
          .pipe(
            switchMap((job) => this.service.waitForJob(this.controller(), this.node().project_id, job)),
            finalize(() => this.busy.set(false)),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe({
            next: (job) => {
              const id = this.node().node_id;
              const code = job.nodes[id];
              if (code === 'configuration_apply_accepted' || code === 'applied') {
                this.result.set('The node accepted the configuration. Check its console to confirm the result.');
                return;
              }
              this.error(new Error(code || 'Configuration application failed'), 'startup');
              const where = startupFailureDetail(job.details?.[id]);
              if (where) this.result.set(`${this.result()} ${where}`);
            },
            error: (error) => this.error(error, 'startup'),
          });
      });
  }
  download() {
    if (!this.saved()?.content || this.dirty()) return;
    downloadConfigurationText(this.node().name, this.driver(), this.saved().content);
  }
  private error(error: unknown, context: ConfigurationErrorContext = 'capture') {
    const message = configurationErrorMessage(error, context);
    this.result.set(message);
    this.toaster.error(message);
  }
}
