import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeService } from '@services/node.service';
import { NodeWipeService } from '@services/node-wipe.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { ProjectService } from '@services/project.service';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import { nodeConfigCapabilities } from '@services/configuration-capabilities';
import { captureFailureMessages, configurationErrorMessage } from '@services/configuration-messages';
import { EMPTY, finalize, map, switchMap } from 'rxjs';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { HasProjectPrivilegeDirective } from '@directives/has-project-privilege.directive';

/** `1 node`, `2 nodes`. */
const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;
const startSummary = (count: number) => `Start or resume ${plural(count, 'node')} before exporting.`;

@Component({
  standalone: true,
  selector: 'app-nodes-menu',
  templateUrl: './nodes-menu.component.html',
  styleUrls: ['./nodes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    HasProjectPrivilegeDirective,
  ],
})
export class NodesMenuComponent {
  private nodeService = inject(NodeService);
  private nodeConsoleService = inject(NodeConsoleService);
  private nodesDataSource = inject(NodesDataSource);
  private toasterService = inject(ToasterService);
  private controllerService = inject(ControllerService);
  private projectService = inject(ProjectService);
  private settingsService = inject(SettingsService);
  private mapSettingsService = inject(MapSettingsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private wipes = inject(NodeWipeService);
  private configurations = inject(StartupConfigurationsService);
  private destroyRef = inject(DestroyRef);
  readonly configurationBusy = signal(false);
  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);

  get readonly() {
    const project = this.project();
    return !!project && this.projectService.isReadOnly(project);
  }

  /**
   * Capture every node whose configuration can be read right now into the
   * project's selected set. The destination is the selected set, not each node's
   * own assignment, and the toast names it. Scope is the whole project: this
   * menu has no node selection to narrow it.
   */
  exportAllConfigurations() {
    if (this.configurationBusy() || !this.project() || this.readonly) return;
    const controller = this.controller();
    const projectId = this.project().project_id;
    this.configurationBusy.set(true);
    const names: Record<string, string> = {};
    this.projectService
      .nodes(controller, projectId)
      .pipe(
        switchMap((nodes) => {
          const nodeIds: string[] = [];
          let requiresStart = 0;
          for (const node of nodes) {
            names[node.node_id] = node.name;
            const capabilities = nodeConfigCapabilities(node);
            if (capabilities.canCapture) nodeIds.push(node.node_id);
            else if (capabilities.captureRequiresStart) requiresStart++;
          }
          if (!nodeIds.length) {
            this.toasterService.info(
              requiresStart ? startSummary(requiresStart) : 'No nodes can be exported right now.',
            );
            return EMPTY;
          }
          return this.configurations.get(controller, projectId).pipe(
            switchMap((document) =>
              this.configurations.capture(controller, projectId, document.selected, nodeIds).pipe(
                // Project captures queue nodes on the backend; allow a bounded per-node budget.
                switchMap((job) =>
                  this.configurations.waitForJob(controller, projectId, job, Math.max(90000, nodeIds.length * 45000)),
                ),
                map((job) => ({
                  job,
                  requiresStart,
                  setName: document.sets?.find((set) => set.id === document.selected)?.name,
                })),
              ),
            ),
          );
        }),
        finalize(() => this.configurationBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ job, requiresStart, setName }) => {
          let captured = 0;
          let skipped = 0;
          const failures: Record<string, string> = {};
          for (const [id, result] of Object.entries(job.nodes)) {
            if (result === 'captured') captured++;
            else if (result === 'configuration_not_saved') skipped++;
            else if (result === 'start_required') requiresStart++;
            else failures[id] = result;
          }
          const failed = Object.keys(failures).length;
          const notices = [
            skipped ? `Skipped ${plural(skipped, 'node')} with no saved configuration.` : '',
            requiresStart ? startSummary(requiresStart) : '',
          ].filter(Boolean);
          const suffix = notices.length ? ` ${notices.join(' ')}` : '';
          if (job.status !== 'finished' || failed) {
            const reasons = captureFailureMessages(failures, (id) => names[id] || id).slice(0, 3);
            this.toasterService.error(
              `Exported ${plural(captured, 'configuration')}; ${plural(failed, 'node')} not exported.` +
                suffix +
                (reasons.length ? ` ${reasons.join(' ')}` : '') +
                ' Open Startup configurations for per-node results.',
            );
          } else if (!captured && notices.length) {
            this.toasterService.info(notices.join(' '));
          } else {
            this.toasterService.success(
              `Exported ${plural(captured, 'configuration')} to the startup configuration set${setName ? ` "${setName}"` : ''}.` +
                suffix,
            );
          }
        },
        error: (error) => this.toasterService.error(configurationErrorMessage(error, 'capture')),
      });
  }

  wipeAllNodes() {
    if (this.configurationBusy() || !this.project() || this.readonly) return;
    this.configurationBusy.set(true);
    this.wipes
      .wipe(this.controller(), this.project().project_id, this.nodesDataSource.getItems(), true)
      .pipe(
        finalize(() => this.configurationBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  async startConsoleForAllNodes() {
    if (this.mapSettingsService.openConsolesInWidget) {
      this.nodeConsoleService.openConsolesForAllNodesInWidget(this.nodesDataSource.getItems());
    } else {
      this.nodeConsoleService.openConsolesForAllNodesInNewTabs(this.nodesDataSource.getItems());
    }
  }

  startNodes() {
    const missingImages = this.nodesDataSource.getItems().filter((node) => node.missing_image).length;
    if (missingImages > 0) {
      this.toasterService.warning(
        `${missingImages} node(s) with a missing image cannot be started and will be skipped.`,
      );
    }
    this.nodeService.startAll(this.controller(), this.project()).subscribe({
      next: () =>
        this.toasterService.success(
          missingImages > 0 ? 'All available nodes successfully started' : 'All nodes successfully started',
        ),
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to start nodes';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  stopNodes() {
    this.nodeService.stopAll(this.controller(), this.project()).subscribe({
      next: () => this.toasterService.success('All nodes successfully stopped'),
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to stop nodes';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  suspendNodes() {
    this.nodeService.suspendAll(this.controller(), this.project()).subscribe({
      next: () => this.toasterService.success('All nodes successfully suspended'),
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to suspend nodes';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  reloadNodes() {
    this.nodeService.reloadAll(this.controller(), this.project()).subscribe({
      next: () => this.toasterService.success('All nodes successfully reloaded'),
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to reload nodes';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  resetNodes() {
    this.nodeService.resetAllNodes(this.controller(), this.project()).subscribe({
      next: () => this.toasterService.success('Successfully reset all console connections'),
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to reset nodes';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  public confirmControlsActions(type) {
    const actionType = String(type);
    const actionLabel = actionType.charAt(0).toUpperCase() + actionType.slice(1);
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      disableClose: true,
      data: {
        title: `${actionLabel} all devices?`,
        message: `This will ${actionType} every device in the current project.`,
        confirmButtonText: `${actionLabel} all`,
        tone: 'warning',
        icon: 'power_settings_new',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      if (actionType == 'start') {
        this.startNodes();
      } else if (actionType == 'stop') {
        this.stopNodes();
      } else if (actionType == 'reload') {
        this.reloadNodes();
      } else if (actionType == 'suspend') {
        this.suspendNodes();
      } else if (actionType == 'reset') {
        this.resetNodes();
      }
    });
  }
}
