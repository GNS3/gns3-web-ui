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
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { UpdatesService } from '@services/updates.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [CommonModule, FormsModule, MatExpansionModule, MatCheckboxModule, MatButtonModule, MatRadioModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
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

  ngOnInit() {
    this.settings = this.settingsService.getAll();
    this.integrateLinksLabelsToLinks = this.mapSettingsService.integrateLinkLabelsToLinks;
    this.openReadme = this.mapSettingsService.openReadme;
    this.openConsolesInWidget = this.mapSettingsService.openConsolesInWidget;
    this.mapTheme = this.themeService.savedMapTheme;
    this.cdr.markForCheck();
  }

  save() {
    this.settingsService.setAll(this.settings);
    this.toaster.success('Settings have been saved.');

    this.mapSettingsService.toggleIntegrateInterfaceLabels(this.integrateLinksLabelsToLinks);
    this.mapSettingsService.toggleOpenReadme(this.openReadme);
    this.mapSettingsService.toggleOpenConsolesInWidget(this.openConsolesInWidget);
  }

  setDarkMode(value: boolean) {
    this.themeService.setDarkMode(value);
  }

    setMapTheme(theme: 'light' | 'dark' | 'auto') {
    this.mapTheme = theme;
    this.themeService.setMapTheme(theme);
    this.cdr.markForCheck();
  }
 
  checkForUpdates() {
    window.open('https://gns3.com/software');
  }
}
