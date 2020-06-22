import { Component, Input, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatDialogRef, Sort, MatTableDataSource, MatPaginator, MatDialog, MatStepper, MatSelectionList, MatSelectionListChange } from '@angular/material';
import { Server } from '../../../models/server';
import { Node } from '../../../cartography/models/node';
import { Project } from '../../../models/project';
import { ApplianceService } from '../../../services/appliances.service';
import { Appliance, Image } from '../../../models/appliance';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FileUploader, FileItem, ParsedResponseHeaders } from 'ng2-file-upload';
import { ToasterService } from '../../../services/toaster.service';
import { ApplianceInfoDialogComponent } from './appliance-info-dialog/appliance-info-dialog.component';
import { QemuBinary } from '../../../models/qemu/qemu-binary';
import { QemuService } from '../../../services/qemu.service';
import { QemuTemplate } from '../../../models/templates/qemu-template';
import { v4 as uuid } from 'uuid';
import { DockerTemplate } from '../../../models/templates/docker-template';
import { DockerService } from '../../../services/docker.service';

@Component({
    selector: 'app-new-template-dialog',
    templateUrl: './new-template-dialog.component.html',
    styleUrls: ['./new-template-dialog.component.scss'],
    animations: [
        trigger('detailExpand', [
          state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
          state('expanded', style({ height: '*', visibility: 'visible' })),
          transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class NewTemplateDialogComponent implements OnInit {
    @Input() server: Server;
    @Input() project: Project;

    uploader: FileUploader;
    uploaderImage: FileUploader;

    public action: string = 'install';
    public actionTitle: string = 'Install appliance from server';
    public secondActionTitle: string = 'Appliance settings';

    public searchText: string = '';
    public allAppliances: Appliance[] = [];
    public appliances: Appliance[] = [];
    public applianceToInstall: Appliance;
    public selectedImages: any[];

    private isGns3VmChosen = true;
    private isLocalComputerChosen = false;

    public qemuBinaries: QemuBinary[] = [];
    public selectedBinary: QemuBinary;

    public categories: string[] = ['all categories', 'router', 'multilayer_switch', 'guest', 'firewall'];
    public category: string = 'all categories';
    public displayedColumns: string[] = ['name', 'emulator', 'vendor', 'actions'];

    public dataSource: MatTableDataSource<Appliance>;

    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
    @ViewChild('stepper', {static: true}) stepper: MatStepper;

    constructor(
        public dialogRef: MatDialogRef<NewTemplateDialogComponent>,
        private applianceService: ApplianceService,
        private changeDetector: ChangeDetectorRef,
        private toasterService: ToasterService,
        private qemuService: QemuService,
        private dockerService: DockerService,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
        this.applianceService.getAppliances(this.server).subscribe((appliances) => {
            this.appliances = appliances;
            this.appliances.forEach(appliance => {
                if (appliance.docker) appliance.emulator = 'Docker';
                if (appliance.dynamips) appliance.emulator = 'Dynamips';
                if (appliance.iou) appliance.emulator = 'Iou';
                if (appliance.qemu) appliance.emulator = 'Qemu';
            });
            this.allAppliances = appliances;
            this.dataSource = new MatTableDataSource(this.allAppliances);
            this.dataSource.paginator = this.paginator;
        });

        this.qemuService.getBinaries(this.server).subscribe((binaries) => {
            this.qemuBinaries = binaries;
        });

        this.uploader =  new FileUploader({});
        this.uploader.onAfterAddingFile = file => {
            file.withCredentials = false;
        };
    
        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.error('An error has occured');
        };
        
        this.uploader.onSuccessItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.success('Appliance imported succesfully');
            this.getAppliance(item.url);
        };

        this.uploaderImage =  new FileUploader({});
        this.uploaderImage.onAfterAddingFile = file => {
            file.withCredentials = false;
        };
    
        this.uploaderImage.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.error('An error has occured');
        };
        
        this.uploaderImage.onSuccessItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.success('Image imported succesfully');
        };
    }

    getAppliance(url: string) {
        let str = url.split('/v2');
        let appliancePath = str[str.length-1];
        this.applianceService.getAppliance(this.server, appliancePath).subscribe((appliance: Appliance) => {
            this.applianceToInstall = appliance;
            setTimeout(() => {
                this.stepper.next();
            }, 100);
        });
    }

    addAppliance(event): void {
        let name = event.target.files[0].name.split('-')[0];
        let fileName = event.target.files[0].name;
        let file = event.target.files[0];
        let fileReader: FileReader = new FileReader();
        let emulator;

        fileReader.onloadend = () => {
            let appliance = JSON.parse(fileReader.result as string);

            if (appliance.docker) emulator = 'docker';
            if (appliance.dynamips) emulator = 'dynamips';
            if (appliance.iou) emulator = 'iou';
            if (appliance.qemu) emulator = 'qemu';

            const url = this.applianceService.getUploadPath(this.server, emulator, fileName);
            this.uploader.queue.forEach(elem => (elem.url = url));
    
            const itemToUpload = this.uploader.queue[0];
            (itemToUpload as any).options.disableMultipart = true;
    
            this.uploader.uploadItem(itemToUpload);
        };

        fileReader.readAsText(file);
    }

    filterAppliances(event) {
        let temporaryAppliances = this.allAppliances.filter(item => {
          return item.name.toLowerCase().includes(this.searchText.toLowerCase());
        });
    
        if (this.category === 'all categories' || !this.category) {
          this.appliances = temporaryAppliances;
        } else  {
          this.appliances = temporaryAppliances.filter(t => t.category === this.category);
        }

        this.dataSource = new MatTableDataSource(this.appliances);
        this.dataSource.paginator = this.paginator;
    }

    setAction(action: string) {
        this.action = action;
        if (action === 'install') {
            this.actionTitle = 'Install appliance from server';
        } else if (action === 'import') {
            this.actionTitle = 'Import an appliance file';
        }
    }

    setServerType(serverType: string) {
        if (serverType === 'gns3 vm') {
            this.isGns3VmChosen = true;
            this.isLocalComputerChosen = false;
        } else {
            this.isGns3VmChosen = false;
            this.isLocalComputerChosen = true;
        }
    }

    sortData(sort: Sort) {
        if (!sort.active || sort.direction === '') return;

        let appliances = this.appliances.slice();
        this.appliances = appliances.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            if (sort.active === 'name') {
                return compareNames(a.name, b.name, isAsc);
            } else if (sort.active === 'emulator') {
                return compareNames(a.emulator, b.emulator, isAsc);
            } else if (sort.active === 'vendor') {
                return compareNames(a.vendor_name, b.vendor_name, isAsc);
            } else return 0;
        });
    }

    onCloseClick() {
        this.dialogRef.close();
    }

    install(object: Appliance) {
        this.applianceToInstall = object;
        setTimeout(() => {
            this.stepper.next();
        }, 100);
    }

    showInfo(object: Appliance) {
        let dialogRef = this.dialog.open(ApplianceInfoDialogComponent, {
            width: '250px',
            data: {appliance: object}
        });
        dialogRef.componentInstance.appliance = object;
    }

    importImage(event) {
        let name = event.target.files[0].name.split('-')[0];
        let fileName = event.target.files[0].name;
        let file = event.target.files[0];
        let fileReader: FileReader = new FileReader();
        let emulator;

        fileReader.onloadend = () => {
            if (this.applianceToInstall.qemu) emulator = 'qemu';

            const url = this.applianceService.getUploadPath(this.server, emulator, fileName);
            this.uploaderImage.queue.forEach(elem => (elem.url = url));
    
            const itemToUpload = this.uploaderImage.queue[0];
            (itemToUpload as any).options.disableMultipart = true;
    
            this.uploaderImage.uploadItem(itemToUpload);
        };

        fileReader.readAsText(file);
    }

    downloadImage(image: Image) {
        window.open(image.download_url);
    }

    createDockerTemplate() {
        let dockerTemplate: DockerTemplate = new DockerTemplate();
        dockerTemplate.name = this.applianceToInstall.name;
        dockerTemplate.adapters = this.applianceToInstall.docker.adapters;
        dockerTemplate.console_type = this.applianceToInstall.docker.console_type;
        dockerTemplate.builtin = this.applianceToInstall.builtin;
        dockerTemplate.category = this.applianceToInstall.category;
        dockerTemplate.default_name_format = this.applianceToInstall.port_name_format;
        dockerTemplate.symbol = this.applianceToInstall.symbol;
        dockerTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';
        dockerTemplate.template_id = uuid();
        dockerTemplate.image = this.applianceToInstall.docker.image;
        dockerTemplate.template_type = 'docker';

        this.dockerService.addTemplate(this.server, dockerTemplate).subscribe(() => {
            this.toasterService.success('Template added');
            this.dialogRef.close();
        });
    }

    createQemuTemplate(image: Image) {
        let qemuTemplate: QemuTemplate = new QemuTemplate();
        qemuTemplate.name = this.applianceToInstall.name;
        qemuTemplate.ram = this.applianceToInstall.qemu.ram;
        qemuTemplate.adapters = this.applianceToInstall.qemu.adapters;
        qemuTemplate.adapter_type = this.applianceToInstall.qemu.adapter_type;
        qemuTemplate.boot_priority = this.applianceToInstall.qemu.boot_priority;
        qemuTemplate.console_type =  this.applianceToInstall.qemu.console_type;
        qemuTemplate.hda_disk_interface = this.applianceToInstall.qemu.hda_disk_interface;
        qemuTemplate.builtin = this.applianceToInstall.builtin;
        qemuTemplate.category = this.applianceToInstall.category;
        qemuTemplate.first_port_name = this.applianceToInstall.first_port_name;
        qemuTemplate.port_name_format = this.applianceToInstall.port_name_format;
        qemuTemplate.symbol = this.applianceToInstall.symbol;
        qemuTemplate.qemu_path = this.selectedBinary.path;
        qemuTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';
        qemuTemplate.template_id = uuid();
        qemuTemplate.hda_disk_image = image.filename;
        qemuTemplate.template_type = 'qemu';

        this.qemuService.addTemplate(this.server, qemuTemplate).subscribe(() => {
            this.toasterService.success('Template added');
            this.dialogRef.close();
        });
    }
}

function compareNames(a: string, b: string, isAsc: boolean) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
