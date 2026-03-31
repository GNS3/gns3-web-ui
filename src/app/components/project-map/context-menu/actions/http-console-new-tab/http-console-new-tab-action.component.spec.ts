import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NodeConsoleService } from '@services/node-console.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ToasterService } from '@services/toaster.service';
import { HttpConsoleNewTabActionComponent } from './http-console-new-tab-action.component';

describe('HttpConsoleNewTabActionComponent', () => {
  let component: HttpConsoleNewTabActionComponent;
  let fixture: ComponentFixture<HttpConsoleNewTabActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodeConsoleService, useValue: {} },
        { provide: VncConsoleService, useValue: {} },
        { provide: ToasterService, useValue: {} },
        { provide: Router, useValue: {} },
      ],
      imports: [HttpConsoleNewTabActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HttpConsoleNewTabActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
