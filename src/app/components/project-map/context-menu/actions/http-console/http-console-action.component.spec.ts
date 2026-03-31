import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpConsoleActionComponent } from './http-console-action.component';

describe('HttpConsoleActionComponent', () => {
  let component: HttpConsoleActionComponent;
  let fixture: ComponentFixture<HttpConsoleActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [HttpConsoleActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HttpConsoleActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
