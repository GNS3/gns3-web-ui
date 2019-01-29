import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { QemuService } from '../../../../services/qemu.service';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { QemuImage } from '../../../../models/qemu/qemu-image';
import { ToasterService } from '../../../../services/toaster.service';
import { QemuTemplate } from '../../../../models/templates/qemu-template';


@Component({
    selector: 'app-add-qemu-virtual-machine-template',
    templateUrl: './add-qemu-vm-template.component.html',
    styleUrls: ['./add-qemu-vm-template.component.scss']
})
export class AddQemuVmTemplateComponent implements OnInit {
    server: Server;
    templateName: string;
    qemuBinaries: QemuBinary[] = [];
    selectedBinary: QemuBinary;
    ramMemory: number;
    consoleTypes: string[] = ['telnet', 'vnc', 'spice', 'spice+agent', 'none'];
    selectedConsoleType: string;
    newImageSelected: boolean;
    qemuImages: QemuImage[] = [];
    selectedImage: QemuImage;
    chosenImage: string;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private toasterService: ToasterService,
        private router: Router
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
            this.qemuService.getBinaries(server).subscribe((qemuBinaries: QemuBinary[]) => {
                this.qemuBinaries = qemuBinaries;
            });
            this.qemuService.getImages(server).subscribe((qemuImages: QemuImage[]) => {
                this.qemuImages = qemuImages;
            });
        });
    }

    setDiskImage(value: string) {
        this.newImageSelected = value === "newImage";
    }

    uploadImageFile(event) {
        this.chosenImage = event.target.files[0].name;
    }

    addTemplate() {
        if (!(this.templateName && this.selectedBinary && this.ramMemory && this.selectedConsoleType &&
            (this.selectedImage || this.chosenImage))) {
            let qemuTemplate = new QemuTemplate();
            qemuTemplate.adapter_type = "e1000";
            qemuTemplate.adapters = 1;
            qemuTemplate.boot_priority = "c";
            qemuTemplate.category = "guest";
            qemuTemplate.name = this.templateName;
            this.qemuService.addTemplate(this.server, qemuTemplate).subscribe((template: QemuTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
