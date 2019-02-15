import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';


@Component({
    selector: 'app-ethernet-switches-add-template',
    templateUrl: './ethernet-switches-add-template.component.html',
    styleUrls: ['./ethernet-switches-add-template.component.scss', '../../../preferences.component.scss']
})
export class EthernetSwitchesAddTemplateComponent implements OnInit {
    server: Server;
    numberOfPorts: number;
    templateName: string = '';
    formGroup: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService,
        private formBuilder: FormBuilder
    ) {
        this.formGroup = this.formBuilder.group({
            templateName: new FormControl('', Validators.required),
            numberOfPorts: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
        });
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'builtin', 'ethernet-switches']);
    }

    addTemplate() {
        if (this.templateName && this.numberOfPorts) {
            let ethernetSwitchTemplate: EthernetSwitchTemplate;

            this.templateMocksService.getEthernetSwitchTemplate().subscribe((template: EthernetSwitchTemplate) => {
                ethernetSwitchTemplate = template;
            });

            ethernetSwitchTemplate.template_id = uuid();
            ethernetSwitchTemplate.name = this.templateName;

            for(let i=0; i<this.numberOfPorts; i++){
                ethernetSwitchTemplate.ports_mapping.push({
                    ethertype: '',
                    name: `Ethernet${i}`,
                    port_number: i,
                    type: 'access',
                    vlan: 1
                });
            }

            this.builtInTemplatesService.addTemplate(this.server, ethernetSwitchTemplate).subscribe((ethernetSwitchTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
