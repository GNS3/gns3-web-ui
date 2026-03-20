import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';
import { VpcsService } from '@services/vpcs.service';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vpcs-template-details',
  templateUrl: './vpcs-template-details.component.html',
  styleUrls: ['./vpcs-template-details.component.scss', '../../preferences.component.scss'],
})
export class VpcsTemplateDetailsComponent implements OnInit {
  controller: Controller;
  vpcsTemplate: VpcsTemplate;
  inputForm: UntypedFormGroup;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  categories = [];

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private vpcsService: VpcsService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private vpcsConfigurationService: VpcsConfigurationService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.inputForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      scriptFile: new UntypedFormControl('', Validators.required),
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
      this.vpcsService.getTemplate(this.controller, template_id).subscribe((vpcsTemplate: VpcsTemplate) => {
        this.vpcsTemplate = vpcsTemplate;
        if (!this.vpcsTemplate.tags) {
          this.vpcsTemplate.tags = [];
        }
        this.cd.markForCheck();
      });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
    this.categories = this.vpcsConfigurationService.getCategories();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'vpcs', 'templates']);
  }

  onSave() {
    if (this.inputForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.vpcsService.saveTemplate(this.controller, this.vpcsTemplate).subscribe((vpcsTemplate: VpcsTemplate) => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.vpcsTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.vpcsTemplate) {
      if (!this.vpcsTemplate.tags) {
        this.vpcsTemplate.tags = [];
      }
      this.vpcsTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.vpcsTemplate.tags) {
      return;
    }
    const index = this.vpcsTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.vpcsTemplate.tags.splice(index, 1);
    }
  }
}
