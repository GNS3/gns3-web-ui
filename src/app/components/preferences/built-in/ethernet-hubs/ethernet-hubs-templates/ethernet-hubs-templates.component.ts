import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';


@Component({
    selector: 'app-ethernet-hubs-templates',
    templateUrl: './ethernet-hubs-templates.component.html',
    styleUrls: ['./ethernet-hubs-templates.component.scss', '../../../preferences.component.scss']
})
export class EthernetHubsTemplatesComponent implements OnInit {
    server: Server;
    ethernetHubsTemplates: EthernetHubTemplate[] = [];
    @ViewChild(DeleteTemplateComponent, {static: false}) deleteComponent: DeleteTemplateComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getTemplates();
        });
    }

    getTemplates() {
        this.builtInTemplatesService.getTemplates(this.server).subscribe((ethernetHubsTemplates: EthernetHubTemplate[]) => {
            this.ethernetHubsTemplates = ethernetHubsTemplates.filter((elem) => elem.template_type === "ethernet_hub" && !elem.builtin);
        });
    }
    
    deleteTemplate(template: EthernetHubTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
