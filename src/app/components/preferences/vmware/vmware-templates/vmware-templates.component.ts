import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareService } from '../../../../services/vmware.service';
import { MatDialog } from '@angular/material';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ToasterService } from '../../../../services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';


@Component({
    selector: 'app-vmware-templates',
    templateUrl: './vmware-templates.component.html',
    styleUrls: ['./vmware-templates.component.scss']
})
export class VmwareTemplatesComponent implements OnInit {
    server: Server;
    vmwareTemplates: VmwareTemplate[] = [];
    @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

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
        this.vmwareTemplates = [];
        this.vmwareService.getTemplates(this.server).subscribe((vpcsTemplates: VmwareTemplate[]) => {
            vpcsTemplates.forEach((template) => {
                if ((template.template_type === 'vmware') && !template.builtin) {
                    this.vmwareTemplates.push(template);
                }
            });
        });
    }

    deleteTemplate(template: VmwareTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
