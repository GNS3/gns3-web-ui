import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsoleDeviceActionBrowserComponent } from './console-device-action-browser.component';

describe('ConsoleDeviceActionBrowserComponent', () => {
  let component: ConsoleDeviceActionBrowserComponent;
  let fixture: ComponentFixture<ConsoleDeviceActionBrowserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [ConsoleDeviceActionBrowserComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsoleDeviceActionBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
