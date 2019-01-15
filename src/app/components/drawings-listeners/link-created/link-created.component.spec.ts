import { LinkCreatedComponent } from './link-created.component';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { ProjectService } from '../../../services/project.service';
import { MockedProjectService } from '../../../services/project.service.spec';
import { LinkService } from '../../../services/link.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from '../../../cartography/converters/map/map-port-to-port-converter';
import { MockedLinkService } from '../../project-map/project-map.component.spec';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { FontBBoxCalculator } from '../../../cartography/helpers/font-bbox-calculator';
import { CssFixer } from '../../../cartography/helpers/css-fixer';
import { FontFixer } from '../../../cartography/helpers/font-fixer';
import { MapLinkCreated } from '../../../cartography/events/links';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { MapPort } from '../../../cartography/models/map/map-port';
import { Observable } from 'rxjs';
import { Project } from '../../../models/project';

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: LinkService, useValue: mockedLinkService },
        { provide: LinksDataSource, useClass: LinksDataSource },
        { provide: LinksEventSource, useValue: mockedLinksEventSource },
        { provide: MapNodeToNodeConverter, useValue: mockedMapNodeToNodeConverter },
        { provide: MapPortToPortConverter, useClass: MapPortToPortConverter }
      ],
      declarations: [LinkCreatedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkCreatedComponent);
    component = fixture.componentInstance;

    project.project_id = 'sampleId';
    component.project = project;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call link service when link created', () => {
    fixture.detectChanges();
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
      name: 'sampleName',
      nodeDirectory: 'sampleNodeDirectory',
      nodeType: 'sampleNodeType',
      portNameFormat: 'samplePortNameFormat',
      portSegmentSize: 0,
      ports: [],
      projectId: 'sampleProjectId',
      status: 'sampleStatus',
      symbol: 'sampleSymbol',
      symbolUrl: 'sampleUrl',
      width: 0,
      x: 0,
      y: 0,
      z: 0
    };
    const mapPort: MapPort = {
      adapterNumber: 1,
      linkType: 'sampleLinkType',
      name: 'sampleName',
      portNumber: 1,
      shortName: 'sampleShortName'
    };
    const linkCreatedDataEvent = new MapLinkCreated(mapNode, mapPort, mapNode, mapPort);
    spyOn(mockedLinkService, 'createLink').and.returnValue(Observable.of({}));

    mockedLinksEventSource.created.emit(linkCreatedDataEvent);

    expect(mockedLinkService.createLink).toHaveBeenCalled();
  });
});
