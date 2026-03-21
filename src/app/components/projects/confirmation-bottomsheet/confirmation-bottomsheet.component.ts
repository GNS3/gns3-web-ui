import { ChangeDetectionStrategy, Component, OnInit, Inject, inject, signal } from '@angular/core';
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
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ConfirmationBottomSheetComponent implements OnInit {
  private bottomSheetRef = inject(MatBottomSheetRef<ConfirmationBottomSheetComponent>);
  private themeService = inject(ThemeService);

  message = signal('');
  isLightThemeEnabled = signal(false);

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { message: string }) {}

  ngOnInit() {
    if (this.data && this.data.message) {
      this.message.set(this.data.message);
    }
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled.set(true))
      : (this.isLightThemeEnabled.set(false));
  }

  onNoClick(): void {
    this.bottomSheetRef.dismiss(false);
  }

  onYesClick(): void {
    this.bottomSheetRef.dismiss(true);
  }
}
