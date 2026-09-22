import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Node } from '../../../cartography/models/node';
import {
  MissingImagesDialogComponent,
  MissingImagesDialogData,
  MissingImagesDialogResult,
} from './missing-images-dialog.component';

/**
 * Opens the "Missing images" dialog for a project (or a subset of its nodes)
 * and reports how many replacements were applied.
 */
@Injectable({ providedIn: 'root' })
export class MissingImagesDialogService {
  private dialog = inject(MatDialog);

  /**
   * Open the dialog when at least one of the given nodes has a missing image.
   *
   * @param options.title header title (defaults to "Project missing images").
   * @param options.introText intro paragraph (defaults to the project wording).
   * @param options.dismissButtonText label of the dismiss button (defaults to
   *   "Open project without fixing"; the context menu passes "Cancel").
   * @param options.contentSized use a content-sized node dialog instead of the
   *   fixed-height project dialog.
   * @returns the dialog result, or `undefined` when there is nothing to fix.
   */
  open(
    controller: Controller,
    nodes: Node[],
    options?: { title?: string; introText?: string; dismissButtonText?: string; contentSized?: boolean }
  ): Observable<MissingImagesDialogResult | undefined> {
    const missingNodes = (nodes || []).filter((node) => node.missing_image && (node.missing_images?.length ?? 0) > 0);
    if (missingNodes.length === 0) {
      return of(undefined);
    }

    const heightClass = options?.contentSized
      ? 'missing-images-dialog-panel--content-sized'
      : 'missing-images-dialog-panel--project';
    const dialogRef = this.dialog.open(MissingImagesDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-large-panel', 'missing-images-dialog-panel', heightClass],
      autoFocus: false,
      data: {
        controller,
        nodes: missingNodes,
        title: options?.title,
        introText: options?.introText,
        dismissButtonText: options?.dismissButtonText,
      } as MissingImagesDialogData,
    });

    return dialogRef.afterClosed();
  }
}
