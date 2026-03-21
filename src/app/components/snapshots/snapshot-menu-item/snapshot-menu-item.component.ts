import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProgressDialogComponent } from '../../../common/progress-dialog/progress-dialog.component';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Snapshot } from '@models/snapshot';
import { SnapshotService } from '@services/snapshot.service';
import { ToasterService } from '@services/toaster.service';
import { CreateSnapshotDialogComponent } from '../create-snapshot-dialog/create-snapshot-dialog.component';

@Component({
  standalone: true,
  selector: 'app-snapshot-menu-item',
  templateUrl: './snapshot-menu-item.component.html',
  styleUrls: ['./snapshot-menu-item.component.scss'],
  imports: [CommonModule, MatDialogModule, MatTooltipModule, MatIconModule, MatButtonModule],
})
export class SnapshotMenuItemComponent implements OnInit {
  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);

  private dialog = inject(MatDialog);
  private snapshotService = inject(SnapshotService);
  private progressDialogService = inject(ProgressDialogService);
  private toaster = inject(ToasterService);

  constructor() {}

  ngOnInit() {}

  public createSnapshotModal() {
    const dialogRef = this.dialog.open(CreateSnapshotDialogComponent, {
      width: '450px',
      data: {
        controller: this.controller(),
        project: this.project(),
      },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((snapshot) => {
      const project = this.project();
      if (snapshot && project.project_id) {
        const creation = this.snapshotService.create(this.controller(), project.project_id, snapshot);

        const progress = this.progressDialogService.open();

        const subscription = creation.subscribe((created_snapshot: Snapshot) => {
          this.toaster.success(`Snapshot '${snapshot.name}' has been created.`);
          progress.close();
        });

        progress.afterClosed().subscribe((result) => {
          if (result === ProgressDialogComponent.CANCELLED) {
            subscription.unsubscribe();
          }
        });
      }
    });
  }
}
