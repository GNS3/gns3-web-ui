import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-navigation-dialog',
  templateUrl: 'navigation-dialog.component.html',
  styleUrls: ['navigation-dialog.component.scss'],
})
export class NavigationDialogComponent implements OnInit {
  projectMessage: string = '';
  isLightThemeEnabled: boolean = false;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<NavigationDialogComponent>,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
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
