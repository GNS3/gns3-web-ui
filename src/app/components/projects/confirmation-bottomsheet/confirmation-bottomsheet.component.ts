import { Component, OnInit, Inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { ThemeService } from '@services/theme.service';

@Component({
  standalone: false,
  selector: 'app-confirmation-bottomsheet',
  templateUrl: 'confirmation-bottomsheet.component.html',
  styleUrls: ['confirmation-bottomsheet.component.scss'],
})
export class ConfirmationBottomSheetComponent implements OnInit {
  message: string = '';
  isLightThemeEnabled: boolean = false;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<ConfirmationBottomSheetComponent>,
    private themeService: ThemeService,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { message: string }
  ) {}

  ngOnInit() {
    if (this.data && this.data.message) {
      this.message = this.data.message;
    }
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
  }

  onNoClick(): void {
    this.bottomSheetRef.dismiss(false);
  }

  onYesClick(): void {
    this.bottomSheetRef.dismiss(true);
  }
}
