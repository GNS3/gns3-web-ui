import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagementComponent } from './management.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';

describe('ManagementComponent', () => {
  let component: ManagementComponent;
  let fixture: ComponentFixture<ManagementComponent>;
  let mockControllerService: ControllerService;
  let mockActivatedRoute: ActivatedRoute;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'test-token',
    tokenExpired: false,
  } as Controller;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    } as any as ControllerService;

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    } as any as ActivatedRoute;

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementComponent, RouterModule, MatTabsModule],
      providers: [
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have links signal with correct tabs', () => {
    expect(component.links()).toEqual(['users', 'groups', 'roles', 'pools', 'ACL']);
  });

  it('should fetch controller on init', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should have controller property', () => {
    expect(component.controller).toBeDefined();
  });

  describe('ngOnInit error handling', () => {
    it('should display error when controllerService.get fails', async () => {
      vi.clearAllMocks();
      mockControllerService.get = vi.fn().mockRejectedValue({ error: { message: 'Controller not found' } }) as any;
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller not found');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback error message when no message available', async () => {
      vi.clearAllMocks();
      mockControllerService.get = vi.fn().mockRejectedValue({ code: 'INTERNAL_ERROR' }) as any;
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
