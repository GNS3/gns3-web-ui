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
export class EthernetHubsTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  ethernetHubTemplate: EthernetHubTemplate;
  isSymbolSelectionOpened = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  categories: any[] = [];

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  symbol = model('');
  category = model('');
  numberOfPorts = model(0);
  tags = model<string[]>([]);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
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
          if (!this.ethernetHubTemplate.tags) {
            this.ethernetHubTemplate.tags = [];
          }

          // Initialize model signals
          this.templateName.set(ethernetHubTemplate.name || '');
          this.defaultName.set(ethernetHubTemplate.default_name_format || '');
          this.symbol.set(ethernetHubTemplate.symbol || '');
          this.category.set(ethernetHubTemplate.category || '');
          this.numberOfPorts.set(ethernetHubTemplate.ports_mapping.length || 0);
          this.tags.set(ethernetHubTemplate.tags || []);

          this.cd.markForCheck();
        });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-hubs']);
  }

  onSave() {
    // Update ethernetHubTemplate from model signals
    this.ethernetHubTemplate.name = this.templateName();
    this.ethernetHubTemplate.default_name_format = this.defaultName();
    this.ethernetHubTemplate.symbol = this.symbol();
    this.ethernetHubTemplate.category = this.category();
    this.ethernetHubTemplate.tags = this.tags();

    const numPorts = this.numberOfPorts();
    this.ethernetHubTemplate.ports_mapping = [];
    for (let i = 0; i < numPorts; i++) {
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
}
