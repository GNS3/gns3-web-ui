import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { MockedNodesDataSource, MockedNodeService, MockedDrawingsDataSource, MockedDrawingService } from '../../../project-map.component.spec';
import { MoveLayerUpActionComponent } from './move-layer-up-action.component';

describe('MoveLayerUpActionComponent', () => {
  let component: MoveLayerUpActionComponent;
  let fixture: ComponentFixture<MoveLayerUpActionComponent>;
  let mockedNodesDataSource = new MockedNodesDataSource();
  let mockedDrawingsDataSource = new MockedDrawingsDataSource();
  let mockedNodeService = new MockedNodeService();
  let mockedDrawingService = new MockedDrawingService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: DrawingService, useValue: mockedDrawingService },
      ],
      imports: [MoveLayerUpActionComponent],
      }).compileComponents();

    fixture = TestBed.createComponent(MoveLayerUpActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
