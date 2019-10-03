import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatBottomSheetRef } from '@angular/material';

@Component({
  selector: 'app-navigation-dialog',
  templateUrl: 'navigation-dialog.component.html',
  styleUrls: ['navigation-dialog.component.scss']
})
export class NavigationDialogComponent implements OnInit {
    projectMessage: string = '';

    constructor(private bottomSheetRef: MatBottomSheetRef<NavigationDialogComponent>) {}

    ngOnInit() {}

    onNoClick(): void {
        this.bottomSheetRef.dismiss(false);
    }

    onYesClick(): void {
        this.bottomSheetRef.dismiss(true);
    }
}
