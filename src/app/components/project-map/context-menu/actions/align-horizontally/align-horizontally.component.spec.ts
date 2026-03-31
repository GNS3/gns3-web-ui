import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { NodeService } from '@services/node.service';
import { MockedNodesDataSource, MockedNodeService } from '../../../project-map.component.spec';
import { AlignHorizontallyActionComponent } from './align-horizontally.component';

describe('AlignHorizontallyActionComponent', () => {
  let component: AlignHorizontallyActionComponent;
  let fixture: ComponentFixture<AlignHorizontallyActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ChangeDetectorRef,
        { provide: NodesDataSource, useValue: new MockedNodesDataSource() },
        { provide: NodeService, useValue: new MockedNodeService() },
      ],
      imports: [AlignHorizontallyActionComponent],
    });
    fixture = TestBed.createComponent(AlignHorizontallyActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
