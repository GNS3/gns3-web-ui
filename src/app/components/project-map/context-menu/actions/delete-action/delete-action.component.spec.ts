import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteActionComponent } from './delete-action.component';
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

describe('DeleteActionComponent', () => {
    let component: DeleteActionComponent;
    let fixture: ComponentFixture<DeleteActionComponent>;
    let mockedNodeService: MockedNodeService = new MockedNodeService();
    let mockedDrawingService: MockedDrawingService = new MockedDrawingService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [MatIconModule, MatMenuModule, NoopAnimationsModule],
            providers: [
                { provide: NodesDataSource,  useClass: NodesDataSource },
                { provide: DrawingsDataSource, useClass: DrawingsDataSource },
                { provide: NodeService, useValue: mockedNodeService },
                { provide: DrawingService, useValue: mockedDrawingService },
            ],
            declarations: [DeleteActionComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DeleteActionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call delete action in drawing service', () => {
        let node = { node_id: '1' } as Node;
        component.nodes = [node];
        let drawing = { drawing_id: '1' } as Drawing;
        component.drawings = [drawing];
        spyOn(mockedDrawingService, 'delete').and.returnValue(of());

        component.delete();

        expect(mockedDrawingService.delete).toHaveBeenCalled();
    });

    it('should call delete action in node service', () => {
        let node = { node_id: '1' } as Node;
        component.nodes = [node];
        let drawing = { drawing_id: '1' } as Drawing;
        component.drawings = [drawing];
        spyOn(mockedNodeService, 'delete').and.returnValue(of());

        component.delete();

        expect(mockedNodeService.delete).toHaveBeenCalled();
    });
});
