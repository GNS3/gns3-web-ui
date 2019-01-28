import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuService } from '../../../../services/qemu.service';


@Component({
    selector: 'app-vpcs-templates',
    templateUrl: './vpcs-templates.component.html',
    styleUrls: ['./vpcs-templates.component.scss']
})
export class VpcsTemplatesComponent implements OnInit {
    server: Server;
    vpcsTemplates: QemuTemplate[] = [];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService
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
}
