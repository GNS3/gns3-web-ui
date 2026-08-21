import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { SymbolsComponent } from '@components/preferences/common/symbols/symbols.component';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-change-symbol-dialog',
  templateUrl: './change-symbol-dialog.component.html',
  styleUrls: ['./change-symbol-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, SymbolsComponent],
})
export class ChangeSymbolDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ChangeSymbolDialogComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() node: Node;
  symbol: string;
  readonly isApplying = signal(false);

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
    if (this.isApplying()) return;
    this.isApplying.set(true);
    this.dialogRef.disableClose = true;
    this.nodeService.updateSymbol(this.controller, this.node, this.symbol).subscribe({
      next: () => {
        this.toasterService.success(`Symbol for node "${this.node.name}" updated.`);
        this.onCloseClick();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to update symbol';
        this.toasterService.error(message);
        this.isApplying.set(false);
        this.dialogRef.disableClose = false;
        this.cd.markForCheck();
      },
    });
  }
}
