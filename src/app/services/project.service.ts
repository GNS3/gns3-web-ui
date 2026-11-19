import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';
import { Drawing } from '../cartography/models/drawing';
import { Node } from '../cartography/models/node';
import { Link } from '@models/link';
import { Project, ProjectDistribution, ProjectShare } from '@models/project';
import { Gns3ProjectFile } from '@models/gns3-file';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';
import { SettingsService } from './settings.service';
import { UserPrivilegesResponse } from './permission.service';

@Injectable()
export class ProjectService {
  compression_methods: any = [
    { id: 1, value: 'none', name: 'None' },
    { id: 2, value: 'zip', name: 'Zip compression (deflate)' },
    { id: 3, value: 'bzip2', name: 'Bzip2 compression' },
    { id: 4, value: 'lzma', name: 'Lzma compression' },
    { id: 5, value: 'zstd', name: 'Zstandard compression' },
  ];
  compression_level_default_value: any = [
    { id: 1, name: 'none', value: '', selectionValues: [] },
    { id: 2, name: 'zip', value: 6, selectionValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 3, name: 'bzip2', value: 9, selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 4, name: 'lzma', value: ' ', selectionValues: [] },
    {
      id: 5,
      name: 'zstd',
      value: 3,
      selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9.1, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    },
  ];

  public projectListSubject = new Subject<boolean>();
  public projectLockIconSubject = new Subject<boolean>();
  constructor(
    private httpController: HttpController,
    private settingsService: SettingsService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService
  ) {}

  projectListUpdated() {
    this.projectListSubject.next(true);
  }

  getReadmeFile(controller: Controller, project_id: string) {
    return this.httpController.getText(controller, `/projects/${project_id}/files/README.txt`);
  }

  postReadmeFile(controller: Controller, project_id: string, readme: string) {
    return this.httpController.post<any>(controller, `/projects/${project_id}/files/README.txt`, readme);
  }

  get(controller: Controller, project_id: string) {
    return this.httpController.get<Project>(controller, `/projects/${project_id}`);
  }

  open(controller: Controller, project_id: string) {
    return this.httpController.post<Project>(controller, `/projects/${project_id}/open`, {});
  }

  close(controller: Controller, project_id: string) {
    this.recentlyOpenedProjectService.removeData();
    return this.httpController.post<Project>(controller, `/projects/${project_id}/close`, {});
  }

  list(controller: Controller) {
    return this.httpController.get<Project[]>(controller, '/projects');
  }

  nodes(controller: Controller, project_id: string) {
    return this.httpController.get<Node[]>(controller, `/projects/${project_id}/nodes`);
  }

  links(controller: Controller, project_id: string) {
    return this.httpController.get<Link[]>(controller, `/projects/${project_id}/links`);
  }

  drawings(controller: Controller, project_id: string) {
    return this.httpController.get<Drawing[]>(controller, `/projects/${project_id}/drawings`);
  }

