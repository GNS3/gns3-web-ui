import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '@services/theme.service';

@Component({
  standalone: true,
  selector: 'app-navigation-dialog',
  templateUrl: 'navigation-dialog.component.html',
  styleUrls: ['navigation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatBottomSheetModule, MatButtonModule],
})
export class NavigationDialogComponent implements OnInit {
  private bottomSheetRef = inject(MatBottomSheetRef<NavigationDialogComponent>);
  private themeService = inject(ThemeService);
  private cd = inject(ChangeDetectorRef);

  projectMessage: string = '';
  isLightThemeEnabled: boolean = false;

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.cd.markForCheck();
  }

  onNoClick(): void {
    this.bottomSheetRef.dismiss(false);
  }

  onYesClick(): void {
    this.bottomSheetRef.dismiss(true);
  }
}
