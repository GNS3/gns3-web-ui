import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmationBottomSheetComponent } from '@components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { NodeConsoleService } from '@services/nodeConsole.service';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable()
export class ConsoleGuard implements CanDeactivate<CanComponentDeactivate> {
  constructor(private consoleService: NodeConsoleService, private bottomSheet: MatBottomSheet) {}

  canDeactivate() {
    if (this.consoleService.openConsoles > 0) {
      this.bottomSheet.open(ConfirmationBottomSheetComponent);
      let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
      bottomSheetRef.instance.message = 'Exiting the project will close open consoles, do you want to continue?';
      return bottomSheetRef.afterDismissed();
    } else {
      return true;
    }
  }
}
