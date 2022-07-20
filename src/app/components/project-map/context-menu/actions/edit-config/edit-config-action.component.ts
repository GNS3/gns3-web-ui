import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Project } from '../../../../../models/project';
import { Server } from '../../../../../models/server';
import { ConfigEditorDialogComponent } from '../../../node-editors/config-editor/config-editor.component';

@Component({
  selector: 'app-edit-config-action',
  templateUrl: './edit-config-action.component.html',
})
export class EditConfigActionComponent {
  @Input() controller: Server;
  @Input() project: Project;
  @Input() node: Node;

  constructor(private dialog: MatDialog) {}

  editConfig() {
    const dialogRef = this.dialog.open(ConfigEditorDialogComponent, {
      width: '600px',
      height: '500px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
    instance.node = this.node;
  }
}
