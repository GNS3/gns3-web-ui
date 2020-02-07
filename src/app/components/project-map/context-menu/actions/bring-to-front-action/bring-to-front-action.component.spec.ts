import { CommonModule } from '@angular/common';
import { ComponentFactoryResolver } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { DrawingService } from '../../../../../services/drawing.service';
import { NodeService } from '../../../../../services/node.service';
import { MockedDrawingsDataSource, MockedDrawingService, MockedNodesDataSource, MockedNodeService } from '../../../project-map.component.spec';
import { BringToFrontActionComponent } from './bring-to-front-action.component';

describe('BringToFrontActionComponent', () => {
  let component: BringToFrontActionComponent;
  let fixture: ComponentFixture<BringToFrontActionComponent>;
  const drawingService = new MockedDrawingService();
  const drawingsDataSource = new MockedDrawingsDataSource();
  const nodeService  = new MockedNodeService();
  const nodesDataSource = new MockedNodesDataSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
        providers: [
            { provide: DrawingService, useValue: drawingService },
            { provide: DrawingsDataSource, useValue: drawingsDataSource },
            { provide: NodeService, useValue: nodeService },
            { provide: NodesDataSource, useValue: nodesDataSource },
          ],
        declarations: [BringToFrontActionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BringToFrontActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call node service when bring to front action called', () => {
    spyOn(nodeService, 'update').and.returnValue(of());
    component.nodes = [{z: 0} as Node];
    component.drawings = [];

    component.bringToFront();

    expect(nodeService.update).toHaveBeenCalled();
  });

  it('should call drawing service when bring to front action called', () => {
    spyOn(drawingService, 'update').and.returnValue(of());
    component.nodes = [];
    component.drawings = [{z: 0} as Drawing];

    component.bringToFront();

    expect(drawingService.update).toHaveBeenCalled();
  });
});
