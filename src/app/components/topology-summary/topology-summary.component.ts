import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../services/node.service';
import { Node } from '../../cartography/models/node';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ProjectStatistics } from '../../models/project-statistics';


@Component({
    selector: 'app-topology-summary',
    templateUrl: './topology-summary.component.html',
    styleUrls: ['./topology-summary.component.scss']
})
export class TopologySummaryComponent implements OnInit, OnDestroy {
    @Input() project: Project;
    @Input() server: Server;

    private subscriptions: Subscription[];
    projectsStatistics: ProjectStatistics;
    nodes: Node[] = [];

    //filters to introduce -> should be generic

    constructor(
        private nodesDataSource: NodesDataSource,
        private projectService: ProjectService
    ) {}

    ngOnInit() {
        this.subscriptions.push(
            this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
                this.nodes = nodes;
            })
        );

        this.projectService.getStatistics(this.server, this.project.project_id).subscribe((stats: ProjectStatistics) => {
            this.projectsStatistics = stats;
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    }
}
