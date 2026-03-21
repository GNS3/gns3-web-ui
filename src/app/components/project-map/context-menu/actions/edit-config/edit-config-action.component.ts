import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ConfigEditorDialogComponent } from '../../../node-editors/config-editor/config-editor.component';

@Component({
  standalone: true,
  selector: 'app-edit-config-action',
  templateUrl: './edit-config-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class EditConfigActionComponent {
  private dialog = inject(MatDialog);

  @Input() controller: Controller;
  @Input() project: Project;
  @Input() node: Node;

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
