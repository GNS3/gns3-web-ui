import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';

import { Server } from '../../models/server';
import { Template } from '../../models/template';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnInit {
  @Input() server: Server;
  @Output() onNodeCreation = new EventEmitter<any>();

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  listTemplatesModal() {
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      width: '600px',
      height: '560px',
      data: {
        server: this.server
      }
    });

    dialogRef.afterClosed().subscribe((template: Template) => {
      if (template !== null) {
        this.onNodeCreation.emit(template);
      }
    });
  }
}
