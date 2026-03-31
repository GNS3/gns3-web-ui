import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { NodesDataSource } from '@cartography/datasources/nodes-datasource';
import { NodeService } from '@services/node.service';
import { MockedNodesDataSource, MockedNodeService } from '../../project-map.component.spec';
import { MoveLayerDownActionComponent } from './move-layer-down-action.component';

describe('MoveLayerDownActionComponent', () => {
  let component: MoveLayerDownActionComponent;
  let fixture: ComponentFixture<MoveLayerDownActionComponent>;
  let mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
  let mockedNodeService: MockedNodeService = new MockedNodeService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MoveLayerDownActionComponent, MatTableModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: NodeService, useValue: mockedNodeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveLayerDownActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
