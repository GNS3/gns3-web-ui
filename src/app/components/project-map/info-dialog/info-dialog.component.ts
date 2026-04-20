import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { InfoService } from '@services/info.service';

@Component({
  standalone: true,
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule],
})
export class InfoDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<InfoDialogComponent>);
  private infoService = inject(InfoService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() node: Node;
  infoList: string[] = [];
  usage: string = '';
  commandLine: string = '';

  ngOnInit() {
    this.infoList = this.infoService.getInfoAboutNode(this.node, this.controller);
    this.commandLine = this.infoService.getCommandLine(this.node);
    this.usage = this.node.usage ? this.node.usage : `No usage information has been provided for this node.`;
    this.cd.markForCheck();
  }

  onCloseClick() {
    this.dialogRef.close();
  }
}
