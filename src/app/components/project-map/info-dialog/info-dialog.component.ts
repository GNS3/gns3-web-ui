import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { InfoService } from '@services/info.service';

@Component({
  standalone: false,
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoDialogComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;
  infoList: string[] = [];
  usage: string = '';
  commandLine: string = '';

  constructor(public dialogRef: MatDialogRef<InfoDialogComponent>, private infoService: InfoService, private cd: ChangeDetectorRef) {}

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
