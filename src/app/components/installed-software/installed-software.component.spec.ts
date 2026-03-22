import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ExternalSoftwareDefinitionService } from 'app/services/external-software-definition.service';
import { InstalledSoftwareService } from 'app/services/installed-software.service';
import { PlatformService } from 'app/services/platform.service';
import { InstalledSoftwareComponent } from './installed-software.component';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { AppTestingModule } from 'app/testing/app-testing/app-testing.module';

describe('InstalledSoftwareComponent', () => {
  let component: InstalledSoftwareComponent;
  let fixture: ComponentFixture<InstalledSoftwareComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InstalledSoftwareComponent],
      imports: [
        CommonModule,
        MatTableModule,
        AppTestingModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        InstalledSoftwareService,
        ExternalSoftwareDefinitionService,
        PlatformService
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
