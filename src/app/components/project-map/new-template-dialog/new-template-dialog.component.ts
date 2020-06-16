import { Component, Input, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatDialogRef, Sort, MatTableDataSource, MatPaginator, MatDialog } from '@angular/material';
import { Server } from '../../../models/server';
import { Node } from '../../../cartography/models/node';
import { Project } from '../../../models/project';
import { ApplianceService } from '../../../services/appliances.service';
import { Appliance } from '../../../models/appliance';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FileUploader, FileItem, ParsedResponseHeaders } from 'ng2-file-upload';
import { ToasterService } from '../../../services/toaster.service';
import { ApplianceInfoDialogComponent } from './appliance-info-dialog/appliance-info-dialog.component';

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

    public action: string = 'install';
    public actionTitle: string = 'Install appliance from server';

    public searchText: string = '';
    public allAppliances: Appliance[] = [];
    public appliances: Appliance[] = [];

    public categories: string[] = ['all categories', 'router', 'multilayer_switch', 'guest', 'firewall'];
    public category: string = 'all categories';
    public displayedColumns: string[] = ['name', 'emulator', 'vendor', 'actions'];

    public dataSource: MatTableDataSource<Appliance>;

    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

    constructor(
        public dialogRef: MatDialogRef<NewTemplateDialogComponent>,
        private applianceService: ApplianceService,
        private changeDetector: ChangeDetectorRef,
        private toasterService: ToasterService,
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

        this.uploader =  new FileUploader({});
        this.uploader.onAfterAddingFile = file => {
            file.withCredentials = false;
        };
    
        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.error('An error has occured');
        };
        
        this.uploader.onSuccessItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.toasterService.success('Appliance imported succesfully');
        };
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

    install(object: any) {
        console.log(object);
    }

    showInfo(object: any) {
        console.log(object);
        
        this.dialog.open(ApplianceInfoDialogComponent, {
            width: '250px',
            data: {info: 'info'}
        });
    }
}

function compareNames(a: string, b: string, isAsc: boolean) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
