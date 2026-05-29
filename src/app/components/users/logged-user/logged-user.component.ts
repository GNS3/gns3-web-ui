import { ChangeDetectionStrategy, Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ChangeUserPasswordComponent } from '@components/user-management/user-detail/change-user-password/change-user-password.component';

export interface LoggedUserDialogData {
  controllerId: number;
}

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrl: './logged-user.component.scss',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoggedUserComponent implements OnInit {
  readonly user = signal<User | undefined>(undefined);
  controller: Controller;

  constructor(
    private dialogRef: MatDialogRef<LoggedUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LoggedUserDialogData,
    private controllerService: ControllerService,
    private userService: UserService,
    private toasterService: ToasterService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.controllerService.get(this.data.controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.userService.getInformationAboutLoggedUser(controller).subscribe((response: any) => {
        this.user.set(response);
      });
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  changePassword(): void {
    this.dialog.open<ChangeUserPasswordComponent>(ChangeUserPasswordComponent, {
      panelClass: ['base-dialog-panel', 'change-user-password-dialog-panel'],
      data: { user: this.user(), controller: this.controller, self_update: true },
    });
  }

  copyToken(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.controller.authToken;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.toasterService.success('Token copied');
  }
}
