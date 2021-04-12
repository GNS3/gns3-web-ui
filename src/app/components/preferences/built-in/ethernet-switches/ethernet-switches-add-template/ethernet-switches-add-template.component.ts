import { Component, OnInit } from '@angular/core';
import { Server } from '../../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ComputeService } from '../../../../../services/compute.service';
import { Compute } from '../../../../../models/compute';

@Component({
  selector: 'app-ethernet-switches-add-template',
  templateUrl: './ethernet-switches-add-template.component.html',
  styleUrls: ['./ethernet-switches-add-template.component.scss', '../../../preferences.component.scss'],
})
export class EthernetSwitchesAddTemplateComponent implements OnInit {
  server: Server;
  templateName: string = '';
  formGroup: FormGroup;

  isGns3VmAvailable: boolean = false;
  isGns3VmChosen: boolean = false;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private builtInTemplatesService: BuiltInTemplatesService,
    private router: Router,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private formBuilder: FormBuilder,
    private computeService: ComputeService
  ) {
    this.formGroup = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      numberOfPorts: new FormControl(8, Validators.required),
    });
  }

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;

      this.computeService.getComputes(server).subscribe((computes: Compute[]) => {
        if (computes.filter((compute) => compute.compute_id === 'vm').length > 0) this.isGns3VmAvailable = true;
      });
    });
  }

  goBack() {
    this.router.navigate(['/server', this.server.id, 'preferences', 'builtin', 'ethernet-switches']);
  }

  setServerType(serverType: string) {
    if (serverType === 'gns3 vm' && this.isGns3VmAvailable) {
      this.isGns3VmChosen = true;
      this.isLocalComputerChosen = false;
    } else {
      this.isGns3VmChosen = false;
      this.isLocalComputerChosen = true;
    }
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      let ethernetSwitchTemplate: EthernetSwitchTemplate;

      this.templateMocksService.getEthernetSwitchTemplate().subscribe((template: EthernetSwitchTemplate) => {
        ethernetSwitchTemplate = template;
      });

      ethernetSwitchTemplate.template_id = uuid();
      ethernetSwitchTemplate.name = this.formGroup.get('templateName').value;
      ethernetSwitchTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';

      for (let i = 0; i < this.formGroup.get('numberOfPorts').value; i++) {
        ethernetSwitchTemplate.ports_mapping.push({
          ethertype: '',
          name: `Ethernet${i}`,
          port_number: i,
          type: 'access',
          vlan: 1,
        });
      }

      this.builtInTemplatesService
        .addTemplate(this.server, ethernetSwitchTemplate)
        .subscribe((ethernetSwitchTemplate) => {
          this.goBack();
        });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
