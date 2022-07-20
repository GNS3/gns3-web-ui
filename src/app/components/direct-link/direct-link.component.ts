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
  public controllerOptionsVisibility = false;
  public controllerIp;
  public controllerPort;
  public projectId;

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
    protocol: new FormControl('http:')
  });

  constructor(
    private serverService: ServerService,
    private serverDatabase: ServerDatabase,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToasterService
  ) {}

  async ngOnInit() {
    if (this.serverService.isServiceInitialized) this.getControllers();

    this.serverService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.getControllers();
      }
    });
  }

  private async getControllers() {
    this.controllerIp = this.route.snapshot.paramMap.get('server_ip');
    this.controllerPort = +this.route.snapshot.paramMap.get('server_port');
    this.projectId = this.route.snapshot.paramMap.get('project_id');

    const controllers = await this.serverService.findAll();
    const controller = controllers.filter((controller) => controller.host === this.controllerIp && controller.port === this.controllerPort)[0];

    if (controller) {
      this.router.navigate(['/controller', controller.id, 'project', this.projectId]);
    } else {
      this.controllerOptionsVisibility = true;
    }
  }

  public createServer() {
    if (!this.serverForm.get('name').hasError && !this.serverForm.get('location').hasError && !this.serverForm.get('protocol').hasError) {
      this.toasterService.error('Please use correct values');
      return;
    }

    let serverToAdd: Server = new Server();
    serverToAdd.host = this.controllerIp;
    serverToAdd.port = this.controllerPort;

    serverToAdd.name = this.serverForm.get('name').value;
    serverToAdd.location = this.serverForm.get('location').value;
    serverToAdd.protocol = this.serverForm.get('protocol').value;

    this.serverService.create(serverToAdd).then((addedServer: Server) => {
      this.router.navigate(['/controller', addedServer.id, 'project', this.projectId]);
    });
  }
}
