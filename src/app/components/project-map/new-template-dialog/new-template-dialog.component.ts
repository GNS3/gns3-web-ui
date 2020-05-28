import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, Sort } from '@angular/material';
import { Server } from '../../../models/server';
import { Node } from '../../../cartography/models/node';
import { Project } from '../../../models/project';
import { ApplianceService } from '../../../services/appliances.service';
import { Appliance } from '../../../models/appliance';

@Component({
    selector: 'app-new-template-dialog',
    templateUrl: './new-template-dialog.component.html',
    styleUrls: ['./new-template-dialog.component.scss']
})
export class NewTemplateDialogComponent implements OnInit {
    @Input() server: Server;
    @Input() project: Project;

    public action: string = 'install';
    public actionTitle: string = 'Install appliance from server';

    public searchText: string = '';
    public allAppliances: Appliance[] = [];
    public appliances: Appliance[] = [];

    public categories: string[] = ['all categories', 'router', 'multilayer_switch', 'guest', 'firewall'];
    public category: string = 'all categories';
    public displayedColumns: string[] = ['name', 'emulator', 'vendor'];

    constructor(
        public dialogRef: MatDialogRef<NewTemplateDialogComponent>,
        private applianceService: ApplianceService,
        private changeDetector: ChangeDetectorRef
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
        });
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
}

function compareNames(a: string, b: string, isAsc: boolean) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
