import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NodesMenuComponent } from './nodes-menu.component';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { MockedNodeService, MockedNodesDataSource } from '../project-map.component.spec';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NodeService } from '../../../services/node.service';
import { ToasterService } from '../../../services/toaster.service';
import { of } from 'rxjs';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { ServerService } from '../../../services/server.service';
import { SettingsService } from '../../../services/settings.service';
import { ElectronService } from 'ngx-electron';

xdescribe('NodesMenuComponent', () => {
    let component: NodesMenuComponent;
    let fixture: ComponentFixture<NodesMenuComponent>;
    let mockedToasterService: MockedToasterService = new MockedToasterService();
    let mockedNodeService: MockedNodeService = new MockedNodeService();
    let mockedNodesDataSource: MockedNodesDataSource =  new MockedNodesDataSource();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports:  [MatButtonModule, MatIconModule, CommonModule, NoopAnimationsModule],
            providers: [
                { provide: NodeService, useValue: mockedNodeService },
                { provide: ToasterService, useValue: mockedToasterService },
                { provide: NodesDataSource, useValue: mockedNodesDataSource },
                { provide: ServerService },
                { provide: SettingsService },
                { provide: ElectronService }
            ],
            declarations: [
                NodesMenuComponent,
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NodesMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call start all nodes', () => {
        spyOn(mockedNodeService, 'startAll').and.returnValue(of());

        component.startNodes();

        expect(mockedNodeService.startAll).toHaveBeenCalled();
    });

    it('should call stop all nodes', () => {
        spyOn(mockedNodeService, 'stopAll').and.returnValue(of());

        component.stopNodes();

        expect(mockedNodeService.stopAll).toHaveBeenCalled();
    });

    it('should call suspend all nodes', () => {
        spyOn(mockedNodeService, 'suspendAll').and.returnValue(of());

        component.suspendNodes();

        expect(mockedNodeService.suspendAll).toHaveBeenCalled();
    });

    it('should call reload all nodes', () => {
        spyOn(mockedNodeService, 'reloadAll').and.returnValue(of());

        component.reloadNodes();

        expect(mockedNodeService.reloadAll).toHaveBeenCalled();
    });
});
