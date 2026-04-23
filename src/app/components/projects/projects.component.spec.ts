import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, firstValueFrom, throwError } from 'rxjs';
import { ProjectsComponent, ProjectDatabase, ProjectDataSource } from './projects.component';
import { ProjectService } from '@services/project.service';
import { SettingsService, Settings } from '@services/settings.service';
import { ProgressService } from '../../common/progress/progress.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { ProjectsFilter } from '../../filters/projectsFilter.pipe';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
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
  let mockDialog: any;
  let mockBottomSheet: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockChangeDetectorRef: any;

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
    { project_id: 'proj1', name: 'Project A', status: 'closed' } as Project,
    { project_id: 'proj2', name: 'Project B', status: 'opened' } as Project,
  ];

  const mockSettings: Settings = {
    crash_reports: true,
    console_command: 'telnet',
    anonymous_statistics: false,
  };

  beforeEach(async () => {
    mockProjectService = {
      list: vi.fn().mockReturnValue(of(mockProjects)),
      projectListSubject: new BehaviorSubject<void>(undefined as any),
      delete: vi.fn().mockReturnValue(of({})),
      open: vi.fn().mockReturnValue(of({})),
      close: vi.fn().mockReturnValue(of({})),
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

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(undefined)),
        componentInstance: {},
      }),
    };

    mockBottomSheet = {
      open: vi.fn().mockReturnValue({
        afterDismissed: vi.fn().mockReturnValue(of(true)),
        instance: { projectMessage: '' },
        _openedBottomSheetRef: {
          instance: {},
        },
      }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        data: { controller: mockController },
      },
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent, ProjectsFilter],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: RecentlyOpenedProjectService, useValue: mockRecentlyOpenedProjectService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatBottomSheet, useValue: mockBottomSheet },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
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
      expect(component.displayedColumns).toEqual(['select', 'name', 'actions', 'delete']);
    });

    it('should have currentYear set to current year', () => {
      fixture.detectChanges();
      expect(component.currentYear).toBe(new Date().getFullYear());
    });
  });

  describe('ngOnInit', () => {
    it('should call recentlyOpenedProjectService with controller id', () => {
      fixture.detectChanges();
      expect(mockRecentlyOpenedProjectService.setcontrollerIdProjectList).toHaveBeenCalledWith(
        mockController.id.toString()
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
      component.isAllDelete = true;

      component.unChecked();

      expect(component.selection.selected.length).toBe(0);
      expect(component.isAllDelete).toBe(false);
    });

    it('should select all projects on allChecked', () => {
      fixture.detectChanges();
      component.projectDatabase.addProjects(mockProjects);

      component.allChecked();

      expect(component.selection.selected.length).toBe(2);
      expect(component.isAllDelete).toBe(true);
    });

    it('should return true from isAllSelected when all selected', () => {
      fixture.detectChanges();
      component.projectDatabase.addProjects([mockProjects[0]]);
      component.selection.select(mockProjects[0]);

      const result = component.isAllSelected();

      expect(result).toBe(true);
    });

    it('should return false from isAllSelected when not all selected', () => {
      fixture.detectChanges();
      component.projectDatabase.addProjects(mockProjects);
      component.selection.select(mockProjects[0]);

      const result = component.isAllSelected();

      expect(result).toBe(false);
    });
  });

  describe('selectAllImages', () => {
    it('should uncheck when all are selected', () => {
      fixture.detectChanges();
      component.projectDatabase.addProjects([mockProjects[0]]);
      component.selection.select(mockProjects[0]);

      component.selectAllImages();

      expect(component.selection.selected.length).toBe(0);
    });

    it('should select all when not all are selected', () => {
      fixture.detectChanges();
      component.projectDatabase.addProjects(mockProjects);

      component.selectAllImages();

      expect(component.selection.selected.length).toBe(2);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when refresh list fails', async () => {
      mockProjectService.list.mockReturnValue(
        throwError(() => ({ error: { message: 'List failed' } }))
      );
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

    it('should call markForCheck when list fails', async () => {
      mockProjectService.list.mockReturnValue(
        throwError(() => ({ error: { message: 'List failed' } }))
      );
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.refresh();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});

describe('ProjectDatabase', () => {
  let database: ProjectDatabase;

  beforeEach(() => {
    database = new ProjectDatabase();
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(database).toBeTruthy();
    });

    it('should initialize with empty data', () => {
      expect(database.data).toEqual([]);
    });
  });

  describe('addProjects', () => {
    it('should set data when adding projects', () => {
      const projects: Project[] = [
        { project_id: '1', name: 'Project 1' } as Project,
        { project_id: '2', name: 'Project 2' } as Project,
      ];

      database.addProjects(projects);

      expect(database.data).toHaveLength(2);
      expect(database.data[0].name).toBe('Project 1');
      expect(database.data[1].name).toBe('Project 2');
    });

    it('should replace existing data when adding new projects', () => {
      const initialProjects: Project[] = [{ project_id: '1', name: 'Initial' } as Project];
      const newProjects: Project[] = [{ project_id: '2', name: 'New' } as Project];

      database.addProjects(initialProjects);
      database.addProjects(newProjects);

      expect(database.data).toHaveLength(1);
      expect(database.data[0].name).toBe('New');
    });

    it('should update data synchronously after adding projects', () => {
      const projects: Project[] = [{ project_id: '1', name: 'Project 1' } as Project];
      database.addProjects(projects);

      expect(database.data).toHaveLength(1);
      expect(database.data[0].project_id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove project from data', () => {
      const project: Project = { project_id: '1', name: 'Project 1' } as Project;
      database.addProjects([project]);

      database.remove(project);

      expect(database.data).toHaveLength(0);
    });

    it('should not remove project that does not exist', () => {
      const project1: Project = { project_id: '1', name: 'Project 1' } as Project;
      const project2: Project = { project_id: '2', name: 'Project 2' } as Project;
      database.addProjects([project1]);

      database.remove(project2);

      expect(database.data).toHaveLength(1);
    });

    it('should not throw when removing non-existent project', () => {
      database.addProjects([]);

      expect(() => database.remove({ project_id: '999', name: 'Non' } as Project)).not.toThrow();
    });

    it('should update data synchronously after removal', () => {
      const project: Project = { project_id: '1', name: 'Project 1' } as Project;
      database.addProjects([project]);
      database.remove(project);

      expect(database.data).toHaveLength(0);
    });
  });
});

describe('ProjectDataSource', () => {
  let dataSource: ProjectDataSource;
  let database: ProjectDatabase;
  let mockSort: MatSort;

  const mockProjects: Project[] = [
    { project_id: '1', name: 'Project A' } as Project,
    { project_id: '2', name: 'Project B' } as Project,
  ];

  beforeEach(() => {
    database = new ProjectDatabase();
    database.addProjects(mockProjects);

    mockSort = {
      active: '',
      direction: '',
      sortChange: new BehaviorSubject<void>(undefined as any),
    } as any as MatSort;

    dataSource = new ProjectDataSource(database, mockSort);
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(dataSource).toBeTruthy();
    });

    it('should have projectDatabase', () => {
      expect(dataSource.projectDatabase).toBeDefined();
      expect(dataSource.projectDatabase).toBe(database);
    });
  });

  describe('connect', () => {
    it('should return an Observable', () => {
      const result = dataSource.connect();
      expect(result).toBeTruthy();
    });
  });

  describe('disconnect', () => {
    it('should not throw when called', () => {
      expect(() => dataSource.disconnect()).not.toThrow();
    });
  });

  describe('sorting behavior', () => {
    it('should have access to projectDatabase data', () => {
      expect(dataSource.projectDatabase.data).toHaveLength(2);
    });

    it('should return data with correct structure via connect', async () => {
      const data = await firstValueFrom(dataSource.connect());
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(2);
    });
  });
});
