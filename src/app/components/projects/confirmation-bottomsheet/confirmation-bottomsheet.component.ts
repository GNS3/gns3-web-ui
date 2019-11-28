import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatBottomSheetRef } from '@angular/material';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-confirmation-bottomsheet',
  templateUrl: 'confirmation-bottomsheet.component.html',
  styleUrls: ['confirmation-bottomsheet.component.scss']
})
export class ConfirmationBottomSheetComponent implements OnInit {
    message: string = '';
    isLightThemeEnabled: boolean = false;

    constructor(
        private bottomSheetRef: MatBottomSheetRef<ConfirmationBottomSheetComponent>,
        private themeService: ThemeService
    ) {}

    ngOnInit() {
        this.themeService.getActualTheme() === 'light' ? this.isLightThemeEnabled = true : this.isLightThemeEnabled = false; 
    }

    onNoClick(): void {
        this.bottomSheetRef.dismiss(false);
    }

    onYesClick(): void {
        this.bottomSheetRef.dismiss(true);
    }
}
