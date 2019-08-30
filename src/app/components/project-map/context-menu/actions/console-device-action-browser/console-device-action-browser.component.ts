import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
    selector: 'app-console-device-action-browser',
    templateUrl: './console-device-action-browser.component.html'
})
export class ConsoleDeviceActionBrowserComponent {
    @Input() node: Node;

    constructor(
        private toasterService: ToasterService
    ) {}

    openConsole() {
        if(this.node.status !== "started") {
            this.toasterService.error("This node must be started before a console can be opened");
        } else {
            location.assign(`telnet://${this.node.console_host}:${this.node.console}/`);
        }
    }
}
