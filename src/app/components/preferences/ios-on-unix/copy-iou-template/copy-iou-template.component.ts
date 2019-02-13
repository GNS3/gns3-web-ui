import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';


@Component({
    selector: 'app-copy-iou-template',
    templateUrl: './copy-iou-template.component.html',
    styleUrls: ['./copy-iou-template.component.scss']
})
export class CopyIouTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    iouTemplate: IouTemplate;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: IouService,
        private toasterService: ToasterService,
        private router: Router
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.qemuService.getTemplate(this.server, template_id).subscribe((iouTemplate: IouTemplate) => {
                this.iouTemplate = iouTemplate;
                this.templateName = `Copy of ${this.iouTemplate.name}`;
            })

        });
    }

    addTemplate() {
        if (this.templateName) {
            this.iouTemplate.template_id = uuid();
            this.iouTemplate.name = this.templateName;

            this.qemuService.addTemplate(this.server, this.iouTemplate).subscribe((template: IouTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'iou', 'templates']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
