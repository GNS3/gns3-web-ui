import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportApplianceComponent } from './import-appliance.component';

describe('ImportApplianceComponent', () => {
  let component: ImportApplianceComponent;
  let fixture: ComponentFixture<ImportApplianceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ImportApplianceComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportApplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
