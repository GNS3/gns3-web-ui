import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { SymbolsComponent } from '@components/preferences/common/symbols/symbols.component';

@Component({
  standalone: true,
  selector: 'app-change-symbol-dialog',
  templateUrl: './change-symbol-dialog.component.html',
  styleUrls: ['./change-symbol-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, SymbolsComponent],
})
export class ChangeSymbolDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ChangeSymbolDialogComponent>);
  private nodeService = inject(NodeService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() node: Node;
  symbol: string;

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
