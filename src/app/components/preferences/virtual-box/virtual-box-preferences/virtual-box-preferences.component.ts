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
  server: Server;
  vboxManagePath: string;

  constructor(private route: ActivatedRoute, private serverService: ServerService) {}

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;
    });
  }

  restoreDefaults() {
    this.vboxManagePath = '';
  }
}
