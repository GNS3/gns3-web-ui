import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { MatMenuModule } from '@angular/material';
import { Server } from '../../../models/server';
import { LogConsoleComponent } from './log-console.component';
import { ProjectWebServiceHandler, WebServiceMessage } from '../../../handlers/project-web-service-handler';
import { NodeService } from '../../../services/node.service';
import { MockedNodeService, MockedNodesDataSource } from '../project-map.component.spec';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { of } from 'rxjs';

export class MockedProjectWebServiceHandler {
    public nodeNotificationEmitter = new EventEmitter<WebServiceMessage>();
    public linkNotificationEmitter = new EventEmitter<WebServiceMessage>();
    public drawingNotificationEmitter = new EventEmitter<WebServiceMessage>();
}

describe('LogConsoleComponent', () => {
  let component: LogConsoleComponent;
  let fixture: ComponentFixture<LogConsoleComponent>;

  let mockedNodeService: MockedNodeService = new MockedNodeService();
  let mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
  let mockedProjectWebServiceHandler: MockedProjectWebServiceHandler =  new MockedProjectWebServiceHandler();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatMenuModule, BrowserModule],
      providers: [
        { provide: ProjectWebServiceHandler, useValue: mockedProjectWebServiceHandler }, 
        { provide: NodeService, useValue: mockedNodeService },
        { provide: NodesDataSource, useValue: mockedNodesDataSource }
      ],
      declarations: [LogConsoleComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogConsoleComponent);
    component = fixture.componentInstance;
    component.server = {location: 'local'} as Server;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call show message when help command entered', () => {
    spyOn(component, 'showMessage');
    component.command = 'help';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Available commands: help, version, start all, start {node name}, stop all, stop {node name}, suspend all, suspend {node name}, reload all, reload {node name}, show {node name}.');
  });

  it('should call show message when version command entered', () => {
    spyOn(component, 'showMessage');
    component.command = 'version';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Current version: 2019.2.0');
  });

  it('should call show message when unknown command entered', () => {
    spyOn(component, 'showMessage');
    component.command = 'xyz';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Unknown syntax: xyz');
  });

  it('should call node service when start all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'startAll').and.returnValue(of({}));
    component.command = 'start all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Starting all nodes...');
    expect(mockedNodeService.startAll).toHaveBeenCalled();
  });

  it('should call node service when stop all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'stopAll').and.returnValue(of({}));
    component.command = 'stop all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Stopping all nodes...');
    expect(mockedNodeService.stopAll).toHaveBeenCalled();
  });

  it('should call node service when suspend all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'suspendAll').and.returnValue(of({}));
    component.command = 'suspend all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Suspending all nodes...');
    expect(mockedNodeService.suspendAll).toHaveBeenCalled();
  });

  it('should call node service when reload all entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'reloadAll').and.returnValue(of({}));
    component.command = 'reload all';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Reloading all nodes...');
    expect(mockedNodeService.reloadAll).toHaveBeenCalled();
  });

  it('should call node service when start node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'start').and.returnValue(of({}));
    component.command = 'start testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Starting node testNode...');
    expect(mockedNodeService.start).toHaveBeenCalled();
  });

  it('should call node service when stop node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'stop').and.returnValue(of({}));
    component.command = 'stop testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Stopping node testNode...');
    expect(mockedNodeService.stop).toHaveBeenCalled();
  });

  it('should call node service when suspend node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'suspend').and.returnValue(of({}));
    component.command = 'suspend testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Suspending node testNode...');
    expect(mockedNodeService.suspend).toHaveBeenCalled();
  });

  it('should call node service when reload node entered', () => {
    spyOn(component, 'showMessage');
    spyOn(mockedNodeService, 'reload').and.returnValue(of({}));
    component.command = 'reload testNode';

    component.handleCommand();

    expect(component.showMessage).toHaveBeenCalledWith('Reloading node testNode...');
    expect(mockedNodeService.reload).toHaveBeenCalled();
  });
});
