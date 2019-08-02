import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule, MatMenuModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodeService } from '../../../../../services/node.service';
import { DrawingService } from '../../../../../services/drawing.service';
import { MockedDrawingService, MockedNodeService } from '../../../project-map.component.spec';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { of } from 'rxjs';
import { DuplicateActionComponent } from './duplicate-action.component';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';

describe('DuplicateActionComponent', () => {
    let component: DuplicateActionComponent;
    let fixture: ComponentFixture<DuplicateActionComponent>;
    let mockedNodeService: MockedNodeService = new MockedNodeService();
    let mockedDrawingService: MockedDrawingService = new MockedDrawingService();
    let mockedToasterService = new MockedToasterService;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [MatIconModule, MatMenuModule, NoopAnimationsModule],
            providers: [
                { provide: NodesDataSource,  useClass: NodesDataSource },
                { provide: DrawingsDataSource, useClass: DrawingsDataSource },
                { provide: NodeService, useValue: mockedNodeService },
                { provide: DrawingService, useValue: mockedDrawingService },
                { provide: ToasterService, useValue: mockedToasterService }
            ],
            declarations: [DuplicateActionComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DuplicateActionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call duplicate action in drawing service', () => {
        let drawing = { drawing_id: '1' } as Drawing;
        component.drawings = [drawing];
        component.nodes = [];
        spyOn(mockedDrawingService, 'duplicate').and.returnValue(of());

        component.duplicate();

        expect(mockedDrawingService.duplicate).toHaveBeenCalled();
    });

    it('should call duplicate action in node service', () => {
        let node = { node_id: '1', status: 'stopped'} as Node;
        component.nodes = [node];
        component.drawings = [];
        spyOn(mockedNodeService, 'duplicate').and.returnValue(of());

        component.duplicate();

        expect(mockedNodeService.duplicate).toHaveBeenCalled();
    });

    it('should call duplicate action in both services', () => {
        let drawing = { drawing_id: '1' } as Drawing;
        component.drawings = [drawing];
        let node = { node_id: '1', status: 'stopped' } as Node;
        component.nodes = [node];
        spyOn(mockedDrawingService, 'duplicate').and.returnValue(of());
        spyOn(mockedNodeService, 'duplicate').and.returnValue(of());

        component.duplicate();

        expect(mockedDrawingService.duplicate).toHaveBeenCalled();
        expect(mockedNodeService.duplicate).toHaveBeenCalled();
    });
});
