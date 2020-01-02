import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerTemplatesComponent } from './docker-templates.component';
import { DockerService } from '../../../../services/docker.service';

export class MockedDockerService {
    public getTemplates(server: Server) {
        return of([{} as DockerTemplate]);
    }
}

describe('DockerTemplatesComponent', () => {
    let component: DockerTemplatesComponent;
    let fixture: ComponentFixture<DockerTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedDockerService = new MockedDockerService;
    let activatedRoute = new MockedActivatedRoute().get();
    
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
