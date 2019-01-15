import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Project } from '../../../../../models/project';
import { Drawing } from '../../../../../cartography/models/drawing';
import { MatDialog } from '@angular/material';
import { TextEditorDialogComponent } from '../../../drawings-editors/text-editor/text-editor.component';

@Component({
  selector: 'app-edit-text-action',
  templateUrl: './edit-text-action.component.html'
})
export class EditTextActionComponent implements OnInit {
  @Input() server: Server;
  @Input() project: Project;
  @Input() drawing: Drawing;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  editText() {
    const dialogRef = this.dialog.open(TextEditorDialogComponent, {
      width: '450px'
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.drawing = this.drawing;
  }
}
