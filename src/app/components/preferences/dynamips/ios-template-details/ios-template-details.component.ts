import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
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
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from '../../../../common/progress/progress.service';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ios-template-details',
  templateUrl: './ios-template-details.component.html',
  styleUrls: ['./ios-template-details.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
  ],
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
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  controller: Controller;
  iosTemplate: IosTemplate;
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
  generalSettingsExpanded: boolean = false;
  memoryExpanded: boolean = false;
  slotsExpanded: boolean = false;
  advancedExpanded: boolean = false;
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
      mmap: new UntypedFormControl(true),
      sparsemem: new UntypedFormControl(true),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();

        this.getConfiguration();
        this.iosService.getTemplate(this.controller, template_id).subscribe({
          next: (iosTemplate: IosTemplate) => {
            this.iosTemplate = iosTemplate;
            if (!this.iosTemplate.tags) {
              this.iosTemplate.tags = [];
            }
            this.fillSlotsData();
            this.populateForms();
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load template';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
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
      image: this.iosTemplate.image,
      platform: this.iosTemplate.platform,
      ram: this.iosTemplate.ram,
    };
    this.progressService.activate();
    this.iosService.findIdlePC(this.controller, data).subscribe(
      (result: any) => {
        this.progressService.deactivate();
        if (result.idlepc !== null) {
          this.iosTemplate.idlepc = result.idlepc;
          this.advancedForm.get('idlepc').setValue(result.idlepc);
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
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    let mac = '';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const byteIndex = i * 2 + Math.floor(j / 2);
        const nibbleIndex = j % 2;
        const nibble = (randomBytes[byteIndex] >> (nibbleIndex * 4)) & 0x0f;
        mac += hexChars[nibble];
      }
      if (i < 2) {
        mac += '.';
      }
    }
    this.iosTemplate.mac_addr = mac;
    this.advancedForm.get('mac_addr').setValue(mac);
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

  populateForms() {
    this.generalSettingsForm.patchValue({
      templateName: this.iosTemplate.name,
      defaultName: this.iosTemplate.default_name_format,
      symbol: this.iosTemplate.symbol,
      path: this.iosTemplate.image,
      initialConfig: this.iosTemplate.startup_config,
    });

    this.memoryForm.patchValue({
      ram: this.iosTemplate.ram,
      nvram: this.iosTemplate.nvram,
      disk0: this.iosTemplate.disk0,
      disk1: this.iosTemplate.disk1,
    });

    this.advancedForm.patchValue({
      systemId: this.iosTemplate.system_id,
      idlemax: this.iosTemplate.idlemax,
      idlesleep: this.iosTemplate.idlesleep,
      execarea: this.iosTemplate.exec_area,
      idlepc: this.iosTemplate.idlepc,
      mac_addr: this.iosTemplate.mac_addr,
      mmap: this.iosTemplate.mmap,
      sparsemem: this.iosTemplate.sparsemem,
    });
  }

  saveSlotsData() {
    // save network adapters
    for (let i = 0; i <= 6; i++) {
      const slotAdapters = this.adapterMatrix?.[this.iosTemplate.platform]?.[this.iosTemplate.chassis || '']?.[i];
      if (slotAdapters) {
        if (this.networkAdaptersForTemplate[i] === undefined) this.iosTemplate[`slot${i}`] = '';
        else this.iosTemplate[`slot${i}`] = this.networkAdaptersForTemplate[i];
      } else {
        // Remove slot properties that don't exist on this platform/chassis
        delete this.iosTemplate[`slot${i}`];
      }
    }

    // save WICs
    for (let i = 0; i <= 3; i++) {
      const wicAdapters = this.wicMatrix?.[this.iosTemplate.platform]?.[i];
      if (wicAdapters) {
        if (this.wicsForTemplate[i] === undefined) this.iosTemplate[`wic${i}`] = '';
        else this.iosTemplate[`wic${i}`] = this.wicsForTemplate[i];
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

      // Update iosTemplate from form values
      this.iosTemplate.name = this.generalSettingsForm.get('templateName').value;
      this.iosTemplate.default_name_format = this.generalSettingsForm.get('defaultName').value;
      this.iosTemplate.symbol = this.generalSettingsForm.get('symbol').value;
      this.iosTemplate.image = this.generalSettingsForm.get('path').value;
      this.iosTemplate.startup_config = this.generalSettingsForm.get('initialConfig').value;
      this.iosTemplate.ram = this.memoryForm.get('ram').value;
      this.iosTemplate.nvram = this.memoryForm.get('nvram').value;
      this.iosTemplate.disk0 = this.memoryForm.get('disk0').value;
      this.iosTemplate.disk1 = this.memoryForm.get('disk1').value;
      this.iosTemplate.system_id = this.advancedForm.get('systemId').value;
      this.iosTemplate.idlemax = this.advancedForm.get('idlemax').value;
      this.iosTemplate.idlesleep = this.advancedForm.get('idlesleep').value;
      this.iosTemplate.exec_area = this.advancedForm.get('execarea').value;
      this.iosTemplate.idlepc = this.advancedForm.get('idlepc').value;
      this.iosTemplate.mac_addr = this.advancedForm.get('mac_addr').value;
      this.iosTemplate.mmap = this.advancedForm.get('mmap').value;
      this.iosTemplate.sparsemem = this.advancedForm.get('sparsemem').value;

      this.iosService.saveTemplate(this.controller, this.iosTemplate).subscribe({
        next: (iosTemplate: IosTemplate) => {
          this.toasterService.success('Changes saved');
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to save template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'dynamips', 'templates']);
  }

  chooseSymbol() {
    const dialogConfig = this.dialogConfig.openConfig('templateSymbol', {
      autoFocus: false,
      disableClose: false,
      data: {
        controller: this.controller,
        symbol: this.iosTemplate.symbol,
      },
    });
    const dialogRef = this.dialog.open(TemplateSymbolDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.iosTemplate.symbol = result;
        this.generalSettingsForm.get('symbol').setValue(result);
      }
    });
  }

  symbolChanged(chosenSymbol: string) {
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
