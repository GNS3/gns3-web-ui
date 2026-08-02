import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  NotificationToastComponent,
  NotificationToastData,
} from '@components/notification-center/notification-toast.component';
import { NotificationCenterService } from './notification-center.service';
import type { NotificationKind } from './notification-center.service';

export interface NotificationOptions {
  showToast?: boolean;
}

@Injectable()
export class ToasterService {
  readonly snackBarConfigForSuccess: MatSnackBarConfig = {
    duration: 4000,
    panelClass: ['gns3-toast-panel'],
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  readonly snackBarConfigForWarning: MatSnackBarConfig = {
    duration: 4000,
    panelClass: ['gns3-toast-panel'],
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    politeness: 'assertive',
  };

  readonly snackBarConfigForError: MatSnackBarConfig = {
    duration: 10000,
    panelClass: ['gns3-toast-panel'],
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    politeness: 'assertive',
  };

  readonly snackBarConfigForInfo: MatSnackBarConfig = {
    duration: 4000,
    panelClass: ['gns3-toast-panel'],
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  constructor(
    private snackbar: MatSnackBar,
    private notificationCenter: NotificationCenterService
  ) {}

  public error(message: unknown, options: NotificationOptions = {}): void {
    console.error(message);
    this.show('error', message, this.snackBarConfigForError, options);
  }

  public warning(message: unknown, options: NotificationOptions = {}): void {
    this.show('warning', message, this.snackBarConfigForWarning, options);
  }

  public success(message: unknown, options: NotificationOptions = {}): void {
    this.show('success', message, this.snackBarConfigForSuccess, options);
  }

  public info(message: unknown, options: NotificationOptions = {}): void {
    this.show('info', message, this.snackBarConfigForInfo, options);
  }

  private show(
    kind: NotificationKind,
    message: unknown,
    config: MatSnackBarConfig,
    options: NotificationOptions
  ): void {
    const notification = this.notificationCenter.add(kind, message);
    if (options.showToast === false || this.notificationCenter.panelOpen()) {
      return;
    }

    this.snackbar.openFromComponent(NotificationToastComponent, {
      ...config,
      data: { notification } satisfies NotificationToastData,
    });
  }
}
