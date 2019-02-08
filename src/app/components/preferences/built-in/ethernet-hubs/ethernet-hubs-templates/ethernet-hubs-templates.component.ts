import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';


@Component({
    selector: 'app-ethernet-hubs-templates',
    templateUrl: './ethernet-hubs-templates.component.html',
    styleUrls: ['./ethernet-hubs-templates.component.scss']
})
export class EthernetHubsTemplatesComponent implements OnInit {
    server: Server;
    ethernetHubsTemplates: EthernetHubTemplate[];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.builtInTemplatesService.getTemplates(this.server).subscribe((ethernetHubsTemplates: EthernetHubTemplate[]) => {
                this.ethernetHubsTemplates = ethernetHubsTemplates.filter((elem) => elem.template_type === "ethernet_hub" && !elem.builtin);
            });
        });
    }
}
