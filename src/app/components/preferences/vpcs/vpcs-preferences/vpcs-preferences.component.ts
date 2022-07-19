import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../models/server';
import { ServerService } from '../../../../services/server.service';

@Component({
  selector: 'app-vpcs-preferences',
  templateUrl: './vpcs-preferences.component.html',
  styleUrls: ['./vpcs-preferences.component.scss'],
})
export class VpcsPreferencesComponent implements OnInit {
  server: Server;
  vpcsExecutable: string;

  constructor(private route: ActivatedRoute, private serverService: ServerService) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');

    this.serverService.get(parseInt(controller_id, 10)).then((server: Server) => {
      this.server = server;
    });
  }

  restoreDefaults() {
    this.vpcsExecutable = '';
  }
}
