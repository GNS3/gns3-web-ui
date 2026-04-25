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
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { Compute } from '@models/compute';
import { Controller } from '@models/controller';
import { CloudTemplate } from '@models/templates/cloud-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cloud-nodes-add-template',
  templateUrl: './cloud-nodes-add-template.component.html',
  styleUrls: ['./cloud-nodes-add-template.component.scss', '../../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class CloudNodesAddTemplateComponent implements OnInit {
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
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'cloud-nodes']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      let cloudTemplate: CloudTemplate;

      this.templateMocksService.getCloudNodeTemplate().subscribe({
        next: (template: CloudTemplate) => {
          cloudTemplate = template;
          cloudTemplate.template_id = uuid();
          cloudTemplate.name = this.formGroup.get('templateName').value;
          cloudTemplate.compute_id = 'local';

          this.builtInTemplatesService.addTemplate(this.controller, cloudTemplate).subscribe({
            next: () => {
              this.goBack();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to add cloud node template';
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
