import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ChangeHostnameDialogComponent } from '../../../change-hostname-dialog/change-hostname-dialog.component';

@Component({
  selector: 'app-change-hostname-action',
  templateUrl: './change-hostname-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeHostnameActionComponent implements OnInit {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  ngOnInit() {}

  changeHostname() {
    const dialogRef = this.dialog.open(ChangeHostnameDialogComponent, {
      autoFocus: false,
      disableClose: false,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.node = this.node();
  }
}
