import { ChangeDetectionStrategy, Component, OnChanges, inject, input, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-lock-action',
  templateUrl: './lock-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockActionComponent implements OnChanges {
  private nodesDataSource = inject(NodesDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private nodeService = inject(NodeService);
  private drawingService = inject(DrawingService);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);
  readonly drawings = input<Drawing[]>(undefined);
  command: string;

  ngOnChanges() {
    const nodes = this.nodes();
    const drawings = this.drawings();
    if (nodes.length === 1 && drawings.length === 0) {
      this.command = nodes[0].locked ? 'Unlock item' : 'Lock item';
    } else if (nodes.length === 0 && drawings.length === 1) {
      this.command = drawings[0].locked ? 'Unlock item' : 'Lock item';
    } else {
      this.command = 'Lock/unlock items';
    }
  }

  lock() {
    const nodes = this.nodes();
    const drawings = this.drawings();
    const totalItems = nodes.length + drawings.length;

    // Only show confirmation for multiple items
    if (totalItems > 1) {
      const isLocking = !nodes.every((n) => n.locked) || !drawings.every((d) => d.locked);
      const action = isLocking ? 'lock' : 'unlock';

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: `${action === 'lock' ? 'Lock' : 'Unlock'} selected items?`,
          message: `${action === 'lock' ? 'Lock' : 'Unlock'} ${totalItems} selected items?`,
          confirmButtonText: action === 'lock' ? 'Lock items' : 'Unlock items',
          tone: 'warning',
          icon: action === 'lock' ? 'lock' : 'lock_open',
        },
      });

      dialogRef.afterClosed().subscribe({
        next: (confirmed) => {
          if (confirmed) {
            this.performLockUnlock();
          }
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to process lock confirmation';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    } else {
      this.performLockUnlock();
    }
  }

  async performLockUnlock() {
    await this.nodes().forEach((node) => {
      node.locked = !node.locked;
      this.nodeService.updateNode(this.controller(), node).subscribe({
        next: (node) => {
          this.nodesDataSource.update(node);
          this.cdr.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update node lock status';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });

    await this.drawings().forEach((drawing) => {
      drawing.locked = !drawing.locked;
      this.drawingService.update(this.controller(), drawing).subscribe({
        next: (drawing) => {
          this.drawingsDataSource.update(drawing);
          this.cdr.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update drawing lock status';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
    this.projectService.projectUpdateLockIcon();
  }
}
