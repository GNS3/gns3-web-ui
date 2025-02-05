import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Controller } from '../../../../models/controller';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';
import { IosService } from '../../../../services/ios.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-ios-template-details',
  templateUrl: './ios-template-details.component.html',
  styleUrls: ['./ios-template-details.component.scss', '../../preferences.component.scss'],
})
export class IosTemplateDetailsComponent implements OnInit {
  controller:Controller ;
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

  generalSettingsForm: UntypedFormGroup;
  memoryForm: UntypedFormGroup;
  advancedForm: UntypedFormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iosService: IosService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private iosConfigurationService: IosConfigurationService,
    private router: Router
  ) {
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
      iomemory: new UntypedFormControl('', Validators.required),
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
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.getConfiguration();
      this.iosService.getTemplate(this.controller, template_id).subscribe((iosTemplate: IosTemplate) => {
        this.iosTemplate = iosTemplate;
        this.fillSlotsData();
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
      if (this.adapterMatrix[this.iosTemplate.platform][this.iosTemplate.chassis || ''][i]) {
        if (this.networkAdaptersForTemplate[i] === undefined)
          this.iosTemplate[`slot${i}`] = ""
        else
          this.iosTemplate[`slot${i}`] = this.networkAdaptersForTemplate[i];
      }
    }

    // save WICs
    for (let i = 0; i <= 3; i++) {
      if (this.wicMatrix[this.iosTemplate.platform][i]) {
        if (this.wicsForTemplate[i] === undefined)
          this.iosTemplate[`wic${i}`] = ""
        else
          this.iosTemplate[`wic${i}`] = this.wicsForTemplate[i];
      }
    }
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.memoryForm.invalid || this.advancedForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
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
}
