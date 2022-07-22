import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import{ Controller } from '../../models/controller';
import { ControllerDatabase } from '../../services/controller.database';
import { ControllerService } from '../../services/controller.service';
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

  controllerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    location: new FormControl(''),
    protocol: new FormControl('http:')
  });

  constructor(
    private controllerService: ControllerService,
    private controllerDatabase: ControllerDatabase,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToasterService
  ) {}

  async ngOnInit() {
    if (this.controllerService.isServiceInitialized) this.getControllers();

    this.controllerService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.getControllers();
      }
    });
  }

  private async getControllers() {
    this.controllerIp = this.route.snapshot.paramMap.get('controller_ip');
    this.controllerPort = +this.route.snapshot.paramMap.get('controller_port');
    this.projectId = this.route.snapshot.paramMap.get('project_id');

    const controllers = await this.controllerService.findAll();
    const controller = controllers.filter((controller) => controller.host === this.controllerIp && controller.port === this.controllerPort)[0];

    if (controller) {
      this.router.navigate(['/controller', controller.id, 'project', this.projectId]);
    } else {
      this.controllerOptionsVisibility = true;
    }
  }

  public createController() {
    if (!this.controllerForm.get('name').hasError && !this.controllerForm.get('location').hasError && !this.controllerForm.get('protocol').hasError) {
      this.toasterService.error('Please use correct values');
      return;
    }

    let controllerToAdd:Controller  = new Controller  ();
    controllerToAdd.host = this.controllerIp;
    controllerToAdd.port = this.controllerPort;

    controllerToAdd.name = this.controllerForm.get('name').value;
    controllerToAdd.location = this.controllerForm.get('location').value;
    controllerToAdd.protocol = this.controllerForm.get('protocol').value;

    this.controllerService.create(controllerToAdd).then((addedController:Controller ) => {
      this.router.navigate(['/controller', addedController.id, 'project', this.projectId]);
    });
  }
}
