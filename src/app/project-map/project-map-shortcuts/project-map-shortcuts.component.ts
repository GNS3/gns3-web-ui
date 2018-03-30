import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { SelectionManager } from '../../cartography/shared/managers/selection-manager';
import { NodeService } from '../../shared/services/node.service';
import { Server } from '../../shared/models/server';
import { ToasterService } from '../../shared/services/toaster.service';


@Component({
  selector: 'app-project-map-shortcuts',
  templateUrl: './project-map-shortcuts.component.html'
})
export class ProjectMapShortcutsComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  @Input() selectionManager: SelectionManager;

  private deleteHotkey: Hotkey;

  constructor(
    private hotkeysService: HotkeysService,
    private toaster: ToasterService,
    private nodesService: NodeService,
  ) { }

  ngOnInit() {
    this.deleteHotkey = new Hotkey('del', (event: KeyboardEvent): boolean => {
      const selectedNodes = this.selectionManager.getSelectedNodes();
      if (selectedNodes) {
        selectedNodes.forEach((node) => {
          this.nodesService.delete(this.server, node).subscribe(data => {
            this.toaster.success("Node has been deleted");
          });
        });
      }
      return false;
    });

    this.hotkeysService.add(this.deleteHotkey);
  }

  ngOnDestroy() {
    this.hotkeysService.remove(this.deleteHotkey);
  }
}
