import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { NodeConsoleService } from '@services/nodeConsole.service';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable()
export class ConsoleGuard implements CanDeactivate<CanComponentDeactivate> {
  constructor(private consoleService: NodeConsoleService, private dialog: MatDialog) {}

  canDeactivate() {
    if (this.consoleService.openConsoles > 0) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-warning-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Leave project?',
          message: 'Leaving this project will close all open consoles.',
          confirmButtonText: 'Leave project',
          tone: 'warning',
          icon: 'exit_to_app',
        },
      });
      return dialogRef.afterClosed();
    } else {
      return true;
    }
  }
}
