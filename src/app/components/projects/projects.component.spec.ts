import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError, Subject } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';
import { ProjectsComponent } from './projects.component';
import { TopologyPreviewComponent } from './topology-preview/topology-preview.component';
import { TopologyPreviewDialogComponent } from './topology-preview/topology-preview-dialog.component';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { DistributeProjectDialogComponent } from './distribute-project-dialog/distribute-project-dialog.component';
import { DistributionHistoryDialogComponent } from './distribution-history-dialog/distribution-history-dialog.component';
import { ShareProjectDialogComponent } from './share-project-dialog/share-project-dialog.component';
import { ProjectService } from '@services/project.service';
import { ProjectDistributionService, TrackedDistribution } from '@services/project-distribution.service';
import { SettingsService, Settings } from '@services/settings.service';
import { ProgressService } from '../../common/progress/progress.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { TopologyPreviewService } from '@services/topology-preview.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { PermissionService } from '@services/permission.service';
import { NotificationService, ProjectNotification } from '@services/notification.service';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Keep the map renderer separate while exercising the Projects preview UI.
@Component({
  selector: 'app-topology-preview',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['controller', 'project', 'nodes', 'links', 'drawings', 'variant'],
})
class TopologyPreviewStubComponent {
  controller: unknown;
  project: unknown;
  nodes: unknown;
  links: unknown;
  drawings: unknown;
  variant: unknown;
}

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  let mockProjectService: any;
  let mockSettingsService: any;
  let mockProgressService: any;
  let mockRecentlyOpenedProjectService: any;
  let mockTopologyPreviewService: any;
  let mockThemeService: any;
  let mockToasterService: any;
  let mockNotificationService: any;
  let mockDialog: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  /**
   * Privilege set behind the PermissionService mock, as a real signal so
   * privilege-gated rendering (directive + computed) re-evaluates when a
   * test changes it, exactly like against the real service.
   */
  let mockPrivileges: ReturnType<typeof signal<Set<string>>>;

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
      listAllDistributions: vi.fn().mockReturnValue(of([])),
      listDistributions: vi.fn(),
      unfreeze: vi.fn().mockReturnValue(of({})),
      // Projects the caller did not create carry their own path-evaluated
      // privilege list; mirror the global mock set so tests keep driving
      // visibility through mockPrivileges.
      getMyPrivileges: vi.fn(() =>
        of({ is_superadmin: false, privileges: [...mockPrivileges()] })
      ),
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

    mockTopologyPreviewService = {
      load: vi.fn().mockReturnValue(of({ nodes: [], links: [], drawings: [] })),
    };

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('dark'),
      darkMode$: of(false),
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

    mockPrivileges = signal(
      new Set<string>([
        'Project.Allocate',
        'Project.Audit',
        'Project.Modify',
        'Project.Duplicate',
        'Project.Export',
        // Sharing and distributing are dedicated privileges on the server:
        // the base set grants them, tests opt out via mockPrivileges.set().
        'Project.Share',
        'Project.Distribute',
      ])
    );

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent, MarkdownModule.forRoot()],
      providers: [
        {
          provide: PermissionService,
          useValue: {
            has: (privilege: string) => mockPrivileges().has(privilege),
            hasAny: (privileges: string[]) => privileges.some((privilege) => mockPrivileges().has(privilege)),
            privileges: () => mockPrivileges(),
            isSuperadmin: () => false,
            loaded: () => true,
          },
        },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: RecentlyOpenedProjectService, useValue: mockRecentlyOpenedProjectService },
        { provide: TopologyPreviewService, useValue: mockTopologyPreviewService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .overrideComponent(ProjectsComponent, {
        remove: { imports: [TopologyPreviewComponent] },
        add: { imports: [TopologyPreviewStubComponent] },
      })
      .compileComponents();

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
        '.projects__table-container > .projects__table-footer mat-paginator'
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

    it('should re-anchor selections to the refreshed row objects of the same project', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);
      component.selection.select(mockProjects[0]);
      fixture.detectChanges();

      // Refreshes and WS notifications swap every row to a new object; the
      // selection must follow the project id, not the stale object identity.
      const refreshed = mockProjects.map((project) => ({ ...project }));
      component['_projects'].set(refreshed);
      fixture.detectChanges();

      expect(component.selection.isSelected(refreshed[0])).toBe(true);
      expect(component.selection.selected.length).toBe(1);
      expect(component.selection.selected[0]).toBe(refreshed[0]);
    });

    it('should drop selections whose project disappeared from the list', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);
      component.selection.select(mockProjects[0]);
      fixture.detectChanges();

      // proj1 was deleted elsewhere before the list updated.
      component['_projects'].set([mockProjects[1]]);
      fixture.detectChanges();

      expect(component.selection.isEmpty()).toBe(true);
    });

    it('should list only live selections in the bulk-delete confirmation', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);
      component.selection.select(mockProjects[0]);
      fixture.detectChanges();

      // Every row is a new object and proj1 is gone by the time the user
      // picks another project and hits delete.
      const distributed = { project_id: 'proj3', name: 'Project C', status: 'closed', created_by: 'Bob' } as Project;
      component['_projects'].set([{ ...mockProjects[1] }, distributed]);
      component.selection.select(distributed);
      fixture.detectChanges();

      component.deleteAllFiles();

      const confirmation = mockDialog.open.mock.calls[0][1].data;
      expect(confirmation.details).toEqual(['Project C']);
    });
  });

  describe('Topology preview', () => {
    it('renders loading, empty and error states without dropping project details', () => {
      fixture.detectChanges();
      const response = new Subject<any>();
      mockTopologyPreviewService.load.mockReturnValue(response);
      component.selectProject(mockProjects[0]);
      fixture.detectChanges();
      expect(component.previewState()).toBe('loading');
      expect(fixture.nativeElement.querySelector('.projects__preview-spinner')).not.toBeNull();
      response.next({ nodes: [], links: [], drawings: [] });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.projects__preview-note').textContent).toContain('Empty topology');
      mockTopologyPreviewService.load.mockReturnValue(throwError(() => new Error('Unavailable')));
      component.selectProject(mockProjects[1]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.projects__preview-note').textContent).toContain(
        'Topology preview unavailable'
      );
      expect(component.displayStats().nodes).toBe(2);
    });

    it('enlarges the preview and restores the thumbnail after the dialog closes', () => {
      fixture.detectChanges();
      const topology = { nodes: [{ node_id: 'node1' }], links: [], drawings: [] };
      const closed = new Subject<void>();
      mockTopologyPreviewService.load.mockReturnValue(of(topology));
      mockDialog.open.mockReturnValue({ afterClosed: () => closed });
      component.selectProject(mockProjects[0]);
      fixture.detectChanges();
      expect(component.displayStats().nodes).toBe(1);
      fixture.nativeElement.querySelector('.projects__preview-thumb').click();
      fixture.detectChanges();
      expect(mockDialog.open).toHaveBeenCalledWith(
        TopologyPreviewDialogComponent,
        expect.objectContaining({
          data: { controller: mockController, project: mockProjects[0], topology },
        })
      );
      expect(fixture.nativeElement.querySelector('app-topology-preview')).toBeNull();
      closed.next();
      closed.complete();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.projects__preview-thumb')).not.toBeNull();
    });

    it('ignores late preview responses for a previously selected project', () => {
      fixture.detectChanges();
      const first = new Subject<any>();
      const second = new Subject<any>();
      mockTopologyPreviewService.load.mockReturnValueOnce(first).mockReturnValueOnce(second);
      component.selectProject(mockProjects[0]);
      component.selectProject(mockProjects[1]);
      first.next({ nodes: [{ node_id: 'old-node' }], links: [], drawings: [] });
      expect(component.previewState()).toBe('loading');
      expect(component.previewTopology()).toBeNull();
      second.next({ nodes: [], links: [], drawings: [] });
      expect(component.previewState()).toBe('empty');
      expect(component.selectedProject()).toBe(mockProjects[1]);
    });
  });

  describe('Project details', () => {
    it('should load and display a README description after selecting a project', async () => {
      fixture.detectChanges();

      component.selectProject(mockProjects[0]);
      fixture.detectChanges();

      // ngx-markdown's render() awaits parse() before inserting the compiled HTML.
      // The global setup installs fake timers, so flush them explicitly.
      await vi.runAllTimersAsync();
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
      // The status chip sits right after the name, inside the meta row that
      // also holds the share badge.
      const status = projectName.nextElementSibling.querySelector('.projects__card-status');
      expect(status).not.toBeNull();
    });
  });

  describe('Grid view card actions', () => {
    const cardActionButton = (card: Element, label: string): HTMLButtonElement | null =>
      card.querySelector(`button[aria-label="${label}"]`);

    it('shows distribute, share and delete on a closed project card and opens their dialogs', () => {
      fixture.detectChanges();
      // The base mock privilege set carries Project.Share and
      // Project.Distribute, so all three actions render.
      component.toggleView('grid');
      fixture.detectChanges();

      // First card is the closed project (proj1).
      const card = fixture.nativeElement.querySelector('.projects__card');
      const distributeBtn = cardActionButton(card, 'Distribute project');
      const shareBtn = cardActionButton(card, 'Share project');
      const deleteBtn = cardActionButton(card, 'Delete project');
      expect(distributeBtn).not.toBeNull();
      expect(shareBtn).not.toBeNull();
      expect(deleteBtn).not.toBeNull();

      distributeBtn!.click();
      expect(mockDialog.open).toHaveBeenCalledWith(DistributeProjectDialogComponent, expect.anything());

      shareBtn!.click();
      expect(mockDialog.open).toHaveBeenCalledWith(ShareProjectDialogComponent, expect.anything());

      deleteBtn!.click();
      expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, expect.anything());
    });

    it('hides distribute and delete on an opened project card', () => {
      fixture.detectChanges();
      component.toggleView('grid');
      fixture.detectChanges();

      // Second card is the opened project (proj2).
      const cards = fixture.nativeElement.querySelectorAll('.projects__card');
      expect(cards.length).toBe(2);
      expect(cardActionButton(cards[1], 'Distribute project')).toBeNull();
      expect(cardActionButton(cards[1], 'Delete project')).toBeNull();
    });

    it('hides the share action when the user lacks Project.Share', () => {
      mockPrivileges.update((privileges) => {
        const without = new Set(privileges);
        without.delete('Project.Share');
        return without;
      });
      fixture.detectChanges();
      component.toggleView('grid');
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.projects__card');
      expect(cardActionButton(card, 'Share project')).toBeNull();
    });
  });

  describe('Distribution history badge', () => {
    /**
     * Seeds the ProjectDistributionService's tracking state directly: the
     * corner widget keeps terminal entries around until dismissed, and
     * that is exactly the state the badge logic must cope with.
     */
    const setTrackedJobs = (entries: TrackedDistribution[]): void => {
      (TestBed.inject(ProjectDistributionService) as any).trackedState.set(entries);
    };

    const trackedEntry = (project_id: string, distribution_id: string, status: string): TrackedDistribution =>
      ({
        controller: mockController,
        job: { distribution_id, project_id, status, name: 'Project A', total: 1, results: [] },
        expired: false,
        cancelPending: false,
      } as unknown as TrackedDistribution);

    it('should badge projects from one cross-project fetch instead of per-project checks', () => {
      mockProjectService.listAllDistributions.mockReturnValue(
        of([{ distribution_id: 'dist-1', project_id: 'proj1' } as any])
      );

      fixture.detectChanges();

      expect(mockProjectService.listAllDistributions).toHaveBeenCalledWith(mockController);
      expect(mockProjectService.listDistributions).not.toHaveBeenCalled();
      expect(component.isDistributed(mockProjects[0])).toBe(true);
      expect(component.isDistributed(mockProjects[1])).toBe(false);
    });

    it('should keep the previous badges when the distributions endpoint fails', () => {
      mockProjectService.listAllDistributions.mockReturnValueOnce(
        of([{ distribution_id: 'dist-1', project_id: 'proj1' } as any])
      );
      fixture.detectChanges();

      mockProjectService.listAllDistributions.mockReturnValueOnce(throwError(() => new Error('Server error')));
      component['refresh']();
      fixture.detectChanges();

      expect(component.isDistributed(mockProjects[0])).toBe(true);
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should re-fetch the distribution history after the history dialog closes', () => {
      fixture.detectChanges();
      mockProjectService.listAllDistributions.mockClear();

      component.openDistributionHistory(new Event('click'), mockProjects[0]);

      expect(mockProjectService.listAllDistributions).toHaveBeenCalledTimes(1);
    });

    it('should drop the badge when the last record is deleted while a terminal job is still tracked', () => {
      mockProjectService.listAllDistributions.mockReturnValue(
        of([{ distribution_id: 'dist-1', project_id: 'proj1' } as any])
      );
      fixture.detectChanges();
      expect(component.isDistributed(mockProjects[0])).toBe(true);

      // The job finished, but its corner-widget card was never dismissed.
      setTrackedJobs([trackedEntry('proj1', 'dist-1', 'completed')]);

      // Deleting the last record re-fetches; the server now returns nothing.
      mockProjectService.listAllDistributions.mockReturnValue(of([]));
      component['refresh']();
      fixture.detectChanges();

      expect(component.isDistributed(mockProjects[0])).toBe(false);
    });

    it('should not re-light a badge from a terminal job when the tracking state changes', () => {
      fixture.detectChanges();
      expect(component.isDistributed(mockProjects[0])).toBe(false);

      setTrackedJobs([trackedEntry('proj1', 'dist-1', 'cancelled')]);
      fixture.detectChanges();

      expect(component.isDistributed(mockProjects[0])).toBe(false);
    });

    it('should keep the badge lit for a running job whose record has not landed yet', () => {
      fixture.detectChanges();
      expect(component.isDistributed(mockProjects[0])).toBe(false);

      setTrackedJobs([trackedEntry('proj1', 'dist-1', 'running')]);
      fixture.detectChanges();
      expect(component.isDistributed(mockProjects[0])).toBe(true);

      // A refresh with no persisted records yet keeps it lit.
      component['refresh']();
      fixture.detectChanges();
      expect(component.isDistributed(mockProjects[0])).toBe(true);
    });
  });

  describe('Distribution lifecycle (frozen template / distributed copy)', () => {
    const cardActionButton = (card: Element, label: string): HTMLButtonElement | null =>
      card.querySelector(`button[aria-label="${label}"]`);

    const frozenTemplate = {
      project_id: 'frozen-1',
      name: 'Lab',
      status: 'closed',
      created_by: 'Alice',
      frozen: true,
    } as Project;

    const distributedCopy = {
      project_id: 'copy-1',
      name: 'Lab-alice',
      status: 'closed',
      created_by: 'alice',
      distribution_master_id: 'frozen-1',
    } as Project;

    beforeEach(() => {
      // Runs ngOnInit (controller from the route, initial project list) so
      // the per-test seeds below are not overwritten by the first refresh.
      fixture.detectChanges();
      component.toggleView('grid');
    });

    it('shows the frozen badge on a frozen template and opens the distribution history', () => {
      component['_projects'].set([frozenTemplate]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.projects__card');
      expect(card.querySelector('.projects__frozen-badge')).not.toBeNull();

      (card.querySelector('.projects__frozen-badge') as HTMLElement).click();
      expect(mockDialog.open).toHaveBeenCalledWith(DistributionHistoryDialogComponent, expect.anything());
    });

    it('shows the provided-by-teacher badge on a distributed copy', () => {
      component['_projects'].set([distributedCopy]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.projects__card');
      expect(card.querySelector('.projects__provided-badge')).not.toBeNull();
      expect(card.querySelector('.projects__frozen-badge')).toBeNull();
    });

    it('hides duplicate and export on a distributed copy but keeps them on a regular project', () => {
      component['_projects'].set([frozenTemplate, distributedCopy]);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.projects__card');
      expect(cards.length).toBe(2);

      // A frozen template can still be duplicated and exported.
      expect(cardActionButton(cards[0], 'Duplicate project')).not.toBeNull();
      expect(cardActionButton(cards[0], 'Export project')).not.toBeNull();

      // A distributed copy cannot.
      expect(cardActionButton(cards[1], 'Duplicate project')).toBeNull();
      expect(cardActionButton(cards[1], 'Export project')).toBeNull();
    });

    it('hides the edit action on a frozen template', () => {
      component['_projects'].set([frozenTemplate]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.projects__card');
      expect(cardActionButton(card, 'Edit project')).toBeNull();
    });

    it('unfreezes a template from the details panel', () => {
      vi.spyOn(TestBed.inject(PermissionService), 'isSuperadmin').mockReturnValue(true);
      mockDialog.open.mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true)),
        componentInstance: {},
      });
      mockProjectService.unfreeze.mockReturnValue(of({ ...frozenTemplate, frozen: false }));

      component.unfreeze(frozenTemplate);

      expect(mockProjectService.unfreeze).toHaveBeenCalledWith(mockController, 'frozen-1');
      expect(mockToasterService.success).toHaveBeenCalledWith('Project "Lab" unfrozen.');
    });

    it('restricts unfreezing to the owner and superadmins', () => {
      // The mock controller carries no username, so the user is neither the
      // owner ('Alice') nor a superadmin.
      expect(component.canUnfreeze(frozenTemplate)).toBe(false);

      vi.spyOn(TestBed.inject(PermissionService), 'isSuperadmin').mockReturnValue(true);
      expect(component.canUnfreeze(frozenTemplate)).toBe(true);
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
      expect(component['_projects']().find((p) => p.project_id === 'proj3')).toBeTruthy();
    });

    it('should update an existing project when project.updated notification arrives', () => {
      fixture.detectChanges();
      component['_projects'].set(mockProjects);

      const updated = { ...mockProjects[0], name: 'Updated A' };
      mockNotificationService.projectNotificationEmitter.next({
        action: 'project.updated',
        event: updated,
      });

      const project = component['_projects']().find((p) => p.project_id === 'proj1');
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

      const project = component['_projects']().find((p) => p.project_id === 'proj1');
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

      const project = component['_projects']().find((p) => p.project_id === 'proj1');
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
      expect(component['_projects']().find((p) => p.project_id === 'proj1')).toBeFalsy();
    });
  });

  describe('loading state', () => {
    it('should return false for a project that is not loading', () => {
      fixture.detectChanges();
      expect(component.isProjectLoading('unknown')).toBe(false);
    });

    it('should return true for a project that is loading', () => {
      fixture.detectChanges();
      component['_loadingProjects'].update((set) => {
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
