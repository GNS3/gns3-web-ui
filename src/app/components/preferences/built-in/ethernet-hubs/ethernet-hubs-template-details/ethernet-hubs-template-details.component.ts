import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { EthernetHubTemplate } from '@models/templates/ethernet-hub-template';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-hubs-template-details',
  templateUrl: './ethernet-hubs-template-details.component.html',
  styleUrl: './ethernet-hubs-template-details.component.scss',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, SymbolsMenuComponent]
})
export class EthernetHubsTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  ethernetHubTemplate: EthernetHubTemplate;
  numberOfPorts: number;
  inputForm: UntypedFormGroup;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  categories = [];

  constructor() {
    this.inputForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.categories = this.builtInTemplatesConfigurationService.getCategoriesForEthernetHubs();
      this.builtInTemplatesService
        .getTemplate(this.controller, template_id)
        .subscribe((ethernetHubTemplate: EthernetHubTemplate) => {
          this.ethernetHubTemplate = ethernetHubTemplate;
          if (!this.ethernetHubTemplate.ports_mapping) {
            this.ethernetHubTemplate.ports_mapping = [];
          }
          this.numberOfPorts = this.ethernetHubTemplate.ports_mapping.length;
          if (!this.ethernetHubTemplate.tags) {
            this.ethernetHubTemplate.tags = [];
          }
          // Fill form with template data
          this.inputForm.patchValue({
            templateName: this.ethernetHubTemplate.name || '',
            defaultName: this.ethernetHubTemplate.default_name_format || '',
            symbol: this.ethernetHubTemplate.symbol || '',
          });
          this.cd.markForCheck();
        });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-hubs']);
  }

  onSave() {
    if (this.inputForm.invalid || !this.numberOfPorts) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.ethernetHubTemplate.ports_mapping = [];
      for (let i = 0; i < this.numberOfPorts; i++) {
        this.ethernetHubTemplate.ports_mapping.push({
          name: `Ethernet${i}`,
          port_number: i,
        });
      }

      this.builtInTemplatesService
        .saveTemplate(this.controller, this.ethernetHubTemplate)
        .subscribe((ethernetHubTemplate: EthernetHubTemplate) => {
          this.toasterService.success('Changes saved');
        });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.ethernetHubTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.ethernetHubTemplate) {
      if (!this.ethernetHubTemplate.tags) {
        this.ethernetHubTemplate.tags = [];
      }
      this.ethernetHubTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.ethernetHubTemplate.tags) {
      return;
    }
    const index = this.ethernetHubTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.ethernetHubTemplate.tags.splice(index, 1);
    }
  }
}
