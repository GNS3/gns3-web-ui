import { StartCaptureDialogComponent } from "./start-capture.component";
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ToasterService } from '../../../../services/toaster.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { LinkService } from '../../../../services/link.service';
import { MockedLinkService, MockedNodesDataSource } from '../../project-map.component.spec';
import { Link } from '../../../../models/link';
import { of } from 'rxjs';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { PacketCaptureService } from '../../../../services/packet-capture.service';

describe('StartCaptureDialogComponent', () => {
    let component: StartCaptureDialogComponent;
    let fixture: ComponentFixture<StartCaptureDialogComponent>;

    let mockedToasterService = new MockedToasterService;
    let mockedLinkService = new MockedLinkService;
    let mockedNodesDataSource = new MockedNodesDataSource;
    let dialogRef = {
        close: jasmine.createSpy('close')
    };
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatDialogModule, FormsModule, ReactiveFormsModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
          providers: [
            { provide: MatDialogRef, useValue: dialogRef },
            { provide: MAT_DIALOG_DATA, useValue: [] },
            { provide: ToasterService, useValue: mockedToasterService },
            { provide: LinkService, useValue: mockedLinkService },
            { provide: NodesDataSource, useValue: mockedNodesDataSource },
            { provide: PacketCaptureService }
          ],
          declarations: [
            StartCaptureDialogComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StartCaptureDialogComponent);
        component = fixture.componentInstance;
        component.link = {link_type: 'ethernet', nodes: [{node_id: '1'}, {node_id: '2'}]} as Link;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call link service when input is valid', () => {
        component.inputForm.controls['linkType'].setValue('Ethernet');
        component.inputForm.controls['fileName'].setValue('SampleFileName');
        spyOn(mockedLinkService, 'startCaptureOnLink').and.returnValue(of({}));

        component.onYesClick();

        expect(mockedLinkService.startCaptureOnLink).toHaveBeenCalled();
    });

    it('should not call link service when link type is not set', () => {
        component.inputForm.controls['fileName'].setValue('SampleFileName');
        spyOn(mockedLinkService, 'startCaptureOnLink').and.returnValue(of({}));

        component.onYesClick();

        expect(mockedLinkService.startCaptureOnLink).not.toHaveBeenCalled();
    });

    it('should not call link service when filename is empty', () => {
        component.inputForm.controls['linkType'].setValue('Ethernet');
        component.inputForm.controls['fileName'].setValue('');
        spyOn(mockedLinkService, 'startCaptureOnLink').and.returnValue(of({}));

        component.onYesClick();

        expect(mockedLinkService.startCaptureOnLink).not.toHaveBeenCalled();
    });
});
