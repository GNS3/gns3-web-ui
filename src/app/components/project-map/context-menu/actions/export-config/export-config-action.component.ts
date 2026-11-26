import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Controller } from '@models/controller';
import {
  configurationExportFileName,
  ConfigurationExportOptions,
  StartupConfigurationsService,
} from '@services/startup-configurations.service';
import { configurationExportDriver, nodeConfigCapabilities } from '@services/configuration-capabilities';
import { configurationErrorMessage, unwrapBlobError } from '@services/configuration-messages';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { finalize, timeout } from 'rxjs';
import { Node } from '../../../../../cartography/models/node';
import { downloadBlob, sanitizeFileName } from '../../../../../utils/file-download.util';
import { ConfigDialogComponent } from '../../dialogs/config-dialog/config-dialog.component';

/**
 * Context-menu "Export config": a pure download. It never asks the server to
 * save into a configuration set; saving device output into a set is the explicit "Fetch from node" action in the node's
 * Configuration tab or the bulk "Export all configurations" action.
 *
 * IOU and Dynamips download the node's saved startup or private configuration
 * file. With `running`, the action instead reads the running configuration of a
 * started IOU or Dynamips router from its console.
 */
@Component({
  selector: 'app-export-config-action',
  templateUrl: './export-config-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportConfigActionComponent {
  private configurations = inject(StartupConfigurationsService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private nodeService = inject(NodeService);
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);
  readonly running = input(false);
  private readonly activeExports = new Set<string>();

  get supportsExport(): boolean {
    const node = this.node();
    if (this.running()) return this.hasStartupFiles() && node.status === 'started';
    return nodeConfigCapabilities(node).supported;
  }

  get label(): string {
    if (this.exportInProgress) return 'Exporting config…';
    return this.running() ? 'Export running config' : 'Export config';
  }

  /** IOU and Dynamips keep a startup and a private configuration file in the node folder. */
  private hasStartupFiles(): boolean {
    return ['dynamips', 'iou'].includes(this.node()?.node_type);
  }

  get exportInProgress(): boolean {
    const node = this.node();
    return !!node && this.activeExports.has(this.exportKey(this.controller(), node));
  }

  private exportKey(controller: Controller, node: Node): string {
    return JSON.stringify([controller?.id, node.project_id, node.node_id]);
  }

  exportConfig() {
    const node = this.node();
    const controller = this.controller();
    if (!node || !this.supportsExport || this.exportInProgress) return;
    if (this.hasStartupFiles() && !this.running()) {
      this.chooseSavedFile(controller, node);
      return;
    }
    const driver = configurationExportDriver(node.netmiko_device_type);
    if (node.node_type === 'qemu' && !driver) {
      this.toasterService.error('Set a supported Netmiko device type in the node’s General settings before exporting.');
      return;
    }
    const options: ConfigurationExportOptions =
      node.node_type === 'qemu'
        ? { device_type: driver }
        : this.running()
          ? { source: 'running', device_type: 'cisco_ios_telnet' }
          : {};
    this.exportDownload(controller, node, options);
  }

  private chooseSavedFile(controller: Controller, node: Node) {
    this.dialog
      .open(ConfigDialogComponent, {
        panelClass: ['base-dialog-panel', 'export-config-action-dialog-panel', 'dialog-medium-panel'],
        autoFocus: false,
        disableClose: false,
      })
      .afterClosed()
      .subscribe((choice?: string) => {
        if (choice !== 'startup-config' && choice !== 'private-config') return;
        const privateFile = choice === 'private-config';
        const request = privateFile
          ? this.nodeService.getPrivateConfiguration(controller, node)
          : this.nodeService.getStartupConfiguration(controller, node);
        request.subscribe({
          next: (config: unknown) => {
            const name = `${sanitizeFileName(node.name)}_${privateFile ? 'private' : 'startup'}.cfg`;
            downloadBlob(name, new Blob([config as string], { type: 'text/plain;charset=utf-8' }));
            this.toasterService.success(`Configuration for node "${node.name}" exported.`);
          },
          error: (error) => {
            const kind = privateFile ? 'private' : 'startup';
            this.toasterService.error(
              error.error?.message || error.message || `Failed to export ${kind} configuration`,
            );
            this.cdr.markForCheck();
          },
        });
      });
  }

  private exportDownload(controller: Controller, node: Node, options: ConfigurationExportOptions) {
    const key = this.exportKey(controller, node);
    this.activeExports.add(key);
    this.cdr.markForCheck();
    this.configurations
      .exportConfiguration(controller, node, options)
      .pipe(
        // Bound stalled export requests as well as the compute-side deadline.
        timeout(45000),
        finalize(() => {
          this.activeExports.delete(key);
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (blob) => {
          downloadBlob(configurationExportFileName(node, options, blob), blob);
          this.toasterService.success(`Configuration for node "${node.name}" exported.`);
        },
        error: (error) => {
          const report = (readable: unknown) =>
            this.toasterService.error(configurationErrorMessage(readable, 'export', { nodeType: node.node_type }));
          // A Blob error body can only be read asynchronously; everything else is reported at once.
          if ((error?.originalError || error)?.error instanceof Blob) unwrapBlobError(error).then(report);
          else report(error);
        },
      });
  }
}
