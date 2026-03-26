import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, model, inject } from '@angular/core';
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
    PortsComponent,
    SymbolsMenuComponent,
  ],
})
export class EthernetSwitchesTemplateDetailsComponent implements OnInit {
  @ViewChild(PortsComponent) portsComponent: PortsComponent;
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  ethernetSwitchTemplate: EthernetSwitchTemplate;
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
  tags = model<string[]>([]);
  usage = model('');

  // Section collapse states
  generalSettingsExpanded = model(false);
  usageExpanded = model(false);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
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

          // Initialize model signals
          this.templateName.set(ethernetSwitchTemplate.name || '');
          this.defaultName.set(ethernetSwitchTemplate.default_name_format || '');
          this.symbol.set(ethernetSwitchTemplate.symbol || '');
          this.category.set(ethernetSwitchTemplate.category || '');
          this.consoleType.set(ethernetSwitchTemplate.console_type || '');
          this.tags.set(ethernetSwitchTemplate.tags || []);
          this.usage.set(ethernetSwitchTemplate.usage || '');

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
    // Update ethernetSwitchTemplate from model signals
    this.ethernetSwitchTemplate.name = this.templateName();
    this.ethernetSwitchTemplate.default_name_format = this.defaultName();
    this.ethernetSwitchTemplate.symbol = this.symbol();
    this.ethernetSwitchTemplate.category = this.category();
    this.ethernetSwitchTemplate.console_type = this.consoleType();
    this.ethernetSwitchTemplate.tags = this.tags();
    this.ethernetSwitchTemplate.usage = this.usage();

    this.ethernetSwitchTemplate.ports_mapping = this.portsComponent.ethernetPorts;
    this.builtInTemplatesService
      .saveTemplate(this.controller, this.ethernetSwitchTemplate)
      .subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
        this.toasterService.success('Changes saved');
      });
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
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
      case 'usage':
        this.usageExpanded.set(!this.usageExpanded());
        break;
    }
  }
}
