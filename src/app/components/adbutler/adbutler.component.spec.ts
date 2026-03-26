import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { AdbutlerComponent } from './adbutler.component';

xdescribe('AdbutlerComponent', () => {
  let component: AdbutlerComponent;
  let fixture: ComponentFixture<AdbutlerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdbutlerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdbutlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
