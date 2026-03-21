import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
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
  selector: 'app-import-config-action',
  templateUrl: './import-config-action.component.html',
  styleUrls: ['./import-config-action.component.scss'],
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class ImportConfigActionComponent {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private dialog = inject(MatDialog);

  @Input() controller: Controller;
  @Input() node: Node;
  @ViewChild('fileInput') fileInput: ElementRef;
  configType: string;

  triggerClick() {
    // 重置 fileInput，确保 change 事件可以再次触发
    this.fileInput.nativeElement.value = '';
    if (this.node.node_type !== 'vpcs') {
      const dialogRef = this.dialog.open(ConfigDialogComponent, {
        width: '500px',
        autoFocus: false,
        disableClose: true,
      });
      let instance = dialogRef.componentInstance;
      dialogRef.afterClosed().subscribe((configType: string) => {
        this.configType = configType;
        this.fileInput.nativeElement.click();
      });
    } else {
      this.configType = 'startup-config';
      this.fileInput.nativeElement.click();
    }
  }

  importConfig(event) {
    let file: File = event.target.files[0];
    let fileReader: FileReader = new FileReader();
    fileReader.onload = (e) => {
      let content: string | ArrayBuffer = fileReader.result;
      if (typeof content !== 'string') {
        content = content.toString();
      }

      if (this.configType === 'startup-config') {
        this.nodeService.saveConfiguration(this.controller, this.node, content).subscribe({
          next: () => {
            this.toasterService.success(`Configuration for node ${this.node.name} imported.`);
          },
          error: (error) => {
            this.toasterService.error(error.error?.message || 'Failed to import startup configuration');
          },
        });
      } else if (this.configType === 'private-config') {
        this.nodeService.savePrivateConfiguration(this.controller, this.node, content).subscribe({
          next: () => {
            this.toasterService.success(`Configuration for node ${this.node.name} imported.`);
          },
          error: (error) => {
            this.toasterService.error(error.error?.message || 'Failed to import private configuration');
          },
        });
      } else {
        this.toasterService.error('No configuration type selected');
      }
    };
    fileReader.readAsText(file);
  }
}
