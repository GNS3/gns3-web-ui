import { Component, OnInit } from '@angular/core';
import { SnapshotService } from '../../../services/snapshot.service';
import { ServerService } from '../../../services/server.service';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../..//models/server';
import { Snapshot } from '../../../models/snapshot';
import { Sort } from '@angular/material/sort';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { ToasterService } from '../../../services/toaster.service';
import { Project } from '../../../models/project';
import { ProgressDialogComponent } from '../../../common/progress-dialog/progress-dialog.component';

@Component({
  selector: 'app-list-of-snapshots',
  templateUrl: './list-of-snapshots.component.html',
  styleUrls: ['./list-of-snapshots.component.scss']
})
export class ListOfSnapshotsComponent implements OnInit {
    server: Server;
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
        this.projectId = this.route.snapshot.paramMap.get("project_id");
        this.server = this.route.snapshot.data['server'];
        this.getSnapshots();
    }

    getSnapshots() {
        this.snapshotService.list(this.server, this.projectId).subscribe((snapshots: Snapshot[]) => {
            this.snapshots = snapshots;
        });
    }

    restoreSnapshot(snapshot: Snapshot) {
        const restoring = this.snapshotService.restore(this.server, this.projectId, snapshot.snapshot_id.toString());
        const progress = this.progressDialogService.open();
        const subscription = restoring.subscribe(
            (project: Project) => {
                this.toaster.success(`Snapshot ${snapshot.name} has been restored.`);
                progress.close();
            }
        );

        progress.afterClosed().subscribe(result => {
            if (result === ProgressDialogComponent.CANCELLED) {
                subscription.unsubscribe();
            }
        });
    }

    deleteSnapshot(snapshot: Snapshot) {
        this.snapshotService.delete(this.server, this.projectId, snapshot.snapshot_id.toString()).subscribe(() => {
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
