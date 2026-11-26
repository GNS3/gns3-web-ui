import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Controller } from '@models/controller';
import { nodeConfigCapabilities } from '@services/configuration-capabilities';
import { Node } from '../../../../../cartography/models/node';
import { StartupSelectionDialogComponent } from './startup-selection-dialog.component';

/**
 * Configuration set actions (capture, assign, clear) for several selected nodes; unsupported node types are left out.
 * A single node has these actions in its Configuration tab.
 */
@Component({
  selector: 'app-startup-selection-action',
  imports: [MatMenuModule, MatIconModule],
  template: `@if (supported().length > 1) {
    <button mat-menu-item (click)="open()">
      <mat-icon>settings_backup_restore</mat-icon>
      <span>Configuration sets ({{ supported().length }} nodes)</span>
    </button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartupSelectionActionComponent {
  readonly controller = input<Controller>();
  readonly nodes = input<Node[]>([]);
  private dialog = inject(MatDialog);

  supported() {
    return this.nodes().filter((node) => nodeConfigCapabilities(node).supported);
  }

  open() {
    const nodes = this.supported();
    if (nodes.length < 2) return;
    this.dialog.open(StartupSelectionDialogComponent, {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel', 'startup-selection-dialog-panel'],
      autoFocus: false,
      data: { controller: this.controller(), projectId: nodes[0].project_id, nodes },
    });
  }
}
