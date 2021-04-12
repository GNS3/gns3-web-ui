import { Component, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Link } from '../../../../../models/link';
import { MatDialog } from '@angular/material/dialog';
import { StartCaptureDialogComponent } from '../../../packet-capturing/start-capture/start-capture.component';
import { Project } from '../../../../../models/project';

@Component({
  selector: 'app-start-capture-action',
  templateUrl: './start-capture-action.component.html',
})
export class StartCaptureActionComponent {
  @Input() server: Server;
  @Input() project: Project;
  @Input() link: Link;

  constructor(private dialog: MatDialog) {}

  startCapture() {
    const dialogRef = this.dialog.open(StartCaptureDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.link = this.link;
  }
}
