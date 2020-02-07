import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../../models/server';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ServerService } from '../../../../../services/server.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';


@Component({
    selector: 'app-cloud-nodes-templates',
    templateUrl: './cloud-nodes-templates.component.html',
    styleUrls: ['./cloud-nodes-templates.component.scss', '../../../preferences.component.scss']
})
export class CloudNodesTemplatesComponent implements OnInit {
    server: Server;
    cloudNodesTemplates: CloudTemplate[] = [];
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
        this.builtInTemplatesService.getTemplates(this.server).subscribe((cloudNodesTemplates: CloudTemplate[]) => {
            this.cloudNodesTemplates = cloudNodesTemplates.filter((elem) => elem.template_type === "cloud" && !elem.builtin);
        });
    }

    deleteTemplate(template: CloudTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
