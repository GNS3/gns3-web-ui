import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../cartography/models/node';
import { Server } from '../../../models/server';
import { NodeService } from '../../../services/node.service';

@Component({
  selector: 'app-change-symbol-dialog',
  templateUrl: './change-symbol-dialog.component.html',
  styleUrls: ['./change-symbol-dialog.component.scss'],
})
export class ChangeSymbolDialogComponent implements OnInit {
  @Input() controller: Server;
  @Input() node: Node;
  symbol: string;

  constructor(public dialogRef: MatDialogRef<ChangeSymbolDialogComponent>, private nodeService: NodeService) {}

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
    this.nodeService.updateSymbol(this.controller, this.node, this.symbol).subscribe(() => {
      this.onCloseClick();
    });
  }
}
