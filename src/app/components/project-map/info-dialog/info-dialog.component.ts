import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MarkdownViewerComponent } from '../../../common/markdown-viewer/markdown-viewer.component';
import { Clipboard } from '@angular/cdk/clipboard';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { InfoService, NodeCommandLineInfo, NodeInfo } from '@services/info.service';
import { ToasterService } from '@services/toaster.service';

export interface InfoDialogData {
  node: Node;
  controller: Controller;
}

@Component({
  standalone: true,
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatTabsModule, MarkdownViewerComponent],
})
export class InfoDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<InfoDialogComponent>);
  private readonly infoService = inject(InfoService);
  private readonly clipboard = inject(Clipboard);
  private readonly toasterService = inject(ToasterService);

  readonly info: NodeInfo;
  readonly commandLineInfo: NodeCommandLineInfo;
  readonly usage: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: InfoDialogData) {
    this.info = this.infoService.getInfoAboutNode(data.node, data.controller);
    this.commandLineInfo = this.infoService.getCommandLine(data.node);
    this.usage = data.node.usage ?? '';
  }

  get statusKey(): string {
    return this.info.alwaysOn ? 'always-on' : this.info.status;
  }

  get consoleLabel(): string {
    return this.info.console ? `${this.info.console.type} (port ${this.info.console.port})` : '—';
  }

  get controllerLabel(): string {
    return `${this.info.controller.name} (port ${this.info.controller.port})`;
  }

  copyCommandLine(): void {
    if (this.commandLineInfo.kind !== 'available') {
      return;
    }
    const copied = this.clipboard.copy(this.commandLineInfo.commandLine);
    if (copied) {
      this.toasterService.success('Command line copied to clipboard');
    } else {
      this.toasterService.error('Failed to copy to clipboard');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
