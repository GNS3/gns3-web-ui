import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Server } from '../../../../models/server';
import { switchMap } from 'rxjs/operators';
import { ServerService } from '../../../../services/server.service';

@Component({
  selector: 'app-vmware-preferences',
  templateUrl: './vmware-preferences.component.html',
  styleUrls: ['./vmware-preferences.component.scss'],
})
export class VmwarePreferencesComponent implements OnInit {
  server: Server;
  vmrunPath: string;

  constructor(private route: ActivatedRoute, private serverService: ServerService) {}

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');

    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;
    });
  }

  restoreDefaults() {
    this.vmrunPath = '';
  }
}
