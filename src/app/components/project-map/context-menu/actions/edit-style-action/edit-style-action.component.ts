import { Component, OnInit, Input } from '@angular/core';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Server } from '../../../../../models/server';
import { MatDialog } from '@angular/material';
import { Project } from '../../../../../models/project';
import { StyleEditorDialogComponent } from '../../../drawings-editors/style-editor/style-editor.component';

@Component({
  selector: 'app-edit-style-action',
  templateUrl: './edit-style-action.component.html'
})
export class EditStyleActionComponent implements OnInit {
  @Input() server: Server;
  @Input() project: Project;
  @Input() drawing: Drawing;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  editStyle() {
    const dialogRef = this.dialog.open(StyleEditorDialogComponent, {
      width: '300px'
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.drawing = this.drawing;
  }
}