  // Raw .gns3 topology file from disk — works for closed projects too.
  gns3file(controller: Controller, project_id: string) {
    // The FileResponse carries ETag/Last-Modified but no Cache-Control, so
    // browsers heuristically cache it for hours and a normal reload (F5) never
    // revalidates — the topology preview would keep rendering a stale file
    // after the project is edited elsewhere. `no-cache` forces revalidation:
    // an unchanged file answers 304 via the ETag, a changed one comes fresh.
    return this.httpController.get<Gns3ProjectFile>(controller, `/projects/${project_id}/gns3file`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  }

  add(controller: Controller, project_name: string, project_id: string): Observable<any> {
    return this.httpController.post<Project>(controller, `/projects`, { name: project_name, project_id: project_id });
  }

  update(controller: Controller, project: Project): Observable<Project> {
    return this.httpController.put<Project>(controller, `/projects/${project.project_id}`, {
      auto_close: project.auto_close,
      auto_open: project.auto_open,
      auto_start: project.auto_start,
      drawing_grid_size: project.drawing_grid_size,
      grid_size: project.grid_size,
      name: project.name,
      scene_width: project.scene_width,
      scene_height: project.scene_height,
      snap_to_grid: project.snap_to_grid,
      show_grid: project.show_grid,
      show_interface_labels: project.show_interface_labels,
      show_layers: project.show_layers,
      variables: project.variables,
      zoom: project.zoom,
    });
  }

  delete(controller: Controller, project_id: string): Observable<any> {
    return this.httpController.delete(controller, `/projects/${project_id}`);
  }

  getUploadPath(controller: Controller, uuid: string, project_name: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${uuid}/import?name=${project_name}`;
  }

  getExportPath(controller: Controller, project: Project) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${project.project_id}/export`;
  }

  export(controller: Controller, project_id: string): Observable<any> {
    return this.httpController.get(controller, `/projects/${project_id}/export`);
  }

  getStatistics(controller: Controller, project_id: string): Observable<any> {
    return this.httpController.get(controller, `/projects/${project_id}/stats`);
  }

  /**
   * Effective privileges of the caller on one project, each evaluated on the
   * project's resource path (unlike the flattened global list, a project ACE
   * such as Lab member replaces the inherited global role). Rendering hint:
   * the server remains the authority for permission checks.
   */
  getMyPrivileges(controller: Controller, project_id: string): Observable<UserPrivilegesResponse> {
    return this.httpController.get<UserPrivilegesResponse>(controller, `/projects/${project_id}/me/privileges`);
  }

  duplicate(controller: Controller, project_id: string, project_name: string): Observable<Project> {
    return this.httpController.post(controller, `/projects/${project_id}/duplicate`, { name: project_name });
  }

  /**
   * Distributes a project as a per-recipient copy (classroom use case).
   *
   * Exactly one of `target_user`, `target_users` and `target_group` must be
   * given (combined or missing targets are rejected with 422):
   * - `target_user`: one recipient, the copy is named `name`.
   * - `target_users`: several recipients, each copy is automatically named
   *   `{name}-{username}`; any unknown username fails the whole request
   *   (404) and an empty list is rejected (422).
   * - `target_group`: fan-out to the group members at call time (same naming
   *   as `target_users`); unknown group 404, empty group 409.
   * The caller cannot be a user target (409 — duplicating the project is
   * the supported way to get a copy for yourself).
   * `owner_role` assigns the role of the copy owners (defaults to the
   * built-in "Lab member" role on the server) and may not grant privileges
   * wider than what the caller holds on the project (403; superadmins are
   * exempt).
   * `lock_topology` locks every node and drawing in each copy so
   * recipients cannot move or delete them (advisory hint: the client hides
   * the actions, the owner role stays the enforcement; defaults to true
   * on the server).
   *
   * Returns 202 with the distribution job: copies are created in the
   * background. Follow the progress with `getDistribution` until the job
   * status leaves "running".
   */
  distribute(
    controller: Controller,
    project_id: string,
    project_name: string,
    targets: {
      target_user?: string;
      target_users?: string[];
      target_group?: string;
      owner_role?: string;
      reset_mac_addresses?: boolean;
      lock_topology?: boolean;
    }
  ): Observable<ProjectDistribution> {
    return this.httpController.post(controller, `/projects/${project_id}/distribute`, {
      name: project_name,
      ...targets,
    });
  }

  /** Returns the current state of one distribution job (404 once the server forgets it). */
  getDistribution(controller: Controller, project_id: string, distribution_id: string): Observable<ProjectDistribution> {
    return this.httpController.get(controller, `/projects/${project_id}/distributions/${distribution_id}`);
  }

  /**
   * Cancels a running distribution job. Cancellation is cooperative: the
   * copy in flight completes, the job stops before the next recipient
   * starts, and copies already made are kept.
   *
   * Returns 200 with the job (status "cancelling"; idempotent when already
   * cancelling). 409 once the job reached a terminal state, 403 when the
   * caller is neither the distributing user nor the project owner.
   */
  cancelDistribution(controller: Controller, project_id: string, distribution_id: string): Observable<ProjectDistribution> {
    return this.httpController.delete(controller, `/projects/${project_id}/distributions/${distribution_id}`);
  }

  /** Returns a project's distribution jobs, newest first (the distributing user or the project owner). */
  listDistributions(controller: Controller, project_id: string): Observable<ProjectDistribution[]> {
    return this.httpController.get(controller, `/projects/${project_id}/distributions`);
  }

  /**
   * Returns the caller's distribution records across every project in one
   * request (every record for a superadmin). Absent on older servers (404):
   * treat that as "no history" rather than falling back to per-project
   * checks.
   */
  listAllDistributions(controller: Controller): Observable<ProjectDistribution[]> {
    return this.httpController.get(controller, `/distributions`);
  }

  /**
   * Deletes a terminal distribution record (204 → null). A still-running job
   * is cancelled instead and its updated state is returned (200 → job), so
   * branch on the emitted value.
   */
  deleteDistribution(
    controller: Controller,
    project_id: string,
    distribution_id: string
  ): Observable<ProjectDistribution | null> {
    return this.httpController.delete(controller, `/projects/${project_id}/distributions/${distribution_id}`);
  }

  /**
   * Deletes every copy of a finished distribution that still exists on the
   * server (copies already deleted are skipped). The distribution record is
   * kept: it still tells who received a copy and when. A running distribution
   * answers 409 — cancel it first.
   *
   * Returns the distribution with its per-recipient `project_exists` flags
   * refreshed.
   */
  deleteDistributionCopies(
    controller: Controller,
    project_id: string,
    distribution_id: string
  ): Observable<ProjectDistribution> {
    return this.httpController.delete(
      controller,
      `/projects/${project_id}/distributions/${distribution_id}/copies`
    );
  }

  /**
   * Unfreezes a distributed template so it can be modified again. Only
   * allowed once every copy made from it is gone, and only to the project
   * owner or a superadmin (409 or 403 otherwise).
   */
  unfreeze(controller: Controller, project_id: string): Observable<Project> {
    return this.httpController.post(controller, `/projects/${project_id}/unfreeze`, {});
  }

  /**
   * Shares a project: the recipients gain access to the same project (no
   * copies, instant).
   *
   * Exactly one of `target_user`, `target_users` and `target_group` must be
   * given (422 otherwise; same target grammar as `distribute`, but a group
   * share is one live ACE — members joining the group later gain access
   * immediately). `role` defaults server-side to the built-in "Lab member"
   * role; sharing again with the same target updates its role. The project
   * owner cannot be a target (409: the share would replace the owner ACE).
   * Returns 201 with the created/updated shares.
   */
  share(
    controller: Controller,
    project_id: string,
    targets: {
      target_user?: string;
      target_users?: string[];
      target_group?: string;
      role?: string;
    }
  ): Observable<ProjectShare[]> {
    return this.httpController.post(controller, `/projects/${project_id}/share`, targets);
  }

  /** Returns the shares of a project (its owner's own ACE is not included). */
  listShares(controller: Controller, project_id: string): Observable<ProjectShare[]> {
    return this.httpController.get(controller, `/projects/${project_id}/shares`);
  }

  /** Removes one share (204). */
  removeShare(controller: Controller, project_id: string, ace_id: string): Observable<void> {
    return this.httpController.delete(controller, `/projects/${project_id}/shares/${ace_id}`);
  }

  isReadOnly(project: Project) {
    if (project.readonly) {
      return project.readonly;
    }
    // A distributed template is frozen: the server refuses every modification
    // while copies exist, so the map hides the editing tools exactly like a
    // read-only project. Reading, opening and snapshot creation stay allowed.
    return !!project.frozen;
  }

  getCompression() {
    return this.compression_methods;
  }
  getCompressionLevel() {
    return this.compression_level_default_value;
  }

  getexportPortableProjectPath(controller: Controller, project_id: string, formData: any = {}) {
    if (formData.compression_level != null && formData.compression_level != '') {
      return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/export?include_snapshots=${formData.include_snapshots}&include_images=${formData.include_base_image}&reset_mac_addresses=${formData.reset_mac_address}&compression=${formData.compression}&compression_level=${formData.compression_level}&token=${controller.authToken}`;
    } else {
      return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/export?include_snapshots=${formData.include_snapshots}&include_images=${formData.include_base_image}&reset_mac_addresses=${formData.reset_mac_address}&compression=${formData.compression}&token=${controller.authToken}`;
    }
  }

  getProjectStatus(controller: Controller, project_id: string): Observable<any> {
    return this.get(controller, `${project_id}/locked`);
  }

  projectUpdateLockIcon() {
    this.projectLockIconSubject.next(true);
  }
}
