import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiLinkCalculatorHelper } from 'app/cartography/helpers/multi-link-calculator-helper';
import { LinkComponent } from './link.component';
import { StatusComponent } from '../status/status.component';

describe('LinkComponent', () => {
  let component: LinkComponent;
  let fixture: ComponentFixture<LinkComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LinkComponent, StatusComponent],
      providers: [
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
