import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { NodeService } from '../../../../../services/node.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
    selector: 'app-import-config-action',
    templateUrl: './import-config-action.component.html',
    styleUrls: ['./import-config-action.component.scss']
})
export class ImportConfigActionComponent {
    @Input() server: Server;
    @Input() node: Node;

    constructor(
        private nodeService: NodeService,
        private toasterService: ToasterService
    ) {}

    importConfig(event) {
        let file: File = event.target.files[0];
        let fileReader: FileReader = new FileReader();
        fileReader.onload = (e) => {
            let content: string | ArrayBuffer = fileReader.result;
            if (typeof content !== 'string'){
                content = content.toString();
            }
            this.nodeService.saveConfiguration(this.server, this.node, content).subscribe(() => {
                this.toasterService.success(`Configuration for node ${this.node.name} imported.`);
            });
        };
        fileReader.readAsText(file);
    }
}
