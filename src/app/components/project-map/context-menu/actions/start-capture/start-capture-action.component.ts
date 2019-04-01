import { Component, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Link } from '../../../../../models/link';
import { MatDialog } from '@angular/material';
import { StartCaptureDialogComponent } from '../../../packet-capturing/start-capture/start-capture.component';

@Component({
  selector: 'app-start-capture-action',
  templateUrl: './start-capture-action.component.html'
})
export class StartCaptureActionComponent {
  @Input() server: Server;
  @Input() link: Link;

  constructor(private dialog: MatDialog) {}

  startCapture() {
    const dialogRef = this.dialog.open(StartCaptureDialogComponent, {
        width: '400px',
        autoFocus: false
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.link = this.link;
  }
}
