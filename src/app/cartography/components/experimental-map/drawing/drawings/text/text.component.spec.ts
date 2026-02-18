import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontFixer } from 'app/cartography/helpers/font-fixer';
import { TextComponent } from './text.component';

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      declarations: [TextComponent],
      providers:[FontFixer]
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
