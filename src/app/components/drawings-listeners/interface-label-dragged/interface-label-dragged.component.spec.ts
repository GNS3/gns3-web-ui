import { InterfaceLabelDraggedComponent } from './interface-label-dragged.component';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MockedLinkService } from '../../project-map/project-map.component.spec';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { LinkService } from '../../../services/link.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapLinkNode } from '../../../cartography/models/map/map-link-node';
import { Observable } from 'rxjs';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { Link } from '../../../models/link';
import { Label } from '../../../cartography/models/label';

describe('InterfaceLabelDraggedComponent', () => {
  let component: InterfaceLabelDraggedComponent;
  let fixture: ComponentFixture<InterfaceLabelDraggedComponent>;
  let mockedLinkService = new MockedLinkService();
  let mockedLinksEventSource = new LinksEventSource();
  let mockedLinksDataSource = new LinksDataSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LinkService, useValue: mockedLinkService },
        { provide: LinksDataSource, useValue: mockedLinksDataSource },
        { provide: LinksEventSource, useValue: mockedLinksEventSource }
      ],
      declarations: [InterfaceLabelDraggedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterfaceLabelDraggedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call link service when interface label dragged', () => {
    fixture.detectChanges();
    const mapLinkNode: MapLinkNode = {
      id: 'sampleId',
      nodeId: 'sampleNodeId',
      linkId: 'sampleLinkId',
      adapterNumber: 0,
      portNumber: 0,
      label: {} as MapLabel
    };
    const interfaceLabelDraggedDataEvent = new DraggedDataEvent<MapLinkNode>(mapLinkNode, 0, 0);

    let link: Link = {} as Link;
    link.nodes = [
      {
        node_id: '1',
        adapter_number: 0,
        port_number: 0,
        label: {} as Label
      },
      {
        node_id: '2',
        adapter_number: 0,
        port_number: 0,
        label: {} as Label
      }
    ];
    mockedLinksDataSource = TestBed.get(LinksDataSource);

    spyOn(mockedLinksDataSource, 'get').and.returnValue(link);
    spyOn(mockedLinkService, 'updateNodes').and.returnValue(Observable.of({}));

    mockedLinksEventSource.interfaceDragged.emit(interfaceLabelDraggedDataEvent);

    expect(mockedLinkService.updateNodes).toHaveBeenCalled();
  });
});
