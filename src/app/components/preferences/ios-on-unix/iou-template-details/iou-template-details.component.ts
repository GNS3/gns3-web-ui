import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Server } from '../../../../models/server';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouConfigurationService } from '../../../../services/iou-configuration.service';
import { IouService } from '../../../../services/iou.service';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-iou-template-details',
  templateUrl: './iou-template-details.component.html',
  styleUrls: ['./iou-template-details.component.scss', '../../preferences.component.scss'],
})
export class IouTemplateDetailsComponent implements OnInit {
  server: Server;
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
    private serverService: ServerService,
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
    this.serverService.get(parseInt(controller_id, 10)).then((server: Server) => {
      this.server = server;

      this.getConfiguration();
      this.iouService.getTemplate(this.server, template_id).subscribe((iouTemplate: IouTemplate) => {
        this.iouTemplate = iouTemplate;
      });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.categories = this.configurationService.getCategories();
  }

  goBack() {
    this.router.navigate(['/controller', this.server.id, 'preferences', 'iou', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.networkForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.iouService.saveTemplate(this.server, this.iouTemplate).subscribe(() => {
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
