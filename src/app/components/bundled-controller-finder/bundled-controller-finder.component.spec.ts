import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgressService } from '../../common/progress/progress.service';
import{ Controller } from '../../models/controller';
import { ControllerService } from '../../services/controller.service';
import { MockedControllerService } from '../../services/controller.service.spec';
import { MockedProgressService } from '../project-map/project-map.component.spec';
import { BundledControllerFinderComponent } from './bundled-controller-finder.component';

describe('BundledControllerFinderComponent', () => {
  let component: BundledControllerFinderComponent;
  let fixture: ComponentFixture<BundledControllerFinderComponent>;
  let router: any;
  let service: ControllerService;
  let progressService: MockedProgressService = new MockedProgressService();
  let controllerServiceMock: jasmine.SpyObj<ControllerService>;


  beforeEach(async () => {
    router = {
      navigate: jasmine.createSpy('navigate'),
    };

    

    controllerServiceMock = jasmine.createSpyObj<ControllerService>([
      "getLocalController"
    ]);


    await TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ControllerService, useValue: controllerServiceMock },
        { provide: ProgressService, useValue: progressService },
      ],
      declarations: [BundledControllerFinderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BundledControllerFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and redirect to controller', fakeAsync(() => {
    const controller = new Controller ();
    controller.id = 99;
    controllerServiceMock.getLocalController.and.returnValue(
      Promise.resolve(controller)
    );
    expect(component).toBeTruthy();
    tick(101)
    fixture.detectChanges()
    fixture.whenStable().then(() => {
      expect(controllerServiceMock.getLocalController).toHaveBeenCalledWith('vps3.gns3.net',3000);
      expect(router.navigate).toHaveBeenCalledWith(['/controller', 99, 'projects']);
    })
    service = TestBed.inject(ControllerService);
  }));
});
