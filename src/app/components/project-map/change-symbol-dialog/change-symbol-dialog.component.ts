import { Component, Input, OnInit } from '@angular/core';
import { Message } from '../../../models/message';
import { Server } from '../../../models/server';
import { Node } from '../../../cartography/models/node';
import { Symbol } from '../../../models/symbol';
import { NodeService } from '../../../services/node.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-change-symbol-dialog',
    templateUrl: './change-symbol-dialog.component.html',
    styleUrls: ['./change-symbol-dialog.component.scss']
})
export class ChangeSymbolDialogComponent implements OnInit {
    @Input() server: Server;
    @Input() node: Node;
    symbol: string;

    constructor(
        public dialogRef: MatDialogRef<ChangeSymbolDialogComponent>,
        private nodeService: NodeService
    ) {}

    ngOnInit() {
        this.symbol = this.node.symbol;
    }

    symbolChanged(chosenSymbol: string) {
        this.symbol = chosenSymbol;
    }

    onCloseClick() {
        this.dialogRef.close();
    }

    onSelectClick() {
        this.nodeService.updateSymbol(this.server, this.node, this.symbol).subscribe(() => {
            this.onCloseClick()
        });
    }
}
