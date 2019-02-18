import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';


@Component({
    selector: 'app-add-iou-template',
    templateUrl: './add-iou-template.component.html',
    styleUrls: ['./add-iou-template.component.scss', '../../preferences.component.scss']
})
export class AddIouTemplateComponent implements OnInit {
    server: Server;
    iouTemplate: IouTemplate;
    isGns3VmChosen: boolean = false;
    isRemoteComputerChosen: boolean = false;
    newImageSelected: boolean = false;
    types: string[] = ['L2 image', 'L3 image'];
    selectedType: string;
    iouImages: string[] = [];

    templateNameForm: FormGroup;
    imageForm: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iouService: IouService,
        private toasterService: ToasterService,
        private router: Router,
        private formBuilder: FormBuilder,
        private templateMocksService: TemplateMocksService
    ) {
        this.iouTemplate = new IouTemplate();

        this.templateNameForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });

        this.imageForm = this.formBuilder.group({
            imageName: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.templateMocksService.getIouTemplate().subscribe((iouTemplate: IouTemplate) => {
                this.iouTemplate = iouTemplate;
            })
        });
    }

    setServerType(serverType: string) {
        if (serverType === 'gns3 vm') {
            this.isGns3VmChosen = true;
        } else {
            this.isRemoteComputerChosen = true;
        }
    }

    setDiskImage(value: string) {
        this.newImageSelected = value === "newImage";
    }

    uploadImageFile(event) {
        this.iouTemplate.path = event.target.files[0].name;
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'iou', 'templates']);
    }

    addTemplate() {
        if (!this.templateNameForm.invalid && ((this.newImageSelected && !this.imageForm.invalid) || (!this.newImageSelected && this.iouTemplate.path))) {
            this.iouTemplate.template_id = uuid();

            this.iouService.addTemplate(this.server, this.iouTemplate).subscribe((template: IouTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
