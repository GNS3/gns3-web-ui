import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { SelectionManager } from '../../../cartography/managers/selection-manager';
import { NodeService } from '../../../services/node.service';
import { Server } from '../../../models/server';
import { ToasterService } from '../../../services/toaster.service';
import { Project } from "../../../models/project";
import { ProjectService } from "../../../services/project.service";


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
    private projectService: ProjectService
  ) { }

  ngOnInit() {
    const self = this;
    this.deleteHotkey = new Hotkey('del', (event: KeyboardEvent) => {
      return self.onDeleteHandler(event);
    });
    this.hotkeysService.add(this.deleteHotkey);
  }

  onDeleteHandler(event: KeyboardEvent): boolean {
    if (!this.projectService.isReadOnly(this.project)) {
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
