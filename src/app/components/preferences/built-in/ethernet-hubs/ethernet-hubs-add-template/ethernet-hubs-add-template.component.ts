import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { Compute } from '@models/compute';
import { Controller } from '@models/controller';
import { EthernetHubTemplate } from '@models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-hubs-add-template',
  templateUrl: './ethernet-hubs-add-template.component.html',
  styleUrl: './ethernet-hubs-add-template.component.scss',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatRadioModule, MatFormFieldModule, MatInputModule]
})
export class EthernetHubsAddTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private formBuilder = inject(UntypedFormBuilder);
  private computeService = inject(ComputeService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  templateName: string = '';
  formGroup: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;

  constructor() {
    this.formGroup = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      numberOfPorts: new UntypedFormControl(8, Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-hubs']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      let ethernetHubTemplate: EthernetHubTemplate;

      this.templateMocksService.getEthernetHubTemplate().subscribe((template: EthernetHubTemplate) => {
        ethernetHubTemplate = template;
      });

      ethernetHubTemplate.template_id = uuid();
      ethernetHubTemplate.name = this.formGroup.get('templateName').value;
      ethernetHubTemplate.compute_id = 'local';

      for (let i = 0; i < this.formGroup.get('numberOfPorts').value; i++) {
        ethernetHubTemplate.ports_mapping.push({
          name: `Ethernet${i}`,
          port_number: i,
        });
      }

      this.builtInTemplatesService.addTemplate(this.controller, ethernetHubTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
