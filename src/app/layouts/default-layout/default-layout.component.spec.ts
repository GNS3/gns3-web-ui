import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultLayoutComponent } from './default-layout.component';
import { ElectronService } from 'ngx-electron';
import { MatIconModule, MatMenuModule, MatToolbarModule, MatProgressSpinnerModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgressComponent } from '../../common/progress/progress.component';
import { ProgressService } from '../../common/progress/progress.service';
import { ServerManagementService, ServerStateEvent } from '../../services/server-management.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { Subject } from 'rxjs';


class ElectronServiceMock {
  public isElectronApp: boolean;
}

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: ComponentFixture<DefaultLayoutComponent>;
  let electronServiceMock: ElectronServiceMock;
  let serverManagementService;

  beforeEach(async(() => {
    electronServiceMock = new ElectronServiceMock();
    serverManagementService = {
      serverStatusChanged: new Subject<ServerStateEvent>()
    };

    TestBed.configureTestingModule({
      declarations: [DefaultLayoutComponent, ProgressComponent],
      imports: [MatIconModule, MatMenuModule, MatToolbarModule, RouterTestingModule, MatProgressSpinnerModule],
      providers: [
        {
          provide: ElectronService,
          useValue: electronServiceMock
        },
        {
          provide: ServerManagementService,
          useValue: serverManagementService
        },
        {
          provide: ToasterService,
          useClass: MockedToasterService
        },
        ProgressService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should installed software be available', () => {
    electronServiceMock.isElectronApp = true;
    component.ngOnInit();
    expect(component.isInstalledSoftwareAvailable).toBeTruthy();
  });

  it('should installed software be not available', () => {
    electronServiceMock.isElectronApp = false;
    component.ngOnInit();
    expect(component.isInstalledSoftwareAvailable).toBeFalsy();
  });

  it('should show error when server management service throw event', () => {
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    serverManagementService.serverStatusChanged.next({
      status: 'errored',
      message: 'Message'
    });
    expect(toaster.errors).toEqual(['Message']);
  });

  it('should not show error when server management service throw event', () => {
    component.ngOnDestroy();
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    serverManagementService.serverStatusChanged.next({
      status: 'errored',
      message: 'Message'
    });
    expect(toaster.errors).toEqual([]);
  });
});
