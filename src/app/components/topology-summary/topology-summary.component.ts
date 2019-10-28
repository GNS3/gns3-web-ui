import { Component, OnInit, OnDestroy, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { Node } from '../../cartography/models/node';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ProjectStatistics } from '../../models/project-statistics';
import { Compute } from '../../models/compute';
import { ComputeService } from '../../services/compute.service';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { ResizeEvent } from 'angular-resizable-element';


@Component({
    selector: 'app-topology-summary',
    templateUrl: './topology-summary.component.html',
    styleUrls: ['./topology-summary.component.scss']
})
export class TopologySummaryComponent implements OnInit, OnDestroy {
    @Input() server: Server;
    @Input() project: Project;

    @Output() closeTopologySummary = new EventEmitter<boolean>();

    public style = { };
    public styleInside = { height: `180px` };
    private subscriptions: Subscription[] = [];
    projectsStatistics: ProjectStatistics;
    nodes: Node[] = [];
    filteredNodes: Node[] = [];
    sortingOrder: string = 'asc';
    startedStatusFilterEnabled: boolean = false;
    suspendedStatusFilterEnabled: boolean = false;
    stoppedStatusFilterEnabled: boolean = false;
    captureFilterEnabled: boolean = false;
    packetFilterEnabled: boolean = false;
    computes: Compute[] = [];
    isTopologyVisible: boolean = true;

    isDraggingEnabled: boolean = false;

    constructor(
        private nodesDataSource: NodesDataSource,
        private projectService: ProjectService,
        private computeService: ComputeService,
        private linksDataSource: LinksDataSource
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

        this.computeService.getComputes(this.server).subscribe((computes) => {
            this.computes = computes;
        });

        this.style = { top: '20px', right: '20px'};
    }

    toggleDragging(value: boolean) {
        this.isDraggingEnabled = value;
    }

    dragWidget(event) {
        let x: number = Number(event.movementX);
        let y: number = Number(event.movementY);

        let left: number = Number(this.style['left'].split('px')[0]);
        let top: number = Number(this.style['top'].split('px')[0]);
        let width: number = Number(this.style['width'].split('px')[0]);
        let height: number = Number(this.style['height'].split('px')[0]);

        top = top + y;
        left = left + x;

        this.style = {
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`
        };
    }

    validate(event: ResizeEvent): boolean {
        if (
            event.rectangle.width &&
            event.rectangle.height &&
            (event.rectangle.width < 290 ||
            event.rectangle.height < 260)
        ) {
            return false;
        }
        return true;
    }

    onResizeEnd(event: ResizeEvent): void {
        this.style = {
            position: 'fixed',
            left: `${event.rectangle.left}px`,
            top: `${event.rectangle.top}px`,
            width: `${event.rectangle.width}px`,
            height: `${event.rectangle.height}px`
        };

        this.styleInside = {
            height: `${event.rectangle.height - 220}px`
        };
    }

    toogleTopologyVisibility(value: boolean) {
        this.isTopologyVisible = value;
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

    applyCaptureFilter(value: boolean, filter: string) {
        if (filter === 'capture') {
            this.captureFilterEnabled = value;
        } else if (filter === 'packet') {
            this.packetFilterEnabled = value;
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

        if (this.captureFilterEnabled) {
            nodes = this.checkCapturing(nodes);
        }

        if(this.packetFilterEnabled) {
            nodes = this.checkPacketFilters(nodes);
        }

        if (this.sortingOrder === 'asc') {
            this.filteredNodes = nodes.sort(this.compareAsc);
        } else {
            this.filteredNodes = nodes.sort(this.compareDesc);
        }    
    }

    checkCapturing(nodes: Node[]): Node[] {
        let links = this.linksDataSource.getItems();
        let nodesWithCapturing: string[] = [];

        links.forEach(link => {
            if (link.capturing) {
                link.nodes.forEach(node => {
                    nodesWithCapturing.push(node.node_id);
                });
            }
        });

        let filteredNodes: Node[] = [];
        nodes.forEach(node => {
            if (nodesWithCapturing.includes(node.node_id)) {
                filteredNodes.push(node);
            }
        });
        return filteredNodes;
    }

    checkPacketFilters(nodes: Node[]): Node[] {
        let links = this.linksDataSource.getItems();
        let nodesWithPacketFilters: string[] = [];

        links.forEach(link => {
            if (link.filters.bpf || link.filters.corrupt || link.filters.corrupt || link.filters.packet_loss || link.filters.frequency_drop) {
                link.nodes.forEach(node => {
                    nodesWithPacketFilters.push(node.node_id);
                });
            }
        });

        let filteredNodes: Node[] = [];
        nodes.forEach(node => {
            if (nodesWithPacketFilters.includes(node.node_id)) {
                filteredNodes.push(node);
            }
        });
        return filteredNodes;
    }

    close() {
        this.closeTopologySummary.emit(false);
    }
}
