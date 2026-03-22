import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigActionComponent } from './config-action.component';

describe('ConfigActionComponent', () => {
  let component: ConfigActionComponent;
  let fixture: ComponentFixture<ConfigActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [ConfigActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
