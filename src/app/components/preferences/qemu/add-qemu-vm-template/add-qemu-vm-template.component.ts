import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { QemuService } from '../../../../services/qemu.service';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { QemuImage } from '../../../../models/qemu/qemu-image';
import { ToasterService } from '../../../../services/toaster.service';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';
import { ComputeService } from '../../../../services/compute.service';
import { Compute } from '../../../../models/compute';
import { FileUploader, FileItem, ParsedResponseHeaders } from 'ng2-file-upload';


@Component({
    selector: 'app-add-qemu-virtual-machine-template',
    templateUrl: './add-qemu-vm-template.component.html',
    styleUrls: ['./add-qemu-vm-template.component.scss', '../../preferences.component.scss']
})
export class AddQemuVmTemplateComponent implements OnInit {
    server: Server;
    qemuBinaries: QemuBinary[] = [];
    selectedBinary: QemuBinary;
    ramMemory: number;
    consoleTypes: string[] = [];
    newImageSelected: boolean = false;;
    qemuImages: QemuImage[] = [];
    selectedImage: QemuImage;
    chosenImage: string = '';
    qemuTemplate: QemuTemplate;
    uploader: FileUploader;

    nameForm: FormGroup;
    memoryForm: FormGroup;
    diskForm: FormGroup;

    isGns3VmAvailable: boolean = false;
    isGns3VmChosen: boolean = false;
    isLocalComputerChosen: boolean = true;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private toasterService: ToasterService,
        private router: Router,
        private formBuilder: FormBuilder,
        private templateMocksService: TemplateMocksService,
        private configurationService: QemuConfigurationService,
        private computeService: ComputeService
    ) {
        this.qemuTemplate = new QemuTemplate();

        this.nameForm = this.formBuilder.group({
            templateName: new FormControl(null, Validators.required)
        });

        this.memoryForm = this.formBuilder.group({
            ramMemory: new FormControl('256', Validators.required)
        });

        this.diskForm = this.formBuilder.group({
            fileName: new FormControl('', Validators.required)
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
            this.qemuService.getImages(this.server).subscribe((qemuImages: QemuImage[]) => {
                this.qemuImages = qemuImages;
            });
            this.toasterService.success('Image uploaded');
        };
        
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.templateMocksService.getQemuTemplate().subscribe((qemuTemplate: QemuTemplate) => {
                this.qemuTemplate = qemuTemplate;
            })

            this.qemuService.getBinaries(server).subscribe((qemuBinaries: QemuBinary[]) => {
                this.qemuBinaries = qemuBinaries;
                if (this.qemuBinaries[0]) this.selectedBinary = this.qemuBinaries[0];
            });

            this.qemuService.getImages(server).subscribe((qemuImages: QemuImage[]) => {
                this.qemuImages = qemuImages;
            });

            this.consoleTypes = this.configurationService.getConsoleTypes();

            this.computeService.getComputes(server).subscribe((computes: Compute[]) => {
                if (computes.filter(compute => compute.compute_id === 'vm').length > 0) this.isGns3VmAvailable = true;
            });
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

    uploadImageFile(event) {
        let name = event.target.files[0].name;
        this.diskForm.controls['fileName'].setValue(name);

        const url = this.qemuService.getImagePath(this.server, name);
        this.uploader.queue.forEach(elem => (elem.url = url));

        const itemToUpload = this.uploader.queue[0];
        if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true;

        this.uploader.uploadItem(itemToUpload);
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates']);
    }

    addTemplate() {
        if (!this.nameForm.invalid && !this.memoryForm.invalid && (this.selectedImage || this.chosenImage)) {
            this.qemuTemplate.ram = this.memoryForm.get("ramMemory").value;
            this.qemuTemplate.qemu_path = this.selectedBinary.path;
            if (this.newImageSelected) {
                this.qemuTemplate.hda_disk_image =  this.diskForm.get("fileName").value;
            } else {
                this.qemuTemplate.hda_disk_image = this.selectedImage.path;
            }
            this.qemuTemplate.template_id = uuid();
            this.qemuTemplate.name = this.nameForm.get("templateName").value;
            this.qemuTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';

            this.qemuService.addTemplate(this.server, this.qemuTemplate).subscribe((template: QemuTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
