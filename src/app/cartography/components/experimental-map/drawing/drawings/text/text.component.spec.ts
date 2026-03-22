import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { FontFixer } from 'app/cartography/helpers/font-fixer';
import { TextComponent } from './text.component';

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;

  beforeEach(() => {
   TestBed.configureTestingModule({
      declarations: [TextComponent],
      providers:[provideZonelessChangeDetection(), FontFixer]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
