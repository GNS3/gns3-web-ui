import { Component, Input } from "@angular/core";
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { NodeService } from '../../../services/node.service';
import { ToasterService } from '../../../services/toaster.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { ElectronService } from 'ngx-electron';
import { SettingsService } from '../../../services/settings.service';
import { ServerService } from '../../../services/server.service';

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
        private nodesDataSource: NodesDataSource,
        private toasterService: ToasterService,
        private serverService: ServerService,
        private settingsService: SettingsService,
        private electronService: ElectronService
    ) {}

    async startConsoleForAllNodes() {
        if (this.electronService.isElectronApp) {
            let consoleCommand = this.settingsService.get<string>('console_command');
            if(consoleCommand === undefined) {
                consoleCommand = `putty.exe -telnet \%h \%p -wt \"\%d\" -gns3 5 -skin 4`;
            }

            let nodes = this.nodesDataSource.getItems();
            for(var node of nodes) {
                const request = {
                    command: consoleCommand,
                    type: node.console_type,
                    host: node.console_host,
                    port: node.console,
                    name: node.name,
                    project_id: node.project_id,
                    node_id: node.node_id,
                    server_url: this.serverService.getServerUrl(this.server)
                };
                await this.electronService.remote.require('./console-executor.js').openConsole(request);
            }
        } else {
            this.toasterService.error("Starting all nodes available only in Electron app.");
        }
    }

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
