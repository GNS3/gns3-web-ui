import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { ProjectService } from '../../services/project.service';
import { MockedProjectService } from '../../services/project.service.spec';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';
import { ProgressComponent } from '../../common/progress/progress.component';
import { ProgressService } from '../../common/progress/progress.service';
import { ControllerManagementService, ControllerStateEvent } from '../../services/controller-management.service';
import { ControllerService } from '../../services/controller.service';
import { ControllerErrorHandler, HttpController } from '../../services/http-controller.service';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { DefaultLayoutComponent } from './default-layout.component';

class ElectronServiceMock {
  public isElectronApp: boolean;
}

class MockedControllerManagementService {
  public controllerStatusChanged;
  public stopAll() {}
}

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: ComponentFixture<DefaultLayoutComponent>;
  let electronServiceMock: ElectronServiceMock;
  let controllerManagementService = new MockedControllerManagementService();
  let controllerService: ControllerService;
  let httpController: HttpController;
  let errorHandler: ControllerErrorHandler;

  beforeEach(async () => {
    electronServiceMock = new ElectronServiceMock();
    controllerManagementService.controllerStatusChanged = new Subject<ControllerStateEvent>();

    await TestBed.configureTestingModule({
      declarations: [DefaultLayoutComponent, ProgressComponent],
      imports: [
        MatIconModule,
        MatMenuModule,
        MatDialogModule,
        MatToolbarModule,
        HttpClientModule,
        RouterTestingModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        {
          provide: ElectronService,
          useValue: electronServiceMock,
        },
        {
          provide: ControllerManagementService,
          useValue: controllerManagementService,
        },
        { provide: ProjectService, useClass: MockedProjectService },

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
        { provide: MatDialogRef, useValue: {}},
        { provide: MAT_DIALOG_DATA, useValue: {}},
        ProgressService,
      ],
    }).compileComponents();

    errorHandler = TestBed.inject(ControllerErrorHandler);
    httpController = TestBed.inject(HttpController);
    controllerService = TestBed.inject(ControllerService);
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
    controllerManagementService.controllerStatusChanged.next({
      status: 'errored',
      message: 'Message',
    });
    expect(toaster.errors).toEqual(['Message']);
  });

  it('should not show error when controller management service throw event', () => {
    component.ngOnDestroy();
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    controllerManagementService.controllerStatusChanged.next({
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
      component.shouldStopControllersOnClosing = false;
      const isClosed = await component.onBeforeUnload(event);
      expect(isClosed).toBeUndefined();
    });

    it('should stop all controllers and close window', () => {
      component.shouldStopControllersOnClosing = true;
      const isClosed = component.onBeforeUnload(event);
      expect(isClosed).toBeTruthy();
    });
  });
});
