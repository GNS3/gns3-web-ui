import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ControllerDatabase } from '@services/controller.database';
import { ToasterService } from '@services/toaster.service';
import { DirectLinkComponent } from './direct-link.component';

describe('DirectLinkComponent', () => {
  let component: DirectLinkComponent;
  let fixture: ComponentFixture<DirectLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ControllerService,
        ControllerDatabase,
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: ToasterService, useValue: {} },
      ],
      imports: [DirectLinkComponent],
    });
    fixture = TestBed.createComponent(DirectLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
