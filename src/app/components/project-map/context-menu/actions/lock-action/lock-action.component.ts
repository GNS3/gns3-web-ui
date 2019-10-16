import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../../../../services/node.service';
import { Drawing } from '../../../../../cartography/models/drawing';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '../../../../../services/drawing.service';

@Component({
  selector: 'app-lock-action',
  templateUrl: './lock-action.component.html'
})
export class LockActionComponent implements OnChanges {
    @Input() server: Server;
    @Input() nodes: Node[];
    @Input() drawings: Drawing[];
    command: string;

    constructor(
        private nodesDataSource: NodesDataSource,
        private drawingsDataSource: DrawingsDataSource,
        private nodeService: NodeService,
        private drawingService: DrawingService
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

    lock() {
        this.nodes.forEach((node) => {
            node.locked = !node.locked;
            this.nodeService.updateNode(this.server, node).subscribe((node) => { this.nodesDataSource.update(node) });
        });

        this.drawings.forEach((drawing) => {
            drawing.locked = ! drawing.locked;
            this.drawingService.update(this.server, drawing).subscribe((drawing) => { this.drawingsDataSource.update(drawing) });
        });
    }
}
