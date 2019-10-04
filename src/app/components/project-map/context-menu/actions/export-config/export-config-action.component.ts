import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { NodeService } from '../../../../../services/node.service';
import { Server } from '../../../../../models/server';

@Component({
    selector: 'app-export-config-action',
    templateUrl: './export-config-action.component.html'
})
export class ExportConfigActionComponent {
    @Input() server: Server;
    @Input() node: Node;

    constructor(
        private nodeService: NodeService
    ) {}

    exportConfig() {
        this.nodeService.getStartupConfiguration(this.server, this.node).subscribe((config: any) => {
            this.downloadByHtmlTag(config);
        });
    }

    private downloadByHtmlTag(config: string) {
        const element = document.createElement('a');
        const fileType = 'text/plain';
        element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(config)}`);
        element.setAttribute('download', `${this.node.name}_startup.vpc`);

        var event = new MouseEvent("click");
        element.dispatchEvent(event);
    }
}
