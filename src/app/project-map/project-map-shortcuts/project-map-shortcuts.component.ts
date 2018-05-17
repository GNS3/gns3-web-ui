import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { SelectionManager } from '../../cartography/shared/managers/selection-manager';
import { NodeService } from '../../shared/services/node.service';
import { Server } from '../../shared/models/server';
import { ToasterService } from '../../shared/services/toaster.service';
import { Project } from "../../shared/models/project";


@Component({
  selector: 'app-project-map-shortcuts',
  template: ''
})
export class ProjectMapShortcutsComponent implements OnInit, OnDestroy {
  @Input() project: Project;
  @Input() server: Server;
  @Input() selectionManager: SelectionManager;

  private deleteHotkey: Hotkey;

  constructor(
    private hotkeysService: HotkeysService,
    private toaster: ToasterService,
    private nodesService: NodeService,
  ) { }

  ngOnInit() {
    this.deleteHotkey = new Hotkey('del', this.onDeleteHandler);
    this.hotkeysService.add(this.deleteHotkey);
  }

  onDeleteHandler(event: KeyboardEvent):boolean {
    if (!this.project.readonly) {
      const selectedNodes = this.selectionManager.getSelectedNodes();
      if (selectedNodes) {
        selectedNodes.forEach((node) => {
          this.nodesService.delete(this.server, node).subscribe(data => {
            this.toaster.success("Node has been deleted");
          });
        });
      }
    }
    return false;
  }

  ngOnDestroy() {
    this.hotkeysService.remove(this.deleteHotkey);
  }
}
