import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NodesDataSource } from 'app/cartography/datasources/nodes-datasource';
import { MockedNodesDataSource } from 'app/components/project-map/project-map.component.spec';
import { SnapshotService } from 'app/services/snapshot.service';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import { MockedSnapshotService } from '../list-of-snapshots/list-of-snaphshots.component.spec';
import { CreateSnapshotDialogComponent } from './create-snapshot-dialog.component';

describe('CreateSnapshotDialogComponent', () => {
  let component: CreateSnapshotDialogComponent;
  let fixture: ComponentFixture<CreateSnapshotDialogComponent>;
  let mockedToasterService: MockedToasterService;
  let mockedSnapshotService: MockedSnapshotService;
  let mockedNodesDataSource: MockedNodesDataSource
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateSnapshotDialogComponent],
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: SnapshotService, useValue: mockedSnapshotService },
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSnapshotDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
