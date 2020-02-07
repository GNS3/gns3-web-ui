import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { NodeAddedEvent, TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';

import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { Template } from '../../models/template';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnInit {
  @Input() server: Server;
  @Input() project: Project;
  @Output() onNodeCreation = new EventEmitter<any>();

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  listTemplatesModal() {
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      width: '600px',
      data: {
        server: this.server,
        project: this.project
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((nodeAddedEvent: NodeAddedEvent) => {
      if (nodeAddedEvent !== null) {
        this.onNodeCreation.emit(nodeAddedEvent);
      }
    });
  }
}
