import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-switches-add-template',
  templateUrl: './ethernet-switches-add-template.component.html',
  styleUrls: ['./ethernet-switches-add-template.component.scss', '../../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    SymbolsMenuComponent,
  ],
})
export class EthernetSwitchesAddTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  isSymbolSelectionOpened = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  categories: any[] = [];
  consoleTypes: string[] = [];

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  symbol = model('');
  category = model('');
  consoleType = model('');
  numberOfPorts = model(8);
  tags = model<string[]>([]);
  usage = model('');

  // Section collapse states
  generalSettingsExpanded = model(false);
  portsExpanded = model(false);
  usageExpanded = model(false);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
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
    const ethernetSwitchTemplate: EthernetSwitchTemplate = {
      template_id: uuid(),
      builtin: false,
      name: this.templateName(),
      default_name_format: this.defaultName(),
      symbol: this.symbol(),
      category: this.category(),
      console_type: this.consoleType(),
      compute_id: 'local',
      template_type: 'ethernet_switch',
      tags: this.tags(),
      usage: this.usage(),
      ports_mapping: [],
    };

    // Create port mappings
    const numPorts = this.numberOfPorts();
    for (let i = 0; i < numPorts; i++) {
      ethernetSwitchTemplate.ports_mapping.push({
        name: `Ethernet${i}`,
        port_number: i,
        ethertype: '0x8100',
        type: 'access',
        vlan: 1,
      });
    }

    this.builtInTemplatesService
      .addTemplate(this.controller, ethernetSwitchTemplate)
      .subscribe(() => {
        this.toasterService.success('Template added successfully');
        this.goBack();
      });
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = false;
    this.symbol.set(chosenSymbol);
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const currentTags = this.tags();

    if (value) {
      this.tags.set([...currentTags, value]);
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    const currentTags = this.tags();
    const index = currentTags.indexOf(tag);

    if (index >= 0) {
      const newTags = [...currentTags];
      newTags.splice(index, 1);
      this.tags.set(newTags);
    }
  }

  toggleSection(section: string): void {
    switch (section) {
      case 'general':
        this.generalSettingsExpanded.set(!this.generalSettingsExpanded());
        break;
      case 'ports':
        this.portsExpanded.set(!this.portsExpanded());
        break;
      case 'usage':
        this.usageExpanded.set(!this.usageExpanded());
        break;
    }
  }
}
