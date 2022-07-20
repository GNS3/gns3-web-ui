import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../models/server';
import { ServerService } from '../../../../services/server.service';

@Component({
  selector: 'app-virtual-box-preferences',
  templateUrl: './virtual-box-preferences.component.html',
  styleUrls: ['./virtual-box-preferences.component.scss'],
})
export class VirtualBoxPreferencesComponent implements OnInit {
  controller: Server;
  vboxManagePath: string;

  constructor(private route: ActivatedRoute, private serverService: ServerService) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;
    });
  }

  restoreDefaults() {
    this.vboxManagePath = '';
  }
}
