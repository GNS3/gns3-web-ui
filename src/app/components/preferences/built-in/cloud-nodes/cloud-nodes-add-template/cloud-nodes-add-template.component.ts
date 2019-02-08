import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';


@Component({
    selector: 'app-cloud-nodes-add-template',
    templateUrl: './cloud-nodes-add-template.component.html',
    styleUrls: ['./cloud-nodes-add-template.component.scss']
})
export class CloudNodesAddTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
        });
    }

    addTemplate() {
        if (this.templateName) {
            let cloudTemplate: CloudTemplate;

            this.templateMocksService.getCloudNodeTemplate().subscribe((template: CloudTemplate) => {
                cloudTemplate = template;
            });

            cloudTemplate.template_id = uuid();
            cloudTemplate.name = this.templateName;

            this.builtInTemplatesService.addTemplate(this.server, cloudTemplate).subscribe((cloudNodeTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'builtin', 'cloud-nodes']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
