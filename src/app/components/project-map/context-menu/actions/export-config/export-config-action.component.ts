import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ConfigDialogComponent } from '../../dialogs/config-dialog/config-dialog.component';

@Component({
  selector: 'app-export-config-action',
  templateUrl: './export-config-action.component.html',
})
export class ExportConfigActionComponent {
  @Input() controller:Controller ;
  @Input() node: Node;

  constructor(private nodeService: NodeService, private dialog: MatDialog) {}

  exportConfig() {
    if (this.node.node_type === 'vpcs') {
      this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe((config: any) => {
        this.downloadByHtmlTag(config);
      });
    } else {
      const dialogRef = this.dialog.open(ConfigDialogComponent, {
        width: '500px',
        autoFocus: false,
        disableClose: true,
      });
      let instance = dialogRef.componentInstance;
      dialogRef.afterClosed().subscribe((configType: string) => {
        if (configType === 'startup-config') {
          this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe((config: any) => {
            this.downloadByHtmlTag(config);
          });
        } else if (configType === 'private-config') {
          this.nodeService.getPrivateConfiguration(this.controller, this.node).subscribe((config: any) => {
            this.downloadByHtmlTag(config);
          });
        }
      });
    }
  }

  private downloadByHtmlTag(config: string) {
    const element = document.createElement('a');
    const fileType = 'text/plain';
    element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(config)}`);
    if (this.node.node_type === 'vpcs') {
      element.setAttribute('download', `${this.node.name}_startup.vpc`);
    } else if (this.node.node_type === 'iou' || this.node.node_type === 'dynamips') {
      element.setAttribute('download', `${this.node.name}_startup.cfg`);
    }

    var event = new MouseEvent('click');
    element.dispatchEvent(event);
  }
}
