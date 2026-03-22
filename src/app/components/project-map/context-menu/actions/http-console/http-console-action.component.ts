import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
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
export class HttpConsoleActionComponent implements OnInit {
  private nodeConsoleService = inject(NodeConsoleService);
  private vncConsoleService = inject(VncConsoleService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private mapSettingsService = inject(MapSettingsService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);

  ngOnInit() {}

  openConsole() {
    let nodesToStart = '';
    let nodesToStartCounter = 0;

    this.nodes().forEach((n) => {
      if (n.console_type !== 'none') {
        if (n.status === 'started') {
          // Check console type to determine how to open the console
          if (n.console_type === 'vnc') {
            // VNC console: use standalone page in popup window
            this.vncConsoleService.openVncConsole(this.controller(), n, false);
          } else if (n.console_type && n.console_type.startsWith('http')) {
            // HTTP/HTTPS console: open directly in popup window
            if (n.console_host === '0.0.0.0' || n.console_host === '0:0:0:0:0:0:0:0' || n.console_host === '::') {
              n.console_host = this.controller().host;
            }

            const uri = `${n.console_type}://${n.console_host}:${n.console}`;
            window.open(uri, `Console-${n.name}`, 'width=1024,height=768');
          } else if (n.console_type === 'telnet') {
            // Telnet console: open in embedded widget
            this.mapSettingsService.logConsoleSubject.next(true);
            setTimeout(() => {
              this.nodeConsoleService.openConsoleForNode(n);
              this.cdr.markForCheck();
            }, 500);
          } else {
            this.toasterService.error(`Console type '${n.console_type}' is not supported for node ${n.name}.`);
          }
        } else {
          nodesToStartCounter++;
          nodesToStart += n.name + ' ';
        }
      }
    });

    if (nodesToStartCounter > 0) {
      this.toasterService.error(
        'Please start the following nodes if you want to open consoles for them: ' + nodesToStart
      );
    }
  }
}
