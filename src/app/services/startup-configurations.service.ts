import { inject, Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  Observable,
  of,
  switchMap,
  take,
  throwError,
  timeout,
  TimeoutError,
  timer,
} from 'rxjs';
import { Node } from '../cartography/models/node';
import { downloadBlob, sanitizeFileName } from '../utils/file-download.util';
import { ConfigurationExportDeviceType, isDockerIol, StartupDeviceType } from './configuration-capabilities';
import { HttpController } from './http-controller.service';
import {
  BulkSelectionResult,
  ConfigurationJob,
  configurationFileName,
  configurationFileExtension,
  normalizeStartupDocument,
  SetImportResult,
  StartupDocument,
  StartupSelection,
  StartupStatus,
  normalizeStartupStatus,
} from '@models/startup-configuration';

export interface ConfigurationExportOptions {
  source?: 'running' | 'saved_startup' | 'saved_files';
  device_type?: ConfigurationExportDeviceType;
}

/** Download a configuration text under the node's name, with the extension of its device type. */
export function downloadConfigurationText(nodeName: string, deviceType: StartupDeviceType, content: string) {
  downloadBlob(
    configurationFileName(nodeName, configurationFileExtension(deviceType)),
    new Blob([content], { type: 'text/plain;charset=utf-8' }),
  );
}

/** Body of `configuration-export`. */
export function configurationExportRequest(node: Node, options: ConfigurationExportOptions = {}) {
  if (node.node_type !== 'docker') return options;
  // Generic Docker exports node-owned files; IOL has a known native IOS path.
  return isDockerIol(node)
    ? node.status === 'started'
      ? { source: 'running', device_type: 'cisco_ios_telnet' }
      : { source: 'saved_startup' }
    : { source: 'saved_files' };
}

/** Download name for a node's exported configuration; the export response carries only the file bytes. */
export function configurationExportFileName(node: Node, options: ConfigurationExportOptions, blob: Blob): string {
  const extension =
    node.node_type === 'vpcs'
      ? 'vpc'
      : blob.type === 'application/zip'
        ? 'zip'
        : options.device_type
          ? configurationFileExtension(options.device_type)
          : 'cfg';
  return configurationFileName(sanitizeFileName(node.name, 'node'), extension);
}

/** URL-safe base64 (the server accepts `-_` as the alternative alphabet). */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
}

@Injectable({ providedIn: 'root' })
export class StartupConfigurationsService {
  private http = inject(HttpController);
  private path(projectId: string) {
    return `/projects/${projectId}/startup-configurations`;
  }
  get(controller: Controller, projectId: string) {
    return this.http.get<StartupDocument>(controller, this.path(projectId)).pipe(map(normalizeStartupDocument));
  }
  save(controller: Controller, projectId: string, document: StartupDocument) {
    return this.http
      .put<StartupDocument>(controller, this.path(projectId), normalizeStartupDocument(document))
      .pipe(map(normalizeStartupDocument));
  }
  /** Add an empty set without making it the project default. */
  createSet(controller: Controller, projectId: string, name: string, revision: number) {
    return this.http.post<{ revision: number; set: { id: string; name: string } }>(
      controller,
      `${this.path(projectId)}/sets`,
      { name, revision, select: false },
    );
  }
  /** One startup choice for several nodes: a set, or none (their image defaults after the next wipe). */
  assignSelection(
    controller: Controller,
    projectId: string,
    nodeIds: string[],
    selection: StartupSelection,
    revision: number,
  ) {
    return this.http.put<BulkSelectionResult>(controller, `${this.path(projectId)}/selections`, {
      node_ids: nodeIds,
      selection,
      revision,
    });
  }
  capture(controller: Controller, projectId: string, setId: string, nodeIds: string[]) {
    return this.http.post<ConfigurationJob>(controller, `${this.path(projectId)}/capture`, {
      set_id: setId,
      node_ids: nodeIds,
    });
  }
  status(controller: Controller, projectId: string) {
    return this.http.get<StartupStatus>(controller, `${this.path(projectId)}/status`).pipe(map(normalizeStartupStatus));
  }
  apply(controller: Controller, node: Node, setId: string, revision: number) {
    return this.http.post<ConfigurationJob>(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/configuration-apply`,
      {
        set_id: setId,
        revision,
      },
    );
  }
  waitForJob(
    controller: Controller,
    projectId: string,
    job: ConfigurationJob,
    deadlineMs = job.operation === 'apply' ? 200000 : 90000,
  ) {
    if (job.status !== 'running') return of(job);
    return timer(0, 1000).pipe(
      exhaustMap(() => this.status(controller, projectId)),
      map((status) => status.jobs.find((current) => current.id === job.id)),
      filter((current) => !!current && current.status !== 'running'),
      take(1),
      timeout(deadlineMs),
      // Giving up on the polling is not a failed job: the server keeps working on it.
      catchError((error) =>
        throwError(() => (error instanceof TimeoutError ? new Error('configuration_job_still_running') : error)),
      ),
    );
  }
  captureNode(controller: Controller, node: Node, setId: string) {
    return this.capture(controller, node.project_id, setId, [node.node_id]).pipe(
      switchMap((job) => this.waitForJob(controller, node.project_id, job)),
      switchMap((job) =>
        job.nodes[node.node_id] === 'captured'
          ? this.get(controller, node.project_id)
          : throwError(() => new Error(job.nodes[node.node_id] || 'Configuration capture failed')),
      ),
    );
  }
  /**
   * Wipe explicit nodes. The server stops running nodes first and wipes stopped
   * nodes directly; `stopped` lists the nodes it had to stop.
   */
  wipe(controller: Controller, projectId: string, nodeIds: string[]) {
    return this.http.post<{ nodes: Record<string, string>; stopped?: string[] }>(
      controller,
      `${this.path(projectId)}/wipe`,
      { node_ids: nodeIds },
    );
  }

  /** Export one node's configuration as a download; a plain export never rewrites a set. */
  exportConfiguration(controller: Controller, node: Node, options: ConfigurationExportOptions = {}): Observable<Blob> {
    return this.http.postBlob(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/configuration-export`,
      new Blob([JSON.stringify(configurationExportRequest(node, options))], { type: 'application/json' }),
    );
  }

  /** ZIP archive of one set. It may contain device secrets. */
  exportSet(controller: Controller, projectId: string, setId: string, revision: number): Observable<Blob> {
    return this.http.getBlob(controller, `${this.path(projectId)}/sets/${setId}/export?revision=${revision}`);
  }

  /**
   * Import a set archive as a NEW set. The server never overwrites an existing
   * set; it remaps nodes by id and reports what it skipped.
   */
  importSet(controller: Controller, projectId: string, archive: Uint8Array, name: string) {
    return this.http.post<SetImportResult>(controller, `${this.path(projectId)}/import`, {
      archive: bytesToBase64Url(archive),
      name,
      select: false,
      assign_nodes: false,
    });
  }
}
