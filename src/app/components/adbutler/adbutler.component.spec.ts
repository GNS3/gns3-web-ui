import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AdbutlerComponent } from './adbutler.component';

xdescribe('AdbutlerComponent', () => {
  let component: AdbutlerComponent;
  let fixture: ComponentFixture<AdbutlerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdbutlerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdbutlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
