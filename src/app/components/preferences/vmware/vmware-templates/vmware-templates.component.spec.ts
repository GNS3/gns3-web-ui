import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { VmwareService } from '../../../../services/vmware.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VmwareTemplatesComponent } from './vmware-templates.component';

export class MockedVmwareService {
  public getTemplates(controller: Server) {
    return of([{} as VmwareTemplate]);
  }
}

describe('VmwareTemplatesComponent', () => {
  let component: VmwareTemplatesComponent;
  let fixture: ComponentFixture<VmwareTemplatesComponent>;

  let mockedServerService = new MockedServerService();
  let mockedVmwareService = new MockedVmwareService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ServerService, useValue: mockedServerService },
        { provide: VmwareService, useValue: mockedVmwareService },
      ],
      declarations: [VmwareTemplatesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

beforeEach(() => {
  fixture = TestBed.createComponent(VmwareTemplatesComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('should create', () => {
  expect(component).toBeTruthy();
});
});
