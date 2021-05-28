import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Server } from '../../models/server';
import { ServerDatabase } from '../../services/server.database';
import { ServerService } from '../../services/server.service';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-direct-link',
  templateUrl: './direct-link.component.html',
  styleUrls: ['./direct-link.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DirectLinkComponent implements OnInit {
  public serverOptionsVisibility = false;
  public serverIp;
  public serverPort;
  public projectId;

  authorizations = [
    { key: 'none', name: 'No authorization' },
    { key: 'basic', name: 'Basic authorization' },
  ];
  protocols = [
    { key: 'http:', name: 'HTTP' },
    { key: 'https:', name: 'HTTPS' },
  ];
  locations = [
    { key: 'local', name: 'Local' },
    { key: 'remote', name: 'Remote' },
  ];

  serverForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    location: new FormControl(''),
    protocol: new FormControl('http:'),
    authorization: new FormControl('none'),
    login: new FormControl(''),
    password: new FormControl(''),
  });

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
    this.serverIp = this.route.snapshot.paramMap.get('server_ip');
    this.serverPort = +this.route.snapshot.paramMap.get('server_port');
    this.projectId = this.route.snapshot.paramMap.get('project_id');

    const servers = await this.serverService.findAll();
    const server = servers.filter((server) => server.host === this.serverIp && server.port === this.serverPort)[0];

    if (server) {
      this.router.navigate(['/server', server.id, 'project', this.projectId]);
    } else {
      this.serverOptionsVisibility = true;
    }
  }

  public createServer() {
    if (!this.serverForm.get('name').hasError && !this.serverForm.get('location').hasError && !this.serverForm.get('protocol').hasError) {
      this.toasterService.error('Please use correct values');
      return;
    }

    if (this.serverForm.get('authorization').value === 'basic' && !this.serverForm.get('login').value && !this.serverForm.get('password').value) {
      this.toasterService.error('Please use correct values');
      return;
    }

    let serverToAdd: Server = new Server();
    serverToAdd.host = this.serverIp;
    serverToAdd.port = this.serverPort;

    serverToAdd.name = this.serverForm.get('name').value;
    serverToAdd.location = this.serverForm.get('location').value;
    serverToAdd.protocol = this.serverForm.get('protocol').value;
    serverToAdd.authorization = this.serverForm.get('authorization').value;
    serverToAdd.login = this.serverForm.get('login').value;
    serverToAdd.password = this.serverForm.get('password').value;

    this.serverService.create(serverToAdd).then((addedServer: Server) => {
      this.router.navigate(['/server', addedServer.id, 'project', this.projectId]);
    });
  }
}
