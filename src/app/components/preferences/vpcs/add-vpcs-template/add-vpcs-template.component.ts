import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { VpcsService } from '../../../../services/vpcs.service';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ToasterService } from '../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../services/template-mocks.service';


@Component({
    selector: 'app-add-vpcs-template',
    templateUrl: './add-vpcs-template.component.html',
    styleUrls: ['./add-vpcs-template.component.scss']
})
export class AddVpcsTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vpcsService: VpcsService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService
    ) {}

    ngOnInit() {
        this.route.paramMap
        .pipe(
          switchMap((params: ParamMap) => {
            const server_id = params.get('server_id');
            return this.serverService.get(parseInt(server_id, 10));
          })
        )
        .subscribe((server: Server) => {
            this.server = server;
        });
    }

    addTemplate() {
        if (this.templateName) {
            let vpcsTemplate: VpcsTemplate;

            this.templateMocksService.getVpcsTemplate().subscribe((template: VpcsTemplate) => {
                vpcsTemplate = template;
            });

            vpcsTemplate.template_id = uuid(),
            vpcsTemplate.name = this.templateName,

            this.vpcsService.addTemplate(this.server, vpcsTemplate).subscribe((vpcsTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'vpcs', 'templates']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
