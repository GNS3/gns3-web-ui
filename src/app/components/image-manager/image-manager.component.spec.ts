import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ImageManagerService } from 'app/services/image-manager.service';
import { ServerService } from 'app/services/server.service';
import { MockedServerService } from 'app/services/server.service.spec';
import { of } from 'rxjs';
import { Server } from '../../models/server';

import { ImageManagerComponent } from './image-manager.component';
import { Image } from '../../models/images';
import { ProgressService } from 'app/common/progress/progress.service';
import { MockedProgressService } from '../project-map/project-map.component.spec';
import { MockedActivatedRoute } from '../preferences/preferences.component.spec';
import { ActivatedRoute } from '@angular/router';
import { MockedVersionService } from '../../services/version.service.spec';
import { VersionService } from 'app/services/version.service';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';

export class MockedImageManagerService {
  public getImages(server: Server) {
    return of();
  }

  public deleteFile(server: Server, image_path) {
    return of();
  }

}

describe('ImageManagerComponent', () => {
  let component: ImageManagerComponent;
  let fixture: ComponentFixture<ImageManagerComponent>;

  let mockedServerService = new MockedServerService();
  let mockedImageManagerService = new MockedImageManagerService()
  let mockedProgressService = new MockedProgressService()
  let mockedVersionService = new MockedVersionService()
  let mockedToasterService = new MockedToasterService()
  let activatedRoute = new MockedActivatedRoute().get();


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ServerService, useValue: mockedServerService },
        { provide: ImageManagerService, useValue: mockedImageManagerService },
        { provide: ProgressService, useValue: mockedProgressService },
        { provide: VersionService, useValue: mockedVersionService },
        { provide: ToasterService, useValue: mockedToasterService },
      ],
      declarations: [ImageManagerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
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
    spyOn(mockedImageManagerService, 'getImages').and.returnValue(of({} as Image));
    component.getImages()
    expect(mockedImageManagerService.getImages).toHaveBeenCalled();
  });

  it('should delete image', () => {
    spyOn(mockedImageManagerService, 'deleteFile').and.returnValue(of({} as Image));
    component.deleteFile('image_path')
    expect(mockedImageManagerService.deleteFile).toHaveBeenCalled();
  });
});