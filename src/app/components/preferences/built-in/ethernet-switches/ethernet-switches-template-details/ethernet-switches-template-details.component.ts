import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, inject } from '@angular/core';
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
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { PortsComponent } from '../../../common/ports/ports.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-switches-template-details',
  templateUrl: './ethernet-switches-template-details.component.html',
  styleUrls: ['./ethernet-switches-template-details.component.scss', '../../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, PortsComponent, SymbolsMenuComponent]
})
export class EthernetSwitchesTemplateDetailsComponent implements OnInit {
  @ViewChild(PortsComponent) portsComponent: PortsComponent;
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  ethernetSwitchTemplate: EthernetSwitchTemplate;
  inputForm: UntypedFormGroup;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  categories = [];
  consoleTypes: string[] = [];

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

      this.getConfiguration();
      this.builtInTemplatesService
        .getTemplate(this.controller, template_id)
        .subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
          this.ethernetSwitchTemplate = ethernetSwitchTemplate;
          if (!this.ethernetSwitchTemplate.tags) {
            this.ethernetSwitchTemplate.tags = [];
          }
          this.cd.markForCheck();
        });
    });
  }

  getConfiguration() {
    this.categories = this.builtInTemplatesConfigurationService.getCategoriesForEthernetSwitches();
    this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForEthernetSwitches();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-switches']);
  }

  onSave() {
    if (this.inputForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.ethernetSwitchTemplate.ports_mapping = this.portsComponent.ethernetPorts;
      this.builtInTemplatesService
        .saveTemplate(this.controller, this.ethernetSwitchTemplate)
        .subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
          this.toasterService.success('Changes saved');
        });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.ethernetSwitchTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.ethernetSwitchTemplate) {
      if (!this.ethernetSwitchTemplate.tags) {
        this.ethernetSwitchTemplate.tags = [];
      }
      this.ethernetSwitchTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.ethernetSwitchTemplate.tags) {
      return;
    }
    const index = this.ethernetSwitchTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.ethernetSwitchTemplate.tags.splice(index, 1);
    }
  }
}
