import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { ControllerService } from '../../services/controller.service';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';
import { ProgressComponent } from '../../common/progress/progress.component';
import { ProgressService } from '../../common/progress/progress.service';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { ControllerManagementService, ControllerStateEvent } from '../../services/controller-management.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { DefaultLayoutComponent } from './default-layout.component';
import { HttpController, ControllerErrorHandler } from '../../services/http-controller.service';
import { HttpClientModule } from '@angular/common/http';

class ElectronServiceMock {
  public isElectronApp: boolean;
}

class MockedServerManagementService {
  public controllerStatusChanged;
  public stopAll() {}
}

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: ComponentFixture<DefaultLayoutComponent>;
  let electronServiceMock: ElectronServiceMock;
  let serverManagementService = new MockedServerManagementService();
  let serverService: ControllerService;
  let httpServer: HttpController;
  let errorHandler: ControllerErrorHandler;

  beforeEach(async() => {
    electronServiceMock = new ElectronServiceMock();
    serverManagementService.controllerStatusChanged = new Subject<ControllerStateEvent>();

    await TestBed.configureTestingModule({
      declarations: [DefaultLayoutComponent, ProgressComponent],
      imports: [MatIconModule, MatMenuModule, MatToolbarModule, HttpClientModule, RouterTestingModule, MatProgressSpinnerModule],
      providers: [
        {
          provide: ElectronService,
          useValue: electronServiceMock,
        },
        {
          provide: ControllerManagementService,
          useValue: serverManagementService,
        },
        {
          provide: ToasterService,
          useClass: MockedToasterService,
        },
        {
          provide: RecentlyOpenedProjectService,
          useClass: RecentlyOpenedProjectService,
        },
        { provide: ControllerService },
        { provide: HttpController },
        { provide: ControllerErrorHandler },
        ProgressService,
      ],
    }).compileComponents();

    errorHandler = TestBed.inject(ControllerErrorHandler);
    httpServer = TestBed.inject(HttpController);
    serverService = TestBed.inject(ControllerService);
  });

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

  it('should show error when controller management service throw event', () => {
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    serverManagementService.controllerStatusChanged.next({
      status: 'errored',
      message: 'Message',
    });
    expect(toaster.errors).toEqual(['Message']);
  });

  it('should not show error when controller management service throw event', () => {
    component.ngOnDestroy();
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    serverManagementService.controllerStatusChanged.next({
      status: 'errored',
      message: 'Message',
    });
    expect(toaster.errors).toEqual([]);
  });

  describe('auto stopping controllers', () => {
    let event;
    beforeEach(() => {
      event = new Event('onbeforeunload');
    });

    it('should close window with no action when not in electron', async () => {
      component.shouldStopServersOnClosing = false;
      const isClosed = await component.onBeforeUnload(event);
      expect(isClosed).toBeUndefined();
    });

    it('should stop all controllers and close window', () => {
      component.shouldStopServersOnClosing = true;
      const isClosed = component.onBeforeUnload(event);
      expect(isClosed).toBeTruthy();
    });
  });
});
