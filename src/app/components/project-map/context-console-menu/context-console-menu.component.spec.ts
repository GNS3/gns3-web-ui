import { ChangeDetectorRef, NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ProjectService } from '@services/project.service';
import { ConsoleService } from '@services/settings/console.service';
import { ToasterService } from '@services/toaster.service';
import { MockedProjectService } from '../../projects/add-blank-project-dialog/add-blank-project-dialog.component.spec';
import { ConsoleDeviceActionBrowserComponent } from '../context-menu/actions/console-device-action-browser/console-device-action-browser.component';
import { ConsoleDeviceActionComponent } from '../context-menu/actions/console-device-action/console-device-action.component';
import { ContextConsoleMenuComponent } from './context-console-menu.component';

describe('ContextConsoleMenuComponent', () => {
  let component: ContextConsoleMenuComponent;
  let fixture: ComponentFixture<ContextConsoleMenuComponent>;
  let nodeConsoleService: NodeConsoleService;
  let mapSettingsService: MapSettingsService;
  let toasterService: ToasterService;
  let router = {
    url: '',
    navigate: vi.fn('navigate'),
  };
  let node = {
    status: 'started',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatMenuModule, BrowserModule, MatSnackBarModule, ContextConsoleMenuComponent, ConsoleDeviceActionComponent, ConsoleDeviceActionBrowserComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ChangeDetectorRef },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: MapSettingsService, useValue: mapSettingsService },
        { provide: ConsoleService },
        { provide: Router, useValue: router },
        NodeConsoleService,
        { provide: VncConsoleService, useValue: {} },
        ToasterService,
        MapSettingsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    toasterService = TestBed.inject(ToasterService);
    mapSettingsService = TestBed.inject(MapSettingsService);
    nodeConsoleService = TestBed.inject(NodeConsoleService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContextConsoleMenuComponent);
    component = fixture.componentInstance;
    component.controller = { location: 'local' } as Controller;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open menu if there is no default settings', () => {
    let spy = spyOn(component.contextConsoleMenu(), 'openMenu');
    localStorage.removeItem('consoleContextMenu');

    component.openMenu(node as unknown as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should call open web console when web console action in settings', () => {
    let spy = spyOn(component, 'openWebConsole');
    mapSettingsService.setConsoleContextMenuAction('web console');

    component.openMenu(node as unknown as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should call open web console in new tab when web console in new tab action in settings', () => {
    let spy = spyOn(component, 'openWebConsoleInNewTab');
    mapSettingsService.setConsoleContextMenuAction('web console in new tab');

    component.openMenu(node as unknown as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should call open console when console action in settings', () => {
    let spy = spyOn(component, 'openConsole');
    mapSettingsService.setConsoleContextMenuAction('console');

    component.openMenu(node as unknown as Node, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });
});
