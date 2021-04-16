import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Drawing } from '../../../../../cartography/models/drawing';
import { ImageElement } from '../../../../../cartography/models/drawings/image-element';
import { Project } from '../../../../../models/project';
import { Server } from '../../../../../models/server';
import { StyleEditorDialogComponent } from '../../../drawings-editors/style-editor/style-editor.component';

@Component({
  selector: 'app-edit-style-action',
  templateUrl: './edit-style-action.component.html',
})
export class EditStyleActionComponent implements OnChanges {
  @Input() server: Server;
  @Input() project: Project;
  @Input() drawing: Drawing;
  isImageDrawing: boolean = false;

  constructor(private dialog: MatDialog) {}

  ngOnChanges() {
    this.isImageDrawing = this.drawing.element instanceof ImageElement;
  }

  editStyle() {
    const dialogRef = this.dialog.open(StyleEditorDialogComponent, {
      width: '800px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.drawing = this.drawing;
  }
}
