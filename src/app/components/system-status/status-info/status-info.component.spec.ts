import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { StatusInfoComponent } from './status-info.component';
import { StatusChartComponent } from '../status-chart/status-chart.component';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ControllerStatistics, ComputeStatistics, LinkStats, NodeStats, ProjectStats } from '@models/computeStatistics';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('StatusInfoComponent', () => {
  let component: StatusInfoComponent;
  let fixture: ComponentFixture<StatusInfoComponent>;
  let mockControllerService: any;
  let mockComputeService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let mockActivatedRoute: any;
  let mockController: Controller;
  let mockControllerStatistics: ControllerStatistics;

  const mockComputeStatistics: ComputeStatistics = {
    compute_id: 'local',
    compute_name: 'Local',
    statistics: {
      cpu_usage_percent: 25.5,
      disk_usage_percent: 45.0,
      load_average_percent: [1.2, 0.8, 0.5],
      memory_free: 8192,
      memory_total: 16384,
      memory_usage_percent: 50,
      memory_used: 8192,
      swap_free: 2048,
      swap_total: 4096,
      swap_usage_percent: 25,
      swap_used: 1024,
    },
  };

  const mockProjectStats: ProjectStats = {
    total: 10,
    opened: 7,
    closed: 3,
  };

  const mockNodeStats: NodeStats = {
    total: 25,
    open_project_nodes: 18,
    closed_project_nodes: 7,
    by_type: { vpcs: 10, qemu: 8, docker: 7 },
    by_status: { started: 15, stopped: 8, suspended: 2 },
  };

  const mockLinkStats: LinkStats = {
    total: 30,
    capturing: 5,
  };

  beforeEach(async () => {
    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockControllerStatistics = {
      computes: [mockComputeStatistics],
      projects: mockProjectStats,
      nodes: mockNodeStats,
      links: mockLinkStats,
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockComputeService = {
      getStatistics: vi.fn().mockReturnValue(of(mockControllerStatistics)),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StatusInfoComponent, StatusChartComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ComputeService, useValue: mockComputeService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusInfoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct initial signal values', () => {
      expect(component.computeStatistics()).toEqual([]);
      expect(component.projectStats()).toEqual({ total: 0, opened: 0, closed: 0 });
      expect(component.nodeStats()).toEqual({
        total: 0,
        open_project_nodes: 0,
        closed_project_nodes: 0,
        by_type: {},
        by_status: {},
      });
      expect(component.linkStats()).toEqual({ total: 0, capturing: 0 });
    });

    it('should have connectionFailed initially undefined', () => {
      expect(component.connectionFailed).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should extract controller_id from route params', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
      expect(component.controllerId).toBe('1');
    });

    it('should call getStatistics after initialization', () => {
      const getStatisticsSpy = vi.spyOn(component, 'getStatistics');

      component.ngOnInit();
      fixture.detectChanges();

      expect(getStatisticsSpy).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    describe('successful statistics fetch', () => {
      beforeEach(() => {
        component.controllerId = '1';
      });

      it('should fetch controller and then statistics', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(mockControllerService.get).toHaveBeenCalledWith(1);
        expect(mockComputeService.getStatistics).toHaveBeenCalledWith(mockController);
      });

      it('should set computeStatistics signal with returned computes', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.computeStatistics()).toEqual([mockComputeStatistics]);
      });

      it('should set projectStats signal with returned projects', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.projectStats()).toEqual(mockProjectStats);
      });

      it('should set nodeStats signal with returned nodes', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.nodeStats()).toEqual(mockNodeStats);
      });

      it('should set linkStats signal with returned links', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.linkStats()).toEqual(mockLinkStats);
      });

      it('should set up polling interval of 20 seconds', async () => {
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 20000);
      });
    });

    describe('failed statistics fetch', () => {
      beforeEach(() => {
        component.controllerId = '1';
        mockComputeService.getStatistics.mockReturnValue(throwError(() => new Error('Network error')));
      });

      it('should set connectionFailed to true on error', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.connectionFailed).toBe(true);
      });

      it('should show error toaster when getStatistics fails', async () => {
        mockComputeService.getStatistics.mockReturnValue(
          throwError(() => ({ error: { message: 'Statistics failed' } }))
        );

        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(mockToasterService.error).toHaveBeenCalledWith('Statistics failed');
      });

      it('should use fallback message when getStatistics error has no message', async () => {
        mockComputeService.getStatistics.mockReturnValue(throwError(() => ({})));

        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load statistics');
      });

      it('should call markForCheck when getStatistics fails', async () => {
        mockComputeService.getStatistics.mockReturnValue(
          throwError(() => ({ error: { message: 'Statistics failed' } }))
        );

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(cdrSpy).toHaveBeenCalled();
      });
    });

    describe('failed controller fetch', () => {
      beforeEach(() => {
        component.controllerId = '1';
        mockControllerService.get.mockRejectedValue({ error: { message: 'Controller failed' } });
      });

      it('should show error toaster when controllerService.get fails', async () => {
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(mockToasterService.error).toHaveBeenCalledWith('Controller failed');
      });

      it('should use fallback message when controller error has no message', async () => {
        mockControllerService.get.mockRejectedValue({});

        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
      });

      it('should call markForCheck when controllerService.get fails', async () => {
        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
        component.getStatistics();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(cdrSpy).toHaveBeenCalled();
      });
    });
  });
});
