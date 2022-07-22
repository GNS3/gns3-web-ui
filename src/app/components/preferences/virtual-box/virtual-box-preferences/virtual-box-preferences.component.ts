import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import{ Controller } from '../../../../models/controller';
import { ControllerService } from '../../../../services/controller.service';

@Component({
  selector: 'app-virtual-box-preferences',
  templateUrl: './virtual-box-preferences.component.html',
  styleUrls: ['./virtual-box-preferences.component.scss'],
})
export class VirtualBoxPreferencesComponent implements OnInit {
  controller:Controller ;
  vboxManagePath: string;

  constructor(private route: ActivatedRoute, private controllerService: ControllerService) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;
    });
  }

  restoreDefaults() {
    this.vboxManagePath = '';
  }
}
