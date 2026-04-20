import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { SnapshotDialogComponent } from '../snapshot-dialog/snapshot-dialog.component';

@Component({
  selector: 'app-snapshot-menu-item',
  templateUrl: './snapshot-menu-item.component.html',
  styleUrl: './snapshot-menu-item.component.scss',
  imports: [CommonModule, MatDialogModule, MatTooltipModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotMenuItemComponent {
  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);

  private dialog = inject(MatDialog);

  openSnapshotDialog() {
    const project = this.project();
    const controller = this.controller();
    if (!project || !controller) return;

    this.dialog.open(SnapshotDialogComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      data: {
        controller,
        project,
      },
      autoFocus: false,
    });
  }
}
