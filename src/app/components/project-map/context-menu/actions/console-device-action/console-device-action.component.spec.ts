import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from 'ngx-electron';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ControllerService } from '../../../../../services/controller.service';
import { MockedControllerService } from '../../../../../services/controller.service.spec';
import { SettingsService } from '../../../../../services/settings.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedNodeService } from '../../../project-map.component.spec';
import { ConsoleDeviceActionComponent } from './console-device-action.component';

describe('ConsoleDeviceActionComponent', () => {
  let component: ConsoleDeviceActionComponent;
  let fixture: ComponentFixture<ConsoleDeviceActionComponent>;
  let electronService;
  let controller:Controller ;
  let settingsService: SettingsService;
  let mockedControllerService: MockedControllerService;
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

    mockedControllerService = new MockedControllerService();
    mockedToaster = new MockedToasterService();

    controller = { host: 'localhost', port: 222 } as Controller ;
  });

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      providers: [
        { provide: ElectronService, useValue: electronService },
        { provide: ControllerService, useValue: mockedControllerService },
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
      component.controller =  controller;

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
        controller_url: 'localhost:222',
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
