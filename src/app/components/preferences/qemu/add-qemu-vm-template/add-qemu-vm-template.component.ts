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

    nameForm: FormGroup;
    memoryForm: FormGroup;
    diskForm: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private toasterService: ToasterService,
        private router: Router,
        private formBuilder: FormBuilder,
        private templateMocksService: TemplateMocksService,
        private configurationService: QemuConfigurationService
    ) {
        this.qemuTemplate = new QemuTemplate();

        this.nameForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });

        this.memoryForm = this.formBuilder.group({
            ramMemory: new FormControl('', Validators.required)
        });

        this.diskForm = this.formBuilder.group({
            fileName: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.templateMocksService.getQemuTemplate().subscribe((qemuTemplate: QemuTemplate) => {
                this.qemuTemplate = qemuTemplate;
            })

            this.qemuService.getBinaries(server).subscribe((qemuBinaries: QemuBinary[]) => {
                this.qemuBinaries = qemuBinaries;
            });

            this.qemuService.getImages(server).subscribe((qemuImages: QemuImage[]) => {
                this.qemuImages = qemuImages;
            });

            this.consoleTypes = this.configurationService.getConsoleTypes();
        });
    }

    setDiskImage(value: string) {
        this.newImageSelected = value === "newImage";
    }

    uploadImageFile(event) {
        this.chosenImage = event.target.files[0].name;
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates']);
    }

    addTemplate() {
        if (!this.nameForm.invalid && !this.memoryForm.invalid && (this.selectedImage || this.chosenImage)) {
            this.qemuTemplate.ram = this.memoryForm.get("ramMemory").value;
            this.qemuTemplate.qemu_path = this.selectedBinary.path;
            if (this.newImageSelected) {
                this.qemuTemplate.hda_disk_image =  this.chosenImage;
            } else {
                this.qemuTemplate.hda_disk_image = this.selectedImage.path;
            }
            this.qemuTemplate.template_id = uuid();
            this.qemuTemplate.name = this.nameForm.get("templateName").value();

            this.qemuService.addTemplate(this.server, this.qemuTemplate).subscribe((template: QemuTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
