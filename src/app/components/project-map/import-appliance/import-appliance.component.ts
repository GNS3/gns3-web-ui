import { Component, Input, OnInit } from "@angular/core";
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ComputeService } from '../../../services/compute.service';
import { ToasterService } from '../../../services/toaster.service';
import { ServerResponse } from '../../../models/serverResponse';
import { FileUploader, ParsedResponseHeaders, FileItem } from 'ng2-file-upload';
import { Template } from '../../../models/template';
import { DockerTemplate } from '../../../models/templates/docker-template';
import { QemuTemplate } from '../../../models/templates/qemu-template';
import { IouTemplate } from '../../../models/templates/iou-template';
import { IosTemplate } from '../../../models/templates/ios-template';
import { TemplateService } from '../../../services/template.service';
import { DockerService } from '../../../services/docker.service';
import { QemuService } from '../../../services/qemu.service';
import { IouService } from '../../../services/iou.service';
import { IosService } from '../../../services/ios.service';


@Component({
    selector: 'app-import-appliance',
    templateUrl: './import-appliance.component.html',
    styleUrls: ['./import-appliance.component.scss']
})
export class ImportApplianceComponent implements OnInit {
    @Input('project') project: Project;
    @Input('server') server: Server;
    uploader: FileUploader;

    constructor(
        private computeService: ComputeService,
        private toasterService: ToasterService,
        private dockerService: DockerService,
        private qemuService: QemuService,
        private iouService: IouService,
        private iosService: IosService
    ) {}

    ngOnInit() {
        this.uploader = new FileUploader({});
        this.uploader.onAfterAddingFile = file => {
            file.withCredentials = false;
        };
    
        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.error('An error has occured');
        };
    
        this.uploader.onCompleteItem = (
            item: FileItem,
            response: string,
            status: number,
            headers: ParsedResponseHeaders
        ) => {
            
            this.toasterService.success('Appliance imported successfully');
            this.uploader.queue = [];
        };
    }

    public uploadAppliance(event) {
        let file: File = event.target.files[0];
        let name: string = file.name;
        let fileReader: FileReader = new FileReader();

        let template;
        fileReader.onloadend = () => {
            let appliance = JSON.parse(fileReader.result as string);
            let emulator: string;
            console.log(appliance);

            if (appliance.qemu) {
                template = new QemuTemplate();
                template.template_type = 'qemu';
            } else if (appliance.iou) {
                template = new IouTemplate();
                template.template_type = 'iou';
            } else if (appliance.dynamips) {
                template = new IosTemplate();
                template.template_type = 'dynamips';
            } else if (appliance.docker) {
                template = new DockerTemplate();
                template.template_type = 'docker';
                template.adapters = appliance.docker.adapters;
                template.console_type = appliance.docker.console_type;
                template.image = appliance.docker.image;
            } else {
                this.toasterService.error("Template type not supported");
                return;
            }
            template.name = appliance.name;
            template.category = appliance.category;
            template.builtin = false;
            template.default_name_format = '{name}-{0}';

            //to exchange
            template.compute_id = "vm";

            if (template.category === 'guest') {
                template.symbol = `:/symbols/computer.svg`;
            } else {
                template.symbol = `:/symbols/${template.category}_guest.svg`;
            }
            console.log(template);

            const url = this.computeService.getUploadPath(this.server, template.template_type, name);
            this.uploader.queue.forEach(elem => (elem.url = url));
            const itemToUpload = this.uploader.queue[0];
            this.uploader.uploadItem(itemToUpload);
        };
        fileReader.readAsText(file);
    }
}
