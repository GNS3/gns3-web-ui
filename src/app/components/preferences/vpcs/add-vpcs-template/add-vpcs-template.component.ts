import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import { Server } from '../../../../models/server';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ComputeService } from '../../../../services/compute.service';
import { ServerService } from '../../../../services/server.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { VpcsService } from '../../../../services/vpcs.service';

@Component({
  selector: 'app-add-vpcs-template',
  templateUrl: './add-vpcs-template.component.html',
  styleUrls: ['./add-vpcs-template.component.scss', '../../preferences.component.scss'],
})
export class AddVpcsTemplateComponent implements OnInit {
  server: Server;
  templateName: string = '';
  templateNameForm: FormGroup;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private vpcsService: VpcsService,
    private router: Router,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private formBuilder: FormBuilder,
    private computeService: ComputeService
  ) {
    this.templateNameForm = this.formBuilder.group({
      templateName: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((server: Server) => {
      this.server = server;
    });
  }

  setServerType(serverType: string) {
    if (serverType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.server.id, 'preferences', 'vpcs', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.templateName = this.templateNameForm.get('templateName').value;

      let vpcsTemplate: VpcsTemplate;

      this.templateMocksService.getVpcsTemplate().subscribe((template: VpcsTemplate) => {
        vpcsTemplate = template;
      });

      (vpcsTemplate.template_id = uuid()),
      (vpcsTemplate.name = this.templateName),
      (vpcsTemplate.compute_id = 'local');

      this.vpcsService.addTemplate(this.server, vpcsTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
