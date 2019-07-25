import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareService } from '../../../../services/vmware.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';


@Component({
    selector: 'app-vmware-templates',
    templateUrl: './vmware-templates.component.html',
    styleUrls: ['./vmware-templates.component.scss', '../../preferences.component.scss']
})
export class VmwareTemplatesComponent implements OnInit {
    server: Server;
    vmwareTemplates: VmwareTemplate[] = [];
    @ViewChild(DeleteTemplateComponent, {static: false}) deleteComponent: DeleteTemplateComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vmwareService: VmwareService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getTemplates();
        });
    }

    getTemplates() {
        this.vmwareService.getTemplates(this.server).subscribe((vmwareTemplates: VmwareTemplate[]) => {
            this.vmwareTemplates = vmwareTemplates.filter((elem) => elem.template_type === 'vmware' && !elem.builtin);
        });
    }

    deleteTemplate(template: VmwareTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
