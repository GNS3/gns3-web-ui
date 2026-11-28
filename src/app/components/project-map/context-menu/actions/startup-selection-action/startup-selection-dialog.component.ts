import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { Controller } from '@models/controller';
import { StartupDocument, StartupSelection } from '@models/startup-configuration';
import { captureFailureMessages, configurationErrorMessage } from '@services/configuration-messages';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import { ToasterService } from '@services/toaster.service';
import { finalize, map, of, switchMap } from 'rxjs';
import { Node } from '../../../../../cartography/models/node';

export interface StartupSelectionDialogData {
  controller: Controller;
  projectId: string;
  nodes: Node[];
}

export type StartupSelectionMode = 'capture' | 'assign' | 'clear';

/** Value of the "New set" choice (set ids are UUIDs). */
export const NEW_SET = 'new';

/** A capture of many nodes reads their consoles a few at a time. */
const CAPTURE_DEADLINE_MS = 600000;

@Component({
  selector: 'app-startup-selection-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: './startup-selection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartupSelectionDialogComponent implements OnInit {
  readonly data = inject<StartupSelectionDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<StartupSelectionDialogComponent>);
  private service = inject(StartupConfigurationsService);
  private toaster = inject(ToasterService);
  private destroyRef = inject(DestroyRef);

  readonly newSet = NEW_SET;
  readonly mode = signal<StartupSelectionMode>('capture');
  readonly document = signal<StartupDocument | null>(null);
  readonly setId = signal('');
  readonly newName = signal('');
  readonly busy = signal(false);
  readonly loadError = signal('');

  readonly canApply = computed(() => {
    if (this.busy() || !this.document()) return false;
    if (this.mode() === 'clear') return true;
    if (this.setId() === NEW_SET) return this.mode() === 'capture' && !!this.newName().trim();
    return !!this.setId();
  });

  ngOnInit() {
    this.service
      .get(this.data.controller, this.data.projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (document) => {
          this.document.set(document);
          this.setId.set(document.selected);
        },
        error: (error) => this.loadError.set(configurationErrorMessage(error, 'startup')),
      });
  }

  setMode(mode: StartupSelectionMode) {
    this.mode.set(mode);
    // A new set only makes sense as a capture target: assigning an empty set would give the nodes nothing.
    if (mode !== 'capture' && this.setId() === NEW_SET) this.setId.set(this.document()?.selected ?? '');
  }

  apply() {
    if (!this.canApply()) return;
    this.busy.set(true);
    this.dialogRef.disableClose = true;
    const request = this.mode() === 'capture' ? this.capture() : this.assign();
    request
      .pipe(
        finalize(() => {
          this.busy.set(false);
          this.dialogRef.disableClose = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.dialogRef.close(),
        error: (error) =>
          this.toaster.error(configurationErrorMessage(error, this.mode() === 'capture' ? 'capture' : 'startup')),
      });
  }

  private nodeIds() {
    return this.data.nodes.map((node) => node.node_id);
  }

  private nameOf(id: string) {
    return this.data.nodes.find((node) => node.node_id === id)?.name ?? id;
  }

  private capture() {
    const { controller, projectId } = this.data;
    const document = this.document()!;
    const existing = document.sets.find((set) => set.id === this.setId());
    const target = existing
      ? of(existing)
      : this.service
          .createSet(controller, projectId, this.newName().trim(), document.revision)
          .pipe(map((created) => created.set));
    return target.pipe(
      switchMap((set) =>
        this.service.capture(controller, projectId, set.id, this.nodeIds()).pipe(
          switchMap((job) => this.service.waitForJob(controller, projectId, job, CAPTURE_DEADLINE_MS)),
          map((job) => {
            const captured = Object.values(job.nodes).filter((result) => result === 'captured').length;
            const failures = captureFailureMessages(job.nodes, (id) => this.nameOf(id));
            const total = this.data.nodes.length;
            if (captured) {
              this.toaster.success(
                `Captured ${captured} of ${total} nodes into "${set.name}". Startup ON/OFF is unchanged.`,
              );
            }
            if (failures.length) this.toaster.warning(failures.join('; '));
          }),
        ),
      ),
    );
  }

  private assign() {
    const { controller, projectId } = this.data;
    const clearing = this.mode() === 'clear';
    const selection: StartupSelection = clearing ? { kind: 'none' } : { kind: 'set', set_id: this.setId() };
    const revision = this.document()!.selection_revision ?? 0;
    return this.service.assignSelection(controller, projectId, this.nodeIds(), selection, revision).pipe(
      map((result) => {
        const count = result.node_ids.length;
        if (clearing) {
          this.toaster.success(
            `Startup cleared for ${count} nodes: they boot with their image defaults after the next Wipe.`,
          );
          return;
        }
        const name = this.document()!.sets.find((set) => set.id === this.setId())?.name ?? '';
        this.toaster.success(`"${name}" assigned to ${count} nodes. It is delivered at the next Wipe and Start.`);
        if (result.without_startup.length) {
          this.toaster.warning(
            `No enabled configuration in "${name}" for: ${result.without_startup
              .map((id) => this.nameOf(id))
              .join(', ')}. They boot with their image defaults.`,
          );
        }
      }),
    );
  }
}
