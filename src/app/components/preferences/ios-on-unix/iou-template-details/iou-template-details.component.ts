import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';
import { IouConfigurationService } from '../../../../services/iou-configuration.service';


@Component({
    selector: 'app-iou-template-details',
    templateUrl: './iou-template-details.component.html',
    styleUrls: ['./iou-template-details.component.scss']
})
export class IouTemplateDetailsComponent implements OnInit {
    server: Server;
    iouTemplate: IouTemplate;

    isSymbolSelectionOpened: boolean = false;
    defaultSettings: boolean = true;

    consoleTypes: string[] = [];
    consoleResolutions: string[] = [];
    categories = [];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iouService: IouService,
        private toasterService: ToasterService,
        private configurationService: IouConfigurationService
    ){}

    ngOnInit(){
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            
            this.getConfiguration();
            this.iouService.getTemplate(this.server, template_id).subscribe((iouTemplate: IouTemplate) => {
                this.iouTemplate = iouTemplate;
            });
        });
    }

    getConfiguration(){
        this.consoleTypes = this.configurationService.getConsoleTypes();
        this.categories = this.configurationService.getCategories();
    }

    onSave(){
        this.iouService.saveTemplate(this.server, this.iouTemplate).subscribe((savedTemplate: IouTemplate) => {
            this.toasterService.success("Changes saved");
        });
    }

    uploadImageFile(event) {
        this.iouTemplate.path = event.target.files[0].name;
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.iouTemplate.symbol = chosenSymbol;
    }
}
