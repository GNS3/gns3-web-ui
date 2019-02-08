import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { ToasterService } from '../../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';


@Component({
    selector: 'app-ethernet-switches-add-template',
    templateUrl: './ethernet-switches-add-template.component.html',
    styleUrls: ['./ethernet-switches-add-template.component.scss']
})
export class EthernetSwitchesAddTemplateComponent implements OnInit {
    server: Server;
    numberOfPorts: number;
    templateName: string = '';
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
        });
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
                this.router.navigate(['/server', this.server.id, 'preferences', 'builtin', 'ethernet-switches']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
