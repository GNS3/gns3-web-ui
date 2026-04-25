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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-copy-ios-template',
  templateUrl: './copy-ios-template.component.html',
  styleUrls: ['./copy-ios-template.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class CopyIosTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);
  controller: Controller;
  templateName: string = '';
  iosTemplate: IosTemplate;
  formGroup: UntypedFormGroup;

  constructor() {
    this.formGroup = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();

        this.iosService.getTemplate(this.controller, template_id).subscribe({
          next: (iosTemplate: IosTemplate) => {
            this.iosTemplate = iosTemplate;
            this.templateName = `Copy of ${this.iosTemplate.name}`;
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load template';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'dynamips', 'templates']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      this.iosTemplate.template_id = uuid();
      this.iosTemplate.name = this.formGroup.get('templateName').value;

      this.iosService.addTemplate(this.controller, this.iosTemplate).subscribe({
        next: (template: IosTemplate) => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to copy ios template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
