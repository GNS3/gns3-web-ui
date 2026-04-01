import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodeService } from '@services/node.service';
import { MockedNodesDataSource, MockedNodeService, MockedDrawingsDataSource } from '../../../project-map.component.spec';
import { SuspendNodeActionComponent } from './suspend-node-action.component';

describe('SuspendNodeActionComponent', () => {
  let component: SuspendNodeActionComponent;
  let fixture: ComponentFixture<SuspendNodeActionComponent>;
  let mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
  let mockedNodeService: MockedNodeService = new MockedNodeService();
  let mockedDrawingsDataSource = new MockedDrawingsDataSource();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SuspendNodeActionComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuspendNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
