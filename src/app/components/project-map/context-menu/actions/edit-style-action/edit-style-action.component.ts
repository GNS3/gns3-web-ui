import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Drawing } from '../../../../../cartography/models/drawing';
import { ImageElement } from '../../../../../cartography/models/drawings/image-element';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { StyleEditorDialogComponent } from '../../../drawings-editors/style-editor/style-editor.component';

@Component({
  standalone: true,
  selector: 'app-edit-style-action',
  templateUrl: './edit-style-action.component.html',
  imports: [CommonModule, MatDialogModule]
})
export class EditStyleActionComponent implements OnChanges {
  private dialog = inject(MatDialog);

  @Input() controller: Controller;
  @Input() project: Project;
  @Input() drawing: Drawing;
  isImageDrawing: boolean = false;

  constructor() {}

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
    instance.controller = this.controller;
    instance.project = this.project;
    instance.drawing = this.drawing;
  }
}
