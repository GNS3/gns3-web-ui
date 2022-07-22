import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import{ Controller } from '../../../../models/controller';
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

  networkAdaptersForTemplate: string[] = [];
  platforms: string[] = [];
  consoleTypes: string[] = [];
  platformsWithEtherSwitchRouterOption = {};
  platformsWithChassis = {};
  chassis = {};
  defaultRam = {};
  defaultNvram = {};
  networkAdapters = {};
  networkAdaptersForPlatform = {};
  networkModules = {};

  generalSettingsForm: FormGroup;
  memoryForm: FormGroup;
  advancedForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iosService: IosService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private iosConfigurationService: IosConfigurationService,
    private router: Router
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      defaultName: new FormControl('', Validators.required),
      symbol: new FormControl('', Validators.required),
      path: new FormControl('', Validators.required),
      initialConfig: new FormControl('', Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ram: new FormControl('', Validators.required),
      nvram: new FormControl('', Validators.required),
      iomemory: new FormControl('', Validators.required),
      disk0: new FormControl('', Validators.required),
      disk1: new FormControl('', Validators.required),
    });

    this.advancedForm = this.formBuilder.group({
      systemId: new FormControl('', Validators.required),
      idlemax: new FormControl('', Validators.required),
      idlesleep: new FormControl('', Validators.required),
      execarea: new FormControl('', Validators.required),
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

        this.fillAdaptersData();
      });
    });
  }

  getConfiguration() {
    this.networkModules = this.iosConfigurationService.getNetworkModules();
    this.networkAdaptersForPlatform = this.iosConfigurationService.getNetworkAdaptersForPlatform();
    this.networkAdapters = this.iosConfigurationService.getNetworkAdapters();
    this.platforms = this.iosConfigurationService.getAvailablePlatforms();
    this.platformsWithEtherSwitchRouterOption = this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption();
    this.platformsWithChassis = this.iosConfigurationService.getPlatformsWithChassis();
    this.chassis = this.iosConfigurationService.getChassis();
    this.defaultRam = this.iosConfigurationService.getDefaultRamSettings();
    this.consoleTypes = this.iosConfigurationService.getConsoleTypes();
  }

  fillAdaptersData() {
    if (this.iosTemplate.slot0) this.networkAdaptersForTemplate[0] = this.iosTemplate.slot0;
    if (this.iosTemplate.slot1) this.networkAdaptersForTemplate[1] = this.iosTemplate.slot1;
    if (this.iosTemplate.slot2) this.networkAdaptersForTemplate[2] = this.iosTemplate.slot2;
    if (this.iosTemplate.slot3) this.networkAdaptersForTemplate[3] = this.iosTemplate.slot3;
    if (this.iosTemplate.slot4) this.networkAdaptersForTemplate[4] = this.iosTemplate.slot4;
    if (this.iosTemplate.slot5) this.networkAdaptersForTemplate[5] = this.iosTemplate.slot5;
    if (this.iosTemplate.slot6) this.networkAdaptersForTemplate[6] = this.iosTemplate.slot6;
    if (this.iosTemplate.slot7) this.networkAdaptersForTemplate[7] = this.iosTemplate.slot7;
  }

  completeAdaptersData() {
    if (this.networkAdaptersForTemplate[0]) this.iosTemplate.slot0 = this.networkAdaptersForTemplate[0];
    if (this.networkAdaptersForTemplate[1]) this.iosTemplate.slot1 = this.networkAdaptersForTemplate[1];
    if (this.networkAdaptersForTemplate[2]) this.iosTemplate.slot2 = this.networkAdaptersForTemplate[2];
    if (this.networkAdaptersForTemplate[3]) this.iosTemplate.slot3 = this.networkAdaptersForTemplate[3];
    if (this.networkAdaptersForTemplate[4]) this.iosTemplate.slot4 = this.networkAdaptersForTemplate[4];
    if (this.networkAdaptersForTemplate[5]) this.iosTemplate.slot5 = this.networkAdaptersForTemplate[5];
    if (this.networkAdaptersForTemplate[6]) this.iosTemplate.slot6 = this.networkAdaptersForTemplate[6];
    if (this.networkAdaptersForTemplate[7]) this.iosTemplate.slot7 = this.networkAdaptersForTemplate[7];
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.memoryForm.invalid || this.advancedForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.completeAdaptersData();

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
