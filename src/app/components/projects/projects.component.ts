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
import { Project, isDistributedCopy, isFrozenTemplate, isTerminalDistributionStatus } from '@models/project';
import { ProjectStatistics } from '@models/project-statistics';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { PermissionService } from '@services/permission.service';
import { NotificationService, ProjectNotification } from '@services/notification.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { Settings, SettingsService } from '@services/settings.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog/add-blank-project-dialog.component';
import { ChooseNameDialogComponent } from './choose-name-dialog/choose-name-dialog.component';
import { DistributeProjectDialogComponent } from './distribute-project-dialog/distribute-project-dialog.component';
import {
  DistributionHistoryDialogComponent,
  DistributionHistoryDialogData,
} from './distribution-history-dialog/distribution-history-dialog.component';
import { ShareProjectDialogComponent } from './share-project-dialog/share-project-dialog.component';
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
import { MarkdownViewerComponent } from '../../common/markdown-viewer/markdown-viewer.component';
import { TopologyPreviewComponent } from './topology-preview/topology-preview.component';
import {
  TopologyPreviewDialogComponent,
  TopologyPreviewDialogData,
} from './topology-preview/topology-preview-dialog.component';
import { TopologyPreviewService } from '@services/topology-preview.service';
import { ProjectDistributionService } from '@services/project-distribution.service';
import { TopologyPreviewData } from '@services/gns3-file.mapper';
import { HasPrivilegeDirective } from '@directives/has-privilege.directive';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  imports: [
    CommonModule,
    MarkdownViewerComponent,
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
    TopologyPreviewComponent,
    HasPrivilegeDirective,
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
  /**
   * Compare selections by project id, not object identity: refreshes and WS
   * notifications swap the list to new Project objects, and identity
   * comparison would leave the checkboxes out of sync with
   * `selection.selected` (stale entries invisible on screen but still fed
   * to bulk actions like delete).
   */
  selection = new SelectionModel<Project>(true, [], true, (a, b) => a.project_id === b.project_id);

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

  // ── Static topology preview (from the raw .gns3 file) ────────
  readonly previewTopology = signal<TopologyPreviewData | null>(null);
  readonly previewState = signal<'loading' | 'ready' | 'empty' | 'error'>('loading');
  // True while the enlarged dialog is open — unmounts the panel thumbnail so
  // only one <app-d3-map> exists at a time (its state managers are singletons).
  readonly previewEnlarged = signal(false);

  // ── Share badge recipients (hover tooltip) ────────────────────
  /**
   * Recipient names per project id, fetched lazily on the first share-badge
   * hover. Cleared on every list refresh: the share dialog (the only writer)
   * triggers a refresh on close, so the cache never outlives its data.
   * An empty array marks "fetch failed" — the tooltip then keeps the plain
   * count text instead of retrying on every hover.
   */
  private readonly _shareRecipients = signal<ReadonlyMap<string, readonly string[]>>(new Map());

  /** Tooltip text of a share badge: recipient names once loaded, count otherwise. */
  shareTooltip(project: Project): string {
    const names = this._shareRecipients().get(project.project_id);
    if (names && names.length > 0) {
      return `Shared with:\n${names.join('\n')}`;
    }
    const label = project.share_count === 1 ? 'user or group' : 'users or groups';
    return `Shared with ${project.share_count} ${label}`;
  }

  /** Fetch the recipient names the first time a share badge is hovered. */
  loadShareRecipients(project: Project): void {
    // The shares list is served only to Project.Share holders; for everyone
    // else the tooltip stays on the plain count.
    if (!this.canManageShares(project) || !project.share_count || this._shareRecipients().has(project.project_id)) return;
    this.projectService.listShares(this.controller, project.project_id).subscribe({
      next: (shares) => {
        const names = shares.map((share) => share.username ?? share.group_name ?? '').filter(Boolean);
        this._shareRecipients.update((map) => new Map(map).set(project.project_id, names));
      },
      error: () => {
        this._shareRecipients.update((map) => new Map(map).set(project.project_id, []));
      },
    });
  }

  // ── Per-project privileges for shared-in projects ────────────
  /**
   * Privileges evaluated on a project's resource path
   * (GET /projects/{id}/me/privileges), for the projects where the flattened
   * global list is not exact: a project shared with the caller carries a
   * project ACE (e.g. Lab member) that replaces the inherited global role,
   * and a distributed copy carries the distribution's owner role. A project
   * the caller created carries an owner ACE with the caller's own role, so
   * the global list is exact there and no request is needed.
   *
   * One request per such project, cached for the page lifetime; the actions
   * stay hidden until the answer lands, so a shared user never sees an action
   * the project ACE does not grant.
   */
  private readonly _projectPrivileges = signal<ReadonlyMap<string, ReadonlySet<string>>>(new Map());
  private readonly requestedProjectPrivileges = new Set<string>();

  /** Whether the caller may manage the shares of this project. */
  canManageShares(project: Project): boolean {
    return this.hasProjectPrivilege(project, 'Project.Share');
  }

  /** Whether the caller may distribute this project. */
  canDistribute(project: Project): boolean {
    return this.hasProjectPrivilege(project, 'Project.Distribute');
  }

  private hasProjectPrivilege(project: Project, privilege: string): boolean {
    if (this.permissionService.isSuperadmin()) {
      return true;
    }
    if (!this.needsProjectPrivileges(project)) {
      return this.permissionService.has(privilege);
    }
    return this._projectPrivileges().get(project.project_id)?.has(privilege) ?? false;
  }

  private needsProjectPrivileges(project: Project): boolean {
    return project.created_by !== this.controller?.username || isDistributedCopy(project);
  }

  private ensureProjectPrivileges(projects: Project[]): void {
    if (this.permissionService.isSuperadmin()) {
      return;
    }
    for (const project of projects) {
      if (!this.needsProjectPrivileges(project) || this.requestedProjectPrivileges.has(project.project_id)) {
        continue;
      }
      const project_id = project.project_id;
      this.requestedProjectPrivileges.add(project_id);
      this.projectService.getMyPrivileges(this.controller, project_id).subscribe({
        next: (response) => {
          this._projectPrivileges.update((map) => new Map(map).set(project_id, new Set(response.privileges ?? [])));
        },
        error: () => {
          // Unreadable privileges: keep the actions hidden (the server stays
          // the authority).
          this._projectPrivileges.update((map) => new Map(map).set(project_id, new Set<string>()));
        },
      });
    }
  }

  // ── Distribution history badge ───────────────────────────────
  /**
   * Project ids with at least one persisted distribution record, fed by the
   * cross-project `/distributions` endpoint in a single request (it returns
   * only records the caller started themselves — every record for a
   * superadmin — so no per-project filtering is needed here). Errors keep
   * the previous set until the next refresh.
   */
  private readonly _distributedProjects = signal<ReadonlySet<string>>(new Set());

  private _checkDistributedProjects = effect(() => {
    // Distributions tracked in this session (corner widget) flip the badge
    // on immediately: the global fetch below only lands on the next refresh.
    // Only non-terminal jobs force the badge: a terminal job's record is
    // already persisted (or was deleted on purpose), so from then on the
    // fetched data alone decides.
    const tracked = this.distributionService.tracked();
    if (tracked.length > 0) {
      this._distributedProjects.update((ids) => {
        let next = ids;
        for (const entry of tracked) {
          if (!isTerminalDistributionStatus(entry.job.status) && !next.has(entry.job.project_id)) {
            next = new Set(next).add(entry.job.project_id);
          }
        }
        return next;
      });
    }
  });

  /**
   * Re-fetches the distribution history across all projects in one request.
   * Called on every list refresh and whenever a distribution dialog closes:
   * deleting the last record in the dialog must drop the badge without a
   * page refresh (the dialog lives inside this page instance, so no route
   * change would re-run the fetch on its own).
   */
  private refreshDistributedProjects(): void {
    this.projectService.listAllDistributions(this.controller).subscribe({
      next: (records) => {
        const ids = new Set(records.map((record) => record.project_id));
        // Session-tracked jobs stay badged even before their record lands
        // in the fetched list — but only while they still run: once a job
        // is terminal its record is persisted, and deleting that record
        // must drop the badge without a page refresh.
        for (const entry of this.distributionService.tracked()) {
          if (!isTerminalDistributionStatus(entry.job.status)) {
            ids.add(entry.job.project_id);
          }
        }
        this._distributedProjects.set(ids);
      },
      error: () => {}, // keep the previous set until the next refresh
    });
  }

  /** Whether the project has a persisted distribution history. */
  isDistributed(project: Project): boolean {
    return this._distributedProjects().has(project.project_id);
  }

  /** Whether the project is a frozen distributed template. */
  isFrozen(project: Project): boolean {
    return isFrozenTemplate(project);
  }

  /** Whether the project is a copy provided by a distribution. */
  isProvidedByTeacher(project: Project): boolean {
    return isDistributedCopy(project);
  }

  /** Unfreezing is reserved to the template owner and superadmins. */
  canUnfreeze(project: Project): boolean {
    return this.isFrozen(project) && (this.permissionService.isSuperadmin() || project.created_by === this.controller?.username);
  }

  /**
   * Unfreeze a distributed template so it can be modified again. The server
   * only allows it once every copy made from it is gone, and answers 409 with
   * the usernames still holding one otherwise.
   */
  unfreeze(project: Project): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-warning-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Unfreeze template?',
        message: `"${project.name}" becomes editable again. New copies will match any later changes.`,
        note: 'This is only possible once every distributed copy has been deleted.',
        confirmButtonText: 'Unfreeze template',
        tone: 'warning',
        icon: 'lock_open',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;
      this.projectService.unfreeze(this.controller, project.project_id).subscribe({
        next: (updated: Project) => {
          this.toasterService.success(`Project "${project.name}" unfrozen.`);
          if (this.selectedProject()?.project_id === updated.project_id) {
            this.selectedProject.set({ ...updated, share_count: this.selectedProject()?.share_count });
          }
          this.refresh();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to unfreeze project';
          this.toasterService.error(message);
        },
      });
    });
  }

  /**
   * Open the distribution history of a project. The grid-view badge lives
   * inside the card's router-link anchor, so the default navigation has to
   * be suppressed alongside the event bubbling.
   */
  openDistributionHistory(event: Event, project: Project): void {
    event.preventDefault();
    event.stopPropagation();
    this.dialog
      .open(DistributionHistoryDialogComponent, {
        panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'distribution-history-dialog-panel'],
        data: { controller: this.controller, project } satisfies DistributionHistoryDialogData,
      })
      .afterClosed()
      .subscribe((unfroze: boolean | undefined) => {
        this.refreshDistributedProjects();
        // Unfreezing emits project.updated, but a dropped notification stream
        // must not leave the frozen badge behind.
        if (unfroze) this.refresh();
      });
  }

  /**
   * Nodes/Links/Drawings counts shown in the details panel. For closed
   * projects getStatistics reports zeros — count them from the .gns3 file
   * data instead. Snapshots are server-only and keep the stats value.
   */
  readonly displayStats = computed<ProjectStatistics | null>(() => {
    const topology = this.previewTopology();
    if (!topology) return this.projectStats();
    return {
      ...(this.projectStats() ?? ({} as ProjectStatistics)),
      nodes: topology.nodes.length,
      links: topology.links.length,
      drawings: topology.drawings.length,
    };
  });

  // ── Status filter ─────────────────────────────────────────────
  readonly filterStatus = signal<string>('all');

  // ── Created-by filter ─────────────────────────────────────────
  readonly filterCreatedBy = signal<string>('all');

  // ── Sharing filter ────────────────────────────────────────────
  /**
   * "shared" shows the projects the current user manages shares for (their
   * own, or every project for a superadmin) with at least one share.
   * "not-shared" shows the rest: projects without shares and projects whose
   * share count is unknown (the server only sends it to the owner, so
   * projects shared *with* the current user land here too).
   */
  readonly filterSharing = signal<'all' | 'shared' | 'not-shared'>('all');
  /**
   * Username this Web UI authenticates with on the active controller
   * (empty when the controller record carries no credentials — the
   * "My projects" option is simply omitted then).
   */
  readonly currentUsername = signal<string>('');
  /**
   * Distinct project creators on the active controller, sorted. The
   * current user is excluded: they are offered as "My projects" above
   * this list instead of appearing twice.
   */
  readonly creators = computed<string[]>(() => {
    const me = this.currentUsername();
    const names = new Set<string>();
    for (const project of this._projects()) {
      const creator = project.created_by?.trim();
      if (creator && creator !== me) names.add(creator);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  });

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
  private _resetPageOnFilter = effect(() => {
    this.searchText();
    this.filterStatus();
    this.filterCreatedBy();
    this.filterSharing();
    this.sortActive();
    this._sortDirection();
    // Keep the grid-view pagination signal in sync and reset the
    // MatTableDataSource paginator back to the first page for list view.
    this._pageIndex.set(0);
    const paginator = this.paginator();
    if (paginator) {
      paginator.firstPage();
    }
  });

  /** Avoid destructive bulk actions retaining projects hidden by a filter. */
  private _clearSelectionOnFilter = effect(() => {
    this.searchText();
    this.filterStatus();
    this.filterCreatedBy();
    this.filterSharing();
    this.selection.clear();
  });

  /**
   * Keep the selection anchored to live rows: projects can vanish while
   * selected (deleted elsewhere) and every list update swaps in new objects.
   * Selected entries are re-anchored to their current object and entries
   * whose project no longer exists are dropped, so bulk actions never
   * operate on stale or on-screen-invisible selections.
   */
  private _syncSelectionWithProjects = effect(() => {
    const liveById = new Map(this._projects().map((project) => [project.project_id, project]));
    for (const selected of [...this.selection.selected]) {
      const current = liveById.get(selected.project_id);
      if (!current) {
        this.selection.deselect(selected);
      } else if (current !== selected) {
        this.selection.deselect(selected);
        this.selection.select(current);
      }
    }
  });

  /**
   * Snap the creator filter back to "All" when the selected creator no
   * longer has any visible project (all deleted / notifications removed
   * them), so the dropdown never points at a vanished option.
   */
  private _resetVanishedCreator = effect(() => {
    const selected = this.filterCreatedBy();
    if (selected === 'all' || selected === this.currentUsername()) return;
    if (!this.creators().includes(selected)) this.filterCreatedBy.set('all');
  });

  // ── Derived: sorted + filtered display data ───────────────────
  readonly displayProjects = computed(() => {
    const search = this.searchText()?.toLowerCase() || '';
    const statusFilter = this.filterStatus();
    let projects = this._projects();

    // Filter by name or created_by
    if (search) {
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(search) || (p.created_by && p.created_by.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      projects = projects.filter((p) => p.status === statusFilter);
    }

    // Filter by creator ("all" or a username, "My projects" passes the
    // logged-in username here)
    const creatorFilter = this.filterCreatedBy();
    if (creatorFilter !== 'all') {
      projects = projects.filter((p) => p.created_by === creatorFilter);
    }

    // Filter by sharing (only projects with a known share count can be
    // "shared"; an absent count means the current user is not the owner)
    const sharingFilter = this.filterSharing();
    if (sharingFilter !== 'all') {
      const isShared = (p: Project) => !!p.share_count;
      projects = projects.filter(sharingFilter === 'shared' ? isShared : (p) => !isShared(p));
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
  private topologyPreviewService = inject(TopologyPreviewService);
  private permissionService = inject(PermissionService);
  private readonly distributionService = inject(ProjectDistributionService);

  ngOnInit() {
    this.controller = this.route.snapshot.data['controller'];
    if (!this.controller) this.router.navigate(['/controllers']);
    this.currentUsername.set(this.controller.username ?? '');
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
    this.projectService.projectListSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());

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
    this.loadProjectTopology(project);
  }

  closeDetails() {
    this.selectedProject.set(null);
    this.projectStats.set(null);
    this.projectDescription.set('');
    this.previewTopology.set(null);
    this.previewState.set('loading');
    this.previewEnlarged.set(false);
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

  /** Load the static topology preview from the raw .gns3 file (cached per project). */
  private loadProjectTopology(project: Project) {
    this.previewTopology.set(null);
    this.previewState.set('loading');
    this.topologyPreviewService.load(this.controller, project).subscribe({
      next: (topology: TopologyPreviewData) => {
        if (this.selectedProject()?.project_id !== project.project_id) return;
        this.previewTopology.set(topology);
        const empty = topology.nodes.length === 0 && topology.links.length === 0 && topology.drawings.length === 0;
        this.previewState.set(empty ? 'empty' : 'ready');
      },
      error: () => {
        if (this.selectedProject()?.project_id !== project.project_id) return;
        this.previewState.set('error');
      },
    });
  }

  /** Enlarge the panel thumbnail to a 70% viewport dialog. */
  openTopologyPreview(): void {
    const project = this.selectedProject();
    const topology = this.previewTopology();
    if (!project || !topology || this.previewState() !== 'ready') return;
    this.previewEnlarged.set(true);
    this.dialog
      .open(TopologyPreviewDialogComponent, {
        panelClass: ['base-dialog-panel', 'dialog-large-panel', 'topology-preview-dialog-panel'],
        data: { controller: this.controller, project, topology } satisfies TopologyPreviewDialogData,
      })
      .afterClosed()
      .subscribe(() => this.previewEnlarged.set(false));
  }

  // ── Data fetching ─────────────────────────────────────────────
  refresh() {
    this.projectService.list(this.controller).subscribe({
      next: (projects: Project[]) => {
        this._projects.set(projects);
        // Share counts came in fresh; drop the hover cache with them.
        this._shareRecipients.set(new Map());
        // Same for the distribution badges.
        this.refreshDistributedProjects();
        // Shared-in projects and copies need their own privilege list: the
        // global one is flattened across paths (see _projectPrivileges).
        this.ensureProjectPrivileges(projects);
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
    // The .gns3 file is rewritten when a project is edited or closed
    // elsewhere — reload the preview of the currently selected project so the
    // panel always reflects the file on disk.
    if (
      (notification.action === 'project.closed' || notification.action === 'project.updated') &&
      this.selectedProject()?.project_id === notification.event.project_id
    ) {
      this.loadProjectTopology(notification.event);
    }
    this._projects.update((projects) => {
      const list = [...projects];
      const index = list.findIndex((p) => p.project_id === notification.event.project_id);
      switch (notification.action) {
        case 'project.created':
          if (index === -1) list.push(notification.event);
          break;
        case 'project.opened':
        case 'project.closed':
        case 'project.updated':
          // The notification payload carries no share_count (shares are a
          // separate sub-resource and the WS event is only the project's own
          // asdict) and share endpoints emit no project notification at all —
          // keep the count from the list response instead of dropping it.
          if (index >= 0) list[index] = { ...notification.event, share_count: list[index].share_count };
          break;
        case 'project.deleted':
          if (index >= 0) list.splice(index, 1);
          break;
      }
      return list;
    });

    // The details panel holds its own reference: freeze/unfreeze (and any
    // other project update) must refresh it too, or it keeps rendering the
    // previous lifecycle state.
    const selected = this.selectedProject();
    if (selected && selected.project_id === notification.event.project_id && notification.action !== 'project.deleted') {
      this.selectedProject.set({ ...notification.event, share_count: selected.share_count });
    }
  }

  // ── Loading state ─────────────────────────────────────────────
  isProjectLoading(projectId: string): boolean {
    return this._loadingProjects().has(projectId);
  }

  private setProjectLoading(projectId: string, loading: boolean): void {
    this._loadingProjects.update((set) => {
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
    this.displayProjects().forEach((row) => this.selection.select(row));
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

  distribute(project: Project) {
    const dialogRef = this.dialog.open(DistributeProjectDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel', 'distribute-project-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = project;
    // The first distribution freezes the source project: refresh so the new
    // state lands even when the notification stream is disconnected.
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  share(project: Project) {
    const dialogRef = this.dialog.open(ShareProjectDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'share-project-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = project;
    // Share changes emit no project notification, so the list (and its share
    // badges) only learns about them through a refresh.
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  /**
   * Open the share dialog from a share badge. The grid-view badge lives
   * inside the card's router-link anchor, so the default navigation has to
   * be suppressed alongside the event bubbling.
   */
  openShares(event: Event, project: Project) {
    event.preventDefault();
    event.stopPropagation();
    this.share(project);
  }

  editProject(project: Project) {
    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      autoFocus: false,
      disableClose: true,
      panelClass: [
        'base-dialog-panel',
        'configurator-dialog-panel',
        'edit-project-dialog-panel',
        'dialog-extra-large-panel',
      ],
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
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete selected projects?',
        message: `${projects.length} selected ${
          projects.length === 1 ? 'project' : 'projects'
        } will be permanently deleted.`,
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
      panelClass: [
        'base-confirmation-dialog-panel',
        'confirmation-danger-panel',
        'delete-all-projects-dialog-panel',
        'dialog-small-panel',
      ],
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
