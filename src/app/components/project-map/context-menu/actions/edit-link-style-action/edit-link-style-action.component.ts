import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Link } from '../../../../../models/link';
import { Project } from '../../../../../models/project';
import { Server } from '../../../../../models/server';
import { LinkStyleEditorDialogComponent } from '../../../drawings-editors/link-style-editor/link-style-editor.component';

@Component({
  selector: 'app-edit-link-style-action',

  templateUrl: './edit-link-style-action.component.html',
})
export class EditLinkStyleActionComponent implements OnChanges {
  @Input() controller: Server;
  @Input() project: Project;
  @Input() link: Link;

  constructor(private dialog: MatDialog) {}

  ngOnChanges() {}

  editStyle() {
    const dialogRef = this.dialog.open(LinkStyleEditorDialogComponent, {
      width: '800px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
    instance.link = this.link;
  }
}
