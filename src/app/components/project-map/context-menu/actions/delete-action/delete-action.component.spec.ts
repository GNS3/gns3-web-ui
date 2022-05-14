import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
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
  let mockedNodeService: MockedNodeService = new MockedNodeService();
  let mockedDrawingService: MockedDrawingService = new MockedDrawingService();
  let mockedLinkService: MockedLinkService = new MockedLinkService();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatIconModule, MatMenuModule, NoopAnimationsModule, MatBottomSheetModule],
      providers: [
        { provide: NodesDataSource, useClass: NodesDataSource },
        { provide: DrawingsDataSource, useClass: DrawingsDataSource },
        { provide: LinksDataSource, useClass: LinksDataSource },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: DrawingService, useValue: mockedDrawingService },
        { provide: LinkService, useValue: mockedLinkService },
      ],
      declarations: [DeleteActionComponent],
    }).compileComponents();
  });

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
    component.links = [];
    spyOn(mockedDrawingService, 'delete').and.returnValue(of());

    component.delete();

    expect(mockedDrawingService.delete).toHaveBeenCalled();
  });

  it('should call delete action in node service', () => {
    let node = { node_id: '1' } as Node;
    component.nodes = [node];
    let drawing = { drawing_id: '1' } as Drawing;
    component.drawings = [drawing];
    component.links = [];
    spyOn(mockedNodeService, 'delete').and.returnValue(of());

    component.delete();

    expect(mockedNodeService.delete).toHaveBeenCalled();
  });

  it('should call delete action in link service', () => {
    component.nodes = [];
    component.drawings = [];
    let link = { link_id: '1', project_id: '1' } as Link;
    component.links = [link];
    spyOn(mockedLinkService, 'deleteLink').and.returnValue(of());

    component.delete();

    expect(mockedLinkService.deleteLink).toHaveBeenCalled();
  });
});
