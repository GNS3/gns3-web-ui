import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ToasterService } from '@services/toaster.service';
import { NodesMenuConfirmationDialogComponent } from './nodes-menu-confirmation-dialog/nodes-menu-confirmation-dialog.component';

@Component({
  selector: 'app-nodes-menu',
  templateUrl: './nodes-menu.component.html',
  styleUrls: ['./nodes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodesMenuComponent {
  @Input('project') project: Project;
  @Input('controller') controller: Controller;

  constructor(
    private nodeService: NodeService,
    private nodeConsoleService: NodeConsoleService,
    private nodesDataSource: NodesDataSource,
    private toasterService: ToasterService,
    private mapSettingsService: MapSettingsService,
    private dialog: MatDialog
  ) {}

  async startConsoleForAllNodes() {
    if (this.mapSettingsService.openConsolesInWidget) {
      this.nodeConsoleService.openConsolesForAllNodesInWidget(this.nodesDataSource.getItems());
    } else {
      this.nodeConsoleService.openConsolesForAllNodesInNewTabs(this.nodesDataSource.getItems());
    }
  }

  startNodes() {
    this.nodeService.startAll(this.controller, this.project).subscribe(() => {
      this.toasterService.success('All nodes successfully started');
    });
  }

  stopNodes() {
    this.nodeService.stopAll(this.controller, this.project).subscribe(() => {
      this.toasterService.success('All nodes successfully stopped');
    });
  }

  suspendNodes() {
    this.nodeService.suspendAll(this.controller, this.project).subscribe(() => {
      this.toasterService.success('All nodes successfully suspended');
    });
  }

  reloadNodes() {
    this.nodeService.reloadAll(this.controller, this.project).subscribe(() => {
      this.toasterService.success('All nodes successfully reloaded');
    });
  }

  resetNodes() {
    this.nodeService.resetAllNodes(this.controller, this.project).subscribe(() => {
      this.toasterService.success('Successfully reset all console connections');
    });
  }

  public confirmControlsActions(type) {
    const dialogRef = this.dialog.open(NodesMenuConfirmationDialogComponent, {
      width: '500px',
      maxHeight: '200px',
      autoFocus: false,
      disableClose: true,
      data: type,
    });

    dialogRef.afterClosed().subscribe((confirmAction_result) => {
      if (confirmAction_result.isAction && confirmAction_result.actionType == 'start') {
        this.startNodes();
      } else if (confirmAction_result.isAction && confirmAction_result.actionType == 'stop') {
        this.stopNodes();
      } else if (confirmAction_result.isAction && confirmAction_result.actionType == 'reload') {
        this.reloadNodes();
      } else if (confirmAction_result.isAction && confirmAction_result.actionType == 'suspend') {
        this.suspendNodes();
      } else {
        this.resetNodes()
      }
    });
  }
}
