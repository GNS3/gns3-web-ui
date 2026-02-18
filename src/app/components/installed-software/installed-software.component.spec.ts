import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExternalSoftwareDefinitionService } from 'app/services/external-software-definition.service';
import { InstalledSoftwareService } from 'app/services/installed-software.service';
import { PlatformService } from 'app/services/platform.service';
import { ElectronService } from 'ngx-electron';
import { InstalledSoftwareComponent } from './installed-software.component';

describe('InstalledSoftwareComponent', () => {
  let component: InstalledSoftwareComponent;
  let fixture: ComponentFixture<InstalledSoftwareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstalledSoftwareComponent],
      providers: [
        InstalledSoftwareService,
        ElectronService,
        ExternalSoftwareDefinitionService,
        PlatformService
      ],

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
