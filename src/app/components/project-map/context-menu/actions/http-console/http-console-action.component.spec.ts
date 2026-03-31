import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NodeConsoleService } from '@services/node-console.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ToasterService } from '@services/toaster.service';
import { MapSettingsService } from '@services/mapSettings.service';
import { HttpConsoleActionComponent } from './http-console-action.component';

describe('HttpConsoleActionComponent', () => {
  let component: HttpConsoleActionComponent;
  let fixture: ComponentFixture<HttpConsoleActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ChangeDetectorRef,
        { provide: NodeConsoleService, useValue: {} },
        { provide: VncConsoleService, useValue: {} },
        { provide: ToasterService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: MapSettingsService, useValue: {} },
      ],
      imports: [HttpConsoleActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HttpConsoleActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
