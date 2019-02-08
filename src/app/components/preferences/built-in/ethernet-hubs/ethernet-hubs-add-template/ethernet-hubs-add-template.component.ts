import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { ToasterService } from '../../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';


@Component({
    selector: 'app-ethernet-hubs-add-template',
    templateUrl: './ethernet-hubs-add-template.component.html',
    styleUrls: ['./ethernet-hubs-add-template.component.scss']
})
export class EthernetHubsAddTemplateComponent implements OnInit {
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
            let ethernetHubTemplate: EthernetHubTemplate;

            this.templateMocksService.getEthernetHubTemplate().subscribe((template: EthernetHubTemplate) => {
                ethernetHubTemplate = template;
            });

            ethernetHubTemplate.template_id = uuid();
            ethernetHubTemplate.name = this.templateName;

            for(let i=0; i<this.numberOfPorts; i++){
                ethernetHubTemplate.ports_mapping.push({
                    name: `Ethernet${i}`,
                    port_number: i
                });
            }

            this.builtInTemplatesService.addTemplate(this.server, ethernetHubTemplate).subscribe((ethernetHubTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'builtin', 'ethernet-hubs']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
