import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';


@Component({
    selector: 'app-ethernet-switches-templates',
    templateUrl: './ethernet-switches-templates.component.html',
    styleUrls: ['./ethernet-switches-templates.component.scss']
})
export class EthernetSwitchesTemplatesComponent implements OnInit {
    server: Server;
    ethernetSwitchesTemplates: EthernetSwitchTemplate[];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.builtInTemplatesService.getTemplates(this.server).subscribe((ethernetSwitchesTemplates: EthernetSwitchTemplate[]) => {
                this.ethernetSwitchesTemplates = ethernetSwitchesTemplates.filter((elem) => elem.template_type === "ethernet_switch" && !elem.builtin);
            });
        });
    }
}
