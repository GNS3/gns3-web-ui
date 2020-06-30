import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { NodeService } from '../../../../../services/node.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialog } from '@angular/material';
import { ConfigDialogComponent } from '../../dialogs/config-dialog/config-dialog.component';

@Component({
    selector: 'app-import-config-action',
    templateUrl: './import-config-action.component.html',
    styleUrls: ['./import-config-action.component.scss']
})
export class ImportConfigActionComponent {
    @Input() server: Server;
    @Input() node: Node;
    @ViewChild('fileInput') fileInput: ElementRef;
    configType: string;

    constructor(
        private nodeService: NodeService,
        private toasterService: ToasterService,
        private dialog: MatDialog
    ) {}

    triggerClick() {
        if (this.node.node_type !== 'vpcs') {
            const dialogRef = this.dialog.open(ConfigDialogComponent, {
                width: '500px',
                autoFocus: false,
                disableClose: true
            });
            let instance = dialogRef.componentInstance;
            dialogRef.afterClosed().subscribe((configType: string) => {
                this.configType = configType;
                this.fileInput.nativeElement.click();
            });
        } else {
            this.configType = 'startup-config';
            this.fileInput.nativeElement.click();
        }
    }

    importConfig(event) {
        let file: File = event.target.files[0];
        let fileReader: FileReader = new FileReader();
        fileReader.onload = (e) => {
            let content: string | ArrayBuffer = fileReader.result;
            if (typeof content !== 'string'){
                content = content.toString();
            }

            if (this.configType === 'startup-config') {
                this.nodeService.saveConfiguration(this.server, this.node, content).subscribe(() => {
                    this.toasterService.success(`Configuration for node ${this.node.name} imported.`);
                });
            } else if (this.configType === 'private-config') {
                this.nodeService.savePrivateConfiguration(this.server, this.node, content).subscribe(() => {
                    this.toasterService.success(`Configuration for node ${this.node.name} imported.`);
                });
            }
        };
        fileReader.readAsText(file);
    }
}
