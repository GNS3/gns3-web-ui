import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ListOfSnapshotsComponent } from './list-of-snapshots.component';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SnapshotService } from '../../../services/snapshot.service';
import { DateFilter } from '../../../filters/dateFilter.pipe';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../services/server.service';
import { MockedServerService } from '../../../services/server.service.spec';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { ToasterService } from '../../../services/toaster.service';
import { Server } from '../../../models/server';
import { Snapshot } from '../../../models/snapshot';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { NameFilter } from '../../../filters/nameFilter.pipe';
import { ServerResolve } from '../../../resolvers/server-resolve';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Sort } from '@angular/material/sort';

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
                },
                data: {
                    'server': new Server() 
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
    let activatedRoute = new MockedActivatedRoute().get();
    let mockedSnapshotService = new MockedSnapshotService();
    let mockedToasterService = new MockedToasterService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports:  [MatDialogModule, 
                MatTableModule, 
                MatIconModule, 
                MatToolbarModule, 
                MatMenuModule, 
                MatCheckboxModule, 
                CommonModule, 
                NoopAnimationsModule, 
                RouterTestingModule.withRoutes([
                    { path: 'server/:server_id/project/:project_id/snapshots', component: ListOfSnapshotsComponent, resolve: {server: ServerResolve} }
                ])],
            providers: [
                { provide: SnapshotService, useValue: mockedSnapshotService },
                { provide: ActivatedRoute, useValue: activatedRoute },
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
        let snapshot: Snapshot = {
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
        let sort: Sort = {
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
