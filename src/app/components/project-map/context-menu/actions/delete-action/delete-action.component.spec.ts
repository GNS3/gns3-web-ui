import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule, MatMenuModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '../../../../../models/link';
import { DrawingService } from '../../../../../services/drawing.service';
import { LinkService } from '../../../../../services/link.service';
import { NodeService } from '../../../../../services/node.service';
import { MockedDrawingService, MockedLinkService, MockedNodeService } from '../../../project-map.component.spec';
import { DeleteActionComponent } from './delete-action.component';

describe('DeleteActionComponent', () => {
    let component: DeleteActionComponent;
    let fixture: ComponentFixture<DeleteActionComponent>;
    const mockedNodeService: MockedNodeService = new MockedNodeService();
    const mockedDrawingService: MockedDrawingService = new MockedDrawingService();
    const mockedLinkService: MockedLinkService = new MockedLinkService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [MatIconModule, MatMenuModule, NoopAnimationsModule],
            providers: [
                { provide: NodesDataSource,  useClass: NodesDataSource },
                { provide: DrawingsDataSource, useClass: DrawingsDataSource },
                { provide: LinksDataSource, useClass: LinksDataSource },
                { provide: NodeService, useValue: mockedNodeService },
                { provide: DrawingService, useValue: mockedDrawingService },
                { provide: LinkService, useValue: mockedLinkService }
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
        const node = { node_id: '1' } as Node;
        component.nodes = [node];
        const drawing = { drawing_id: '1' } as Drawing;
        component.drawings = [drawing];
        component.links = [];
        spyOn(mockedDrawingService, 'delete').and.returnValue(of());

        component.delete();

        expect(mockedDrawingService.delete).toHaveBeenCalled();
    });

    it('should call delete action in node service', () => {
        const node = { node_id: '1' } as Node;
        component.nodes = [node];
        const drawing = { drawing_id: '1' } as Drawing;
        component.drawings = [drawing];
        component.links = [];
        spyOn(mockedNodeService, 'delete').and.returnValue(of());

        component.delete();

        expect(mockedNodeService.delete).toHaveBeenCalled();
    });

    it('should call delete action in link service', () => {
        component.nodes = [];
        component.drawings = [];
        const link = { link_id: '1', project_id: '1' } as Link;
        component.links = [link];
        spyOn(mockedLinkService, 'deleteLink').and.returnValue(of());

        component.delete();

        expect(mockedLinkService.deleteLink).toHaveBeenCalled();
    });
});
