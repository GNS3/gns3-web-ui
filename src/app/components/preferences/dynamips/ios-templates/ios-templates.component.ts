import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { IosService } from '../../../../services/ios.service';
import { IosTemplate } from '../../../../models/templates/ios-template';


@Component({
    selector: 'app-ios-templates',
    templateUrl: './ios-templates.component.html',
    styleUrls: ['./ios-templates.component.scss']
})
export class IosTemplatesComponent implements OnInit {
    server: Server;
    iosTemplates: IosTemplate[];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iosService: IosService
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

            this.iosService.getTemplates(this.server).subscribe((templates: IosTemplate[]) => {
                this.iosTemplates = templates.filter((elem) => elem.template_type === 'dynamips');
            });
        });
    }
}
