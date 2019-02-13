import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';


@Component({
    selector: 'app-iou-templates',
    templateUrl: './iou-templates.component.html',
    styleUrls: ['./iou-templates.component.scss']
})
export class IouTemplatesComponent implements OnInit {
    server: Server;
    iouTemplates: IouTemplate[] = [];
    @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iouService: IouService 
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getTemplates();
        });
    }

    getTemplates() {
        this.iouTemplates = [];
        this.iouService.getTemplates(this.server).subscribe((iouTemplates: IouTemplate[]) => {
            iouTemplates.forEach((template) => {
                if ((template.template_type === 'iou') && !template.builtin) {
                    this.iouTemplates.push(template);
                }
            });
        });
    }

    deleteTemplate(template: IouTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
