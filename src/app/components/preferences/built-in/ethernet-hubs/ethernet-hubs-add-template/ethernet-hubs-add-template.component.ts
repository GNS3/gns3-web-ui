import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, model } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { EthernetHubTemplate } from '@models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { TemplateInfoFieldsComponent } from '../../../common/template-info-fields/template-info-fields.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-hubs-add-template',
  templateUrl: './ethernet-hubs-add-template.component.html',
  styleUrl: './ethernet-hubs-add-template.component.scss',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    TemplateInfoFieldsComponent,
  ],
})
export class EthernetHubsAddTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller?: Controller;
  templateName: string = '';
  formGroup: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;
  usage = model('');
  symbol = model('hub');

  constructor() {
    this.formGroup = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      numberOfPorts: new UntypedFormControl(8, Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  goBack() {
    const controllerId = this.controller?.id ?? parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);
    this.router.navigate(['/controller', controllerId, 'preferences']);
  }

  addTemplate() {
    if (!this.formGroup.invalid && this.controller) {
      this.templateMocksService.getEthernetHubTemplate().subscribe({
        next: (ethernetHubTemplate: EthernetHubTemplate) => {
          ethernetHubTemplate.template_id = uuid();
          ethernetHubTemplate.name = this.formGroup.get('templateName').value;
          ethernetHubTemplate.compute_id = 'local';
          ethernetHubTemplate.usage = this.usage();
          ethernetHubTemplate.symbol = this.symbol();

          for (let i = 0; i < this.formGroup.get('numberOfPorts').value; i++) {
            ethernetHubTemplate.ports_mapping.push({
              name: `Ethernet${i}`,
              port_number: i,
            });
          }

          this.builtInTemplatesService.addTemplate(this.controller, ethernetHubTemplate).subscribe({
            next: () => {
              this.goBack();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to add ethernet hub template';
              this.toasterService.error(message);
              this.cd.markForCheck();
            },
          });
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
