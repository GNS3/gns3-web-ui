import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { SelectionManager } from '../../../cartography/managers/selection-manager';
import { NodeService } from '../../../services/node.service';
import { Server } from '../../../models/server';
import { ToasterService } from '../../../services/toaster.service';
import { Project } from '../../../models/project';
import { ProjectService } from '../../../services/project.service';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';

@Component({
  selector: 'app-project-map-shortcuts',
  template: ''
})
export class ProjectMapShortcutsComponent implements OnInit, OnDestroy {
  @Input() project: Project;
  @Input() server: Server;

  private deleteHotkey: Hotkey;

  constructor(
    private hotkeysService: HotkeysService,
    private toaster: ToasterService,
    private nodesService: NodeService,
    private projectService: ProjectService,
    private mapNodeToNode: MapNodeToNodeConverter,
    private selectionManager: SelectionManager
  ) {}

  ngOnInit() {
    const self = this;
    this.deleteHotkey = new Hotkey('del', (event: KeyboardEvent) => {
      return self.onDeleteHandler(event);
    });
    this.hotkeysService.add(this.deleteHotkey);
  }

  onDeleteHandler(event: KeyboardEvent): boolean {
    if (!this.projectService.isReadOnly(this.project)) {
      const selected = this.selectionManager.getSelected();

      selected
        .filter(item => item instanceof MapNode)
        .forEach((item: MapNode) => {
          const node = this.mapNodeToNode.convert(item);
          this.nodesService.delete(this.server, node).subscribe(data => {
            this.toaster.success('Node has been deleted');
          });
        });
    }
    return false;
  }

  ngOnDestroy() {
    this.hotkeysService.remove(this.deleteHotkey);
  }
}
