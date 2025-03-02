import { Component, Input, OnChanges } from '@angular/core';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';
import { ProjectService } from '@services/project.service';

@Component({
  selector: 'app-lock-action',
  templateUrl: './lock-action.component.html',
})
export class LockActionComponent implements OnChanges {
  @Input() controller: Controller;
  @Input() nodes: Node[];
  @Input() drawings: Drawing[];
  command: string;

  constructor(
    private nodesDataSource: NodesDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private nodeService: NodeService,
    private drawingService: DrawingService,
    private projectService: ProjectService
  ) {}

  ngOnChanges() {
    if (this.nodes.length === 1 && this.drawings.length === 0) {
      this.command = this.nodes[0].locked ? 'Unlock item' : 'Lock item';
    } else if (this.nodes.length === 0 && this.drawings.length === 1) {
      this.command = this.drawings[0].locked ? 'Unlock item' : 'Lock item';
    } else {
      this.command = 'Lock/unlock items';
    }
  }

  async lock() {
   await this.nodes.forEach((node) => {
      node.locked = !node.locked;
      this.nodeService.updateNode(this.controller, node).subscribe((node) => {
        this.nodesDataSource.update(node);
      });
    });

   await this.drawings.forEach((drawing) => {
      drawing.locked = !drawing.locked;
      this.drawingService.update(this.controller, drawing).subscribe((drawing) => {
        this.drawingsDataSource.update(drawing);
      });
    });
    this.projectService.projectUpdateLockIcon()
  }
}
