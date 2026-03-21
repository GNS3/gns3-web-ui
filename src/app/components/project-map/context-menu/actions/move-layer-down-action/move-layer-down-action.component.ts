import { Component, OnInit, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';

@Component({
  standalone: true,
  selector: 'app-move-layer-down-action',
  templateUrl: './move-layer-down-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class MoveLayerDownActionComponent implements OnInit {
  private nodesDataSource = inject(NodesDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private nodeService = inject(NodeService);
  private drawingService = inject(DrawingService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);
  readonly drawings = input<Drawing[]>(undefined);

  ngOnInit() {}

  moveLayerDown() {
    this.nodes().forEach((node) => {
      node.z--;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.controller(), node).subscribe((node: Node) => {});
    });

    this.drawings().forEach((drawing) => {
      drawing.z--;
      this.drawingsDataSource.update(drawing);

      this.drawingService.update(this.controller(), drawing).subscribe((drawing: Drawing) => {});
    });
  }
}
