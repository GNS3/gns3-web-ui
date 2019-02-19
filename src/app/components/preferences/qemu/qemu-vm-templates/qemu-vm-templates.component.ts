import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuService } from '../../../../services/qemu.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';


@Component({
    selector: 'app-qemu-virtual-machines-templates',
    templateUrl: './qemu-vm-templates.component.html',
    styleUrls: ['./qemu-vm-templates.component.scss', '../../preferences.component.scss']
})
export class QemuVmTemplatesComponent implements OnInit {
    server: Server;
    qemuTemplates: QemuTemplate[] = [];
    @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private router: Router
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getTemplates();
        });
    }

    getTemplates() {
        this.qemuService.getTemplates(this.server).subscribe((qemuTemplates: QemuTemplate[]) => {
            this.qemuTemplates = qemuTemplates.filter((elem) => elem.template_type === 'dynamips');
        });
    }

    deleteTemplate(template: QemuTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }

    copyTemplate(template: QemuTemplate) {
        this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates', template.template_id, 'copy']);
    }
}
