import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '@services/theme.service';

@Component({
  standalone: true,
  selector: 'app-confirmation-bottomsheet',
  templateUrl: 'confirmation-bottomsheet.component.html',
  styleUrls: ['confirmation-bottomsheet.component.scss'],
  imports: [CommonModule, MatBottomSheetModule, MatButtonModule],
})
export class ConfirmationBottomSheetComponent implements OnInit {
  private bottomSheetRef = inject(MatBottomSheetRef<ConfirmationBottomSheetComponent>);
  private themeService = inject(ThemeService);

  message: string = '';
  isLightThemeEnabled: boolean = false;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { message: string }) {}

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
