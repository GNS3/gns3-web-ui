import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material';
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
    public appliances: Appliance[] = [];

    public categories: string[] = ['router', 'multilayer_switch', 'guest', 'firewall'];
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
        });
    }

    setAction(action: string) {
        this.action = action;
        if (action === 'install') {
            this.actionTitle = 'Install appliance from server';
        } else if (action === 'import') {
            this.actionTitle = 'Import an appliance file';
        }
    }

    onCloseClick() {
        this.dialogRef.close();
    }
}
