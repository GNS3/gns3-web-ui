import { TopologySummaryComponent } from "./topology-summary.component";
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { ProjectService } from '../../services/project.service';
import { MockedProjectService } from '../../services/project.service.spec';
import { MatTableModule, MatTooltipModule, MatIconModule, MatSortModule, MatDialogModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MockedNodesDataSource, MockedLinksDataSource } from '../project-map/project-map.component.spec';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Project } from '../../models/project';
import { Node } from '../../cartography/models/node';
import { Server } from '../../models/server';
import { ComputeService } from '../../services/compute.service';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';

export class MockedComputeService {
    getComputes(server: Server) {
        return of([]);
    }
}

describe('TopologySummaryComponent', () => {
    let component: TopologySummaryComponent;
    let fixture: ComponentFixture<TopologySummaryComponent>;
    let mockedProjectService: MockedProjectService = new MockedProjectService();
    let mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
    let mockedComputeService: MockedComputeService = new MockedComputeService();
    let mockedLinksDataSource: MockedLinksDataSource = new MockedLinksDataSource();
  
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                MatTableModule,
                MatTooltipModule,
                MatIconModule,
                MatSortModule,
                MatDialogModule,
                NoopAnimationsModule,
                RouterTestingModule.withRoutes([])
            ],
            providers: [
                { provide: ProjectService, useValue: mockedProjectService },
                { provide: NodesDataSource, useValue: mockedNodesDataSource },
                { provide: ComputeService, useValue: mockedComputeService},
                { provide: LinksDataSource, useValue: mockedLinksDataSource }
            ],
            declarations: [TopologySummaryComponent],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));
  
    beforeEach(() => {
        fixture = TestBed.createComponent(TopologySummaryComponent);
        component = fixture.componentInstance;
        component.project = { project_id: 1 } as unknown as Project;
        fixture.detectChanges();
    });
  
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show only running nodes when filter started applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter('started');

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('started');
    });

    it('should show only stopped nodes when filter stopped applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter('stopped');

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('stopped');
    });

    it('should show only suspended nodes when filter suspended applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter('suspended');

        expect(component.filteredNodes.length).toBe(0);
    });

    it('should show all nodes when all filters applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter('suspended');
        component.applyStatusFilter('started');
        component.applyStatusFilter('stopped');

        expect(component.filteredNodes.length).toBe(2);
    });

    it('should show all nodes when no filters applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter('suspended');
        component.applyStatusFilter('started');
        component.applyStatusFilter('stopped');

        expect(component.filteredNodes.length).toBe(2);

        component.applyStatusFilter('stopped');

        expect(component.filteredNodes.length).toBe(1);

        component.applyStatusFilter('suspended');
        component.applyStatusFilter('started');

        expect(component.filteredNodes.length).toBe(2);
    });

    it('should sort nodes in correct order', () => {
        component.nodes = [
            { status: 'started', name: 'A' } as Node,
            { status: 'stopped', name: 'B' } as Node,
            { status: 'stopped', name: 'D' } as Node,
        ];
        component.sortingOrder = 'asc';

        component.applyFilters();
        component.setSortingOrder();

        expect(component.filteredNodes[0].name).toBe('A');
    });

    it('should sort filtered nodes in correct order', () => {
        component.nodes = [
            { status: 'started', name: 'A' } as Node,
            { status: 'stopped', name: 'B' } as Node,
            { status: 'stopped', name: 'D' } as Node,
        ];
        component.sortingOrder = 'desc';

        component.applyStatusFilter('stopped');
        component.setSortingOrder();

        expect(component.filteredNodes[0].name).toBe('D');
    });
});
