import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { MockedProjectService } from '../../projects/add-blank-project-dialog/add-blank-project-dialog.component.spec';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Server } from '../../../models/server';
import { ElectronService } from 'ngx-electron';
import { ContextConsoleMenuComponent } from './context-console-menu.component';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { NodeConsoleService } from '../../../services/nodeConsole.service';
import { ConsoleService } from '../../../services/settings/console.service';
import { ToasterService } from '../../../services/toaster.service';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { Router } from '@angular/router';
import { Node } from '../../../cartography/models/node';
import { ConsoleDeviceActionComponent } from '../context-menu/actions/console-device-action/console-device-action.component';
import { ConsoleDeviceActionBrowserComponent } from '../context-menu/actions/console-device-action-browser/console-device-action-browser.component';

describe('ContextConsoleMenuComponent', () => {
  let component: ContextConsoleMenuComponent;
  let fixture: ComponentFixture<ContextConsoleMenuComponent>;
  let toasterService: MockedToasterService = new MockedToasterService();
  let router = {
    url: '',
    navigate: jasmine.createSpy('navigate'),
  };
  let node = {
    status: 'started',
  };
  let mapSettingsService = new MapSettingsService();

  beforeEach(async(() => {
    const electronMock = {
      isElectronApp: true,
    };

    TestBed.configureTestingModule({
      imports: [MatMenuModule, BrowserModule],
      providers: [
        { provide: ChangeDetectorRef },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: ElectronService, useValue: electronMock },
        { provide: MapSettingsService, useValue: mapSettingsService },
        { provide: NodeConsoleService },
        { provide: ConsoleService },
        { provide: ToasterService, useValue: toasterService },
        { provide: Router, useValue: router },
      ],
      declarations: [ContextConsoleMenuComponent, ConsoleDeviceActionComponent, ConsoleDeviceActionBrowserComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContextConsoleMenuComponent);
    component = fixture.componentInstance;
    component.server = { location: 'local' } as Server;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define property if running in electron ', () => {
    expect(component.isElectronApp).toBeTruthy();
  });

  it('should open menu if there is no default settings', () => {
    let spy = spyOn(component.contextConsoleMenu, 'openMenu');
    localStorage.removeItem('consoleContextMenu');

    component.openMenu((node as unknown) as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should call open web console when web console action in settings', () => {
    let spy = spyOn(component, 'openWebConsole');
    mapSettingsService.setConsoleContextMenuAction('web console');

    component.openMenu((node as unknown) as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should call open web console in new tab when web console in new tab action in settings', () => {
    let spy = spyOn(component, 'openWebConsoleInNewTab');
    mapSettingsService.setConsoleContextMenuAction('web console in new tab');

    component.openMenu((node as unknown) as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should call open console when console action in settings', () => {
    let spy = spyOn(component, 'openConsole');
    mapSettingsService.setConsoleContextMenuAction('console');

    component.openMenu((node as unknown) as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });
});
