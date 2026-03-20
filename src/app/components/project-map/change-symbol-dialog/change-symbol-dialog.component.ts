import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  standalone: false,
  selector: 'app-change-symbol-dialog',
  templateUrl: './change-symbol-dialog.component.html',
  styleUrls: ['./change-symbol-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeSymbolDialogComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;
  symbol: string;

  constructor(public dialogRef: MatDialogRef<ChangeSymbolDialogComponent>, private nodeService: NodeService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.symbol = this.node.symbol;
    this.cd.markForCheck();
  }

  symbolChanged(chosenSymbol: string) {
    this.symbol = chosenSymbol;
    this.cd.markForCheck();
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
