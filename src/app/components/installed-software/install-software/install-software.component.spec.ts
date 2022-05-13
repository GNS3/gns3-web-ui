import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElectronService, ElectronServiceRef } from 'ngx-electron';
import { InstallSoftwareComponent } from './install-software.component';

describe('InstallSoftwareComponent', () => {
  let component: InstallSoftwareComponent;
  let fixture: ComponentFixture<InstallSoftwareComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [InstallSoftwareComponent],
      providers: [
        { provide: ElectronService, useValue: {} },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallSoftwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
