import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BringToFrontActionComponent } from './bring-to-front-action.component';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockedDrawingService, MockedDrawingsDataSource, MockedNodesDataSource, MockedNodeService } from '../../../project-map.component.spec';
import { DrawingService } from '../../../../../services/drawing.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodeService } from '../../../../../services/node.service';
import { Node } from '../../../../../cartography/models/node';
import { of } from 'rxjs';
import { ComponentFactoryResolver } from '@angular/core';
import { Drawing } from '../../../../../cartography/models/drawing';
import { MATERIAL_IMPORTS } from '../../../../../material.imports';

describe('BringToFrontActionComponent', () => {
  let component: BringToFrontActionComponent;
  let fixture: ComponentFixture<BringToFrontActionComponent>;
  let drawingService = new MockedDrawingService();
  let drawingsDataSource = new MockedDrawingsDataSource();
  let nodeService  = new MockedNodeService();
  let nodesDataSource = new MockedNodesDataSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule],
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
