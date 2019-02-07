import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { VpcsService } from '../../../../services/vpcs.service';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';


@Component({
    selector: 'app-vpcs-templates',
    templateUrl: './vpcs-templates.component.html',
    styleUrls: ['./vpcs-templates.component.scss']
})
export class VpcsTemplatesComponent implements OnInit {
    server: Server;
    vpcsTemplates: VpcsTemplate[] = [];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vpcsService: VpcsService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.vpcsService.getTemplates(this.server).subscribe((vpcsTemplates: VpcsTemplate[]) => {
                vpcsTemplates.forEach((template) => {
                    if ((template.template_type === 'vpcs') && !template.builtin) {
                        this.vpcsTemplates.push(template);
                    }
                });
            });
        });
    }
}
