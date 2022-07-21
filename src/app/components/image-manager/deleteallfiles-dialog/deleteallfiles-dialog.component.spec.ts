import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import{ Server } from 'http';
import { of } from 'rxjs';
import { ImageManagerService } from '../../../services/image-manager.service';
import { ControllerService } from '../../../services/controller.service';
import { MockedServerService } from '../../../services/controller.service.spec';
import { ImageManagerComponent } from '../image-manager.component';

import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog.component';

export class MockedImageManagerService {
  public deleteALLFile(controller:Server , image_path) {
    return of();
  }
}

 describe('DeleteAllImageFilesDialogComponent', () => {
  let component: DeleteAllImageFilesDialogComponent;
  let fixture: ComponentFixture<DeleteAllImageFilesDialogComponent>;
  let mockedServerService = new MockedServerService();
  let mockedImageManagerService = new MockedImageManagerService()
  let mockedToasterService = new MockedToasterService()

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
      ],
      providers: [
        { provide: ControllerService, useValue: mockedServerService },
        { provide: ImageManagerService, useValue: mockedImageManagerService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },

      ],
      declarations: [DeleteAllImageFilesDialogComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAllImageFilesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
