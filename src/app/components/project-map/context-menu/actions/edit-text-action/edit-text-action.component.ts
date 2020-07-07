import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Project } from '../../../../../models/project';
import { Drawing } from '../../../../../cartography/models/drawing';
import { MatDialog } from '@angular/material/dialog';
import { TextEditorDialogComponent } from '../../../drawings-editors/text-editor/text-editor.component';
import { Label } from '../../../../../cartography/models/label';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '../../../../../models/link';
import { LinkNode } from '../../../../../models/link-node';

@Component({
  selector: 'app-edit-text-action',
  templateUrl: './edit-text-action.component.html'
})
export class EditTextActionComponent implements OnInit {
  @Input() server: Server;
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
      disableClose: true
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.drawing = this.drawing;
    instance.node = this.node;
    instance.label = this.label;
    instance.link = this.link;
    instance.linkNode = this.linkNode;
  }
}
