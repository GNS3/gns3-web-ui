import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ToasterService } from '@services/toaster.service';
import { Router } from '@angular/router';
import { MapSettingsService } from '@services/mapsettings.service';

@Component({
  selector: 'app-http-console-action',
  templateUrl: './http-console-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpConsoleActionComponent {
  private nodeConsoleService = inject(NodeConsoleService);
  private vncConsoleService = inject(VncConsoleService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private mapSettingsService = inject(MapSettingsService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly nodes = input<Node[]>(undefined);

  @Output() openWebConsoleInline = new EventEmitter<{ node: Node; controller: Controller; project: Project }>();

  openConsole() {
    // Only support single node for inline console
    if (this.nodes().length !== 1) {
      this.toasterService.error('Inline web console is only supported for a single node.');
      return;
    }

    const node = this.nodes()[0];
    const controller = this.controller();
    const project = this.project();

    if (!controller || !project) {
      return;
    }

    // Check if node is started
    if (node.status !== 'started') {
      this.toasterService.error(`Please start the node '${node.name}' before opening the console.`);
      return;
    }

    // Check console type
    if (node.console_type === 'none') {
      this.toasterService.error(`Node '${node.name}' has no console configured.`);
      return;
    }

    // For VNC and HTTP/HTTPS consoles, use inline window
    if (node.console_type === 'vnc' || (node.console_type && node.console_type.startsWith('http'))) {
      // Emit event to parent component to open inline window
      this.openWebConsoleInline.emit({
        node,
        controller,
        project,
      });
    } else if (node.console_type === 'telnet' || node.console_type === 'ssh') {
      // Terminal console: still use embedded widget (not inline window)
      this.mapSettingsService.logConsoleSubject.next(true);
      setTimeout(() => {
        this.nodeConsoleService.openConsoleForNode(node);
        this.cdr.markForCheck();
      }, 500);
    } else {
      this.toasterService.error(`Console type '${node.console_type}' is not supported for inline web console.`);
    }
  }
}
