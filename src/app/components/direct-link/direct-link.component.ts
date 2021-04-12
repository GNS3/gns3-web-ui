import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { ServerService } from '../../services/server.service';
import { ServerDatabase } from '../../services/server.database';
import { Router, ActivatedRoute } from '@angular/router';
import { Server } from '../../models/server';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-direct-link',
  templateUrl: './direct-link.component.html',
  styleUrls: ['./direct-link.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DirectLinkComponent implements OnInit {
  constructor(
    private serverService: ServerService,
    private serverDatabase: ServerDatabase,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToasterService
  ) {}

  async ngOnInit() {
    if (this.serverService.isServiceInitialized) this.getServers();

    this.serverService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.getServers();
      }
    });
  }

  private async getServers() {
    const serverIp = this.route.snapshot.paramMap.get('server_ip');
    const serverPort = +this.route.snapshot.paramMap.get('server_port');
    const projectId = this.route.snapshot.paramMap.get('project_id');

    const servers = await this.serverService.findAll();
    const server = servers.filter((server) => server.host === serverIp && server.port === serverPort)[0];

    if (server) {
      this.router.navigate(['/server', server.id, 'project', projectId]);
    } else {
      let serverToAdd: Server = new Server();
      serverToAdd.host = serverIp;
      serverToAdd.port = serverPort;
      serverToAdd.location = 'bundled';
      serverToAdd.name = serverIp;

      this.serverService.create(serverToAdd).then((addedServer: Server) => {
        this.router.navigate(['/server', addedServer.id, 'project', projectId]);
      });
    }
  }
}
