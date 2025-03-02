import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '../../../models/controller';
import { ProgressDialogComponent } from '../../../common/progress-dialog/progress-dialog.component';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { Project } from '../../../models/project';
import { Snapshot } from '../../../models/snapshot';
import { SnapshotService } from '../../../services/snapshot.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-list-of-snapshots',
  templateUrl: './list-of-snapshots.component.html',
  styleUrls: ['./list-of-snapshots.component.scss'],
})
export class ListOfSnapshotsComponent implements OnInit {
  controller: Controller;
  projectId: string;
  snapshots: Snapshot[];
  displayedColumns = ['name', 'creationDate', 'actions'];
  searchText: string;

  constructor(
    private route: ActivatedRoute,
    private snapshotService: SnapshotService,
    private progressDialogService: ProgressDialogService,
    private toaster: ToasterService
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('project_id');
    this.controller = this.route.snapshot.data['controller'];
    this.getSnapshots();
  }

  getSnapshots() {
    this.snapshotService.list(this.controller, this.projectId).subscribe((snapshots: Snapshot[]) => {
      this.snapshots = snapshots;
    });
  }

  restoreSnapshot(snapshot: Snapshot) {
    const restoring = this.snapshotService.restore(this.controller, this.projectId, snapshot.snapshot_id.toString());
    const progress = this.progressDialogService.open();
    const subscription = restoring.subscribe((project: Project) => {
      this.toaster.success(`Snapshot ${snapshot.name} has been restored.`);
      progress.close();
    });

    progress.afterClosed().subscribe((result) => {
      if (result === ProgressDialogComponent.CANCELLED) {
        subscription.unsubscribe();
      }
    });
  }

  deleteSnapshot(snapshot: Snapshot) {
    this.snapshotService.delete(this.controller, this.projectId, snapshot.snapshot_id.toString()).subscribe(() => {
      this.getSnapshots();
      this.toaster.success(`Snapshot ${snapshot.name} has been deleted.`);
    });
  }

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') return;

    let snapshots = this.snapshots.slice();
    this.snapshots = snapshots.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      if (sort.active === 'name') {
        return compareNames(a.name, b.name, isAsc);
      } else if (sort.active === 'creationDate') {
        return compareDates(+a.created_at, +b.created_at, !isAsc);
      } else return 0;
    });
  }
}

function compareDates(a: number, b: number, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function compareNames(a: string, b: string, isAsc: boolean) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
