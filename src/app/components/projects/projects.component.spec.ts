import { OverlayRef } from '@angular/cdk/overlay';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule, MatDialogContainer, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule, MatSortModule, MatTableModule, MatTooltipModule } from '@angular/material';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ElectronService } from 'ngx-electron';
import { Observable, of } from 'rxjs';
import { ProgressService } from '../../common/progress/progress.service';
import { ProjectsFilter } from '../../filters/projectsFilter.pipe';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { ProjectService } from '../../services/project.service';
import { MockedProjectService } from '../../services/project.service.spec';
import { ServerService } from '../../services/server.service';
import { MockedServerService } from '../../services/server.service.spec';
import { SettingsService } from '../../services/settings.service';
import { Settings } from '../../services/settings.service';
import { MockedSettingsService } from '../../services/settings.service.spec';
import { ToasterService } from '../../services/toaster.service';
import { ConfigureGns3VMDialogComponent } from '../servers/configure-gns3vm-dialog/configure-gns3vm-dialog.component';
import { ChooseNameDialogComponent } from './choose-name-dialog/choose-name-dialog.component';
import { ProjectsComponent } from './projects.component';

xdescribe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let settingsService: SettingsService;
  let projectService: ProjectService;
  let serverService: ServerService;
  let server: Server;
  let progressService: ProgressService;
  const mockedProjectService: MockedProjectService = new MockedProjectService();
  let electronService;

  beforeEach(async(() => {
    electronService = {
      isElectronApp: true,
      remote: {
        require: (file) => {
          return {
            openConsole() {}
          };
        }
      }
    };

    TestBed.configureTestingModule({
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
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: ServerService, useClass: MockedServerService },
        { provide: ProjectService, useValue: mockedProjectService },
        { provide: SettingsService, useClass: MockedSettingsService },
        { provide: ToasterService },
        { provide: ElectronService, useValue: electronService },
        ProgressService
      ],
      declarations: [ProjectsComponent, ChooseNameDialogComponent, ConfigureGns3VMDialogComponent, ProjectsFilter],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideModule(BrowserDynamicTestingModule, { set: { entryComponents: [ChooseNameDialogComponent, ConfigureGns3VMDialogComponent] } })
    .compileComponents();

    serverService = TestBed.get(ServerService);
    settingsService = TestBed.get(SettingsService);
    projectService = TestBed.get(ProjectService);
    progressService = TestBed.get(ProgressService);

    server = new Server();
    server.id = 99;

    const settings = {} as Settings;

    spyOn(serverService, 'get').and.returnValue(Promise.resolve(server));
    spyOn(settingsService, 'getAll').and.returnValue(settings);
    spyOn(projectService, 'list').and.returnValue(of([]));

    spyOn(progressService, 'activate');
    spyOn(progressService, 'deactivate');
  }));

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
    const project = new Project();
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

      component.server = server;
    });

    it('should open project', () => {
      component.open(project);
      expect(projectService.open).toHaveBeenCalledWith(server, project.project_id);

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

      component.server = server;
    });

    xit('should close project', () => {
      component.close(project);
      expect(projectService.close).toHaveBeenCalledWith(server, project.project_id);

      expect(progressService.activate).toHaveBeenCalled();
      expect(progressService.deactivate).toHaveBeenCalled();
    });
  });
});
