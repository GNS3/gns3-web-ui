import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
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
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  standalone: true,
  selector: 'app-nodes-menu',
  templateUrl: './nodes-menu.component.html',
  styleUrls: ['./nodes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class NodesMenuComponent {
  private nodeService = inject(NodeService);
  private nodeConsoleService = inject(NodeConsoleService);
  private nodesDataSource = inject(NodesDataSource);
  private toasterService = inject(ToasterService);
  private controllerService = inject(ControllerService);
  private settingsService = inject(SettingsService);
  private mapSettingsService = inject(MapSettingsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);

  async startConsoleForAllNodes() {
    if (this.mapSettingsService.openConsolesInWidget) {
      this.nodeConsoleService.openConsolesForAllNodesInWidget(this.nodesDataSource.getItems());
    } else {
      this.nodeConsoleService.openConsolesForAllNodesInNewTabs(this.nodesDataSource.getItems());
    }
  }

  startNodes() {
    this.nodeService.startAll(this.controller(), this.project()).subscribe({
      next: () => this.toasterService.success('All nodes successfully started'),
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
