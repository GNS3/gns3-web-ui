import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { VpcsService } from '../../../../services/vpcs.service';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ToasterService } from '../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';


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
        private toasterService: ToasterService
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
            let vpcsTemplate: VpcsTemplate = {
                base_script_file: 'vpcs_base_config.txt',
                builtin: false,
                category: 'guest',
                compute_id: 'local',
                console_auto_start: false,
                console_type: 'telnet',
                default_name_format: 'PC{0}',
                name: this.templateName,
                symbol: ':/symbols/vpcs_guest.svg',
                template_id: uuid(),
                template_type: 'vpcs'
            };
            this.vpcsService.addTemplate(this.server, vpcsTemplate).subscribe((vpcsTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'vpcs', 'templates']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
