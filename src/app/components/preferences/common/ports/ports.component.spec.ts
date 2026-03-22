import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { PortsComponent } from './ports.component';

describe('PortsComponent', () => {
  let component: PortsComponent;
  let fixture: ComponentFixture<PortsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [PortsComponent],
    });
    fixture = TestBed.createComponent(PortsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});