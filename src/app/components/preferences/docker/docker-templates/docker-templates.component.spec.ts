import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerService } from '../../../../services/docker.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { DockerTemplatesComponent } from './docker-templates.component';

export class MockedDockerService {
    public getTemplates(server: Server) {
        return of([{} as DockerTemplate]);
    }
}

describe('DockerTemplatesComponent', () => {
    let component: DockerTemplatesComponent;
    let fixture: ComponentFixture<DockerTemplatesComponent>;

    const mockedServerService = new MockedServerService;
    const mockedDockerService = new MockedDockerService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              { provide: ActivatedRoute,  useValue: activatedRoute },
              { provide: ServerService, useValue: mockedServerService },
              { provide: DockerService, useValue: mockedDockerService }
          ],
          declarations: [
              DockerTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DockerTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
