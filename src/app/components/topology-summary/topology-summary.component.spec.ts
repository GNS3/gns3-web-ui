import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatIconModule, MatSortModule, MatTableModule, MatTooltipModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { Node } from '../../cartography/models/node';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { ComputeService } from '../../services/compute.service';
import { ProjectService } from '../../services/project.service';
import { MockedProjectService } from '../../services/project.service.spec';
import { MockedLinksDataSource, MockedNodesDataSource } from '../project-map/project-map.component.spec';
import { TopologySummaryComponent } from "./topology-summary.component";

export class MockedComputeService {
    getComputes(server: Server) {
        return of([]);
    }
}

describe('TopologySummaryComponent', () => {
    let component: TopologySummaryComponent;
    let fixture: ComponentFixture<TopologySummaryComponent>;
    const mockedProjectService: MockedProjectService = new MockedProjectService();
    const mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
    const mockedComputeService: MockedComputeService = new MockedComputeService();
    const mockedLinksDataSource: MockedLinksDataSource = new MockedLinksDataSource();
  
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

        component.applyStatusFilter(true, 'started');

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('started');
    });

    it('should show only stopped nodes when filter stopped applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter(true, 'stopped');

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('stopped');
    });

    it('should show only suspended nodes when filter suspended applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter(true, 'suspended');

        expect(component.filteredNodes.length).toBe(0);
    });

    it('should show all nodes when all filters applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter(true, 'suspended');
        component.applyStatusFilter(true, 'started');
        component.applyStatusFilter(true, 'stopped');

        expect(component.filteredNodes.length).toBe(2);
    });

    it('should show all nodes when no filters applied', () => {
        component.nodes = [
            { status: 'started' } as Node,
            { status: 'stopped' } as Node
        ];

        component.applyStatusFilter(true, 'suspended');
        component.applyStatusFilter(true, 'started');
        component.applyStatusFilter(true, 'stopped');

        expect(component.filteredNodes.length).toBe(2);

        component.applyStatusFilter(false, 'stopped');

        expect(component.filteredNodes.length).toBe(1);

        component.applyStatusFilter(false, 'suspended');
        component.applyStatusFilter(false, 'started');

        expect(component.filteredNodes.length).toBe(2);
    });

    it('should sort nodes in correct order', () => {
        component.nodes = [
            { status: 'started', name: 'A' } as Node,
            { status: 'stopped', name: 'B' } as Node,
            { status: 'stopped', name: 'D' } as Node,
        ];

        component.applyFilters();
        component.setSortingOrder('asc');

        expect(component.filteredNodes[0].name).toBe('A');
    });

    it('should sort filtered nodes in correct order', () => {
        component.nodes = [
            { status: 'started', name: 'A' } as Node,
            { status: 'stopped', name: 'B' } as Node,
            { status: 'stopped', name: 'D' } as Node,
        ];

        component.applyStatusFilter(true, 'stopped');
        component.setSortingOrder('desc');

        expect(component.filteredNodes[0].name).toBe('D');
    });
});
