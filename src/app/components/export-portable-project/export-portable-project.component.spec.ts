import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectService } from '@services/project.service';
import { MockedProjectService } from '@services/project.service.spec';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ExportPortableProjectComponent } from './export-portable-project.component';

describe('ExportPortableProjectComponent', () => {
  let component: ExportPortableProjectComponent;
  let fixture: ComponentFixture<ExportPortableProjectComponent>;
  let mockedToasterService = new MockedToasterService();
  let mockedProjectService = new MockedProjectService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExportPortableProjectComponent],
      imports: [
        MatDialogModule,
        ReactiveFormsModule,
        FormsModule,
        MatSelectModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        BrowserAnimationsModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: ProjectService, useValue: mockedProjectService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportPortableProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
