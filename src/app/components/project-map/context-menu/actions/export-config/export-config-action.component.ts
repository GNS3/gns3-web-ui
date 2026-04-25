import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
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
  selector: 'app-export-config-action',
  templateUrl: './export-config-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportConfigActionComponent {
  private nodeService = inject(NodeService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  exportConfig() {
    const node = this.node();
    if (node.node_type === 'vpcs') {
      this.nodeService.getStartupConfiguration(this.controller(), node).subscribe({
        next: (config: any) => {
          this.downloadByHtmlTag(config);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to export configuration';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    } else {
      const dialogRef = this.dialog.open(ConfigDialogComponent, {
        panelClass: ['base-dialog-panel', 'export-config-action-dialog-panel'],
        autoFocus: false,
        disableClose: false,
      });
      let instance = dialogRef.componentInstance;
      dialogRef.afterClosed().subscribe({
        next: (configType: string) => {
          if (configType === 'startup-config') {
            this.nodeService.getStartupConfiguration(this.controller(), this.node()).subscribe({
              next: (config: any) => {
                this.downloadByHtmlTag(config);
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to export startup configuration';
                this.toasterService.error(message);
                this.cdr.markForCheck();
              },
            });
          } else if (configType === 'private-config') {
            this.nodeService.getPrivateConfiguration(this.controller(), this.node()).subscribe({
              next: (config: any) => {
                this.downloadByHtmlTag(config);
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to export private configuration';
                this.toasterService.error(message);
                this.cdr.markForCheck();
              },
            });
          }
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to get config type';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    }
  }

  private downloadByHtmlTag(config: string) {
    const element = document.createElement('a');
    const fileType = 'text/plain';
    element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(config)}`);
    const node = this.node();
    if (node.node_type === 'vpcs') {
      element.setAttribute('download', `${node.name}_startup.vpc`);
    } else if (node.node_type === 'iou' || node.node_type === 'dynamips') {
      element.setAttribute('download', `${node.name}_startup.cfg`);
    }

    var event = new MouseEvent('click');
    element.dispatchEvent(event);
  }
}
