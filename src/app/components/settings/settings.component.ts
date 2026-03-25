import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MapSettingsService } from '@services/mapsettings.service';
import { Settings, SettingsService } from '@services/settings.service';
import { ConsoleService } from '@services/settings/console.service';
import { ThemeService, PrebuiltTheme } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { UpdatesService } from '@services/updates.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [CommonModule, FormsModule, MatExpansionModule, MatCheckboxModule, MatButtonModule, MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private toaster = inject(ToasterService);
  private themeService = inject(ThemeService);
  public mapSettingsService = inject(MapSettingsService);
  public updatesService = inject(UpdatesService);
  private cdr = inject(ChangeDetectorRef);

  settings: Settings;
  integrateLinksLabelsToLinks: boolean;
  openReadme: boolean;
  openConsolesInWidget: boolean;
  mapTheme: string;
  currentTheme: PrebuiltTheme;
  availableThemes = this.themeService.availableThemes;
  availableMapBackgrounds = this.themeService.availableMapBackgrounds;

  get lightThemes() {
    return this.themeService.availableThemes.filter(t => t.type === 'light');
  }

  get darkThemes() {
    return this.themeService.availableThemes.filter(t => t.type === 'dark');
  }

  ngOnInit() {
    this.settings = this.settingsService.getAll();
    this.integrateLinksLabelsToLinks = this.mapSettingsService.integrateLinkLabelsToLinks;
    this.openReadme = this.mapSettingsService.openReadme;
    this.openConsolesInWidget = this.mapSettingsService.openConsolesInWidget;
    this.mapTheme = this.themeService.savedMapTheme;
    this.currentTheme = this.themeService.getCurrentTheme();
    this.cdr.markForCheck();
  }

  save() {
    this.settingsService.setAll(this.settings);
    this.toaster.success('Settings have been saved.');

    this.mapSettingsService.toggleIntegrateInterfaceLabels(this.integrateLinksLabelsToLinks);
    this.mapSettingsService.toggleOpenReadme(this.openReadme);
    this.mapSettingsService.toggleOpenConsolesInWidget(this.openConsolesInWidget);
  }

  setTheme(theme: PrebuiltTheme) {
    this.themeService.setTheme(theme);
    this.currentTheme = theme;
    this.cdr.markForCheck();
  }

    setMapTheme(theme: string) {
    this.mapTheme = theme;
    this.themeService.setMapTheme(theme as 'light' | 'dark' | 'auto');
    this.cdr.markForCheck();
  }

  checkForUpdates() {
    window.open('https://gns3.com/software');
  }
}
