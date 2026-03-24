import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from "../../../../common/progress/progress.service";
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ios-template-details',
  templateUrl: './ios-template-details.component.html',
  styleUrls: ['./ios-template-details.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatExpansionModule, SymbolsMenuComponent]
})
export class IosTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private iosConfigurationService = inject(IosConfigurationService);
  private progressService = inject(ProgressService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  iosTemplate: IosTemplate;
  isSymbolSelectionOpened: boolean = false;
  platforms: string[] = [];
  consoleTypes: string[] = [];
  categories = [];
  platformsWithEtherSwitchRouterOption = {};
  platformsWithChassis = {};
  chassis = {};
  defaultRam = {};
  defaultNvram = {};
  networkAdaptersForTemplate: string[] = [];
  wicsForTemplate: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  generalSettingsForm: UntypedFormGroup;
  memoryForm: UntypedFormGroup;
  advancedForm: UntypedFormGroup;

  // Section collapse states
  generalSettingsExpanded: boolean = true;
  memoryExpanded: boolean = true;
  slotsExpanded: boolean = true;
  advancedExpanded: boolean = true;
  usageExpanded: boolean = false;

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
      path: new UntypedFormControl('', Validators.required),
      initialConfig: new UntypedFormControl('', Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ram: new UntypedFormControl('', Validators.required),
      nvram: new UntypedFormControl('', Validators.required),
      iomemory: new UntypedFormControl(''),
      disk0: new UntypedFormControl('', Validators.required),
      disk1: new UntypedFormControl('', Validators.required),
    });

    this.advancedForm = this.formBuilder.group({
      systemId: new UntypedFormControl('', Validators.required),
      idlemax: new UntypedFormControl('', Validators.required),
      idlesleep: new UntypedFormControl('', Validators.required),
      execarea: new UntypedFormControl('', Validators.required),
      idlepc: new UntypedFormControl('', Validators.pattern(this.iosConfigurationService.getIdlepcRegex())),
      mac_addr: new UntypedFormControl('', Validators.pattern(this.iosConfigurationService.getMacAddrRegex())),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.iosService.getTemplate(this.controller, template_id).subscribe((iosTemplate: IosTemplate) => {
        this.iosTemplate = iosTemplate;
        if (!this.iosTemplate.tags) {
          this.iosTemplate.tags = [];
        }
        this.fillSlotsData();
        this.cd.markForCheck();
      });
    });
  }

  getConfiguration() {
    this.platforms = this.iosConfigurationService.getAvailablePlatforms();
    this.platformsWithEtherSwitchRouterOption = this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption();
    this.platformsWithChassis = this.iosConfigurationService.getPlatformsWithChassis();
    this.chassis = this.iosConfigurationService.getChassis();
    this.defaultRam = this.iosConfigurationService.getDefaultRamSettings();
    this.consoleTypes = this.iosConfigurationService.getConsoleTypes();
    this.categories = this.iosConfigurationService.getCategories();
    this.adapterMatrix = this.iosConfigurationService.getAdapterMatrix();
    this.wicMatrix = this.iosConfigurationService.getWicMatrix();
  }

  findIdlePC() {
    let data = {
      "image": this.iosTemplate.image,
      "platform": this.iosTemplate.platform,
      "ram": this.iosTemplate.ram
    };
    this.progressService.activate();
    this.iosService.findIdlePC(this.controller, data).subscribe((result: any) => {
      this.progressService.deactivate();
      if (result.idlepc !== null) {
        this.iosTemplate.idlepc = result.idlepc;
        this.toasterService.success(`Idle-PC value found: ${result.idlepc}`);
      }
    },
      (error) => {
        this.progressService.deactivate();
        this.toasterService.error(`Error while finding an idle-PC value`);
      }
      );
  }

  generateBaseMAC() {
    // Generate a random MAC address in format xxxx.xxxx.xxxx
    const hexChars = '0123456789abcdef';
    let mac = '';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        mac += hexChars[Math.floor(Math.random() * 16)];
      }
      if (i < 2) {
        mac += '.';
      }
    }
    this.iosTemplate.mac_addr = mac;
    this.toasterService.success(`Base MAC generated: ${mac}`);
  }

  fillSlotsData() {

    // load network adapters
    for (let i = 0; i <= 6; i++) {
      if (this.iosTemplate[`slot${i}`]) {
        this.networkAdaptersForTemplate[i] = this.iosTemplate[`slot${i}`];
      }
    }

    // load WICs
    for (let i = 0; i <= 3; i++) {
      if (this.iosTemplate[`wic${i}`]) {
        this.wicsForTemplate[i] = this.iosTemplate[`wic${i}`];
      }
    }
  }

  saveSlotsData() {

    // save network adapters
    for (let i = 0; i <= 6; i++) {
      const slotAdapters = this.adapterMatrix?.[this.iosTemplate.platform]?.[this.iosTemplate.chassis || '']?.[i];
      if (slotAdapters) {
        if (this.networkAdaptersForTemplate[i] === undefined)
          this.iosTemplate[`slot${i}`] = ""
        else
          this.iosTemplate[`slot${i}`] = this.networkAdaptersForTemplate[i];
      } else {
        // Remove slot properties that don't exist on this platform/chassis
        delete this.iosTemplate[`slot${i}`];
      }
    }

    // save WICs
    for (let i = 0; i <= 3; i++) {
      const wicAdapters = this.wicMatrix?.[this.iosTemplate.platform]?.[i];
      if (wicAdapters) {
        if (this.wicsForTemplate[i] === undefined)
          this.iosTemplate[`wic${i}`] = ""
        else
          this.iosTemplate[`wic${i}`] = this.wicsForTemplate[i];
      } else {
        // Remove WIC properties that don't exist on this platform
        delete this.iosTemplate[`wic${i}`];
      }
    }
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.memoryForm.invalid || this.advancedForm.invalid) {
      const missingFields: string[] = [];

      // Check general settings form
      if (this.generalSettingsForm.get('templateName').invalid) {
        missingFields.push('Template name');
      }
      if (this.generalSettingsForm.get('defaultName').invalid) {
        missingFields.push('Default name format');
      }
      if (this.generalSettingsForm.get('symbol').invalid) {
        missingFields.push('Symbol');
      }
      if (this.generalSettingsForm.get('path').invalid) {
        missingFields.push('IOS image path');
      }
      if (this.generalSettingsForm.get('initialConfig').invalid) {
        missingFields.push('Initial startup-config');
      }

      // Check memory form
      if (this.memoryForm.get('ram').invalid) {
        missingFields.push('RAM size');
      }
      if (this.memoryForm.get('nvram').invalid) {
        missingFields.push('NVRAM size');
      }
      if (this.memoryForm.get('disk0').invalid) {
        missingFields.push('PCMCIA disk0');
      }
      if (this.memoryForm.get('disk1').invalid) {
        missingFields.push('PCMCIA disk1');
      }

      // Check advanced form
      if (this.advancedForm.get('systemId').invalid) {
        missingFields.push('System ID');
      }
      if (this.advancedForm.get('mac_addr').invalid) {
        missingFields.push('Base MAC (format: xxxx.xxxx.xxxx)');
      }
      if (this.advancedForm.get('idlemax').invalid) {
        missingFields.push('Idlemax');
      }
      if (this.advancedForm.get('idlesleep').invalid) {
        missingFields.push('Idlesleep');
      }
      if (this.advancedForm.get('execarea').invalid) {
        missingFields.push('Exec area');
      }

      this.toasterService.error(`Missing required fields: ${missingFields.join(', ')}`);
    } else {
      this.saveSlotsData();

      this.iosService.saveTemplate(this.controller, this.iosTemplate).subscribe((iosTemplate: IosTemplate) => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'dynamips', 'templates']);
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.iosTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.iosTemplate) {
      if (!this.iosTemplate.tags) {
        this.iosTemplate.tags = [];
      }
      this.iosTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.iosTemplate.tags) {
      return;
    }
    const index = this.iosTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.iosTemplate.tags.splice(index, 1);
    }
  }

  toggleSection(section: string): void {
    switch (section) {
      case 'general':
        this.generalSettingsExpanded = !this.generalSettingsExpanded;
        break;
      case 'memory':
        this.memoryExpanded = !this.memoryExpanded;
        break;
      case 'slots':
        this.slotsExpanded = !this.slotsExpanded;
        break;
      case 'advanced':
        this.advancedExpanded = !this.advancedExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }
}
