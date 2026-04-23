import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-switches-add-template',
  templateUrl: './ethernet-switches-add-template.component.html',
  styleUrl: './ethernet-switches-add-template.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class EthernetSwitchesAddTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
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
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-switches']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      const ethernetSwitchTemplate: EthernetSwitchTemplate = {
        template_id: uuid(),
        builtin: false,
        name: this.formGroup.get('templateName').value,
        compute_id: 'local',
        template_type: 'ethernet_switch',
        category: 'switch',
        console_type: 'none',
        default_name_format: 'Switch{0}',
        symbol: 'ethernet_switch',
        ports_mapping: [],
        tags: [],
        usage: '',
      };

      const numPorts = this.formGroup.get('numberOfPorts').value;
      for (let i = 0; i < numPorts; i++) {
        ethernetSwitchTemplate.ports_mapping.push({
          name: `Ethernet${i}`,
          port_number: i,
          ethertype: '0x8100',
          type: 'access',
          vlan: 1,
        });
      }

      this.builtInTemplatesService.addTemplate(this.controller, ethernetSwitchTemplate).subscribe({
        next: () => {
          this.toasterService.success('Template added successfully');
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add ethernet switch template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
