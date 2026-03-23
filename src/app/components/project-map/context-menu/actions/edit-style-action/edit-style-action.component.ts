import { ChangeDetectionStrategy, Component, OnChanges, inject, input } from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Drawing } from '../../../../../cartography/models/drawing';
import { ImageElement } from '../../../../../cartography/models/drawings/image-element';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { StyleEditorDialogComponent } from '../../../drawings-editors/style-editor/style-editor.component';

@Component({
  selector: 'app-edit-style-action',
  templateUrl: './edit-style-action.component.html',
  imports: [ MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditStyleActionComponent implements OnChanges {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly drawing = input<Drawing>(undefined);
  isImageDrawing: boolean = false;

  constructor() {}

  ngOnChanges() {
    this.isImageDrawing = this.drawing().element instanceof ImageElement;
  }

  editStyle() {
    const dialogRef = this.dialog.open(StyleEditorDialogComponent, {
      width: '800px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.drawing = this.drawing();
  }
}
