import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { StartCaptureDialogComponent } from '../../../packet-capturing/start-capture/start-capture.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  selector: 'app-start-capture-action',
  templateUrl: './start-capture-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartCaptureActionComponent {
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  startCapture() {
    const dialogConfig = this.dialogConfig.openConfig('startCapture', {
      autoFocus: false,
      disableClose: false,
    });
    const dialogRef = this.dialog.open(StartCaptureDialogComponent, dialogConfig);
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.link = this.link();
  }
}
