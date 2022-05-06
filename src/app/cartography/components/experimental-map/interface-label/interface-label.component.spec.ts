import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CssFixer } from 'app/cartography/helpers/css-fixer';
import { InterfaceLabelComponent } from './interface-label.component';

describe('InterfaceLabelComponent', () => {
  let component: InterfaceLabelComponent;
  let fixture: ComponentFixture<InterfaceLabelComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [InterfaceLabelComponent],
      providers:[CssFixer]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterfaceLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
  });
});
