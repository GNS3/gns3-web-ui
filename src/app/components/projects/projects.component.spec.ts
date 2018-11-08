import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule, MatSortModule, MatTableModule, MatTooltipModule, MatDialogModule } from "@angular/material";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

import { Observable, of } from "rxjs";

import { ProjectsComponent } from './projects.component';
import { ServerService } from "../../services/server.service";
import { MockedServerService } from "../../services/server.service.spec";
import { ProjectService } from "../../services/project.service";
import { MockedProjectService } from "../../services/project.service.spec";
import { SettingsService } from "../../services/settings.service";
import { MockedSettingsService } from "../../services/settings.service.spec";
import { ProgressService } from "../../common/progress/progress.service";
import { Server } from "../../models/server";
import { Settings } from "../../services/settings.service";
import { Project } from "../../models/project";


describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let settingsService: SettingsService;
  let projectService: ProjectService;
  let serverService: ServerService;
  let server: Server;
  let progressService: ProgressService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MatTooltipModule,
        MatIconModule,
        MatSortModule,
        MatDialogModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: ServerService, useClass: MockedServerService },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: SettingsService, useClass: MockedSettingsService },
        ProgressService
      ],
      declarations: [ ProjectsComponent ]
    })
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


  describe('ProjectComponent open', () => {
    let project: Project;

    beforeEach(() => {
      project = new Project();
      project.project_id = "1";

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
      project.project_id = "1";

      spyOn(projectService, 'close').and.returnValue(of(project));

      component.server = server;
    });


    it('should close project', () => {
      component.close(project);
      expect(projectService.close).toHaveBeenCalledWith(server, project.project_id);

      expect(progressService.activate).toHaveBeenCalled();
      expect(progressService.deactivate).toHaveBeenCalled();
    });
  });
});
