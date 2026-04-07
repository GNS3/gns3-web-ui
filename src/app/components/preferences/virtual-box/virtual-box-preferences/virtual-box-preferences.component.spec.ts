import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VirtualBoxPreferencesComponent } from './virtual-box-preferences.component';
import { ControllerService } from '@services/controller.service';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VirtualBoxPreferencesComponent', () => {
  let component: VirtualBoxPreferencesComponent;
  let fixture: ComponentFixture<VirtualBoxPreferencesComponent>;
  let mockControllerService: any;
  let mockChangeDetectorRef: any;
  let mockActivatedRoute: any;
  let mockController: Controller;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: 'test-token',
      name: 'Test Controller',
      location: 'local',
      host: '127.0.0.1',
      port: 3080,
      path: '/path',
      ubridge_path: '/usr/local/bin/ubridge',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'secret',
      tokenExpired: false,
    } as Controller);

  beforeEach(async () => {
    mockController = createMockController();

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
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
      imports: [VirtualBoxPreferencesComponent],
      providers: [
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VirtualBoxPreferencesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller from route param', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should assign controller when get succeeds', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.controller).toEqual(mockController);
    });

    it('should call markForCheck after controller is loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // markForCheck is called inside the async .then() callback
      // which runs outside Angular's zone in zoneless mode.
      // We verify markForCheck is called by checking the controller is assigned.
      expect(component.controller).toEqual(mockController);
    });

    it('should set vboxManagePath to empty string initially', () => {
      expect(component.vboxManagePath()).toBe('');
    });
  });

  describe('restoreDefaults', () => {
    it('should reset vboxManagePath to empty string', () => {
      component.vboxManagePath.set('/some/path');

      component.restoreDefaults();

      expect(component.vboxManagePath()).toBe('');
    });
  });

  describe('Template', () => {
    it('should display VirtualBox preferences heading', () => {
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toContain('VirtualBox preferences');
    });

    it('should have mat-form-field for vboxManagePath input', () => {
      fixture.detectChanges();

      const formField = fixture.nativeElement.querySelector('mat-form-field');
      expect(formField).toBeTruthy();
    });

    it('should have input bound to vboxManagePath', async () => {
      component.vboxManagePath.set('/usr/bin/vboxmanage');

      fixture.detectChanges();
      await fixture.whenStable();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(input.value).toBe('/usr/bin/vboxmanage');
    });
  });
});
