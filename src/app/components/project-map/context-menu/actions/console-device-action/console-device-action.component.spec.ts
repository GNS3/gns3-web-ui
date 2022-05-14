import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from 'ngx-electron';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ServerService } from '../../../../../services/server.service';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { SettingsService } from '../../../../../services/settings.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedNodeService } from '../../../project-map.component.spec';
import { ConsoleDeviceActionComponent } from './console-device-action.component';

describe('ConsoleDeviceActionComponent', () => {
  let component: ConsoleDeviceActionComponent;
  let fixture: ComponentFixture<ConsoleDeviceActionComponent>;
  let electronService;
  let server: Server;
  let settingsService: SettingsService;
  let mockedServerService: MockedServerService;
  let mockedToaster: MockedToasterService;
  let mockedNodeService: MockedNodeService = new MockedNodeService();

  beforeEach(() => {
    electronService = {
      isElectronApp: true,
      remote: {
        require: (file) => {
          return {
            openConsole() {},
          };
        },
      },
    };

    mockedServerService = new MockedServerService();
    mockedToaster = new MockedToasterService();

    server = { host: 'localhost', port: 222 } as Server;
  });

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      providers: [
        { provide: ElectronService, useValue: electronService },
        { provide: ServerService, useValue: mockedServerService },
        { provide: SettingsService },
        { provide: ToasterService, useValue: mockedToaster },
        { provide: NodeService, useValue: mockedNodeService },
      ],
      imports: [MatIconModule],
      declarations: [ConsoleDeviceActionComponent],
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleDeviceActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('console to nodes', () => {
    let nodes: Node[];

    beforeEach(() => {
      nodes = [
        {
          status: 'started',
          console_type: 'telnet',
          console_host: 'host',
          console: 999,
          name: 'Node 1',
          project_id: '1111',
          node_id: '2222',
        } as Node,
      ];

      component.nodes = nodes;
      component.server = server;

      settingsService.setConsoleSettings('command');
      spyOn(component, 'openConsole');
    });

    it('should console to device', async () => {
      await component.console();

      expect(component.openConsole).toHaveBeenCalledWith({
        command: 'command',
        type: 'telnet',
        host: 'host',
        port: 999,
        name: 'Node 1',
        project_id: '1111',
        node_id: '2222',
        server_url: 'localhost:222',
      });
    });

    it('should set command when it is not defined', async () => {
      settingsService.setConsoleSettings(undefined);
      await component.console();
      expect(component.openConsole).toHaveBeenCalled();
    });

    it('should show message when there is no started nodes', async () => {
      nodes[0]['status'] = 'stopped';
      await component.console();
      expect(component.openConsole).not.toHaveBeenCalled();
    });

    it('should only start running nodes', async () => {
      nodes.push({
        status: 'stopped',
      } as Node);
      await component.console();
      expect(component.openConsole).toHaveBeenCalledTimes(1);
    });
  });
});
