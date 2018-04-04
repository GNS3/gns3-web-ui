import { Component, OnInit } from '@angular/core';
import { SettingsService } from "../shared/services/settings.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = { ...SettingsService.DEFAULTS };

  constructor(private settingsService: SettingsService) { }

  ngOnInit() {
    this.settings = this.settingsService.getAll();
  }

  save() {
    this.settingsService.setAll(this.settings);
  }
}
