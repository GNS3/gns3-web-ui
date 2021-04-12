import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from 'ngx-electron';

import { ConsoleDeviceActionComponent } from './console-device-action.component';
import { ServerService } from '../../../../../services/server.service';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { SettingsService } from '../../../../../services/settings.service';
import { MockedSettingsService } from '../../../../../services/settings.service.spec';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { MockedNodeService } from '../../../project-map.component.spec';
import { NodeService } from '../../../../../services/node.service';

describe('ConsoleDeviceActionComponent', () => {
  let component: ConsoleDeviceActionComponent;
  let fixture: ComponentFixture<ConsoleDeviceActionComponent>;
  let electronService;
  let server: Server;
  let mockedSettingsService: MockedSettingsService;
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

    mockedSettingsService = new MockedSettingsService();
    mockedServerService = new MockedServerService();
    mockedToaster = new MockedToasterService();

    server = { host: 'localhost', port: 222 } as Server;
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElectronService, useValue: electronService },
        { provide: ServerService, useValue: mockedServerService },
        { provide: SettingsService, useValue: mockedSettingsService },
        { provide: ToasterService, useValue: mockedToaster },
        { provide: NodeService, useValue: mockedNodeService },
      ],
      imports: [MatIconModule],
      declarations: [ConsoleDeviceActionComponent],
    }).compileComponents();
  }));

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

      mockedSettingsService.set('console_command', 'command');
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
      mockedSettingsService.set('console_command', undefined);
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
