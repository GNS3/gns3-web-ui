import { Component, OnInit, ViewChild } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { TracengTemplate } from '../../../../models/templates/traceng-template';
import { TracengService } from '../../../../services/traceng.service';

@Component({
    selector: 'app-traceng-templates',
    templateUrl: './traceng-templates.component.html',
    styleUrls: ['./traceng-templates.component.scss', '../../preferences.component.scss']
})
export class TracengTemplatesComponent implements OnInit {
    server: Server;
    tracengTemplates: TracengTemplate[] = [];
    @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private tracengService: TracengService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getTemplates();
        });
    }

    getTemplates() {
        this.tracengService.getTemplates(this.server).subscribe((tracengTemplates: TracengTemplate[]) => {
            this.tracengTemplates = tracengTemplates.filter((elem) => elem.template_type === 'traceng' && !elem.builtin);
        });
    }

    deleteTemplate(template: TracengTemplate) {
        this.deleteComponent.deleteItem(template.name, template.template_id);
    }

    onDeleteEvent() {
        this.getTemplates();
    }
}
