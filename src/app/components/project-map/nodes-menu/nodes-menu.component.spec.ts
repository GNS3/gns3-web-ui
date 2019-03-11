import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NodesMenuComponent } from './nodes-menu.component';
import { MockedToasterService } from '../../../services/toaster.service.spec';
import { MockedNodeService } from '../project-map.component.spec';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NodeService } from '../../../services/node.service';
import { ToasterService } from '../../../services/toaster.service';
import { of } from 'rxjs';

describe('NodesMenuComponent', () => {
    let component: NodesMenuComponent;
    let fixture: ComponentFixture<NodesMenuComponent>;
    let mockedToasterService: MockedToasterService = new MockedToasterService();
    let mockedNodeService: MockedNodeService = new MockedNodeService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports:  [MatButtonModule, MatIconModule, CommonModule, NoopAnimationsModule],
            providers: [
                { provide: NodeService, useValue: mockedNodeService },
                { provide: ToasterService, useValue: mockedToasterService }
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
