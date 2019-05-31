import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Project } from '../../../../../models/project';
import { Drawing } from '../../../../../cartography/models/drawing';
import { MatDialog } from '@angular/material';
import { TextEditorDialogComponent } from '../../../drawings-editors/text-editor/text-editor.component';
import { Label } from '../../../../../cartography/models/label';

@Component({
  selector: 'app-edit-text-action',
  templateUrl: './edit-text-action.component.html'
})
export class EditTextActionComponent implements OnInit {
  @Input() server: Server;
  @Input() project: Project;
  @Input() drawing: Drawing;
  @Input() label: Label;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  editText() {
    const dialogRef = this.dialog.open(TextEditorDialogComponent, {
      width: '300px',
      autoFocus: false
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.drawing = this.drawing;
    instance.label = this.label;
  }
}
