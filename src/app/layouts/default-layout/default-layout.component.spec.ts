import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { ProjectService } from '@services/project.service';
import { MockedProjectService } from '@services/project.service.spec';
import { Subject } from 'rxjs';
import { ProgressComponent } from '../../common/progress/progress.component';
import { ProgressService } from '../../common/progress/progress.service';
import { ControllerManagementService, ControllerStateEvent } from '@services/controller-management.service';
import { ControllerService } from '@services/controller.service';
import { ControllerErrorHandler, HttpController } from '@services/http-controller.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { DefaultLayoutComponent } from './default-layout.component';

class MockedControllerManagementService {
  public controllerStatusChanged;
  public stopAll() {}
}

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: ComponentFixture<DefaultLayoutComponent>;
  let controllerManagementService = new MockedControllerManagementService();
  let controllerService: ControllerService;
  let httpController: HttpController;
  let errorHandler: ControllerErrorHandler;

  beforeEach(async () => {
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

  it('should show error when controller management service throws event', () => {
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    controllerManagementService.controllerStatusChanged.next({
      controllerName: 'test-controller',
      status: 'errored',
      message: 'Message',
    });
    expect(toaster.errors).toEqual(['Message']);
  });

  it('should show error when controller management service throws stderr event', () => {
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    controllerManagementService.controllerStatusChanged.next({
      controllerName: 'test-controller',
      status: 'stderr',
      message: 'Stderr message',
    });
    expect(toaster.errors).toEqual(['Stderr message']);
  });

  it('should not show error when controller management service throws event after destroy', () => {
    component.ngOnDestroy();
    const toaster: MockedToasterService = TestBed.get(ToasterService);
    controllerManagementService.controllerStatusChanged.next({
      controllerName: 'test-controller',
      status: 'errored',
      message: 'Message',
    });
    expect(toaster.errors).toEqual([]);
  });
});
