import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MockedProjectService } from '../../../services/project.service.spec';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { ProjectService } from '../../../services/project.service';
import { ServerService } from '../../../services/server.service';
import { MockedServerService } from '../../../services/server.service.spec';
import { ToasterService } from '../../../services/toaster.service';

import { ConfirmationDeleteAllProjectsComponent } from './confirmation-delete-all-projects.component';

describe('ConfirmationDeleteAllProjectsComponent', () => {
  let component: ConfirmationDeleteAllProjectsComponent;
  let fixture: ComponentFixture<ConfirmationDeleteAllProjectsComponent>;
  let mockedServerService = new MockedServerService();
  let mockedImageManagerService = new MockedProjectService()
  let mockedToasterService = new MockedToasterService()

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
      ],
      providers: [
        { provide: ServerService, useValue: mockedServerService },
        { provide: ProjectService, useValue: mockedImageManagerService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },

      ],
      declarations: [ ConfirmationDeleteAllProjectsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDeleteAllProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
