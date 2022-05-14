import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpServer } from 'app/services/http-server.service';
import { MockedServerService } from 'app/services/server.service.spec';
import { TemplateMocksService } from 'app/services/template-mocks.service';
import { TemplateService } from 'app/services/template.service';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import { NonNegativeValidator } from 'app/validators/non-negative-validator';
import { TemplateListDialogComponent } from './template-list-dialog.component';



describe('TemplateListDialogComponent', () => {
  let component: TemplateListDialogComponent;
  let fixture: ComponentFixture<TemplateListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TemplateListDialogComponent],
      imports: [ReactiveFormsModule, FormsModule,RouterTestingModule],
      providers: [
        { provide: TemplateService, useClass: TemplateMocksService },
        { provide: ToasterService, useValue: MockedToasterService },
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: NonNegativeValidator, useValue: {} },
        HttpServer,
        HttpClient
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
