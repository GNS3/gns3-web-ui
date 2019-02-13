import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { QemuService } from '../../../../services/qemu.service';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { ToasterService } from '../../../../services/toaster.service';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { v4 as uuid } from 'uuid';


@Component({
    selector: 'app-copy-qemu-virtual-machine-template',
    templateUrl: './copy-qemu-vm-template.component.html',
    styleUrls: ['./copy-qemu-vm-template.component.scss']
})
export class CopyQemuVmTemplateComponent implements OnInit {
    server: Server;
    qemuBinaries: QemuBinary[] = [];
    templateName: string = '';
    qemuTemplate: QemuTemplate;

    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private toasterService: ToasterService,
        private router: Router,
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.qemuService.getTemplate(this.server, template_id).subscribe((qemuTemplate: QemuTemplate) => {
                this.qemuTemplate = qemuTemplate;
                this.templateName = `Copy of ${this.qemuTemplate.name}`;
            })

        });
    }

    addTemplate() {
        if (this.templateName) {
            this.qemuTemplate.template_id = uuid();
            this.qemuTemplate.name = this.templateName;

            this.qemuService.addTemplate(this.server, this.qemuTemplate).subscribe((template: QemuTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
