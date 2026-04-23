import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { Controller } from '@models/controller';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-direct-link',
  templateUrl: './direct-link.component.html',
  styleUrl: './direct-link.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectLinkComponent implements OnInit {
  private controllerService = inject(ControllerService);
  private controllerDatabase = inject(ControllerDatabase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controllerOptionsVisibility = signal(false);
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

  controllerForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required]),
    location: new UntypedFormControl(''),
    protocol: new UntypedFormControl('http:'),
  });

  constructor() {}

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

    try {
      const controllers = await this.controllerService.findAll();
      const controller = controllers.filter(
        (controller) => controller.host === this.controllerIp && controller.port === this.controllerPort
      )[0];

      if (controller) {
        this.router.navigate(['/controller', controller.id, 'project', this.projectId]);
      } else {
        this.controllerOptionsVisibility.set(true);
        this.cdr.markForCheck();
      }
    } catch (err) {
      const message = err.error?.message || err.message || 'Failed to load controllers';
      this.toasterService.error(message);
      this.cdr.markForCheck();
    }
  }

  public createController() {
    if (
      !this.controllerForm.get('name').hasError &&
      !this.controllerForm.get('location').hasError &&
      !this.controllerForm.get('protocol').hasError
    ) {
      this.toasterService.error('Please use correct values');
      return;
    }

    let controllerToAdd: Controller = new Controller();
    controllerToAdd.host = this.controllerIp;
    controllerToAdd.port = this.controllerPort;

    controllerToAdd.name = this.controllerForm.get('name').value;
    controllerToAdd.location = this.controllerForm.get('location').value;
    controllerToAdd.protocol = this.controllerForm.get('protocol').value;

    this.controllerService.create(controllerToAdd).then(
      (addedController: Controller) => {
        this.router.navigate(['/controller', addedController.id, 'project', this.projectId]);
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to create controller';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      }
    );
  }
}
