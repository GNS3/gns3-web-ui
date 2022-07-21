import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import{ Controller } from '../../../../models/controller';
import { ControllerSettingsService } from '../../../../services/controller-settings.service';
import { ControllerService } from '../../../../services/controller.service';

@Component({
  selector: 'app-dynamips-preferences',
  templateUrl: './dynamips-preferences.component.html',
  styleUrls: ['./dynamips-preferences.component.scss'],
})
export class DynamipsPreferencesComponent implements OnInit {
  controller:Controller ;
  dynamipsPath: string;

  constructor(
    private route: ActivatedRoute,
    private serverService: ControllerService,
    private controllerSettingsService: ControllerSettingsService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;
    });
  }

  restoreDefaults() {
    this.dynamipsPath = '';
  }
}
