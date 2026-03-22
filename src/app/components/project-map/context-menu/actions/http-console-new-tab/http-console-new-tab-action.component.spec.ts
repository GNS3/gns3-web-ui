import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpConsoleNewTabActionComponent } from './http-console-new-tab-action.component';

describe('HttpConsoleNewTabActionComponent', () => {
  let component: HttpConsoleNewTabActionComponent;
  let fixture: ComponentFixture<HttpConsoleNewTabActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [HttpConsoleNewTabActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HttpConsoleNewTabActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
