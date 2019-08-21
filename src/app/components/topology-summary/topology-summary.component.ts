import { Component, OnInit, OnDestroy, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
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
    @Input() server: Server;
    @Input() project: Project;

    @Output() closeTopologySummary = new EventEmitter<boolean>();

    private subscriptions: Subscription[] = [];
    projectsStatistics: ProjectStatistics;
    nodes: Node[] = [];
    filteredNodes: Node[] = [];
    dataSource: Node[] = [];
    displayedColumns: string[] = ['name', 'console'];
    sortingOrder: string = 'asc';
    startedStatusFilterEnabled: boolean = false;
    suspendedStatusFilterEnabled: boolean = false;
    stoppedStatusFilterEnabled: boolean = false;

    constructor(
        private nodesDataSource: NodesDataSource,
        private projectService: ProjectService
    ) {}

    ngOnInit() {
        this.subscriptions.push(
            this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
                this.nodes = nodes;
                if (this.sortingOrder === 'asc') {
                    this.filteredNodes = nodes.sort(this.compareAsc);
                } else {
                    this.filteredNodes = nodes.sort(this.compareDesc);
                }
            })
        );

        this.projectService.getStatistics(this.server, this.project.project_id).subscribe((stats) => {
            this.projectsStatistics = stats;
        });
    }

    compareAsc(first: Node, second: Node) {
        if (first.name < second.name) return -1;
        return 1;
    }

    compareDesc(first: Node, second: Node) {
        if (first.name < second.name) return 1;
        return -1;
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    }

    setSortingOrder(order: string) {
        this.sortingOrder = order;
        if (this.sortingOrder === 'asc') {
            this.filteredNodes = this.filteredNodes.sort(this.compareAsc);
        } else {
            this.filteredNodes = this.filteredNodes.sort(this.compareDesc);
        }   
    }

    applyStatusFilter(value: boolean, filter: string) {
        if (filter === 'started') {
            this.startedStatusFilterEnabled = value;
        } else if (filter === 'stopped') {
            this.stoppedStatusFilterEnabled = value;
        } else if (filter === 'suspended') {
            this.suspendedStatusFilterEnabled = value;
        }
        this.applyFilters();
    }

    applyFilters() {
        let nodes: Node[] = [];

        if (this.startedStatusFilterEnabled) {
            nodes = nodes.concat(this.nodes.filter(n => n.status === 'started'));
        }
        
        if (this.stoppedStatusFilterEnabled) {
            nodes = nodes.concat(this.nodes.filter(n => n.status === 'stopped'));
        }
        
        if (this.suspendedStatusFilterEnabled) {
            nodes = nodes.concat(this.nodes.filter(n => n.status === 'suspended'));
        }
        
        if (!this.startedStatusFilterEnabled && !this.stoppedStatusFilterEnabled && !this.suspendedStatusFilterEnabled) {
            nodes = nodes.concat(this.nodes);
        }

        if (this.sortingOrder === 'asc') {
            this.filteredNodes = nodes.sort(this.compareAsc);
        } else {
            this.filteredNodes = nodes.sort(this.compareDesc);
        }    
    }

    close() {
        this.closeTopologySummary.emit(false);
    }
}
