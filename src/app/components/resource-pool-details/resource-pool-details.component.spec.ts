import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, ReplaySubject } from 'rxjs';
import { ResourcePoolDetailsComponent } from './resource-pool-details.component';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { ToasterService } from '@services/toaster.service';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ResourcePoolDetailsComponent', () => {
  let component: ResourcePoolDetailsComponent;
  let fixture: ComponentFixture<ResourcePoolDetailsComponent>;
  let mockResourcePoolsService: any;
  let mockToasterService: any;
  let routeDataSubject: ReplaySubject<{ controller: Controller; pool: ResourcePool }>;

  const mockController: Controller = {
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

  const createMockPool = (): ResourcePool =>
    ({
      name: 'Test Pool',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      resource_pool_id: 'pool-1',
      resources: [],
    } as ResourcePool);

  const createMockProject = (name: string): Project =>
    ({
      project_id: `proj-${name}`,
      name,
      filename: `${name}.gns3`,
      status: 'opened' as const,
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: `/path/to/${name}`,
      readonly: false,
    } as Project);

  beforeEach(async () => {
    // ReplaySubject replays values to new subscribers
    routeDataSubject = new ReplaySubject<{ controller: Controller; pool: ResourcePool }>(1);

    const mockPool = createMockPool();
    const mockProjects = [createMockProject('Project A'), createMockProject('Project B')];

    mockResourcePoolsService = {
      get: vi.fn().mockReturnValue(of(mockPool)),
      getFreeResources: vi.fn().mockReturnValue(of(mockProjects)),
      update: vi.fn().mockReturnValue(of(mockPool)),
      addResource: vi.fn().mockReturnValue(of(undefined)),
      deleteResource: vi.fn().mockReturnValue(of(undefined)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    const mockActivatedRoute = {
      data: routeDataSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourcePoolDetailsComponent],
      providers: [
        { provide: ResourcePoolsService, useValue: mockResourcePoolsService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcePoolDetailsComponent);
    component = fixture.componentInstance;

    // Emit route data BEFORE detectChanges so ReplaySubject can replay it
    routeDataSubject.next({ controller: mockController, pool: mockPool });
    // Trigger ngOnInit to subscribe to route.data - will immediately get replayed value
    fixture.detectChanges();
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
    it('should set controller and pool from route data', () => {
      expect(component.controller).toBe(mockController);
      expect(component.pool()).toBeDefined();
      expect(component.pool().name).toBe('Test Pool');
    });

    it('should initialize editPoolForm with pool name', () => {
      expect(component.editPoolForm.get('poolname')?.value).toBe('Test Pool');
    });

    it('should call refresh to load pool and free resources', () => {
      expect(mockResourcePoolsService.get).toHaveBeenCalledWith(mockController, 'pool-1');
      expect(mockResourcePoolsService.getFreeResources).toHaveBeenCalledWith(mockController);
    });
  });

  describe('onUpdate', () => {
    it('should not call update service when pool name is empty', () => {
      component.editPoolForm.patchValue({ poolname: '' });
      component.onUpdate();

      expect(mockResourcePoolsService.update).not.toHaveBeenCalled();
    });

    it('should call update service with new name', () => {
      const updatedPool = { ...createMockPool(), name: 'Updated Pool' };
      mockResourcePoolsService.update.mockReturnValue(of(updatedPool));

      component.editPoolForm.patchValue({ poolname: 'Updated Pool' });
      component.onUpdate();

      expect(mockResourcePoolsService.update).toHaveBeenCalled();
    });

    it('should show success toast after successful update', () => {
      const updatedPool = { ...createMockPool(), name: 'Updated Pool' };
      mockResourcePoolsService.update.mockReturnValue(of(updatedPool));

      component.editPoolForm.patchValue({ poolname: 'Updated Pool' });
      component.onUpdate();

      expect(mockToasterService.success).toHaveBeenCalledWith('Pool Updated Pool updated');
    });
  });

  describe('addResource', () => {
    it('should add resource when exactly one matching project is found', () => {
      const mockProject = createMockProject('Project A');
      mockResourcePoolsService.addResource.mockReturnValue(of(undefined));

      component.addResourceFormControl.setValue('Project A');
      component.addResource();

      expect(mockResourcePoolsService.addResource).toHaveBeenCalledWith(mockController, component.pool(), mockProject);
    });

    it('should show success toast when project is added', () => {
      const mockProject = createMockProject('Project A');
      mockResourcePoolsService.addResource.mockReturnValue(of(undefined));

      component.addResourceFormControl.setValue('Project A');
      component.addResource();

      expect(mockToasterService.success).toHaveBeenCalledWith(
        `Project ${mockProject.name} added to pool: ${component.pool().name}`
      );
    });

    it('should clear form control after successful add', () => {
      createMockProject('Project A');
      mockResourcePoolsService.addResource.mockReturnValue(of(undefined));

      component.addResourceFormControl.setValue('Project A');
      component.addResource();

      expect(component.addResourceFormControl.value).toBe('');
    });

    it('should show error when no matching project is found', () => {
      component.addResourceFormControl.setValue('NonExistent');
      component.addResource();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot find related project with string: NonExistent');
      expect(mockResourcePoolsService.addResource).not.toHaveBeenCalled();
    });

    it('should show error when multiple matching projects are found', () => {
      const duplicateProject1 = createMockProject('Test Project');
      const duplicateProject2 = createMockProject('Test Project');
      mockResourcePoolsService.getFreeResources.mockReturnValue(of([duplicateProject1, duplicateProject2]));

      // Manually refresh the projects list
      mockResourcePoolsService.getFreeResources(mockController).subscribe((projects: Project[]) => {
        component.projects.set(projects);
      });
      fixture.detectChanges();

      component.addResourceFormControl.setValue('Test');
      component.addResource();

      expect(mockToasterService.error).toHaveBeenCalledWith('2 matches for Test, please be more accurate');
      expect(mockResourcePoolsService.addResource).not.toHaveBeenCalled();
    });
  });

  // TODO: add deleteResource tests - MatDialog mocking has issues with inject() in Angular 21
  // The deleteResource tests fail with "Cannot read properties of undefined (reading 'push')"
  // because Angular Material's real dialog code is running instead of the mock.
  // This appears to be a specific issue with how inject(MatDialog) works with TestBed mocking.
});
