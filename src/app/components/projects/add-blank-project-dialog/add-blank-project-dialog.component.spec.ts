import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog.component';
import { Server } from '../../../models/server';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatInputModule,
  MatFormFieldModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBarModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectService } from '../../../services/project.service';
import { ToasterService } from '../../../services/toaster.service';
import { of } from 'rxjs/internal/observable/of';
import { Project } from '../../../models/project';
import { Router } from '@angular/router';

export class MockedProjectService {
  public projects: Project[] = [
    {
      auto_close: false,
      auto_open: false,
      auto_start: false,
      filename: 'blank',
      name: 'blank',
      path: '',
      project_id: '',
      scene_height: 100,
      scene_width: 100,
      status: 'opened',
      readonly: false,
      show_interface_labels: false,
      show_layers: false,
      show_grid: false,
      snap_to_grid: false
    }
  ];

  list() {
    return of(this.projects);
  }

  add() {
    return of(this.projects.pop);
  }
}

describe('AddBlankProjectDialogComponent', () => {
  let component: AddBlankProjectDialogComponent;
  let fixture: ComponentFixture<AddBlankProjectDialogComponent>;
  let server: Server;
  let router = {
    navigate: jasmine.createSpy('navigate')
  };
  let toaster = {
    success: jasmine.createSpy('success')
  };
  let dialogRef = {
    close: jasmine.createSpy('close')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: ToasterService, useValue: toaster },
        { provide: Router, useValue: router }
      ],
      declarations: [AddBlankProjectDialogComponent]
    }).compileComponents();

    server = new Server();
    server.ip = 'localhost';
    server.port = 80;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBlankProjectDialogComponent);
    component = fixture.componentInstance;
    component.server = server;
    component.projectNameForm.controls['projectName'].setValue('ValidName');
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should call adding project when name is valid', () => {
    spyOn(component, 'addProject');

    component.onAddClick();

    expect(component.addProject).toHaveBeenCalled();
  });

  it('should sanitize file name input', () => {
    component.projectNameForm.controls['projectName'].setValue('[][]');
    fixture.detectChanges();
    spyOn(component, 'addProject');

    component.onAddClick();

    expect(component.addProject).not.toHaveBeenCalled();
    expect(component.projectNameForm.valid).toBeFalsy();
  });

  it('should open confirmation dialog if project with the same exists', () => {
    component.projectNameForm.controls['projectName'].setValue('blank');
    spyOn(component, 'openConfirmationDialog');

    component.onAddClick();

    expect(component.openConfirmationDialog).toHaveBeenCalled();
  });

  it('should redirect to newly created project', () => {
    component.projectNameForm.controls['projectName'].setValue('validName');

    component.addProject();

    expect(dialogRef.close).toHaveBeenCalled();
    expect(toaster.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });
});
