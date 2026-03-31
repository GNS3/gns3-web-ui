import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToasterService } from '@services/toaster.service';
import { ImportApplianceComponent } from './import-appliance.component';

describe('ImportApplianceComponent', () => {
  let component: ImportApplianceComponent;
  let fixture: ComponentFixture<ImportApplianceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ImportApplianceComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ToasterService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportApplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
