import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosService } from '../../../../services/ios.service';


@Component({
    selector: 'app-ios-template-details',
    templateUrl: './ios-template-details.component.html',
    styleUrls: ['./ios-template-details.component.scss']
})
export class IosTemplateDetailsComponent implements OnInit {
    server: Server;
    iosTemplate: IosTemplate;

    isSymbolSelectionOpened: boolean = false;

    consoleTypes: string[] = ['telnet', 'none'];
    categories = [["Default", "guest"],
                    ["Routers", "router"],
                    ["Switches", "switch"],
                    ["End devices", "end_device"],
                    ["Security devices", "security_device"]];
    isConfiguratorOpened: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iosService: IosService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.iosService.getTemplate(this.server, template_id).subscribe((iosTemplate: IosTemplate) => {
                this.iosTemplate = iosTemplate;
            });
        });
    }

    onSave() {
        this.iosService.saveTemplate(this.server, this.iosTemplate).subscribe((iosTemplate: IosTemplate) => {
            this.toasterService.success("Changes saved");
        });
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.iosTemplate.symbol = chosenSymbol;
    }
}
