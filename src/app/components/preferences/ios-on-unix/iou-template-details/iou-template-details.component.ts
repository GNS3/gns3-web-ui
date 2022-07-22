import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import{ Controller } from '../../../../models/controller';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouConfigurationService } from '../../../../services/iou-configuration.service';
import { IouService } from '../../../../services/iou.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-iou-template-details',
  templateUrl: './iou-template-details.component.html',
  styleUrls: ['./iou-template-details.component.scss', '../../preferences.component.scss'],
})
export class IouTemplateDetailsComponent implements OnInit {
  controller:Controller ;
  iouTemplate: IouTemplate;

  isSymbolSelectionOpened: boolean = false;
  defaultSettings: boolean = true;

  consoleTypes: string[] = [];
  consoleResolutions: string[] = [];
  categories = [];

  generalSettingsForm: FormGroup;
  networkForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iouService: IouService,
    private toasterService: ToasterService,
    private configurationService: IouConfigurationService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      defaultName: new FormControl('', Validators.required),
      symbol: new FormControl('', Validators.required),
      path: new FormControl('', Validators.required),
      initialConfig: new FormControl('', Validators.required),
    });

    this.networkForm = this.formBuilder.group({
      ethernetAdapters: new FormControl('', Validators.required),
      serialAdapters: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.getConfiguration();
      this.iouService.getTemplate(this.controller, template_id).subscribe((iouTemplate: IouTemplate) => {
        this.iouTemplate = iouTemplate;
      });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.categories = this.configurationService.getCategories();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'iou', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.networkForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.iouService.saveTemplate(this.controller, this.iouTemplate).subscribe(() => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  uploadImageFile(event) {
    this.iouTemplate.path = event.target.files[0].name;
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.iouTemplate.symbol = chosenSymbol;
  }
}
