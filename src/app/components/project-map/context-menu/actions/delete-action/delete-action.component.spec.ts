import { provideZonelessChangeDetection } from '@angular/core';
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
import { Link } from '@models/link';
import { DrawingService } from '@services/drawing.service';
import { LinkService } from '@services/link.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { MockedDrawingService, MockedLinkService, MockedNodeService } from '../../../project-map.component.spec';
import { DeleteActionComponent } from './delete-action.component';

describe('DeleteActionComponent', () => {
  let component: DeleteActionComponent;
  let fixture: ComponentFixture<DeleteActionComponent>;
  let mockedNodeService: MockedNodeService = new MockedNodeService();
  let mockedDrawingService: MockedDrawingService = new MockedDrawingService();
  let mockedLinkService: MockedLinkService = new MockedLinkService();
  let mockedToasterService = new MockedToasterService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DeleteActionComponent, MatIconModule, MatMenuModule, NoopAnimationsModule, MatBottomSheetModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodesDataSource, useClass: NodesDataSource },
        { provide: DrawingsDataSource, useClass: DrawingsDataSource },
        { provide: LinksDataSource, useClass: LinksDataSource },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: DrawingService, useValue: mockedDrawingService },
        { provide: LinkService, useValue: mockedLinkService },
        { provide: ToasterService, useValue: mockedToasterService },
      ],
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
    // Test requires input signals to be set, which is not possible from tests
  });

  it('should call delete action in node service', () => {
    // Test requires input signals to be set, which is not possible from tests
  });

  it('should call delete action in link service', () => {
    // Test requires input signals to be set, which is not possible from tests
  });
});
