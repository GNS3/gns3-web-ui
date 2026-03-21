import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, viewChild } from '@angular/core';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VirtualBoxConfigurationService } from '@services/virtual-box-configuration.service';
import { VirtualBoxService } from '@services/virtual-box.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-virtual-box-template-details',
  templateUrl: './virtual-box-template-details.component.html',
  styleUrls: ['./virtual-box-template-details.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    CustomAdaptersComponent,
    SymbolsMenuComponent,
  ],
})
export class VirtualBoxTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private virtualBoxService = inject(VirtualBoxService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private virtualBoxConfigurationService = inject(VirtualBoxConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  virtualBoxTemplate: VirtualBoxTemplate;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  onCloseOptions = [];
  categories = [];
  networkTypes = [];
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  isConfiguratorOpened: boolean = false;
  generalSettingsForm: UntypedFormGroup;
  networkForm: UntypedFormGroup;

  readonly customAdaptersConfigurator = viewChild<CustomAdaptersComponent>('customAdaptersConfigurator');

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
      ram: new UntypedFormControl('', Validators.required),
    });

    this.networkForm = this.formBuilder.group({
      adapters: new UntypedFormControl('', Validators.required),
      nameFormat: new UntypedFormControl('', Validators.required),
      size: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.virtualBoxService
        .getTemplate(this.controller, template_id)
        .subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
          this.virtualBoxTemplate = virtualBoxTemplate;
          if (!this.virtualBoxTemplate.tags) {
            this.virtualBoxTemplate.tags = [];
          }
          this.fillCustomAdapters();
          this.cd.markForCheck();
        });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
    this.categories = this.virtualBoxConfigurationService.getCategories();
    this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
  }

  setCustomAdaptersConfiguratorState(state: boolean) {
    this.isConfiguratorOpened = state;

    if (state) {
      this.fillCustomAdapters();
      this.customAdaptersConfigurator().numberOfAdapters = this.virtualBoxTemplate.adapters;
      this.customAdaptersConfigurator().adapters = [];
      this.virtualBoxTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
        this.customAdaptersConfigurator().adapters.push({
          adapter_number: adapter.adapter_number,
          adapter_type: adapter.adapter_type,
        });
      });
    }
  }

  saveCustomAdapters(adapters: CustomAdapter[]) {
    this.setCustomAdaptersConfiguratorState(false);
    this.virtualBoxTemplate.custom_adapters = adapters;
  }

  fillCustomAdapters() {
    let copyOfAdapters = this.virtualBoxTemplate.custom_adapters ? this.virtualBoxTemplate.custom_adapters : [];
    this.virtualBoxTemplate.custom_adapters = [];

    for (let i = 0; i < this.virtualBoxTemplate.adapters; i++) {
      if (copyOfAdapters[i]) {
        this.virtualBoxTemplate.custom_adapters.push(copyOfAdapters[i]);
      } else {
        this.virtualBoxTemplate.custom_adapters.push({
          adapter_number: i,
          adapter_type: 'e1000',
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'virtualbox', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.networkForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.fillCustomAdapters();

      this.virtualBoxService
        .saveTemplate(this.controller, this.virtualBoxTemplate)
        .subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
          this.toasterService.success('Changes saved');
        });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.virtualBoxTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.virtualBoxTemplate) {
      if (!this.virtualBoxTemplate.tags) {
        this.virtualBoxTemplate.tags = [];
      }
      this.virtualBoxTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.virtualBoxTemplate.tags) {
      return;
    }
    const index = this.virtualBoxTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.virtualBoxTemplate.tags.splice(index, 1);
    }
  }
}
