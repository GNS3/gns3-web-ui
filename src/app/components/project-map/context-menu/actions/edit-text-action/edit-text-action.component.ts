import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Label } from '../../../../../cartography/models/label';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '../../../../../models/link';
import { LinkNode } from '../../../../../models/link-node';
import { Project } from '../../../../../models/project';
import { Server } from '../../../../../models/server';
import { TextEditorDialogComponent } from '../../../drawings-editors/text-editor/text-editor.component';

@Component({
  selector: 'app-edit-text-action',
  templateUrl: './edit-text-action.component.html',
})
export class EditTextActionComponent implements OnInit {
  @Input() controller: Server;
  @Input() project: Project;
  @Input() drawing: Drawing;
  @Input() node: Node;
  @Input() label: Label;
  @Input() link: Link;
  @Input() linkNode: LinkNode;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  editText() {
    const dialogRef = this.dialog.open(TextEditorDialogComponent, {
      width: '300px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
    instance.drawing = this.drawing;
    instance.node = this.node;
    instance.label = this.label;
    instance.link = this.link;
    instance.linkNode = this.linkNode;
  }
}
