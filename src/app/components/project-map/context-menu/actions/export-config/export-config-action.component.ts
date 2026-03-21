import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ConfigDialogComponent } from '../../dialogs/config-dialog/config-dialog.component';

@Component({
  standalone: true,
  selector: 'app-export-config-action',
  templateUrl: './export-config-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class ExportConfigActionComponent {
  private nodeService = inject(NodeService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);

  @Input() controller: Controller;
  @Input() node: Node;

  exportConfig() {
    if (this.node.node_type === 'vpcs') {
      this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe({
        next: (config: any) => {
          this.downloadByHtmlTag(config);
        },
        error: (error) => {
          this.toasterService.error(error.error?.message || 'Failed to export configuration');
        },
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
          this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe({
            next: (config: any) => {
              this.downloadByHtmlTag(config);
            },
            error: (error) => {
              this.toasterService.error(error.error?.message || 'Failed to export startup configuration');
            },
          });
        } else if (configType === 'private-config') {
          this.nodeService.getPrivateConfiguration(this.controller, this.node).subscribe({
            next: (config: any) => {
              this.downloadByHtmlTag(config);
            },
            error: (error) => {
              this.toasterService.error(error.error?.message || 'Failed to export private configuration');
            },
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
