import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Project } from '../../../../../models/project';
import { NodeService } from '../../../../../services/node.service';
import { DrawingService } from '../../../../../services/drawing.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';

@Component({
selector: 'app-duplicate-action',
templateUrl: './duplicate-action.component.html'
})
export class DuplicateActionComponent {
    @Input() server: Server;
    @Input() project: Project;
    @Input() drawings: Drawing[];
    @Input() nodes: Node[];
    
    constructor(
        private nodeService: NodeService,
        private nodesDataSource: NodesDataSource,
        private drawingService: DrawingService,
        private drawingsDataSource: DrawingsDataSource
    ) {}

    duplicate() {
        for(let node of this.nodes) {
            this.nodeService.duplicate(this.server, node).subscribe((node: Node) => {
                this.nodesDataSource.add(node);
            });
        }

        for(let drawing of this.drawings) {
            this.drawingService.duplicate(this.server, drawing.project_id, drawing).subscribe((drawing: Drawing) => {
                this.drawingsDataSource.add(drawing);
            })
        }
    }
}
