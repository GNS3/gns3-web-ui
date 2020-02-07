import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatDialogModule, MatIconModule, MatMenuModule, MatTableModule, MatToolbarModule, Sort } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { DateFilter } from '../../../filters/dateFilter.pipe';
import { NameFilter } from '../../../filters/nameFilter.pipe';
import { Server } from '../../../models/server';
import { Snapshot } from '../../../models/snapshot';
import { ServerService } from '../../../services/server.service';
import { MockedServerService } from '../../../services/server.service.spec';
import { SnapshotService } from '../../../services/snapshot.service';
import { ToasterService } from '../../../services/toaster.service';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { ListOfSnapshotsComponent } from './list-of-snapshots.component';

export class MockedActivatedRoute {
    get() {
        return {
            params: of({ id: 3 }),
            snapshot: {
                parent: {
                    params: {
                        id: 1
                    }
                },
                paramMap: {
                    get(name: string): string {
                        return '1';
                    }
                }
            },
        };
    }
}

export class MockedSnapshotService {
    public list(server: Server, project_id: string) {
        return of([]);
    }

    public delete(server: Server, project_id: string, snapshot_id: string) {
        return of({});
    }

    public restore(server: Server, project_id: string, snapshot_id: string) {
        return of({});
    }
}

describe('ListOfSnapshotsComponent', () => {
    let component: ListOfSnapshotsComponent;
    let fixture: ComponentFixture<ListOfSnapshotsComponent>;
    const activatedRoute = new MockedActivatedRoute().get();
    const mockedServerService = new MockedServerService();
    const mockedSnapshotService = new MockedSnapshotService();
    const mockedToasterService = new MockedToasterService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports:  [MatDialogModule, MatTableModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
            providers: [
                { provide: SnapshotService, useValue: mockedSnapshotService },
                { provide: ActivatedRoute, useValue: activatedRoute },
                { provide: ServerService, useValue: mockedServerService },
                { provide: ProgressDialogService, useClass: ProgressDialogService },
                { provide: ToasterService, useValue: mockedToasterService }
            ],
            declarations: [
                ListOfSnapshotsComponent,
                DateFilter,
                NameFilter
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfSnapshotsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call snapshot service to get items', () => {
        spyOn(mockedSnapshotService, 'list').and.returnValues(of([]));

        component.getSnapshots();

        expect(mockedSnapshotService.list).toHaveBeenCalled();
    });

    it('should call snapshot service to delete snapshot', () => {
        const snapshot: Snapshot = {
            snapshot_id: 1,
            name: 'snapshot1',
            created_at: '111111',
            project_id: 1
        };
        spyOn(mockedSnapshotService, 'delete').and.returnValues(of([]));

        component.deleteSnapshot(snapshot);

        expect(mockedSnapshotService.delete).toHaveBeenCalled();
    });

    it('should sort snapshots in correct order', () => {
        component.snapshots = [
            {
                snapshot_id: 2,
                name: 'second snapshot',
                created_at: '222222',
                project_id: 1
            },
            {
                snapshot_id: 1,
                name: 'first snapshot',
                created_at: '111111',
                project_id: 1
            }
        ];
        const sort: Sort = {
            active: 'name',
            direction: 'asc'
        };

        component.sortData(sort);

        expect(component.snapshots[0].snapshot_id).toBe(1);

        sort.direction = 'desc';
        component.sortData(sort);

        expect(component.snapshots[0].snapshot_id).toBe(2);
    });
});
