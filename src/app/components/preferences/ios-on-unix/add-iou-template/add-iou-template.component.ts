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
import { ComputeService } from '../../../../services/compute.service';
import { Compute } from '../../../../models/compute';
import { FileUploader, FileItem, ParsedResponseHeaders } from 'ng2-file-upload';
import { IouImage } from '../../../../models/iou/iou-image';


@Component({
    selector: 'app-add-iou-template',
    templateUrl: './add-iou-template.component.html',
    styleUrls: ['./add-iou-template.component.scss', '../../preferences.component.scss']
})
export class AddIouTemplateComponent implements OnInit {
    server: Server;
    iouTemplate: IouTemplate;
    isRemoteComputerChosen: boolean = false;
    newImageSelected: boolean = false;
    types: string[] = ['L2 image', 'L3 image'];
    selectedType: string;
    iouImages: IouImage[] = [];
    uploader: FileUploader;

    templateNameForm: FormGroup;
    imageForm: FormGroup;

    isGns3VmAvailable: boolean = false;
    isGns3VmChosen: boolean = false;
    isLocalComputerChosen: boolean = true;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iouService: IouService,
        private toasterService: ToasterService,
        private router: Router,
        private formBuilder: FormBuilder,
        private templateMocksService: TemplateMocksService,
        private computeService: ComputeService
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
        this.uploader = new FileUploader({});
        this.uploader.onAfterAddingFile = file => {
            file.withCredentials = false;
        };
        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.error('An error occured: ' + response);
        };
        this.uploader.onSuccessItem = (
            item: FileItem,
            response: string,
            status: number,
            headers: ParsedResponseHeaders
        ) => {
            this.getImages();
            this.toasterService.success('Image uploaded');
        };
        
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.getImages();

            this.templateMocksService.getIouTemplate().subscribe((iouTemplate: IouTemplate) => {
                this.iouTemplate = iouTemplate;
            })

            this.computeService.getComputes(server).subscribe((computes: Compute[]) => {
                if (computes.filter(compute => compute.compute_id === 'vm').length > 0) this.isGns3VmAvailable = true;
            });
        });
    }

    getImages() {
        this.iouService.getImages(this.server).subscribe((images: IouImage[]) => {
            this.iouImages = images;
        });
    }

    setServerType(serverType: string) {
        if (serverType === 'gns3 vm' && this.isGns3VmAvailable) {
            this.isGns3VmChosen = true;
            this.isLocalComputerChosen = false;
        } else {
            this.isGns3VmChosen = false;
            this.isLocalComputerChosen = true;
        }
    }

    setDiskImage(value: string) {
        this.newImageSelected = value === "newImage";
    }

    uploadImageFile(event): void {
        let name = event.target.files[0].name;
        this.imageForm.controls['imageName'].setValue(name);

        const url = this.iouService.getImagePath(this.server, name);
        this.uploader.queue.forEach(elem => (elem.url = url));

        const itemToUpload = this.uploader.queue[0];
        (itemToUpload as any).options.disableMultipart = true;

        this.uploader.uploadItem(itemToUpload);
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'iou', 'templates']);
    }

    addTemplate() {
        if (!this.templateNameForm.invalid && ((this.newImageSelected && !this.imageForm.invalid) || (!this.newImageSelected && this.iouTemplate.path))) {
            this.iouTemplate.template_id = uuid();
            this.iouTemplate.name = this.templateNameForm.get("templateName").value;
            if (this.newImageSelected) this.iouTemplate.path = this.imageForm.get("imageName").value;
            this.iouTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';

            this.iouService.addTemplate(this.server, this.iouTemplate).subscribe((template: IouTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
