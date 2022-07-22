import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ElectronService } from 'ngx-electron';
import { of } from 'rxjs';
import { ProgressService } from '../../common/progress/progress.service';
import { ProjectsFilter } from '../../filters/projectsFilter.pipe';
import { Project } from '../../models/project';
import{ Controller } from '../../models/controller';
import { ProjectService } from '../../services/project.service';
import { MockedProjectService } from '../../services/project.service.spec';
import { ControllerService } from '../../services/controller.service';
import { MockedControllerService } from '../../services/controller.service.spec';
import { Settings, SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { ChooseNameDialogComponent } from './choose-name-dialog/choose-name-dialog.component';
import { ProjectsComponent } from './projects.component';

xdescribe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let settingsService: SettingsService;
  let projectService: ProjectService;
  let controllerService: ControllerService;
  let controller:Controller ;
  let progressService: ProgressService;
  let mockedProjectService: MockedProjectService = new MockedProjectService();
  let electronService;

  beforeEach(async () => {
    electronService = {
      isElectronApp: true,
      remote: {
        require: (file) => {
          return {
            openConsole() { },
          };
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MatTooltipModule,
        MatIconModule,
        MatSortModule,
        MatDialogModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatBottomSheetModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: ControllerService, useClass: MockedControllerService },
        { provide: ProjectService, useValue: mockedProjectService },
        { provide: SettingsService },
        { provide: ToasterService },
        { provide: ElectronService, useValue: electronService },
        ProgressService,
      ],
      declarations: [ProjectsComponent, ChooseNameDialogComponent, ProjectsFilter],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: { entryComponents: [ChooseNameDialogComponent] },
      })
      .compileComponents();

    controllerService = TestBed.inject(ControllerService);
    settingsService = TestBed.inject(SettingsService);
    projectService = TestBed.inject(ProjectService);
    progressService = TestBed.inject(ProgressService);

    controller = new Controller  ();
    controller.id = 99;

    const settings = {} as Settings;

    spyOn(controllerService, 'get').and.returnValue(Promise.resolve(controller));
    spyOn(settingsService, 'getAll').and.returnValue(settings);
    spyOn(projectService, 'list').and.returnValue(of([]));

    spyOn(progressService, 'activate');
    spyOn(progressService, 'deactivate');
  });

beforeEach(() => {
  fixture = TestBed.createComponent(ProjectsComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('should create', () => {
  expect(component).toBeTruthy();
});

it('should remove item after delete action', () => {
  spyOn(mockedProjectService, 'delete').and.returnValue(of());
  let project = new Project();
  project.project_id = '1';

  component.delete(project);

  expect(mockedProjectService.delete).toHaveBeenCalled();
});

it('should call list on refresh', () => {
  mockedProjectService.list = jasmine.createSpy().and.returnValue(of([]));

  component.refresh();

  expect(mockedProjectService.list).toHaveBeenCalled();
});

describe('ProjectComponent open', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
    project.project_id = '1';

    spyOn(projectService, 'open').and.returnValue(of(project));

    component.controller = controller;
  });

  it('should open project', () => {
    component.open(project);
    expect(projectService.open).toHaveBeenCalledWith(controller, project.project_id);

    expect(progressService.activate).toHaveBeenCalled();
    expect(progressService.deactivate).toHaveBeenCalled();
  });
});

describe('ProjectComponent close', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
    project.project_id = '1';

    spyOn(projectService, 'close').and.returnValue(of(project));

    component.controller = controller;
  });

  xit('should close project', () => {
    component.close(project);
    expect(projectService.close).toHaveBeenCalledWith(controller, project.project_id);

    expect(progressService.activate).toHaveBeenCalled();
    expect(progressService.deactivate).toHaveBeenCalled();
  });
});
});
