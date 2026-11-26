import { Type } from '@angular/core';
import { MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import {
  ConfigurationJob,
  STARTUP_DEFAULT_SET_ID,
  StartupDocument,
  StartupStatus,
} from '@models/startup-configuration';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import { ToasterService } from '@services/toaster.service';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';

export function startupDocument(overrides: Partial<StartupDocument> = {}): StartupDocument {
  return {
    version: 1,
    revision: 0,
    selected: STARTUP_DEFAULT_SET_ID,
    sets: [{ id: STARTUP_DEFAULT_SET_ID, name: 'Default', nodes: {} }],
    ...overrides,
  };
}

export function configurationJob(overrides: Partial<ConfigurationJob> = {}): ConfigurationJob {
  return {
    id: 'job',
    set_id: STARTUP_DEFAULT_SET_ID,
    operation: 'capture',
    status: 'finished',
    nodes: {},
    ...overrides,
  };
}

export function startupStatus(overrides: Partial<StartupStatus> = {}): StartupStatus {
  return { jobs: [], nodes: {}, ...overrides };
}

export function configurationDocumentMocks(initial: () => StartupDocument) {
  return {
    get: vi.fn<StartupConfigurationsService['get']>(() => of(initial())),
    save: vi.fn<StartupConfigurationsService['save']>((_controller, _project, document) =>
      of({ ...structuredClone(document), revision: document.revision + 1 }),
    ),
  };
}

export function configurationEditorUiMocks(defaultAnswer?: unknown) {
  return {
    toast: {
      error: vi.fn<ToasterService['error']>(),
      success: vi.fn<ToasterService['success']>(),
    },
    dialog: {
      open: vi.fn<(component: Type<unknown>, config: MatDialogConfig) => { afterClosed: () => Observable<unknown> }>(
        () => ({ afterClosed: () => of(defaultAnswer) }),
      ),
    },
    dialogRef: {
      close: vi.fn<MatDialogRef<unknown>['close']>(),
      disableClose: false,
    },
  };
}

/** The media profile catalog of a controller that has none. */
export const noStartupMediaProfiles = { list: () => of([]), deviceType: () => undefined };

/** Records the downloads made through the shared downloadBlob helper; `vi.restoreAllMocks()` undoes it. */
export function captureDownloads() {
  const recorded = { names: [] as string[], blobs: [] as Blob[] };
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    recorded.blobs.push(blob as Blob);
    return 'blob:download';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    recorded.names.push(this.download);
  });
  return recorded;
}
