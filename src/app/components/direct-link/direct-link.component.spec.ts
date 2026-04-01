import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ControllerDatabase } from '@services/controller.database';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { DirectLinkComponent } from './direct-link.component';

describe('DirectLinkComponent', () => {
  let component: DirectLinkComponent;
  let fixture: ComponentFixture<DirectLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DirectLinkComponent, RouterModule.forRoot([])],
      providers: [
        provideZonelessChangeDetection(),
        ControllerService,
        ControllerDatabase,
        HttpController,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => null
              }
            }
          }
        },
        { provide: Router, useValue: {} },
        { provide: ToasterService, useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(DirectLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
