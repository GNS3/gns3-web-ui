import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { ConsoleService } from '../../services/settings/console.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = { ...SettingsService.DEFAULTS };
  viewSettings = { ...SettingsService.DEFAULTS };
  consoleCommand: string;

  constructor(
    private settingsService: SettingsService,
    private toaster: ToasterService,
    private consoleService: ConsoleService) {}

  ngOnInit() {
    this.consoleCommand = this.consoleService.command;
    this.getSettings();
  }

  save() {
    this.settingsService.setAll(this.settings);
    this.getSettings();
    this.toaster.success('Settings have been saved.');
  }

  getSettings() {
    this.settings = this.settingsService.getAll();
    this.viewSettings = this.settingsService.getAll();
  }
}
