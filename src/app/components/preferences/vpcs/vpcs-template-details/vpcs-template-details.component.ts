import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';
import { VpcsService } from '@services/vpcs.service';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vpcs-template-details',
  templateUrl: './vpcs-template-details.component.html',
  styleUrls: ['./vpcs-template-details.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatChipsModule, SymbolsMenuComponent]
})
export class VpcsTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vpcsService = inject(VpcsService);
  private toasterService = inject(ToasterService);
  private vpcsConfigurationService = inject(VpcsConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  vpcsTemplate: VpcsTemplate;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  categories = [];

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  scriptFile = model('');
  symbol = model('');
  category = model('');
  consoleType = model('');
  consoleAutoStart = model(false);

  // Usage & Tags
  tags = model<string[]>([]);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.vpcsService.getTemplate(this.controller, template_id).subscribe((vpcsTemplate: VpcsTemplate) => {
        this.vpcsTemplate = vpcsTemplate;
        if (!this.vpcsTemplate.tags) {
          this.vpcsTemplate.tags = [];
        }
        this.initFormFromTemplate();
        this.cd.markForCheck();
      });
    });
  }

  initFormFromTemplate() {
    this.templateName.set(this.vpcsTemplate.name || '');
    this.defaultName.set(this.vpcsTemplate.default_name_format || '');
    this.scriptFile.set(this.vpcsTemplate.base_script_file || '');
    this.symbol.set(this.vpcsTemplate.symbol || '');
    this.category.set(this.vpcsTemplate.category || '');
    this.consoleType.set(this.vpcsTemplate.console_type || '');
    this.consoleAutoStart.set(this.vpcsTemplate.console_auto_start || false);
    this.tags.set(this.vpcsTemplate.tags || []);
  }

  getConfiguration() {
    this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
    this.categories = this.vpcsConfigurationService.getCategories();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'vpcs', 'templates']);
  }

  onSave() {
    if (!this.templateName() || !this.defaultName() || !this.scriptFile() || !this.symbol()) {
      const missingFields: string[] = [];
      if (!this.templateName()) missingFields.push('Template name');
      if (!this.defaultName()) missingFields.push('Default name format');
      if (!this.scriptFile()) missingFields.push('Base script file');
      if (!this.symbol()) missingFields.push('Symbol');
      this.toasterService.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Update vpcsTemplate from model signals
    this.vpcsTemplate.name = this.templateName();
    this.vpcsTemplate.default_name_format = this.defaultName();
    this.vpcsTemplate.base_script_file = this.scriptFile();
    this.vpcsTemplate.symbol = this.symbol();
    this.vpcsTemplate.category = this.category();
    this.vpcsTemplate.console_type = this.consoleType();
    this.vpcsTemplate.console_auto_start = this.consoleAutoStart();
    this.vpcsTemplate.tags = this.tags();

    this.vpcsService.saveTemplate(this.controller, this.vpcsTemplate).subscribe((vpcsTemplate: VpcsTemplate) => {
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