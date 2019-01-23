import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = { ...SettingsService.DEFAULTS };

  constructor(private settingsService: SettingsService, private toaster: ToasterService) {}

  ngOnInit() {
    this.settings = this.settingsService.getAll();
  }

  save() {
    this.settingsService.setAll(this.settings);
    this.toaster.success('Settings have been saved.');
  }
}
