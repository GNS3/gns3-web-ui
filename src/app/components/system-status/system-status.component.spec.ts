import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller } from '@models/controller';
import { ControllerStatistics } from '@models/computeStatistics';
import { Project } from '@models/project';
import { ComputeService } from '@services/compute.service';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { ControllerService } from '@services/controller.service';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';
import { SystemStatusComponent } from './system-status.component';

describe('SystemStatusComponent', () => {
  let fixture: ComponentFixture<SystemStatusComponent>;
  let component: SystemStatusComponent;
  let controllerService: any;
  let computeService: any;
  let projectService: any;
  let versionService: any;
  let connectionManager: any;
  let toasterService: any;

  const controller = {
    id: 1,
    name: 'Local controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    username: 'admin',
    status: 'running',
  } as Controller;

  const statistics: ControllerStatistics = {
    uptime_seconds: 90061,
    projects: { total: 3, opened: 1, closed: 2 },
    nodes: {
      total: 8,
      open_project_nodes: 5,
      closed_project_nodes: 3,
      by_type: { qemu: 5, docker: 3 },
      by_status: { started: 4, stopped: 3, suspended: 1 },
    },
    links: { total: 10, capturing: 2 },
    computes: [
      {
        compute_id: 'local',
        compute_name: 'Local compute',
        statistics: {
          cpu_count: 8,
          cpu_count_physical: 4,
          cpu_model: 'Test CPU',
          cpu_usage_percent: 20,
          disk_free: 12288,
          disk_total: 16384,
          disk_usage_percent: 35,
          disk_used: 4096,
          load_average: [2.51, 2.12, 2.12],
          load_average_percent: [2, 3, 4],
          memory_free: 2048,
          memory_total: 8192,
          memory_usage_percent: 75,
          memory_used: 6144,
          swap_free: 512,
          swap_total: 1024,
          swap_usage_percent: 50,
          swap_used: 512,
        },
      },
    ],
  };

  const projects = [
    { project_id: 'closed', name: 'Closed lab', status: 'closed', created_by: 'admin' },
    { project_id: 'open', name: 'Running lab', status: 'opened', created_by: 'operator' },
  ] as Project[];

  beforeEach(async () => {
    controllerService = { get: vi.fn().mockResolvedValue(controller) };
    computeService = { getStatistics: vi.fn().mockReturnValue(of(statistics)) };
    projectService = { list: vi.fn().mockReturnValue(of(projects)) };
    versionService = { get: vi.fn().mockReturnValue(of({ version: '3.1.0' })) };
    connectionManager = { isConnectedTo: vi.fn().mockReturnValue(true) };
    toasterService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SystemStatusComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue('1') } } },
        },
        { provide: ControllerService, useValue: controllerService },
        { provide: ComputeService, useValue: computeService },
        { provide: ProjectService, useValue: projectService },
        { provide: VersionService, useValue: versionService },
        { provide: ConnectionManagerService, useValue: connectionManager },
        { provide: ToasterService, useValue: toasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemStatusComponent);
    component = fixture.componentInstance;
  });

  async function initialize() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('loads and presents the unified system snapshot', async () => {
    await initialize();

    expect(controllerService.get).toHaveBeenCalledWith(1);
    expect(computeService.getStatistics).toHaveBeenCalledWith(controller);
    expect(projectService.list).toHaveBeenCalledWith(controller);
    expect(versionService.get).toHaveBeenCalledWith(controller);
    expect(component.statistics()).toEqual(statistics);
    expect(component.gns3Version()).toBe('3.1.0');
    expect(component.runningNodes()).toBe(4);
    expect(component.visibleProjects()[0].name).toBe('Running lab');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('System status');
    expect(text).toContain('Local compute');
    expect(text).toContain('Running lab');
    expect(text).toContain('1d 1h 1m 1s');
    expect(text).toContain('Test CPU · 4 cores / 8 threads');
    expect(text).toContain('12.00 KB free');
    expect(fixture.nativeElement.querySelector('.compute-card__load strong').textContent).toContain('2.51');
  });

  it('refreshes statistics, projects, and version together', async () => {
    await initialize();
    computeService.getStatistics.mockClear();
    projectService.list.mockClear();
    versionService.get.mockClear();

    component.refresh();

    expect(computeService.getStatistics).toHaveBeenCalledOnce();
    expect(projectService.list).toHaveBeenCalledOnce();
    expect(versionService.get).toHaveBeenCalledOnce();
    expect(component.lastUpdated()).toBeInstanceOf(Date);
  });

  it('automatically refreshes the system snapshot every 15 seconds', async () => {
    const intervalSpy = vi.spyOn(globalThis, 'setInterval');

    await initialize();

    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    intervalSpy.mockRestore();
  });

  it('keeps the page usable when statistics cannot be loaded', async () => {
    computeService.getStatistics.mockReturnValue(throwError(() => new Error('Statistics unavailable')));

    await initialize();

    expect(component.statistics()).toBeNull();
    expect(component.statisticsError()).toBe('Statistics unavailable');
    expect(component.projects()).toEqual(projects);
    expect(fixture.nativeElement.textContent).toContain('Statistics unavailable');
  });

  it('formats resource and node values for display', () => {
    expect(component.formatBytes(1536)).toBe('1.5 KB');
    expect(component.formatUptime(90061)).toBe('1d 1h 1m 1s');
    expect(component.formatNodeType('qemu')).toBe('QEMU');
    expect(component.formatStatus('started')).toBe('Running');
    expect(component.clampPercentage(125)).toBe(100);
    expect(component.clampPercentage(-4)).toBe(0);
  });
});
