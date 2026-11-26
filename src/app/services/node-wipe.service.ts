import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Controller } from '@models/controller';
import { EMPTY, catchError, filter, switchMap, tap } from 'rxjs';
import { Node } from '../cartography/models/node';
import { wipeableNodes } from './configuration-capabilities';
import { configurationErrorMessage, configurationErrorText } from './configuration-messages';
import { ProjectService } from './project.service';
import { StartupConfigurationsService } from './startup-configurations.service';
import { ToasterService } from './toaster.service';

/**
 * The one entry point for wiping nodes (context menu and nodes menu). Any
 * supported node can be wiped in any state: the server stops running nodes
 * first (the "stop, wipe, start" workflow) and wipes stopped nodes directly.
 */
@Injectable({ providedIn: 'root' })
export class NodeWipeService {
  private dialog = inject(MatDialog);
  private configurations = inject(StartupConfigurationsService);
  private toaster = inject(ToasterService);
  private projects = inject(ProjectService);

  /**
   * Confirm, wipe and report. Never errors: failures are shown as a toast, so
   * callers only need to reset their own busy state when it completes.
   */
  wipe(controller: Controller, projectId: string, nodes: Node[], all = false) {
    return this.confirm(controller, projectId, nodes, all).pipe(
      catchError((error) => {
        this.toaster.error(configurationErrorMessage(error, 'wipe') || 'Node wipe failed.');
        return EMPTY;
      }),
    );
  }

  confirm(controller: Controller, projectId: string, nodes: Node[], all = false) {
    // "Wipe all" reads the current node list from the server so it covers every node in the project.
    if (all) {
      return this.projects
        .nodes(controller, projectId)
        .pipe(switchMap((current) => this.confirmNodes(controller, projectId, current, true)));
    }
    if (!nodes?.length) return EMPTY;
    return this.confirmNodes(controller, projectId, nodes, false);
  }

  private confirmNodes(controller: Controller, projectId: string, nodes: Node[], all: boolean) {
    nodes = wipeableNodes(nodes);
    if (!nodes.length) {
      if (all) this.toaster.info('No nodes in this project support wiping.');
      return EMPTY;
    }
    return this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: [
          'base-confirmation-dialog-panel',
          'dialog-small-panel',
          'confirmation-danger-panel',
          'wipe-confirmation-panel',
        ],
        autoFocus: '.cancel-button',
        data: {
          title:
            all || nodes.length > 1
              ? `Wipe ${nodes.length} node${nodes.length === 1 ? '' : 's'}?`
              : `Wipe ${nodes[0]?.name}?`,
          message: `${
            all || nodes.length > 1 ? 'These nodes' : 'This node'
          } will be reset to a clean state. Your saved configuration sets are kept.`,
          note: 'This action cannot be undone.',
          confirmButtonText: all ? 'Wipe all nodes' : nodes.length > 1 ? 'Wipe nodes' : 'Wipe node',
          tone: 'danger',
        },
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        // Never send an empty/project-wide selection for a toolbar action.
        switchMap(() =>
          this.configurations.wipe(
            controller,
            projectId,
            nodes.map((node) => node.node_id),
          ),
        ),
        tap((result) => {
          const results = Object.entries(result?.nodes ?? {});
          const wiped = results.filter(([, status]) => status === 'wiped');
          const stopped = new Set(result?.stopped);
          if (wiped.length) {
            const stoppedFirst = wiped.filter(([id]) => stopped.has(id)).length;
            this.toaster.success(
              `${wiped.length} node${wiped.length === 1 ? '' : 's'} wiped${stoppedFirst ? ` (${stoppedFirst} stopped first)` : ''}.`,
            );
          }
          const names = new Map(nodes.map((node) => [node.node_id, node.name]));
          for (const [id, status] of results) {
            if (status === 'wiped') continue;
            const reason = configurationErrorText(status, 'wipe');
            const stoppedOnly = stopped.has(id) ? ' The node was stopped.' : '';
            this.toaster.error(`${names.get(id) || id} was not wiped. ${reason}${stoppedOnly}`);
          }
        }),
      );
  }
}
