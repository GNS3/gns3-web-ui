import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { inject } from "@angular/core/testing";

import { mock, instance, capture, when } from "ts-mockito";
import { HotkeyModule, HotkeysService, Hotkey } from "angular2-hotkeys";
import { of } from "rxjs";

import { ProjectMapShortcutsComponent } from './project-map-shortcuts.component';
import { ToasterService, } from "../../../services/toaster.service";
import { NodeService } from "../../../services/node.service";
import { HttpServer } from "../../../services/http-server.service";
import { SelectionManager } from "../../../cartography/managers/selection-manager";
import { Server } from "../../../models/server";
import { Node } from "../../../cartography/models/node";
import { Project } from "../../../models/project";
import { ProjectService } from "../../../services/project.service";
import { MockedProjectService } from "../../../services/project.service.spec";
import { SettingsService } from "../../../services/settings.service";
import { MockedToasterService } from "../../../services/toaster.service.spec";
import { mapTo } from "rxjs/internal/operators";


describe('ProjectMapShortcutsComponent', () => {
  let component: ProjectMapShortcutsComponent;
  let fixture: ComponentFixture<ProjectMapShortcutsComponent>;
  let hotkeyServiceMock: HotkeysService;
  let hotkeyServiceInstanceMock: HotkeysService;
  let nodeServiceMock: NodeService;

  beforeEach(async(() => {
    nodeServiceMock = mock(NodeService);
    hotkeyServiceMock = mock(HotkeysService);
    hotkeyServiceInstanceMock = instance(hotkeyServiceMock);
    TestBed.configureTestingModule({
      imports: [
        HotkeyModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        HttpServer,
        { provide: NodeService, useFactory: () => instance(nodeServiceMock) },
        { provide: HotkeysService, useFactory: () => hotkeyServiceInstanceMock },
        { provide: ToasterService, useClass: MockedToasterService },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: SettingsService, useClass: SettingsService }
      ],
      declarations: [ ProjectMapShortcutsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should bind delete key', () => {
    component.ngOnInit();
    const [hotkey] = capture(hotkeyServiceMock.add).last();
    expect((hotkey as Hotkey).combo).toEqual([ 'del' ]);
    expect((hotkey as Hotkey).callback).toBeDefined();
  });

  it('should remove binding', () => {
    component.ngOnDestroy();
    const [hotkey] = capture(hotkeyServiceMock.remove).last();
    expect((hotkey as Hotkey).combo).toEqual([ 'del' ]);
  });

  describe('onDeleteHandler', () => {
    beforeEach(() => {
      const selectionManagerMock = mock(SelectionManager);
      const node = new Node();
      node.node_id = "nodeid";
      const server = new Server();
      const project = new Project();

      when(selectionManagerMock.getSelectedNodes()).thenReturn([node]);
      when(nodeServiceMock.delete(server, node))
        .thenReturn(of(node).pipe(mapTo(null)));

      component.project = project;
      component.server = server;
      component.selectionManager = instance(selectionManagerMock);
    });

    it('should handle delete', inject([ToasterService], (toaster: MockedToasterService) => {
      component.project.readonly = false;
      component.onDeleteHandler(null);
      expect(toaster.successes).toEqual(["Node has been deleted"]);
    }));

    it('should not delete when project in readonly mode', inject([ToasterService], (toaster: MockedToasterService) => {
      component.project.readonly = true;
      component.onDeleteHandler(null);
      expect(toaster.successes).toEqual([]);
    }));
  });

});
