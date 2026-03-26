import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ImageManagerService } from 'app/services/image-manager.service';
import { ControllerService } from 'app/services/controller.service';
import { MockedControllerService } from 'app/services/controller.service.spec';
import { of } from 'rxjs';
import { Controller } from '@models/controller';

import { ImageManagerComponent } from './image-manager.component';
import { Image } from '@models/images';
import { ProgressService } from 'app/common/progress/progress.service';
import { MockedProgressService } from '../project-map/project-map.component.spec';
import { MockedActivatedRoute } from '../preferences/preferences.component.spec';
import { ActivatedRoute } from '@angular/router';
import { MockedVersionService } from '@services/version.service.spec';
import { VersionService } from 'app/services/version.service';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import { ImageUploadSessionService } from '@services/image-upload-session.service';
import { Subject } from 'rxjs';

export class MockedImageManagerService {
  public getImages(controller: Controller) {
    return of();
  }

  public deleteFile(controller: Controller, image_path) {
    return of();
  }
}

describe('ImageManagerComponent', () => {
  let component: ImageManagerComponent;
  let fixture: ComponentFixture<ImageManagerComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedImageManagerService = new MockedImageManagerService();
  let mockedProgressService = new MockedProgressService();
  let mockedVersionService = new MockedVersionService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();
  let mockedImageUploadSessionService = { events$: new Subject() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: ImageManagerService, useValue: mockedImageManagerService },
        { provide: ProgressService, useValue: mockedProgressService },
        { provide: VersionService, useValue: mockedVersionService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: ImageUploadSessionService, useValue: mockedImageUploadSessionService },
      ],
      declarations: [ImageManagerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save images', () => {
    spyOn(mockedImageManagerService, 'getImages').and.returnValue(of([] as Image[]));
    component.getImages();
    expect(mockedImageManagerService.getImages).toHaveBeenCalled();
  });

  it('should delete image', () => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(mockDialogRef);
    spyOn(mockedImageManagerService, 'getImages').and.returnValue(of([] as Image[]));
    spyOn(mockedImageManagerService, 'deleteFile').and.returnValue(of({} as Image));
    component.controller = { authToken: 'test' } as any;
    component.deleteFile('image_path');
    expect(mockedImageManagerService.deleteFile).toHaveBeenCalled();
  });
});
