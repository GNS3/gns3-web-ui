import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '@models/controller';
import { ControllerSettingsService } from '@services/controller-settings.service';
import { ControllerService } from '@services/controller.service';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dynamips-preferences',
  templateUrl: './dynamips-preferences.component.html',
  styleUrls: ['./dynamips-preferences.component.scss'],
})
export class DynamipsPreferencesComponent implements OnInit {
  controller: Controller;
  dynamipsPath: string;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private controllerSettingsService: ControllerSettingsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();
    });
  }

  restoreDefaults() {
    this.dynamipsPath = '';
  }
}
