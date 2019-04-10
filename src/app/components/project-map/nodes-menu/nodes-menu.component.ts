import { Component, Input } from "@angular/core";
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { NodeService } from '../../../services/node.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
    selector: 'app-nodes-menu',
    templateUrl: './nodes-menu.component.html',
    styleUrls: ['./nodes-menu.component.scss']
})
export class NodesMenuComponent {
    @Input('project') project: Project;
    @Input('server') server: Server;

    constructor(
        private nodeService: NodeService,
        private toasterService: ToasterService
    ) {}

    startNodes() {
        this.nodeService.startAll(this.server, this.project).subscribe(() => {
            this.toasterService.success('All nodes successfully started');
        });
    }

    stopNodes() {
        this.nodeService.stopAll(this.server, this.project).subscribe(() => {
            this.toasterService.success('All nodes successfully stopped');
        });
    }

    suspendNodes() {
        this.nodeService.suspendAll(this.server, this.project).subscribe(() => {
            this.toasterService.success('All nodes successfully suspended');
        });
    }

    reloadNodes() {
        this.nodeService.reloadAll(this.server, this.project).subscribe(() => {
            this.toasterService.success('All nodes successfully reloaded');
        });
    }
}
