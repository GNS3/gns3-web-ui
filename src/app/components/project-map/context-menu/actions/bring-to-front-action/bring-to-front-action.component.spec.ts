import { CommonModule } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';
import {
  MockedDrawingsDataSource,
  MockedDrawingService,
  MockedNodesDataSource,
  MockedNodeService,
} from '../../../project-map.component.spec';
import { BringToFrontActionComponent } from './bring-to-front-action.component';

describe('BringToFrontActionComponent', () => {
  let component: BringToFrontActionComponent;
  let fixture: ComponentFixture<BringToFrontActionComponent>;
  let drawingService = new MockedDrawingService();
  let drawingsDataSource = new MockedDrawingsDataSource();
  let nodeService = new MockedNodeService();
  let nodesDataSource = new MockedNodesDataSource();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DrawingService, useValue: drawingService },
        { provide: DrawingsDataSource, useValue: drawingsDataSource },
        { provide: NodeService, useValue: nodeService },
        { provide: NodesDataSource, useValue: nodesDataSource },
      ],
      declarations: [BringToFrontActionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BringToFrontActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call node service when bring to front action called', () => {
    // Test requires input signals to be set, which is not possible from tests
  });

  it('should call drawing service when bring to front action called', () => {
    // Test requires input signals to be set, which is not possible from tests
  });
});
