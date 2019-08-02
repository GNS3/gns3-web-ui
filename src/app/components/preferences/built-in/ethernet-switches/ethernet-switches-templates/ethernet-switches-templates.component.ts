import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';


@Component({
    selector: 'app-ethernet-switches-templates',
    templateUrl: './ethernet-switches-templates.component.html',
    styleUrls: ['./ethernet-switches-templates.component.scss', '../../../preferences.component.scss']
})
export class EthernetSwitchesTemplatesComponent implements OnInit {
    server: Server;
    ethernetSwitchesTemplates: EthernetSwitchTemplate[] = [];
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
        this.builtInTemplatesService.getTemplates(this.server).subscribe((ethernetSwitchesTemplates: EthernetSwitchTemplate[]) => {
            this.ethernetSwitchesTemplates = ethernetSwitchesTemplates.filter((elem) => elem.template_type === "ethernet_switch" && !elem.builtin);
        });
    }
    
    deleteTemplate(template: EthernetSwitchTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
