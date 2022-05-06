import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockedDrawingsDataSource } from 'app/components/project-map/project-map.component.spec';
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
        { provide: ElectronServiceRef, useValue: {} },
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
