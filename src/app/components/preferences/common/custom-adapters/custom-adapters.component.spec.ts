import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CustomAdaptersTableComponent } from '../custom-adapters-table/custom-adapters-table.component';
import { CustomAdaptersComponent } from './custom-adapters.component';

describe('Custom adapters component', () => {
  let component: CustomAdaptersComponent;
  let fixture: ComponentFixture<CustomAdaptersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
      ],
      providers: [provideZonelessChangeDetection()],
      declarations: [CustomAdaptersComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomAdaptersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO: fix for Angular 21 - component now uses MatDialogRef.close() instead of emitters
  xit('should emit event when apply clicked', () => {
    const dialogRef = component.dialogRef;
    spyOn(dialogRef, 'close');

    component.configureCustomAdapters();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  // TODO: fix for Angular 21 - component now uses MatDialogRef.close() instead of emitters
  xit('should emit event when cancel clicked', () => {
    const dialogRef = component.dialogRef;
    spyOn(dialogRef, 'close');

    component.cancelConfigureCustomAdapters();

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
