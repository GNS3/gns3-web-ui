import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatBottomSheetRef } from '@angular/material';

@Component({
  selector: 'app-confirmation-bottomsheet',
  templateUrl: 'confirmation-bottomsheet.component.html',
  styleUrls: ['confirmation-bottomsheet.component.scss']
})
export class ConfirmationBottomSheetComponent implements OnInit {
    message: string = '';

    constructor(private bottomSheetRef: MatBottomSheetRef<ConfirmationBottomSheetComponent>) {}

    ngOnInit() {}

    onNoClick(): void {
        this.bottomSheetRef.dismiss(false);
    }

    onYesClick(): void {
        this.bottomSheetRef.dismiss(true);
    }
}
