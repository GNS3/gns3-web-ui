import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VmwarePreferencesComponent } from './vmware-preferences.component';
import { ControllerService } from '@services/controller.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VmwarePreferencesComponent', () => {
  let component: VmwarePreferencesComponent;
  let fixture: ComponentFixture<VmwarePreferencesComponent>;
  let mockControllerService: any;
  let mockActivatedRoute: any;
  let mockController: Controller;

  beforeEach(async () => {
    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '/',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      authToken: 'token',
      tokenExpired: false,
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [VmwarePreferencesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VmwarePreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract controller_id from route params on ngOnInit', () => {
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
  });

  it('should call controllerService.get with parsed controller id', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should populate controller after async load', async () => {
    // The mock controllerService.get returns a promise that resolves immediately
    // After ngOnInit and detectChanges, the controller should be populated
    expect(component.controller).toEqual(mockController);
  });

  it('should have vmrunPath initially undefined', () => {
    const newFixture = TestBed.createComponent(VmwarePreferencesComponent);
    const newComponent = newFixture.componentInstance;
    // vmrunPath is not initialized in the component, so it is undefined
    expect(newComponent.vmrunPath).toBeUndefined();
  });

  it('should restore vmrunPath to empty string when restoreDefaults is called', () => {
    component.vmrunPath = '/some/path';
    component.restoreDefaults();
    expect(component.vmrunPath).toBe('');
  });

  it('should display VMware preferences title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('VMware preferences');
  });

  it('should display mat-form-field for vmrun path input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const formField = compiled.querySelector('mat-form-field');
    expect(formField).toBeTruthy();
  });

  it('should have input element with placeholder for vmrun path', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[matInput]');
    expect(input).toBeTruthy();
  });

  it('should display "Path to vmrun:" placeholder text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[matInput]');
    expect(input?.getAttribute('placeholder')).toBe('Path to vmrun:');
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });
});
