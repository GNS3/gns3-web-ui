import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IouTemplatesComponent } from './iou-templates.component';

export class MockedIouService {
    public getTemplates(server: Server) {
        return of([{} as IouTemplate]);
    }
}

describe('IouTemplatesComponent', () => {
    let component: IouTemplatesComponent;
    let fixture: ComponentFixture<IouTemplatesComponent>;

    const mockedServerService = new MockedServerService;
    const mockedIouService = new MockedIouService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              { provide: ActivatedRoute,  useValue: activatedRoute },
              { provide: ServerService, useValue: mockedServerService },
              { provide: IouService, useValue: mockedIouService }
          ],
          declarations: [
              IouTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(IouTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
