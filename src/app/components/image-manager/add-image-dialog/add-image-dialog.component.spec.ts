import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ImageManagerService } from 'app/services/image-manager.service';
import { ControllerService } from '../../../services/controller.service';
import { MockedControllerService } from '../../../services/controller.service.spec';
import { of } from 'rxjs';
import{ Controller } from '../../../models/controller';

import { AddImageDialogComponent } from './add-image-dialog.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export class MockedImageManagerService {
  public getImages(controller:Controller ) {
    return of();
  }

}

describe('AddImageDialogComponent', () => {
  let component: AddImageDialogComponent;
  let fixture: ComponentFixture<AddImageDialogComponent>;
  
  let mockedServerService = new MockedControllerService();
  let mockedImageManagerService = new MockedImageManagerService()
  let mockedToasterService = new MockedToasterService()

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ControllerService, useValue: mockedServerService },
        { provide: ImageManagerService, useValue: mockedImageManagerService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },
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
