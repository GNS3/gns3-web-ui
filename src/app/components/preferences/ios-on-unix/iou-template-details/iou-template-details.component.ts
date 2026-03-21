import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';
import { IouConfigurationService } from '@services/iou-configuration.service';
import { IouService } from '@services/iou.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-iou-template-details',
  templateUrl: './iou-template-details.component.html',
  styleUrls: ['./iou-template-details.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, SymbolsMenuComponent]
})
export class IouTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iouService = inject(IouService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(IouConfigurationService);
  private router = inject(Router);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);
  controller: Controller;
  iouTemplate: IouTemplate;

  isSymbolSelectionOpened: boolean = false;
  defaultSettings: boolean = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  consoleTypes: string[] = [];
  consoleResolutions: string[] = [];
  categories = [];

  generalSettingsForm: UntypedFormGroup;
  networkForm: UntypedFormGroup;

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
      path: new UntypedFormControl('', Validators.required),
      initialConfig: new UntypedFormControl('', Validators.required),
    });

    this.networkForm = this.formBuilder.group({
      ethernetAdapters: new UntypedFormControl('', Validators.required),
      serialAdapters: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.iouService.getTemplate(this.controller, template_id).subscribe((iouTemplate: IouTemplate) => {
        this.iouTemplate = iouTemplate;
        if (!this.iouTemplate.tags) {
          this.iouTemplate.tags = [];
        }
        this.cd.markForCheck();
      });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.categories = this.configurationService.getCategories();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'iou', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.networkForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.iouService.saveTemplate(this.controller, this.iouTemplate).subscribe(() => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  uploadImageFile(event) {
    this.iouTemplate.path = event.target.files[0].name;
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.iouTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.iouTemplate) {
      if (!this.iouTemplate.tags) {
        this.iouTemplate.tags = [];
      }
      this.iouTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.iouTemplate.tags) {
      return;
    }
    const index = this.iouTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.iouTemplate.tags.splice(index, 1);
    }
  }
}
