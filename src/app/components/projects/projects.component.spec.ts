import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError, Subject } from 'rxjs';
import { ProjectsComponent } from './projects.component';
import { ProjectService } from '@services/project.service';
import { SettingsService, Settings } from '@services/settings.service';
import { ProgressService } from '../../common/progress/progress.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { NotificationService, ProjectNotification } from '@services/notification.service';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  let mockProjectService: any;
  let mockSettingsService: any;
  let mockProgressService: any;
  let mockRecentlyOpenedProjectService: any;
  let mockThemeService: any;
  let mockToasterService: any;
  let mockNotificationService: any;
  let mockDialog: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockController: Controller = {
    id: 1,
    authToken: '',
    name: 'Test Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  } as Controller;

  const mockProjects: Project[] = [
    { project_id: 'proj1', name: 'Project A', status: 'closed', created_by: 'Alice' } as Project,
    { project_id: 'proj2', name: 'Project B', status: 'opened', created_by: 'Bob' } as Project,
  ];

  const mockSettings: Settings = {
    crash_reports: true,
    console_command: 'telnet',
    anonymous_statistics: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockProjectService = {
      list: vi.fn().mockReturnValue(of(mockProjects)),
      projectListSubject: new Subject<void>(),
      delete: vi.fn().mockReturnValue(of({})),
      open: vi.fn().mockReturnValue(of({})),
      close: vi.fn().mockReturnValue(of({})),
      getStatistics: vi.fn().mockReturnValue(of({ nodes: 2, links: 1, drawings: 0, snapshots: 0 })),
      getReadmeFile: vi.fn().mockReturnValue(of('A useful project description.')),
    };

    mockSettingsService = {
      getAll: vi.fn().mockReturnValue(mockSettings),
    };

    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
      setError: vi.fn(),
    };

    mockRecentlyOpenedProjectService = {
      setcontrollerIdProjectList: vi.fn(),
    };

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('dark'),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockNotificationService = {
      projectNotificationEmitter: new Subject<ProjectNotification>(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(undefined)),
        componentInstance: {},
      }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        data: { controller: mockController },
        queryParams: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: RecentlyOpenedProjectService, useValue: mockRecentlyOpenedProjectService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have displayedColumns with correct values', () => {
      fixture.detectChanges();
      expect(component.displayedColumns).toEqual(['select', 'name', 'created_by', 'status', 'actions', 'delete']);
    });

    it('should have currentYear set to current year', () => {
      fixture.detectChanges();
      expect(component.currentYear).toBe(new Date().getFullYear());
    });

    it('should embed a paginator with a default page size of 25 in the list table footer', () => {
      fixture.detectChanges();

      const paginator = fixture.nativeElement.querySelector(
        '.projects__table-container > .projects__table-footer mat-paginator',
      );

      expect(paginator).not.toBeNull();
      expect(component['_pageSize']()).toBe(25);
    });

    it('should activate action tooltips', () => {
      fixture.detectChanges();

      const startAction = fixture.debugElement.query(By.css('.projects__action-button--start'));
      const tooltip = startAction.injector.get(MatTooltip);

      expect(tooltip.message).toBe('Start project');
    });
  });

  describe('ngOnInit', () => {
    it('should call recentlyOpenedProjectService with controller id', () => {
      fixture.detectChanges();
      expect(mockRecentlyOpenedProjectService.setcontrollerIdProjectList).toHaveBeenCalledWith(
        mockController.id.toString(),
      );
    });

    it('should load projects from projectService', () => {
      fixture.detectChanges();
      expect(mockProjectService.list).toHaveBeenCalledWith(mockController);
    });

    it('should set settings from settingsService', () => {
      fixture.detectChanges();
      expect(component.settings).toEqual(mockSettings);
    });
  });

  describe('isLightThemeEnabled', () => {
    it('should return true for light theme', () => {
      fixture.detectChanges();
      mockThemeService.getActualTheme.mockReturnValue('light');

      const result = component.isLightThemeEnabled();

      expect(result).toBe(true);
    });

    it('should return false for dark theme', () => {
      fixture.detectChanges();
      mockThemeService.getActualTheme.mockReturnValue('dark');

      const result = component.isLightThemeEnabled();

      expect(result).toBe(false);
    });
  });

  describe('Selection', () => {
    it('should clear selection on unChecked', () => {
      fixture.detectChanges();
      component.selection.select(mockProjects[0]);

      component.unChecked();

      expect(component.selection.selected.length).toBe(0);
    });

    it('should select all projects on allChecked', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      component.allChecked();

      expect(component.selection.selected.length).toBe(2);
    });

    it('should return true from isAllSelected when all selected', () => {
      fixture.detectChanges();
      component['_projects'].set([mockProjects[0]]);
      component.selection.select(mockProjects[0]);

      const result = component.isAllSelected();

      expect(result).toBe(true);
    });

    it('should return false from isAllSelected when not all selected', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);
      component.selection.select(mockProjects[0]);

      const result = component.isAllSelected();

      expect(result).toBe(false);
    });

    it('should select only projects matching the active filters', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);
      component.searchText.set('Project A');

      component.allChecked();

      expect(component.selection.selected).toEqual([mockProjects[0]]);
      expect(component.isAllSelected()).toBe(true);
    });

    it('should clear selected projects when a filter changes', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);
      component.selection.select(mockProjects[1]);

      component.searchText.set('Project A');
      fixture.detectChanges();

      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('Project details', () => {
    it('should load and display a README description after selecting a project', () => {
      fixture.detectChanges();

      component.selectProject(mockProjects[0]);
      fixture.detectChanges();

      const description = fixture.nativeElement.querySelector('.projects__detail-description');
      expect(mockProjectService.getReadmeFile).toHaveBeenCalledWith(mockController, 'proj1');
      expect(component.projectDescription()).toBe('A useful project description.');
      expect(description.textContent.trim()).toBe('A useful project description.');
    });

    it('should clear the README description when details are closed', () => {
      fixture.detectChanges();
      component.selectProject(mockProjects[0]);

      component.closeDetails();

      expect(component.projectDescription()).toBe('');
    });

    it('should render grid status immediately after the project name', () => {
      fixture.detectChanges();
      component.toggleView('grid');
      fixture.detectChanges();

      const projectName = fixture.nativeElement.querySelector('.projects__card-name');
      expect(projectName.nextElementSibling.classList.contains('projects__card-status')).toBe(true);
    });
  });

  describe('searchText and filtering', () => {
    it('should filter projects by name when searchText changes', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      component.searchText.set('Project A');

      const displayed = component.displayProjects();
      expect(displayed.length).toBe(1);
      expect(displayed[0].project_id).toBe('proj1');
    });

    it('should filter projects by created_by when searchText changes', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      component.searchText.set('Bob');

      const displayed = component.displayProjects();
      expect(displayed.length).toBe(1);
      expect(displayed[0].project_id).toBe('proj2');
    });

    it('should return all projects when searchText is empty', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      const displayed = component.displayProjects();
      expect(displayed.length).toBe(2);
    });
  });

  describe('sorting', () => {
    it('should sort projects by name in ascending order by default', () => {
      fixture.detectChanges();
      const projects = [
        { project_id: 'z', name: 'Z Project', status: 'closed', created_by: '' } as Project,
        { project_id: 'a', name: 'A Project', status: 'closed', created_by: '' } as Project,
      ];
      component['_projects'].set(projects);

      const displayed = component.displayProjects();
      expect(displayed[0].project_id).toBe('a');
      expect(displayed[1].project_id).toBe('z');
    });

    it('should sort by specified column when onSortChange is called', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      component.onSortChange({ active: 'name', direction: 'desc' });

      const displayed = component.displayProjects();
      expect(displayed[0].project_id).toBe('proj2');
      expect(displayed[1].project_id).toBe('proj1');
    });
  });

  describe('project notifications', () => {
    it('should add a new project when project.created notification arrives', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      const newProject = { project_id: 'proj3', name: 'Project C', status: 'closed', created_by: '' } as Project;
      mockNotificationService.projectNotificationEmitter.next({
        action: 'project.created',
        event: newProject,
      });

      expect(component['_projects']().length).toBe(3);
      expect(component['_projects']().find(p => p.project_id === 'proj3')).toBeTruthy();
    });

    it('should update an existing project when project.updated notification arrives', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      const updated = { ...mockProjects[0], name: 'Updated A' };
      mockNotificationService.projectNotificationEmitter.next({
        action: 'project.updated',
        event: updated,
      });

      const project = component['_projects']().find(p => p.project_id === 'proj1');
      expect(project?.name).toBe('Updated A');
    });

    it('should update project status when project.opened notification arrives', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      const opened = { ...mockProjects[0], status: 'opened' };
      mockNotificationService.projectNotificationEmitter.next({
        action: 'project.opened',
        event: opened,
      });

      const project = component['_projects']().find(p => p.project_id === 'proj1');
      expect(project?.status).toBe('opened');
    });

    it('should update project status when project.closed notification arrives', () => {
      fixture.detectChanges();
      const openedProject = { ...mockProjects[0], status: 'opened' };
      component['_projects'].set([openedProject, mockProjects[1]]);

      const closed = { ...openedProject, status: 'closed' };
      mockNotificationService.projectNotificationEmitter.next({
        action: 'project.closed',
        event: closed,
      });

      const project = component['_projects']().find(p => p.project_id === 'proj1');
      expect(project?.status).toBe('closed');
    });

    it('should remove a project when project.deleted notification arrives', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      mockNotificationService.projectNotificationEmitter.next({
        action: 'project.deleted',
        event: mockProjects[0],
      });

      expect(component['_projects']().length).toBe(1);
      expect(component['_projects']().find(p => p.project_id === 'proj1')).toBeFalsy();
    });
  });

  describe('loading state', () => {
    it('should return false for a project that is not loading', () => {
      fixture.detectChanges();
      expect(component.isProjectLoading('unknown')).toBe(false);
    });

    it('should return true for a project that is loading', () => {
      fixture.detectChanges();
      component['_loadingProjects'].update(set => {
        const next = new Set(set);
        next.add('proj1');
        return next;
      });

      expect(component.isProjectLoading('proj1')).toBe(true);
    });
  });

  describe('project lifecycle notifications', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockDialog.open.mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true)),
        componentInstance: {},
      });
      component.dialog = mockDialog;
    });

    it('should notify after deleting a project', () => {
      component.delete(mockProjects[0]);

      expect(mockToasterService.success).toHaveBeenCalledWith('Project "Project A" deleted.');
    });

    it('should notify after opening a project', () => {
      component.open(mockProjects[0]);

      expect(mockToasterService.success).toHaveBeenCalledWith('Project "Project A" opened.');
    });

    it('should notify after closing a project', () => {
      component.close(mockProjects[1]);

      expect(mockToasterService.success).toHaveBeenCalledWith('Project "Project B" closed.');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when refresh list fails', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));
      fixture.detectChanges();

      component.refresh();

      expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
      expect(mockProgressService.setError).toHaveBeenCalled();
    });

    it('should use fallback message when list error has no message', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();

      component.refresh();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to list projects');
    });
  });
});
