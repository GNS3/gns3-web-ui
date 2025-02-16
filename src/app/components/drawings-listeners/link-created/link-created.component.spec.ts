import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from '../../../cartography/converters/map/map-port-to-port-converter';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { MapLinkCreated } from '../../../cartography/events/links';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { CssFixer } from '../../../cartography/helpers/css-fixer';
import { FontBBoxCalculator } from '../../../cartography/helpers/font-bbox-calculator';
import { FontFixer } from '../../../cartography/helpers/font-fixer';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapPort } from '../../../cartography/models/map/map-port';
import { Project } from '../../../models/project';
import { LinkService } from '../../../services/link.service';
import { ProjectService } from '../../../services/project.service';
import { MockedProjectService } from '../../../services/project.service.spec';
import { MockedLinkService } from '../../project-map/project-map.component.spec';
import { LinkCreatedComponent } from './link-created.component';

describe('LinkCreatedComponent', () => {
  let component: LinkCreatedComponent;
  let fixture: ComponentFixture<LinkCreatedComponent>;
  let mockedLinkService = new MockedLinkService();
  let mockedMapNodeToNodeConverter: MapNodeToNodeConverter = new MapNodeToNodeConverter(
    new MapLabelToLabelConverter(new FontBBoxCalculator(), new CssFixer(), new FontFixer()),
    new MapPortToPortConverter()
  );
  let mockedLinksEventSource = new LinksEventSource();
  let project = new Project();

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      providers: [
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: LinkService, useValue: mockedLinkService },
        { provide: LinksDataSource, useClass: LinksDataSource },
        { provide: LinksEventSource, useValue: mockedLinksEventSource },
        { provide: MapNodeToNodeConverter, useValue: mockedMapNodeToNodeConverter },
        { provide: MapPortToPortConverter, useClass: MapPortToPortConverter },
      ],
      declarations: [LinkCreatedComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkCreatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    project.project_id = 'sampleId';
    component.project = project;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call link service when link created', () => {
    const mapNode: MapNode = {
      id: 'sampleId',
      commandLine: 'sampleCommandLine',
      computeId: 'sampleComputeId',
      console: 0,
      consoleHost: 'sampleConsoleHost',
      consoleType: 'sampleConsoleType',
      firstPortName: 'sampleFirstPortName',
      height: 0,
      label: {} as MapLabel,
      locked: false,
      name: 'sampleName',
      nodeDirectory: 'sampleNodeDirectory',
      nodeType: 'sampleNodeType',
      portNameFormat: 'samplePortNameFormat',
      portSegmentSize: 0,
      ports: [],
      properties: undefined,
      projectId: 'sampleProjectId',
      status: 'sampleStatus',
      symbol: 'sampleSymbol',
      symbolUrl: 'sampleUrl',
      width: 0,
      x: 0,
      y: 0,
      z: 0,
    };
    const mapPort: MapPort = {
      adapterNumber: 1,
      linkType: 'sampleLinkType',
      name: 'sampleName',
      portNumber: 1,
      shortName: 'sampleShortName',
    };
    const linkCreatedDataEvent = new MapLinkCreated(mapNode, mapPort, mapNode, mapPort);
    spyOn(mockedLinkService, 'createLink').and.returnValue(Observable.of({}));

    mockedLinksEventSource.created.emit(linkCreatedDataEvent);

    expect(mockedLinkService.createLink).toHaveBeenCalled();
  });
});
