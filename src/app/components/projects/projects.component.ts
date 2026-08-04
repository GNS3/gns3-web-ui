import { SelectionModel } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  model,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExportPortableProjectComponent } from '@components/export-portable-project/export-portable-project.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProgressService } from '../../common/progress/progress.service';
import { Project } from '@models/project';
import { ProjectStatistics } from '@models/project-statistics';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { NotificationService, ProjectNotification } from '@services/notification.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { Settings, SettingsService } from '@services/settings.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog/add-blank-project-dialog.component';
import { ChooseNameDialogComponent } from './choose-name-dialog/choose-name-dialog.component';
import { ConfirmationDeleteAllProjectsComponent } from './confirmation-delete-all-projects/confirmation-delete-all-projects.component';
import { EditProjectDialogComponent } from './edit-project-dialog/edit-project-dialog.component';
import { ImportProjectDialogComponent } from './import-project-dialog/import-project-dialog.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { version } from '../../version';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatSortModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent implements OnInit {
  controller: Controller;
  settings: Settings;
  project: Project;
  displayedColumns = ['select', 'name', 'created_by', 'status', 'actions', 'delete'];
  public readonly version = version;
  public readonly currentYear = new Date().getFullYear();
  selection = new SelectionModel<Project>(true, []);

  readonly sort = viewChild<MatSort>(MatSort);
  readonly paginator = viewChild<MatPaginator>(MatPaginator);
  readonly searchText = model('');

  // ── Signal state ──────────────────────────────────────────────
  private _projects = signal<Project[]>([]);
  readonly sortActive = signal<string>('name');
  private _sortDirection = signal<'asc' | 'desc' | ''>('asc');
  private _loadingProjects = signal<Set<string>>(new Set());

  // ── View mode (list / grid) ───────────────────────────────────
  readonly viewMode = signal<'list' | 'grid'>('list');

  // ── Selected project for details panel ────────────────────────
  readonly selectedProject = signal<Project | null>(null);
  readonly projectStats = signal<ProjectStatistics | null>(null);
  readonly projectDescription = signal('');

  // ── Status filter ─────────────────────────────────────────────
  readonly filterStatus = signal<string>('all');

  // ── Pagination ───────────────────────────────────────────────
  readonly pageSizeOptions = [5, 10, 25, 50, 100];

  /**
   * Mirror of the paginator's `pageIndex`/`pageSize` as signals so the grid
   * view (which does not use MatTableDataSource) can react to page changes.
   * Updated from {@link onPageChange} whenever `mat-paginator` emits a `page`
   * event. Initial `pageSize` of 25 also restricts the default number of
   * visible projects, mirroring the Image Manager table behavior.
   */
  private _pageIndex = signal(0);
  private _pageSize = signal(25);

  onPageChange(event: PageEvent): void {
    this._pageIndex.set(event.pageIndex);
    this._pageSize.set(event.pageSize);
  }

  /** Reset paginator to first page when filters, sort, or search change */
  private _resetPageOnFilter = effect(
    () => {
      this.searchText();
      this.filterStatus();
      this.sortActive();
      this._sortDirection();
      // Keep the grid-view pagination signal in sync and reset the
      // MatTableDataSource paginator back to the first page for list view.
      this._pageIndex.set(0);
      const paginator = this.paginator();
      if (paginator) {
        paginator.firstPage();
      }
    },
    { allowSignalWrites: true },
  );

  /** Avoid destructive bulk actions retaining projects hidden by a filter. */
  private _clearSelectionOnFilter = effect(() => {
    this.searchText();
    this.filterStatus();
    this.selection.clear();
  });

  // ── Derived: sorted + filtered display data ───────────────────
  readonly displayProjects = computed(() => {
    const search = this.searchText()?.toLowerCase() || '';
    const statusFilter = this.filterStatus();
    let projects = this._projects();

    // Filter by name or created_by
    if (search) {
      projects = projects.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          (p.created_by && p.created_by.toLowerCase().includes(search)),
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      projects = projects.filter(p => p.status === statusFilter);
    }

    // Sort
    const active = this.sortActive();
    const direction = this._sortDirection();
    if (active && direction) {
      projects = [...projects].sort((a, b) => {
        const valueA = (a as any)[active];
        const valueB = (b as any)[active];
        const valA = isNaN(+valueA) ? valueA : +valueA;
        const valB = isNaN(+valueB) ? valueB : +valueB;
        const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
        return comparison * (direction === 'asc' ? 1 : -1);
      });
    }

    return projects;
  });

  /** Paginated slice for grid view — reads paginator-synced signals */
  readonly paginatedProjects = computed(() => {
    const all = this.displayProjects();
    const pageIndex = this._pageIndex();
    const pageSize = this._pageSize();
    const start = pageIndex * pageSize;
    return all.slice(start, start + pageSize);
  });

  // MatTableDataSource for the list-view table (handles pagination automatically)
  readonly tableDataSource = new MatTableDataSource<Project>([]);

  /** Keep tableDataSource.data in sync with the filtered/sorted list */
  private _syncTableData = effect(() => {
    this.tableDataSource.data = this.displayProjects();
  });

  /** Connect paginator once it becomes available */
  private _connectPaginator = effect(() => {
    const paginator = this.paginator();
    if (paginator) {
      this.tableDataSource.paginator = paginator;
    }
  });

  // ── Dependencies ──────────────────────────────────────────────
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private notificationService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private progressService = inject(ProgressService);
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private recentlyOpenedProjectService = inject(RecentlyOpenedProjectService);
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.controller = this.route.snapshot.data['controller'];
    if (!this.controller) this.router.navigate(['/controllers']);
    this.recentlyOpenedProjectService.setcontrollerIdProjectList(this.controller.id.toString());

    // Handle error queryParam from redirect after project not found (404)
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam) {
      this.toasterService.error(errorParam);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }

    this.refresh();
    this.sort()?.sort({ id: 'name', start: 'asc' } as any);
    this.settings = this.settingsService.getAll();

    // Subscribe to external refresh requests
    this.projectService.projectListSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());

    // Subscribe to global project notifications for incremental updates
    this.notificationService.projectNotificationEmitter
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification: ProjectNotification) => this.handleProjectNotification(notification));
  }

  // ── Sort handler (called from template matSortChange) ─────────
  onSortChange(sortState: Sort) {
    this.sortActive.set(sortState.active);
    this._sortDirection.set(sortState.direction);
  }

  // ── Sort by dropdown handler ──────────────────────────────────
  onSortByChange(field: string) {
    this.sortActive.set(field);
    this._sortDirection.set('asc');
  }

  // ── View mode toggle ──────────────────────────────────────────
  toggleView(mode: 'list' | 'grid') {
    this.viewMode.set(mode);
  }

  // ── Project selection for details panel ───────────────────────
  selectProject(project: Project) {
    this.selectedProject.set(project);
    this.projectStats.set(null);
    this.projectDescription.set('');
    this.loadProjectStats(project);
    this.loadProjectDescription(project);
  }

  closeDetails() {
    this.selectedProject.set(null);
    this.projectStats.set(null);
    this.projectDescription.set('');
  }

  private loadProjectStats(project: Project) {
    this.projectService.getStatistics(this.controller, project.project_id).subscribe({
      next: (stats: ProjectStatistics) => {
        if (this.selectedProject()?.project_id === project.project_id) {
          this.projectStats.set(stats);
        }
      },
      error: () => {
        // Stats are not critical, silently ignore errors
        if (this.selectedProject()?.project_id === project.project_id) {
          this.projectStats.set(null);
        }
      },
    });
  }

  private loadProjectDescription(project: Project) {
    this.projectService.getReadmeFile(this.controller, project.project_id).subscribe({
      next: (readme: string | null) => {
        if (this.selectedProject()?.project_id === project.project_id) {
          this.projectDescription.set(readme?.trim() || '');
        }
      },
      error: () => {
        // A README is optional; an absent file should not affect the panel.
        if (this.selectedProject()?.project_id === project.project_id) {
          this.projectDescription.set('');
        }
      },
    });
  }

  // ── Data fetching ─────────────────────────────────────────────
  refresh() {
    this.projectService.list(this.controller).subscribe({
      next: (projects: Project[]) => {
        this._projects.set(projects);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to list projects';
        this.toasterService.error(message);
        this.progressService.setError(err);
      },
    });
  }

  // ── WebSocket notification handler ────────────────────────────
  private handleProjectNotification(notification: ProjectNotification): void {
    this._projects.update(projects => {
      const list = [...projects];
      const index = list.findIndex(p => p.project_id === notification.event.project_id);
      switch (notification.action) {
        case 'project.created':
          if (index === -1) list.push(notification.event);
          break;
        case 'project.opened':
        case 'project.closed':
        case 'project.updated':
          if (index >= 0) list[index] = notification.event;
          break;
        case 'project.deleted':
          if (index >= 0) list.splice(index, 1);
          break;
      }
      return list;
    });
  }

  // ── Loading state ─────────────────────────────────────────────
  isProjectLoading(projectId: string): boolean {
    return this._loadingProjects().has(projectId);
  }

  private setProjectLoading(projectId: string, loading: boolean): void {
    this._loadingProjects.update(set => {
      const next = new Set(set);
      if (loading) next.add(projectId);
      else next.delete(projectId);
      return next;
    });
  }

  // ── Selection ─────────────────────────────────────────────────
  isAllSelected() {
    const displayedProjects = this.displayProjects();
    return displayedProjects.length > 0 && displayedProjects.every((project) => this.selection.isSelected(project));
  }

  unChecked() {
    this.selection.clear();
  }

  allChecked() {
    this.displayProjects().forEach(row => this.selection.select(row));
  }

  // ── CRUD operations ───────────────────────────────────────────
  delete(project: Project) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-danger-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete project?',
        message: `"${project.name}" and its project files will be permanently deleted.`,
        note: 'This action cannot be undone.',
        confirmButtonText: 'Delete project',
        tone: 'danger',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.setProjectLoading(project.project_id, true);
        this.projectService.delete(this.controller, project.project_id).subscribe({
          next: () => {
            this.toasterService.success(`Project "${project.name}" deleted.`);
            this.refresh();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to delete project';
            this.toasterService.error(message);
            this.setProjectLoading(project.project_id, false);
          },
          complete: () => {
            this.setProjectLoading(project.project_id, false);
          },
        });
      }
    });
  }

  open(project: Project) {
    this.progressService.activate();

    this.projectService.open(this.controller, project.project_id).subscribe({
      next: () => {
        this.toasterService.success(`Project "${project.name}" opened.`);
        this.refresh();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Project was deleted';
        this.refresh();
        this.progressService.deactivate();
        this.toasterService.error(message);
      },
      complete: () => {
        this.progressService.deactivate();
      },
    });
  }

  close(project: Project) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-warning-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Close project?',
        message: `Close "${project.name}"? Open consoles for this project will be disconnected.`,
        confirmButtonText: 'Close project',
        tone: 'warning',
        icon: 'folder_off',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.setProjectLoading(project.project_id, true);
        this.projectService.close(this.controller, project.project_id).subscribe({
          next: () => {
            this.toasterService.success(`Project "${project.name}" closed.`);
            this.refresh();
            this.progressService.deactivate();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to close project';
            this.toasterService.error(message);
            this.setProjectLoading(project.project_id, false);
            this.progressService.deactivate();
          },
          complete: () => {
            this.setProjectLoading(project.project_id, false);
          },
        });
      }
    });
  }

  duplicate(project: Project) {
    const dialogRef = this.dialog.open(ChooseNameDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel', 'choose-name-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = project;
    dialogRef.afterClosed().subscribe(() => {
      this.refresh();
      if (this.selectedProject()?.project_id === project.project_id) {
        this.loadProjectDescription(project);
      }
    });
  }

  editProject(project: Project) {
    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      autoFocus: false,
      disableClose: true,
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'edit-project-dialog-panel'],
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = project;
    dialogRef.afterClosed().subscribe(() => {
      this.refresh();
    });
  }

  addBlankProject() {
    const dialogRef = this.dialog.open(AddBlankProjectDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel', 'add-blank-project-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
  }

  importProject() {
    let uuid: string = '';
    const dialogRef = this.dialog.open(ImportProjectDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel', 'import-project-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    const subscription = dialogRef.componentInstance.onImportProject.subscribe((projectId: string) => {
      uuid = projectId;
    });

    dialogRef.afterClosed().subscribe(() => {
      this.refresh();
      subscription.unsubscribe();
      if (uuid) {
        const navigationDialogRef = this.dialog.open(ConfirmationDialogComponent, {
          panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel'],
          autoFocus: '.cancel-button',
          data: {
            title: 'Open imported project?',
            message: 'The project was imported successfully. Would you like to open it now?',
            confirmButtonText: 'Open project',
            tone: 'neutral',
            icon: 'folder_open',
          },
        });

        navigationDialogRef.afterClosed().subscribe((result: boolean) => {
          if (result) {
            this.projectService.open(this.controller, uuid).subscribe({
              next: () => {
                this.router.navigate(['/controller', this.controller.id, 'project', uuid]);
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to open project';
                this.toasterService.error(message);
              },
            });
          }
        });
      }
    });
  }

  deleteAllFiles() {
    const projects = this.selection.selected;
    const confirmationRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete selected projects?',
        message: `${projects.length} selected ${projects.length === 1 ? 'project' : 'projects'} will be permanently deleted.`,
        details: projects.map((project) => project.name || project.project_id),
        note: 'This action cannot be undone.',
        confirmButtonText: projects.length === 1 ? 'Delete project' : 'Delete projects',
        tone: 'danger',
      },
    });

    confirmationRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.openProjectDeletionProgress(projects);
    });
  }

  private openProjectDeletionProgress(projects: Project[]): void {
    const dialogRef = this.dialog.open(ConfirmationDeleteAllProjectsComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'delete-all-projects-dialog-panel'],
      autoFocus: false,
      disableClose: true,
      data: {
        controller: this.controller,
        deleteFilesPaths: projects,
        autoStart: true,
      },
    });

    dialogRef.afterClosed().subscribe((isAllfilesdeleted: boolean) => {
      if (isAllfilesdeleted) {
        this.unChecked();
        this.refresh();
        this.toasterService.success('All projects deleted');
      } else {
        this.unChecked();
        this.refresh();
        return false;
      }
    });
  }

  exportSelectProject(project: Project) {
    this.project = project;
    if (this.project.project_id) {
      this.exportPortableProjectDialog();
    }
  }

  exportPortableProjectDialog() {
    this.dialog.open(ExportPortableProjectComponent, {
      panelClass: ['base-dialog-panel', 'dialog-medium-panel'],
      autoFocus: false,
      disableClose: true,
      data: { controllerDetails: this.controller, projectDetails: this.project },
    });
  }

  isLightThemeEnabled() {
    return this.themeService.getActualTheme() === 'light';
  }
}
