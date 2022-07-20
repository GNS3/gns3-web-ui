import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Server } from '../../../../models/server';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';
import { VpcsConfigurationService } from '../../../../services/vpcs-configuration.service';
import { VpcsService } from '../../../../services/vpcs.service';

@Component({
  selector: 'app-vpcs-template-details',
  templateUrl: './vpcs-template-details.component.html',
  styleUrls: ['./vpcs-template-details.component.scss', '../../preferences.component.scss'],
})
export class VpcsTemplateDetailsComponent implements OnInit {
  controller: Server;
  vpcsTemplate: VpcsTemplate;
  inputForm: FormGroup;
  isSymbolSelectionOpened: boolean = false;
  consoleTypes: string[] = [];
  categories = [];

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private vpcsService: VpcsService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private vpcsConfigurationService: VpcsConfigurationService,
    private router: Router
  ) {
    this.inputForm = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      defaultName: new FormControl('', Validators.required),
      scriptFile: new FormControl('', Validators.required),
      symbol: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;

      this.getConfiguration();
      this.vpcsService.getTemplate(this.controller, template_id).subscribe((vpcsTemplate: VpcsTemplate) => {
        this.vpcsTemplate = vpcsTemplate;
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
}
