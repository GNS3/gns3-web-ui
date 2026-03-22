import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { InstallSoftwareComponent } from './install-software.component';

describe('InstallSoftwareComponent', () => {
  let component: InstallSoftwareComponent;
  let fixture: ComponentFixture<InstallSoftwareComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InstallSoftwareComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallSoftwareComponent);
    component = fixture.componentInstance;
    component.software = { installed: false };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Install button when software not installed', () => {
    component.software = { installed: false };
    component.ngOnInit();
    expect(component.buttonText).toBe('Install');
    expect(component.disabled).toBeFalsy();
  });

  it('should show Installed button when software is installed', () => {
    component.software = { installed: true };
    component.ngOnInit();
    expect(component.buttonText).toBe('Installed');
    expect(component.disabled).toBeTruthy();
  });

  it('should show Not supported when install is called', () => {
    component.install();
    expect(component.buttonText).toBe('Not supported');
    expect(component.disabled).toBeTruthy();
  });
});
