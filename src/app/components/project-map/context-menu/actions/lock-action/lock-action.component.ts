import { ChangeDetectionStrategy, Component, OnChanges, inject, input, ChangeDetectorRef, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';
import { ProjectService } from '@services/project.service';

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
      const isLocking = !nodes.every(n => n.locked) || !drawings.every(d => d.locked);
      const action = isLocking ? 'lock' : 'unlock';

      const dialogRef = this.dialog.open(LockConfirmDialogComponent, {
        panelClass: 'simple-dialog-panel',
        data: {
          title: `Confirm ${action === 'lock' ? 'Lock' : 'Unlock'} All`,
          message: `Are you sure you want to ${action} ${totalItems} item${totalItems > 1 ? 's' : ''}?`,
          action: action
        }
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.performLockUnlock();
        }
      });
    } else {
      this.performLockUnlock();
    }
  }

  async performLockUnlock() {
    await this.nodes().forEach((node) => {
      node.locked = !node.locked;
      this.nodeService.updateNode(this.controller(), node).subscribe((node) => {
        this.nodesDataSource.update(node);
        this.cdr.markForCheck();
      });
    });

    await this.drawings().forEach((drawing) => {
      drawing.locked = !drawing.locked;
      this.drawingService.update(this.controller(), drawing).subscribe((drawing) => {
        this.drawingsDataSource.update(drawing);
        this.cdr.markForCheck();
      });
    });
    this.projectService.projectUpdateLockIcon();
  }
}

@Component({
  selector: 'app-lock-confirm-dialog',
  template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(true)">{{ data.action === 'lock' ? 'Lock' : 'Unlock' }}</button>
    </div>
  `,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LockConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LockConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string; action: string }
  ) {}
}
