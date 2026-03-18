import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ImageManagerService } from 'app/services/image-manager.service';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { of, Subject } from 'rxjs';
import { Controller } from '@models/controller';

import { AddImageDialogComponent } from './add-image-dialog.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ImageUploadSessionService } from '@services/image-upload-session.service';

export class MockedImageManagerService {
  public getImages(controller: Controller ) {
    return of();
  }

}

describe('AddImageDialogComponent', () => {
  let component: AddImageDialogComponent;
  let fixture: ComponentFixture<AddImageDialogComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedImageManagerService = new MockedImageManagerService()
  let mockedToasterService = new MockedToasterService()
  let mockedImageUploadSessionService = {
    cancelRequests$: new Subject(),
    emit: jasmine.createSpy('emit'),
    registerCancelHandler: jasmine.createSpy('registerCancelHandler'),
    unregisterCancelHandler: jasmine.createSpy('unregisterCancelHandler'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
        MatSnackBarModule,
        require('@angular/common/http/testing').HttpClientTestingModule
      ],
      providers: [
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: ImageManagerService, useValue: mockedImageManagerService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: ImageUploadSessionService, useValue: mockedImageUploadSessionService },
      ],
      declarations: [ AddImageDialogComponent ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddImageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
