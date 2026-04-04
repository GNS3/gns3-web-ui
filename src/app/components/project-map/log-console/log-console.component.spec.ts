import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { LogConsoleComponent } from './log-console.component';
import { LogEventsDataSource } from './log-events-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { ProjectWebServiceHandler } from '../../../handlers/project-web-service-handler';
import { NodeService } from '@services/node.service';
import { HttpController } from '@services/http-controller.service';
import { ProtocolHandlerService } from '@services/protocol-handler.service';
import { ThemeService } from '@services/theme.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { Node } from '../../../cartography/models/node';
import { Link } from '@models/link';
import { Drawing } from '../../../cartography/models/drawing';
import { LogEvent } from '@models/logEvent';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('LogConsoleComponent', () => {
  let component: LogConsoleComponent;
  let fixture: ComponentFixture<LogConsoleComponent>;

  let mockLogEventsDataSource: LogEventsDataSource;
  let mockNodesDataSource: any;
  let mockProjectWebServiceHandler: any;
  let mockNodeService: any;
  let mockHttpService: any;
  let mockProtocolHandlerService: any;
  let mockThemeService: any;
  let mockNodeConsoleService: any;
  let mockCd: any;

  let consoleResizeSubject: Subject<any>;

  let mockController: Controller;
  let mockProject: Project;
  let mockNode: Node;
  let mockLink: Link;
  let mockDrawing: Drawing;

  const createMockNode = (name = 'TestNode', status = 'started'): Node =>
    ({
      node_id: 'node1',
      name,
      status,
      console_host: '0.0.0.0',
      console: 3080,
      console_type: 'telnet',
      node_type: 'vpcs',
      project_id: 'proj1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 80,
      x: 100,
      y: 200,
      z: 1,
      port_name_format: 'eth{0}',
      port_segment_size: 0,
      first_port_name: '',
      label: { text: 'TEST', rotation: 0, style: '', x: 0, y: 0 },
      symbol: '',
      symbol_url: '',
      properties: {},
      console_auto_start: false,
      locked: false,
      node_directory: '',
      ports: [],
    } as Node);

  beforeEach(async () => {
    consoleResizeSubject = new Subject<any>();

    mockLogEventsDataSource = new LogEventsDataSource();

    mockNodesDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    mockProjectWebServiceHandler = {
      nodeNotificationEmitter: new EventEmitter<any>(),
      linkNotificationEmitter: new EventEmitter<any>(),
      drawingNotificationEmitter: new EventEmitter<any>(),
      errorNotificationEmitter: new EventEmitter<string>(),
      warningNotificationEmitter: new EventEmitter<string>(),
      infoNotificationEmitter: new EventEmitter<string>(),
    };

    mockNodeService = {
      startAll: vi.fn().mockReturnValue(of(undefined)),
      stopAll: vi.fn().mockReturnValue(of(undefined)),
      suspendAll: vi.fn().mockReturnValue(of(undefined)),
      reloadAll: vi.fn().mockReturnValue(of(undefined)),
      start: vi.fn().mockReturnValue(of(undefined)),
      stop: vi.fn().mockReturnValue(of(undefined)),
      suspend: vi.fn().mockReturnValue(of(undefined)),
      reload: vi.fn().mockReturnValue(of(undefined)),
    };

    mockHttpService = {
      requestsNotificationEmitter: new EventEmitter<string>(),
    };

    mockProtocolHandlerService = {
      open: vi.fn(),
    };

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('dark'),
    };

    mockNodeConsoleService = {
      consoleResized: consoleResizeSubject.asObservable(),
    };

    mockCd = {
      detectChanges: vi.fn(),
      markForCheck: vi.fn(),
    };

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '127.0.0.1',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockProject = {
      project_id: 'proj1',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: '/path/to/project',
      readonly: false,
    } as Project;

    mockNode = createMockNode();
    mockLink = {
      link_id: 'link1',
      link_type: 'ethernet',
      capturing: false,
      capture_file_name: '',
      capture_file_path: '',
      nodes: [],
      filters: {},
      project_id: 'proj1',
      suspend: false,
      distance: 0,
      length: 0,
      source: mockNode,
      target: mockNode,
      x: 0,
      y: 0,
    } as Link;

    mockDrawing = {
      drawing_id: 'draw1',
      project_id: 'proj1',
      rotation: 0,
      x: 100,
      y: 200,
      z: 1,
    } as unknown as Drawing;

    await TestBed.configureTestingModule({
      imports: [LogConsoleComponent, FormsModule],
      providers: [
        { provide: LogEventsDataSource, useValue: mockLogEventsDataSource },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: ProjectWebServiceHandler, useValue: mockProjectWebServiceHandler },
        { provide: NodeService, useValue: mockNodeService },
        { provide: HttpController, useValue: mockHttpService },
        { provide: ProtocolHandlerService, useValue: mockProtocolHandlerService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: ChangeDetectorRef, useValue: mockCd },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogConsoleComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    fixture.componentRef.setInput('project', mockProject);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default filter set to all', () => {
      expect(component.selectedFilter).toBe('all');
    });

    it('should have empty filteredEvents initially', () => {
      expect(component.filteredEvents).toEqual([]);
    });

    it('should have lightTheme disabled for dark theme', () => {
      expect(component.isLightThemeEnabled).toBe(false);
    });
  });

  describe('applyFilter', () => {
    it('should update selectedFilter when applying a filter', () => {
      component.applyFilter('errors');
      expect(component.selectedFilter).toBe('errors');
    });

    it('should update filteredEvents to only error events when filter is errors', () => {
      mockLogEventsDataSource.add({ type: 'error', message: 'err1' });
      mockLogEventsDataSource.add({ type: 'info', message: 'info1' });
      component.applyFilter('errors');
      expect(component.filteredEvents.length).toBe(1);
      expect(component.filteredEvents[0].type).toBe('error');
    });

    it('should update filteredEvents to only warning events when filter is warnings', () => {
      mockLogEventsDataSource.add({ type: 'warning', message: 'warn1' });
      mockLogEventsDataSource.add({ type: 'info', message: 'info1' });
      component.applyFilter('warnings');
      expect(component.filteredEvents.length).toBe(1);
      expect(component.filteredEvents[0].type).toBe('warning');
    });

    it('should return all events when filter is all', () => {
      mockLogEventsDataSource.add({ type: 'error', message: 'err1' });
      mockLogEventsDataSource.add({ type: 'info', message: 'info1' });
      component.applyFilter('all');
      expect(component.filteredEvents.length).toBe(2);
    });
  });

  describe('getFilteredEvents', () => {
    let localDataSource: LogEventsDataSource;

    beforeEach(() => {
      localDataSource = new LogEventsDataSource();
      // Replace the component's logEventsDataSource with a fresh one
      (component as any).logEventsDataSource = localDataSource;
    });

    it('should return all events when filter is all', () => {
      localDataSource.add({ type: 'error', message: 'err1' });
      localDataSource.add({ type: 'command', message: 'cmd1' });
      component.applyFilter('all');
      expect(component.filteredEvents.length).toBe(2);
    });

    it('should return only map updates and commands when filter is map updates', () => {
      localDataSource.add({ type: 'map update', message: 'map1' });
      localDataSource.add({ type: 'command', message: 'cmd1' });
      localDataSource.add({ type: 'error', message: 'err1' });
      component.applyFilter('map updates');
      expect(component.filteredEvents.length).toBe(2);
      expect(component.filteredEvents.every((e) => e.type === 'map update' || e.type === 'command')).toBe(true);
    });

    it('should return only controller requests when filter is controller requests', () => {
      localDataSource.add({ type: 'controller request', message: 'req1' });
      localDataSource.add({ type: 'error', message: 'err1' });
      component.applyFilter('controller requests');
      expect(component.filteredEvents.length).toBe(1);
      expect(component.filteredEvents[0].type).toBe('controller request');
    });
  });

  describe('clearConsole', () => {
    it('should clear filteredEvents', () => {
      mockLogEventsDataSource.add({ type: 'error', message: 'err1' });
      component.filteredEvents = mockLogEventsDataSource.getItems();
      component.clearConsole();
      expect(component.filteredEvents).toEqual([]);
    });
  });

  describe('handleCommand', () => {
    beforeEach(() => {
      mockNodesDataSource.getItems.mockReturnValue([mockNode]);
    });

    it('should show help message when command is help', () => {
      component.command = 'help';
      component.handleCommand();
      expect(component.command).toBe('');
    });

    it('should clear command and process version when command is version', () => {
      component.command = 'version';
      component.handleCommand();
      expect(component.command).toBe('');
    });

    it('should call startAll when command is start all', () => {
      component.command = 'start all';
      component.handleCommand();
      expect(mockNodeService.startAll).toHaveBeenCalledWith(mockController, mockProject);
    });

    it('should call stopAll when command is stop all', () => {
      component.command = 'stop all';
      component.handleCommand();
      expect(mockNodeService.stopAll).toHaveBeenCalledWith(mockController, mockProject);
    });

    it('should call suspendAll when command is suspend all', () => {
      component.command = 'suspend all';
      component.handleCommand();
      expect(mockNodeService.suspendAll).toHaveBeenCalledWith(mockController, mockProject);
    });

    it('should call reloadAll when command is reload all', () => {
      component.command = 'reload all';
      component.handleCommand();
      expect(mockNodeService.reloadAll).toHaveBeenCalledWith(mockController, mockProject);
    });

    it('should call start for specific node when command matches regex', () => {
      component.command = 'start TestNode';
      component.handleCommand();
      expect(mockNodeService.start).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should clear command after handling', () => {
      component.command = 'help';
      component.handleCommand();
      expect(component.command).toBe('');
    });

    it('should show unknown syntax for unrecognized commands', () => {
      component.command = 'foobar';
      component.handleCommand();
      expect(component.command).toBe('');
    });
  });

  describe('showMessage', () => {
    it('should add event to logEventsDataSource', () => {
      const event: LogEvent = { type: 'info', message: 'test message' };
      component.showMessage(event);
      expect(mockLogEventsDataSource.getItems().length).toBe(1);
      expect(mockLogEventsDataSource.getItems()[0].message).toBe('test message');
    });

    it('should update filteredEvents after adding message', () => {
      component.filteredEvents = [];
      const event: LogEvent = { type: 'info', message: 'test' };
      component.showMessage(event);
      expect(component.filteredEvents.length).toBe(1);
    });
  });

  describe('showCommand', () => {
    it('should add command type event via showMessage', () => {
      const addSpy = vi.spyOn(component, 'showMessage');
      component.showCommand('test command');
      expect(addSpy).toHaveBeenCalledWith({ type: 'command', message: 'test command' });
    });
  });

  describe('subscriptions', () => {
    it('should add map update event when nodeNotificationEmitter emits', () => {
      const event = {
        action: 'created',
        event: mockNode,
      };
      mockProjectWebServiceHandler.nodeNotificationEmitter.emit(event);
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'map update')).toBe(true);
    });

    it('should add map update event when linkNotificationEmitter emits', () => {
      const event = {
        action: 'created',
        event: mockLink,
      };
      mockProjectWebServiceHandler.linkNotificationEmitter.emit(event);
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'map update')).toBe(true);
    });

    it('should add map update event when drawingNotificationEmitter emits', () => {
      const event = {
        action: 'created',
        event: mockDrawing,
      };
      mockProjectWebServiceHandler.drawingNotificationEmitter.emit(event);
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'map update')).toBe(true);
    });

    it('should add error event when errorNotificationEmitter emits', () => {
      mockProjectWebServiceHandler.errorNotificationEmitter.emit('Error: something failed');
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'error')).toBe(true);
    });

    it('should add warning event when warningNotificationEmitter emits', () => {
      mockProjectWebServiceHandler.warningNotificationEmitter.emit('Warning: low memory');
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'warning')).toBe(true);
    });

    it('should add info event when infoNotificationEmitter emits', () => {
      mockProjectWebServiceHandler.infoNotificationEmitter.emit('Info: server connected');
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'info')).toBe(true);
    });

    it('should add controller request event when requestsNotificationEmitter emits', () => {
      mockHttpService.requestsNotificationEmitter.emit('GET /api/nodes');
      expect(mockLogEventsDataSource.getItems().some((e) => e.type === 'controller request')).toBe(true);
    });
  });

  describe('printNode', () => {
    it('should return formatted string with node properties', () => {
      const result = component.printNode(mockNode);
      expect(result).toContain('node_id: node1');
      expect(result).toContain('name: TestNode');
      expect(result).toContain('status: started');
    });
  });

  describe('printPorts', () => {
    it('should return formatted string with port details', () => {
      const ports = [
        {
          adapter_number: 0,
          port_number: 0,
          name: 'eth0',
          short_name: 'e0',
          link_type: 'ethernet',
        },
      ] as any[];
      const result = component.printPorts(ports);
      expect(result).toContain('adapter_number: 0');
      expect(result).toContain('name: eth0');
    });
  });

  describe('printLink', () => {
    it('should return formatted string with link properties', () => {
      const result = component.printLink(mockLink);
      expect(result).toContain('link_id: link1');
      expect(result).toContain('link_type: ethernet');
    });
  });

  describe('printDrawing', () => {
    it('should return formatted string with drawing properties', () => {
      const result = component.printDrawing(mockDrawing);
      expect(result).toContain('drawing_id: draw1');
      expect(result).toContain('project_id: proj1');
    });
  });
});
