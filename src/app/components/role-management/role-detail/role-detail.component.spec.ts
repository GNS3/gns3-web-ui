import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { HttpController } from '@services/http-controller.service';
import { RoleService } from '@services/role.service';
import { ToasterService } from '@services/toaster.service';
import { PrivilegeService } from '@services/privilege.service';
import { RoleDetailComponent } from './role-detail.component';

describe('RoleDetailComponent', () => {
  let component: RoleDetailComponent;
  let fixture: ComponentFixture<RoleDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoleDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        FormBuilder,
        { provide: HttpController, useValue: {} },
        { provide: RoleService, useValue: {} },
        { provide: ToasterService, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: PrivilegeService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
