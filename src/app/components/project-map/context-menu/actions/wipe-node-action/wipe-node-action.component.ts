import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Controller } from '@models/controller';
import { wipeableNodes } from '@services/configuration-capabilities';
import { NodeWipeService } from '@services/node-wipe.service';
import { finalize } from 'rxjs';
import { Node } from '../../../../../cartography/models/node';

/**
 * Wipe is offered for every supported node in any state (the server stops a
 * running node first), for one node or a multi-selection.
 */
@Component({
  selector: 'app-wipe-node-action',
  imports: [MatMenuModule, MatIconModule],
  template: `@if (wipeable().length) {
    <button mat-menu-item (click)="wipe()" [disabled]="busy()">
      <mat-icon>delete_sweep</mat-icon><span>{{ wipeable().length > 1 ? 'Wipe nodes' : 'Wipe node' }}</span>
    </button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WipeNodeActionComponent {
  readonly controller = input<Controller>();
  readonly nodes = input<Node[]>([]);
  readonly busy = signal(false);
  private wipes = inject(NodeWipeService);
  private destroyRef = inject(DestroyRef);
  /** Selected nodes whose type can be wiped; the others are skipped. */
  wipeable() {
    return wipeableNodes(this.nodes());
  }
  wipe() {
    if (this.busy() || !this.wipeable().length) return;
    const nodes = this.nodes();
    this.busy.set(true);
    this.wipes
      .wipe(this.controller(), nodes[0].project_id, nodes)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
