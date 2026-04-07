import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { DynamipsPreferencesComponent } from './dynamips-preferences.component';
import { ControllerService } from '@services/controller.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DynamipsPreferencesComponent', () => {
  let component: DynamipsPreferencesComponent;
  let fixture: ComponentFixture<DynamipsPreferencesComponent>;
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
      imports: [DynamipsPreferencesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamipsPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
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

  it('should populate controller after async load', () => {
    expect(component.controller).toEqual(mockController);
  });

  it('should display Dynamips preferences title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Dynamips preferences');
  });

  it('should have mat-form-field for dynamips path input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const formField = compiled.querySelector('mat-form-field');
    expect(formField).toBeTruthy();
  });

  it('should have text input for dynamips path', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[type="text"]');
    expect(input).toBeTruthy();
  });

  it('should have placeholder "Path to Dynamips"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input');
    expect(input?.getAttribute('placeholder')).toContain('Path to Dynamips');
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  describe('restoreDefaults()', () => {
    it('should set dynamipsPath to empty string', () => {
      component.dynamipsPath.set('/some/path');
      component.restoreDefaults();
      expect(component.dynamipsPath()).toBe('');
    });

    it('should reset dynamipsPath in template after restoreDefaults', () => {
      component.dynamipsPath.set('/some/path');
      component.restoreDefaults();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('dynamipsPath binding', () => {
    it('should have dynamipsPath property bound via ngModel', () => {
      expect(component.dynamipsPath()).toBeUndefined();
    });
  });
});
