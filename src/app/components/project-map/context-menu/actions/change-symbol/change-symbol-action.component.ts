import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ChangeSymbolDialogComponent } from '../../../change-symbol-dialog/change-symbol-dialog.component';

@Component({
  selector: 'app-change-symbol-action',
  templateUrl: './change-symbol-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeSymbolActionComponent implements OnInit {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  ngOnInit() {}

  changeSymbol() {
    const dialogRef = this.dialog.open(ChangeSymbolDialogComponent, {
      width: '800px',
      autoFocus: false,
      disableClose: true,
      panelClass: 'change-symbol-dialog-panel',
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.node = this.node();
  }
}
