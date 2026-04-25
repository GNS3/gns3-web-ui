import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef, model } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Node } from '../../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html',
  styleUrl: './config-editor.component.scss',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigEditorDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ConfigEditorDialogComponent>);
  public nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  node: Node;

  readonly config = model<any>('');
  readonly privateConfig = model<any>('');

  ngOnInit() {
    this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe({
      next: (config: any) => {
        this.config.set(config);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load startup configuration';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });

    if (this.node.node_type === 'iou' || this.node.node_type === 'dynamips') {
      this.nodeService.getPrivateConfiguration(this.controller, this.node).subscribe({
        next: (privateConfig: any) => {
          this.privateConfig.set(privateConfig);
          this.cdr.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load private configuration';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    }
  }

  onConfigChange(value: string) {
    this.config.set(value);
    this.cdr.markForCheck();
  }

  onPrivateConfigChange(value: string) {
    this.privateConfig.set(value);
    this.cdr.markForCheck();
  }

  onSaveClick() {
    this.nodeService.saveConfiguration(this.controller, this.node, this.config()).subscribe({
      next: (response) => {
        if (this.node.node_type === 'iou' || this.node.node_type === 'dynamips') {
          this.nodeService.savePrivateConfiguration(this.controller, this.node, this.privateConfig()).subscribe({
            next: (resp) => {
              this.dialogRef.close();
              this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
              this.cdr.markForCheck();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to save private configuration';
              this.toasterService.error(message);
              this.cdr.markForCheck();
            },
          });
        } else {
          this.dialogRef.close();
          this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to save configuration';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
