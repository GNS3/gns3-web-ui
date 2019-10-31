import { Component, OnInit, HostBinding } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { ConsoleService } from '../../services/settings/console.service';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = { ...SettingsService.DEFAULTS };
  consoleCommand: string;

  @HostBinding('class') componentCssClass;

  constructor(
    private settingsService: SettingsService,
    private toaster: ToasterService,
    private consoleService: ConsoleService,
    public overlayContainer: OverlayContainer) {}

  ngOnInit() {
    this.settings = this.settingsService.getAll();
    this.consoleCommand = this.consoleService.command;
  }

  save() {
    this.settingsService.setAll(this.settings);
    this.toaster.success('Settings have been saved.');
  }

  onSetTheme(theme) {
    this.overlayContainer.getContainerElement().classList.remove(this.componentCssClass);
    this.overlayContainer.getContainerElement().classList.add(theme);
    this.componentCssClass = theme;
  }
}
