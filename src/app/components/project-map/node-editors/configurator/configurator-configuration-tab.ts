import { WritableSignal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { catchError, defer, EMPTY, finalize, Observable, of, switchMap, throwError } from 'rxjs';
import { NodeConfigurationComponent } from '../node-configuration/node-configuration.component';

/** What the vpcs/ios/iou/qemu/docker configurators share when they embed the Configuration tab. */
export interface ConfiguratorHost {
  /** The embedded tab, or undefined when it was never opened (its content is lazy). */
  editor: NodeConfigurationComponent | undefined;
  isApplying: WritableSignal<boolean>;
  dialogRef: MatDialogRef<unknown>;
  toaster: ToasterService;
}

/**
 * Save the Configuration tab's edits into the startup set, then run the node
 * update. The node update is skipped when the configuration could not be saved,
 * so the dialog never half-applies. If only the node update fails, the user is
 * told the configuration edits were still saved.
 */
export function saveConfigurationThenUpdate<T>(host: ConfiguratorHost, update: () => Observable<T>): Observable<T> {
  const editor = host.editor;
  const hadEdits = !!editor?.dirty();
  const configurationSave = editor?.saveBeforeApply() ?? of(true);
  host.isApplying.set(true);
  host.dialogRef.disableClose = true;
  return configurationSave.pipe(
    switchMap((saved) =>
      saved
        ? defer(update).pipe(
            catchError((error) => {
              if (hadEdits) {
                host.toaster.warning('The configuration was saved to its set, but updating the node settings failed.');
              }
              return throwError(() => error);
            }),
          )
        : EMPTY,
    ),
    finalize(() => {
      host.isApplying.set(false);
      // Keep the dialog open while the tab has unsaved edits or an operation in flight.
      host.dialogRef.disableClose = !!host.editor?.dirty() || !!host.editor?.busy();
    }),
  );
}

/** False (after telling the user why) while the Configuration tab has unsaved edits or is busy. */
export function configurationAllowsLeaving(editor: NodeConfigurationComponent | undefined): boolean {
  return editor?.canLeave() !== false;
}
