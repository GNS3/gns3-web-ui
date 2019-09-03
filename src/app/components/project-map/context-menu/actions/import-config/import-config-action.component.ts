import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { NodeService } from '../../../../../services/node.service';
import { Server } from '../../../../../models/server';

@Component({
    selector: 'app-import-config-action',
    templateUrl: './import-config-action.component.html'
})
export class ImportConfigActionComponent {
    @Input() server: Server;
    @Input() node: Node;

    constructor() {}

    importConfig() {
        //needs implementation
    }
}
