import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { VpcsService } from '../../../../services/vpcs.service';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
    selector: 'app-vpcs-templates',
    templateUrl: './vpcs-templates.component.html',
    styleUrls: ['./vpcs-templates.component.scss', '../../preferences.component.scss']
})
export class VpcsTemplatesComponent implements OnInit {
    server: Server;
    vpcsTemplates: VpcsTemplate[] = [];
    @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vpcsService: VpcsService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getTemplates();
        });
    }

    getTemplates() {
        this.vpcsService.getTemplates(this.server).subscribe((vpcsTemplates: VpcsTemplate[]) => {
            this.vpcsTemplates = vpcsTemplates.filter((elem) => elem.template_type === 'vpcs' && !elem.builtin);
        });
    }

    deleteTemplate(template: VpcsTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
