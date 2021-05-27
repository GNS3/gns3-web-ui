import { Component, OnInit } from '@angular/core';
import { MapSettingsService } from '../../services/mapsettings.service';
import { Settings, SettingsService } from '../../services/settings.service';
import { ConsoleService } from '../../services/settings/console.service';
import { ThemeService } from '../../services/theme.service';
import { ToasterService } from '../../services/toaster.service';
import { UpdatesService } from '../../services/updates.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  settings: Settings;
  consoleCommand: string;
  integrateLinksLabelsToLinks: boolean;
  openReadme: boolean;
  openConsolesInWidget: boolean;

  constructor(
    private settingsService: SettingsService,
    private toaster: ToasterService,
    private consoleService: ConsoleService,
    private themeService: ThemeService,
    public mapSettingsService: MapSettingsService,
    public updatesService: UpdatesService
  ) {}

  ngOnInit() {
    this.settings = this.settingsService.getAll();
    this.consoleCommand = this.consoleService.command;
    this.integrateLinksLabelsToLinks = this.mapSettingsService.integrateLinkLabelsToLinks;
    this.openReadme = this.mapSettingsService.openReadme;
    this.openConsolesInWidget = this.mapSettingsService.openConsolesInWidget;
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

  checkForUpdates() {
    window.open('https://gns3.com/software');
  }
}
