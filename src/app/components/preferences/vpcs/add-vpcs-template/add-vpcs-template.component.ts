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
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsService } from '@services/vpcs.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-vpcs-template',
  templateUrl: './add-vpcs-template.component.html',
  styleUrls: ['./add-vpcs-template.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatRadioModule, MatFormFieldModule, MatInputModule]
})
export class AddVpcsTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vpcsService = inject(VpcsService);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private formBuilder = inject(UntypedFormBuilder);
  private computeService = inject(ComputeService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  templateName: string = '';
  templateNameForm: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;

  constructor() {
    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, [Validators.required]),
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
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'vpcs', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.templateName = this.templateNameForm.get('templateName').value;

      let vpcsTemplate: VpcsTemplate;

      this.templateMocksService.getVpcsTemplate().subscribe((template: VpcsTemplate) => {
        vpcsTemplate = template;
      });

      (vpcsTemplate.template_id = uuid()),
      (vpcsTemplate.name = this.templateName),
      (vpcsTemplate.compute_id = 'local');

      this.vpcsService.addTemplate(this.controller, vpcsTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
