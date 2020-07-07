import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../cartography/models/node';
import { InfoService } from '../../../services/info.service';
import { Server } from '../../../models/server';

@Component({
    selector: 'app-info-dialog',
    templateUrl: './info-dialog.component.html',
    styleUrls: ['./info-dialog.component.scss']
})
export class InfoDialogComponent implements OnInit {
    @Input() server: Server;
    @Input() node: Node;
    infoList: string[] = [];
    usage: string = '';
    commandLine: string = '';

    constructor(
        public dialogRef: MatDialogRef<InfoDialogComponent>,
        private infoService: InfoService
    ) {}

    ngOnInit() {
        this.infoList = this.infoService.getInfoAboutNode(this.node, this.server);
        this.commandLine = this.infoService.getCommandLine(this.node);
        this.usage = this.node.usage ? this.node.usage : `No usage information has been provided for this node.`;
    }

    onCloseClick() {
        this.dialogRef.close();
    }
}
