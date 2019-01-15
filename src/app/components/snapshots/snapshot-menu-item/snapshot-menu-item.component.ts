import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { CreateSnapshotDialogComponent } from '../create-snapshot-dialog/create-snapshot-dialog.component';
import { SnapshotService } from '../../../services/snapshot.service';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { ToasterService } from '../../../services/toaster.service';
import { ProgressDialogComponent } from '../../../common/progress-dialog/progress-dialog.component';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { Snapshot } from '../../../models/snapshot';

@Component({
  selector: 'app-snapshot-menu-item',
  templateUrl: './snapshot-menu-item.component.html',
  styleUrls: ['./snapshot-menu-item.component.scss']
})
export class SnapshotMenuItemComponent implements OnInit {
  @Input('project') project: Project;
  @Input('server') server: Server;

  constructor(
    private dialog: MatDialog,
    private snapshotService: SnapshotService,
    private progressDialogService: ProgressDialogService,
    private toaster: ToasterService
  ) {}

  ngOnInit() {}

  public createSnapshotModal() {
    const dialogRef = this.dialog.open(CreateSnapshotDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(snapshot => {
      if (snapshot) {
        const creation = this.snapshotService.create(this.server, this.project.project_id, snapshot);

        const progress = this.progressDialogService.open();

        const subscription = creation.subscribe(
          (created_snapshot: Snapshot) => {
            this.toaster.success(`Snapshot '${snapshot.name}' has been created.`);
            progress.close();
          },
          response => {
            const error = response.json();
            this.toaster.error(`Cannot create snapshot: ${error.message}`);
            progress.close();
          }
        );

        progress.afterClosed().subscribe(result => {
          if (result === ProgressDialogComponent.CANCELLED) {
            subscription.unsubscribe();
          }
        });
      }
    });
  }
}
