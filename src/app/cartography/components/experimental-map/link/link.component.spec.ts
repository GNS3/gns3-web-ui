import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { MultiLinkCalculatorHelper } from 'app/cartography/helpers/multi-link-calculator-helper';
import { LinkComponent } from './link.component';
import { StatusComponent } from '../status/status.component';

describe('LinkComponent', () => {
  let component: LinkComponent;
  let fixture: ComponentFixture<LinkComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LinkComponent, StatusComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MultiLinkCalculatorHelper, useValue: {} }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
