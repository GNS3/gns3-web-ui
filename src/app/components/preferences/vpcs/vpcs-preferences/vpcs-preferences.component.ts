import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vpcs-preferences',
  templateUrl: './vpcs-preferences.component.html',
  styleUrls: ['./vpcs-preferences.component.scss'],
})
export class VpcsPreferencesComponent implements OnInit {
  controller: Controller;
  vpcsExecutable: string;

  constructor(private route: ActivatedRoute, private controllerService: ControllerService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');

    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();
    });
  }

  restoreDefaults() {
    this.vpcsExecutable = '';
  }
}
