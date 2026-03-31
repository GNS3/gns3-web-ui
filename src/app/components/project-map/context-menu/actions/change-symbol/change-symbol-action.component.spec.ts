import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeSymbolActionComponent } from './change-symbol-action.component';

describe('ChangeSymbolActionComponent', () => {
  let component: ChangeSymbolActionComponent;
  let fixture: ComponentFixture<ChangeSymbolActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeSymbolActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
