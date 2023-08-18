import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'environments/environment';
import { FileItem, FileSelectDirective, FileUploadModule } from 'ng2-file-upload';
import { of } from 'rxjs/internal/observable/of';
import { Project } from '../../../models/project';
import{ Controller } from '../../../models/controller';
import { ProjectService } from '../../../services/project.service';
import { ImportProjectDialogComponent } from './import-project-dialog.component';
import { ToasterService } from '../../../services/toaster.service';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { MatSnackBarModule } from '@angular/material/snack-bar';


export class MockedProjectService {
  public projects: Project[] = [
    {
      auto_close: false,
      auto_open: false,
      auto_start: false,
      drawing_grid_size: 10,
      grid_size: 10,
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
      snap_to_grid: false,
      variables: [],
    },
  ];

  list() {
    return of(this.projects);
  }

  getUploadPath(controller:Controller , uuid: string, project_name: string) {
    return `http://${controller.host}:${controller.port}/${environment.current_version}/projects/${uuid}/import?name=${project_name}`;
  }

  getExportPath(controller:Controller , project: Project) {
    return `http://${controller.host}:${controller.port}/${environment.current_version}/projects/${project.project_id}/export`;
  }
}

describe('ImportProjectDialogComponent', () => {
  let component: ImportProjectDialogComponent;
  let fixture: ComponentFixture<ImportProjectDialogComponent>;
  let controller:Controller ;
  let debugElement: DebugElement;
  let fileSelectDirective: FileSelectDirective;
  let mockedToasterService = new MockedToasterService()

  let dialogRef = {
    close: jasmine.createSpy('close'),
  };

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MatTooltipModule,
        MatIconModule,
        MatSortModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        FileUploadModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: ToasterService, useValue: mockedToasterService },

      ],
      declarations: [ImportProjectDialogComponent],
    }).compileComponents();

    controller = new Controller  ();
    controller.host = 'localhost';
    controller.port = 80;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportProjectDialogComponent);
    debugElement = fixture.debugElement;
    component = fixture.componentInstance;
    component.controller =  controller;
    component.projectNameForm.controls['projectName'].setValue('ValidName');
    fixture.detectChanges();

    debugElement = fixture.debugElement.query(By.directive(FileSelectDirective));
    fileSelectDirective = debugElement.injector.get(FileSelectDirective) as FileSelectDirective;
    component.uploader.onErrorItem = () => {};
  });

  it('should be created', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should set file uploader', () => {
    expect(fileSelectDirective).toBeDefined();
    expect(fileSelectDirective.uploader).toBe(component.uploader);
  });

  it('should handle file adding', () => {
    spyOn(fileSelectDirective.uploader, 'addToQueue');

    fileSelectDirective.onChange();

    expect(fileSelectDirective.uploader.addToQueue).toHaveBeenCalledWith(
      debugElement.nativeElement.files,
      fileSelectDirective.getOptions(),
      fileSelectDirective.getFilters()
    );
  });

  it('should call uploading item', () => {
    spyOn(fileSelectDirective.uploader, 'uploadItem');

    component.onImportClick();

    expect(fileSelectDirective.uploader.uploadItem).toHaveBeenCalled();
  });

  it('should call uploading item with correct arguments', () => {
    let fileItem = new FileItem(fileSelectDirective.uploader, new File([], 'fileName'), {url: ''});
    fileSelectDirective.uploader.queue.push(fileItem);
    spyOn(fileSelectDirective.uploader, 'uploadItem');

    component.onImportClick();

    expect(fileSelectDirective.uploader.uploadItem).toHaveBeenCalledWith(fileItem);
  });

  it('should handle file change event', () => {
    let input = fixture.debugElement.query(By.css('input[type=file]')).nativeElement;
    spyOn(component, 'uploadProjectFile');

    input.dispatchEvent(new Event('change'));

    expect(component.uploadProjectFile).toHaveBeenCalled();
  });

  it('should clear queue after calling delete', () => {
    fileSelectDirective.uploader.queue.push(new FileItem(fileSelectDirective.uploader, new File([], 'fileName'), {url: ''}));
    spyOn(fileSelectDirective.uploader.queue, 'pop');

    component.onDeleteClick();

    expect(fileSelectDirective.uploader.queue.pop).toHaveBeenCalled();
    expect(fileSelectDirective.uploader.queue[0]).toBeNull;
  });

  it('should prepare correct upload path for file', () => {
    fileSelectDirective.uploader.queue.push(new FileItem(fileSelectDirective.uploader, new File([], 'fileName'), {url: ''}));
    component.projectNameForm.controls['projectName'].setValue('newProject');

    component.onImportClick();

    expect(fileSelectDirective.uploader.queue[0].url).toContain('localhost:80');
    expect(fileSelectDirective.uploader.queue[0].url).toContain('newProject');
  });

  it('should navigate to progress view after clicking import', () => {
    let fileItem = new FileItem(fileSelectDirective.uploader, new File([], 'fileName'), {url: ''});
    fileSelectDirective.uploader.queue.push(fileItem);

    component.onImportClick();

    expect(component.isFirstStepCompleted).toBe(true);
  });

  it('should detect if file input is empty', () => {
    component.projectNameForm.controls['projectName'].setValue('');
    fixture.detectChanges();
    spyOn(fileSelectDirective.uploader, 'uploadItem');

    component.onImportClick();

    expect(fileSelectDirective.uploader.uploadItem).not.toHaveBeenCalled();
    expect(component.projectNameForm.valid).toBeFalsy();
  });

  it('should sanitize file name input', () => {
    component.projectNameForm.controls['projectName'].setValue('[][]');
    fixture.detectChanges();
    spyOn(fileSelectDirective.uploader, 'uploadItem');

    component.onImportClick();

    expect(fileSelectDirective.uploader.uploadItem).not.toHaveBeenCalled();
    expect(component.projectNameForm.valid).toBeFalsy();
  });

  it('should open confirmation dialog if project with the same exists', () => {
    component.projectNameForm.controls['projectName'].setValue('blank');
    spyOn(component, 'openConfirmationDialog');

    component.onImportClick();

    expect(component.openConfirmationDialog).toHaveBeenCalled();
  });

  it('should show delete button after selecting project', () => {
    let fileItem = new FileItem(fileSelectDirective.uploader, new File([], 'fileName'), {url: ''});
    fileSelectDirective.uploader.queue.push(fileItem);
    let event = {
      target: {
        files: [{ name: 'uploadedFile' }],
      },
    };
    component.uploadProjectFile(event);

    expect(component.isDeleteVisible).toBe(true);
  });

  it('should hide delete button after deselecting project', () => {
    let fileItem = new FileItem(fileSelectDirective.uploader, new File([], 'fileName'), {url: ''});
    fileSelectDirective.uploader.queue.push(fileItem);
    let event = {
      target: {
        files: [{ name: 'uploadedFile' }],
      },
    };
    component.uploadProjectFile(event);
    component.onDeleteClick();

    expect(component.isDeleteVisible).toBe(false);
  });
});
