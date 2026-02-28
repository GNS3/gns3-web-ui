import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ExternalSoftwareDefinitionService } from 'app/services/external-software-definition.service';
import { InstalledSoftwareService } from 'app/services/installed-software.service';
import { PlatformService } from 'app/services/platform.service';
import { ElectronService } from 'ngx-electron';
import { InstalledSoftwareComponent } from './installed-software.component';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { AppTestingModule } from 'app/testing/app-testing/app-testing.module';

class PlatformServiceMock {
  isWindows() {
    return false;
  }
  isLinux() {
    return true;
  }
  isDarwin() {
    return false;
  }
}

class ElectronServiceMock {
  remote = {
    require: () => ({
      getInstalledSoftware: () => ({})
    })
  };
}

describe('InstalledSoftwareComponent', () => {
  let component: InstalledSoftwareComponent;
  let fixture: ComponentFixture<InstalledSoftwareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstalledSoftwareComponent],
      imports: [
        CommonModule,
        MatTableModule,
        AppTestingModule
      ],
      providers: [
        InstalledSoftwareService,
        { provide: ElectronService, useClass: ElectronServiceMock },
        ExternalSoftwareDefinitionService,
        { provide: PlatformService, useClass: PlatformServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],

    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstalledSoftwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
