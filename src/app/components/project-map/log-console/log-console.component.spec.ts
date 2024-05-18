import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ToasterService } from '../../../services/toaster.service';
import { ProtocolHandlerService } from '../../../services/protocol-handler.service';
import { of } from 'rxjs';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { ProjectWebServiceHandler, WebServiceMessage } from '../../../handlers/project-web-service-handler';
import { Controller } from '../../../models/controller';
import { HttpController, ControllerErrorHandler } from '../../../services/http-controller.service';
import { NodeService } from '../../../services/node.service';
import { NodeConsoleService } from '../../../services/nodeConsole.service';
import { MockedNodesDataSource, MockedNodeService } from '../project-map.component.spec';
import { LogConsoleComponent } from './log-console.component';
import { LogEventsDataSource } from './log-events-datasource';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export class MockedProjectWebServiceHandler {
  public nodeNotificationEmitter = new EventEmitter<WebServiceMessage>();
  public linkNotificationEmitter = new EventEmitter<WebServiceMessage>();
  public drawingNotificationEmitter = new EventEmitter<WebServiceMessage>();
  public infoNotificationEmitter = new EventEmitter<any>();
  public warningNotificationEmitter = new EventEmitter<any>();
  public errorNotificationEmitter = new EventEmitter<any>();
}

describe('LogConsoleComponent', () => {
  let component: LogConsoleComponent;
  let fixture: ComponentFixture<LogConsoleComponent>;

  let mockedNodeService: MockedNodeService = new MockedNodeService();
  let mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
  let mockedProjectWebServiceHandler: MockedProjectWebServiceHandler = new MockedProjectWebServiceHandler();
  let nodeConsoleService: NodeConsoleService;
  let mapSettingsService: MapSettingsService;
  let toasterService: ToasterService;
  let protocolHandlerService: ProtocolHandlerService;

  let httpController = new HttpController({} as HttpClient, {} as ControllerErrorHandler);

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, MatMenuModule, BrowserModule, MatSnackBarModule],
      providers: [
        { provide: ProjectWebServiceHandler, useValue: mockedProjectWebServiceHandler },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: LogEventsDataSource, useClass: LogEventsDataSource },
        { provide: HttpController, useValue: httpController },
        NodeConsoleService,
        ToasterService,
        ProtocolHandlerService,
        MapSettingsService
      ],
      declarations: [LogConsoleComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    toasterService = TestBed.inject(ToasterService);
    protocolHandlerService = TestBed.inject(ProtocolHandlerService);
    mapSettingsService = TestBed.inject(MapSettingsService);
    nodeConsoleService = TestBed.inject(NodeConsoleService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogConsoleComponent);
    component = fixture.componentInstance;
    component.controller = { location: 'local' } as Controller ;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call show message when help command entered', () => {
    spyOn(component, 'showMessage');
    component.command = 'help';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({
      type: 'command',
      message:
        'Available commands: help, version, console {node name}, start all, start {node name}, stop all, stop {node name}, suspend all, suspend {node name}, reload all, reload {node name}, show {node name}.',
    });
  });

  xit('should call show message when version command entered', () => {
    spyOn(component, 'showMessage');
    component.command = 'version';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Current version: 2.2.18dev' });
  });

  it('should call show message when unknown command entered', () => {
    spyOn(component, 'showMessage');
    component.command = 'xyz';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Unknown syntax: xyz' });
  });

  it('should call node service when start all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'startAll').and.returnValue(of({}));
    component.command = 'start all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Starting all nodes...' });
    expect(mockedNodeService.startAll).toHaveBeenCalled();
  });

  it('should call node service when stop all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'stopAll').and.returnValue(of({}));
    component.command = 'stop all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Stopping all nodes...' });
    expect(mockedNodeService.stopAll).toHaveBeenCalled();
  });

  it('should call node service when suspend all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'suspendAll').and.returnValue(of({}));
    component.command = 'suspend all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Suspending all nodes...' });
    expect(mockedNodeService.suspendAll).toHaveBeenCalled();
  });

  it('should call node service when reload all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'reloadAll').and.returnValue(of({}));
    component.command = 'reload all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Reloading all nodes...' });
    expect(mockedNodeService.reloadAll).toHaveBeenCalled();
  });

  it('should call node service when start node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'start').and.returnValue(of({}));
    component.command = 'start testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Starting node testNode...' });
    expect(mockedNodeService.start).toHaveBeenCalled();
  });

  it('should call node service when stop node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'stop').and.returnValue(of({}));
    component.command = 'stop testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Stopping node testNode...' });
    expect(mockedNodeService.stop).toHaveBeenCalled();
  });

  it('should call node service when suspend node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'suspend').and.returnValue(of({}));
    component.command = 'suspend testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Suspending node testNode...' });
    expect(mockedNodeService.suspend).toHaveBeenCalled();
  });

  it('should call node service when reload node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'reload').and.returnValue(of({}));
    component.command = 'reload testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith({ type: 'command', message: 'Reloading node testNode...' });
    expect(mockedNodeService.reload).toHaveBeenCalled();
  });
});
