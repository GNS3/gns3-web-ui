import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ComputesComponent } from './computes.component';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Compute } from '@models/compute';
import { of, throwError, Subject } from 'rxjs';

describe('ComputesComponent', () => {
  let component: ComputesComponent;
  let fixture: ComponentFixture<ComputesComponent>;
  let mockComputeService: ComputeService;
  let mockControllerService: ControllerService;
  let mockNotificationService: NotificationService;
  let mockToasterService: ToasterService;
  let mockDialog: MatDialog;
  let mockDialogRef: MatDialogRef<any>;
  let computeNotificationEmitter: Subject<any>;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'test-token',
    tokenExpired: false,
  } as Controller;

  const mockComputes: Compute[] = [
    {
      compute_id: 'local',
      name: 'Local Compute',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      connected: true,
      cpu: 25.5,
      memory: 50.0,
      disk: 75.0,
      capabilities: [],
      cpu_usage_percent: 0,
      memory_usage_percent: 0,
      user: 'test',
    } as unknown as Compute,
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    computeNotificationEmitter = new Subject<any>();

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    } as any as ControllerService;

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of(mockComputes)),
      getCompute: vi.fn().mockReturnValue(of(mockComputes[0])),
      createCompute: vi.fn().mockReturnValue(of({})),
      updateCompute: vi.fn().mockReturnValue(of({})),
      deleteCompute: vi.fn().mockReturnValue(of({})),
      connectCompute: vi.fn().mockReturnValue(of({})),
    } as any as ComputeService;

    mockNotificationService = {
      connectToComputeNotifications: vi.fn(),
      computeNotificationEmitter: computeNotificationEmitter.asObservable(),
    } as any as NotificationService;

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    } as any as ToasterService;

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
      close: vi.fn(),
    } as any as MatDialogRef<any>;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any as MatDialog;

    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        ComputesComponent,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTableModule,
        MatTooltipModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: ComputeService, useValue: mockComputeService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComputesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct displayedColumns', () => {
    expect(component.displayedColumns).toEqual(['status', 'name', 'host', 'connected', 'cpu', 'memory', 'disk', 'actions']);
  });

  it('should initialize with empty computes signal', () => {
    expect(component.computes()).toEqual([]);
  });

  it('should initialize with loading signal', () => {
    expect(component.loading()).toBe(true);
  });

  it('should load controller on init', async () => {
    component.ngOnInit();
    // Wait for async controllerService.get to complete
    // Use fake timers to advance time, not real setTimeout
    vi.advanceTimersByTime(10);
    await vi.runAllTimersAsync();
    expect(mockControllerService.get).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = vi.spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should get status icon for connected compute', () => {
    const compute = { connected: true } as Compute;
    expect(component.getStatusIcon(compute)).toBe('check_circle');
  });

  it('should get status icon for disconnected compute', () => {
    const compute = { connected: false } as Compute;
    expect(component.getStatusIcon(compute)).toBe('cancel');
  });

  it('should get status color for connected compute', () => {
    const compute = { connected: true } as Compute;
    expect(component.getStatusColor(compute)).toBe('var(--mat-sys-primary)');
  });

  it('should get status color for disconnected compute', () => {
    const compute = { connected: false } as Compute;
    expect(component.getStatusColor(compute)).toBe('var(--mat-sys-error)');
  });

  it('should format percent value', () => {
    expect(component.formatPercent(25.5)).toBe('25.5%');
    expect(component.formatPercent(undefined)).toBe('--');
  });

  it('should format host', () => {
    const compute = { host: 'localhost', port: 3080 } as Compute;
    expect(component.formatHost(compute)).toBe('localhost:3080');
  });

  it('should load controller and computes', () => {
    component.loadControllerAndComputes();
    expect(mockControllerService.get).toHaveBeenCalled();
  });

  it('should handle compute notification for created', () => {
    const notification = {
      action: 'compute.created',
      event: { compute_id: 'new-id', name: 'New Compute', host: 'localhost', port: 3080, protocol: 'http:' } as Compute,
    };

    component.computes.set([]);
    component.handleComputeNotification(notification);

    expect(component.computes()).toHaveLength(1);
    expect(mockToasterService.success).toHaveBeenCalled();
  });

  it('should handle compute notification for deleted', () => {
    const notification = {
      action: 'compute.deleted',
      event: { compute_id: 'local', name: 'Local Compute' } as Compute,
    };

    component.computes.set([...mockComputes]);
    component.handleComputeNotification(notification);

    expect(component.computes()).toHaveLength(0);
  });

  it('should have connectToGlobalNotifications method', () => {
    expect(typeof component.connectToGlobalNotifications).toBe('function');
  });

  it('should have openAddDialog method', () => {
    expect(typeof component.openAddDialog).toBe('function');
  });

  it('should have openEditDialog method', () => {
    expect(typeof component.openEditDialog).toBe('function');
  });

  it('should have deleteCompute method', () => {
    expect(typeof component.deleteCompute).toBe('function');
  });

  it('should have connectCompute method', () => {
    expect(typeof component.connectCompute).toBe('function');
  });
});
