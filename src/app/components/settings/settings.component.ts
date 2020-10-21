import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { ConsoleService } from '../../services/settings/console.service';
import { ThemeService } from '../../services/theme.service';
import { MapSettingsService } from '../../services/mapsettings.service';
import { UpdatesService } from '../../services/updates.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = { ...SettingsService.DEFAULTS };
  consoleCommand: string;
  integrateLinksLabelsToLinks: boolean;
  openReadme: boolean;

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
  }

  save() {
    this.settingsService.setAll(this.settings);
    this.toaster.success('Settings have been saved.');
    
    this.mapSettingsService.toggleIntegrateInterfaceLabels(this.integrateLinksLabelsToLinks);
    this.mapSettingsService.toggleOpenReadme(this.openReadme);
  }

  setDarkMode(value: boolean) {
    this.themeService.setDarkMode(value);
  }

  checkForUpdates() {
    window.open("https://gns3.com/software");
  }
}
