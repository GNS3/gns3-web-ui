import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MockedProjectService } from '../../../services/project.service.spec';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { ProjectService } from '../../../services/project.service';
import { ControllerService } from '../../../services/controller.service';
import { MockedControllerService } from '../../../services/controller.service.spec';
import { ToasterService } from '../../../services/toaster.service';

import { ConfirmationDeleteAllProjectsComponent } from './confirmation-delete-all-projects.component';

describe('ConfirmationDeleteAllProjectsComponent', () => {
  let component: ConfirmationDeleteAllProjectsComponent;
  let fixture: ComponentFixture<ConfirmationDeleteAllProjectsComponent>;
  let mockedControllerService = new MockedControllerService();
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
        { provide: ControllerService, useValue: mockedControllerService },
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
