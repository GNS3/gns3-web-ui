import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatCheckboxModule, MatDialogModule, MatDialogRef, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Link } from '../../../../models/link';
import { LinkService } from '../../../../services/link.service';
import { MockedLinkService } from '../../project-map.component.spec';
import { PacketFiltersDialogComponent } from './packet-filters.component';

describe('PacketFiltersDialogComponent', () => {
    let component: PacketFiltersDialogComponent;
    let fixture: ComponentFixture<PacketFiltersDialogComponent>;

    const mockedLinkService = new MockedLinkService;
    const dialogRef = {
        close: jasmine.createSpy('close')
    };
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatDialogModule, FormsModule, ReactiveFormsModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
          providers: [
            { provide: MatDialogRef, useValue: dialogRef },
            { provide: MAT_DIALOG_DATA, useValue: [] },
            { provide: LinkService, useValue: mockedLinkService }
          ],
          declarations: [
            PacketFiltersDialogComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PacketFiltersDialogComponent);
        component = fixture.componentInstance;
        component.link = {link_type: 'ethernet'} as Link;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call update link when filters applied', () => {
        spyOn(mockedLinkService, 'updateLink').and.returnValue(of({}));

        component.onYesClick();

        expect(mockedLinkService.updateLink).toHaveBeenCalled();
    });

    it('should call update link after resetting', () => {
        spyOn(mockedLinkService, 'updateLink').and.returnValue(of({}));

        component.onResetClick();

        expect(mockedLinkService.updateLink).toHaveBeenCalled();
    });
});
