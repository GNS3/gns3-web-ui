import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ProjectService } from '@services/project.service';
import { ChooseNameDialogComponent } from './choose-name-dialog.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ChooseNameDialogComponent', () => {
  let fixture: ComponentFixture<ChooseNameDialogComponent>;
  let mockDialogRef: any;
  let mockProjectService: any;
  let mockController: Controller;
  let mockProject: Project;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: 'token',
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
    } as Controller);

  const createMockProject = (): Project =>
    ({
      project_id: 'proj-123',
      name: 'Original Project Name',
      filename: 'test.gns3',
      status: 'opened',
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
      path: '/path/to/project',
      readonly: false,
    } as Project);

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockProjectService = {
      duplicate: vi.fn().mockReturnValue(of(undefined)),
    };

    mockController = createMockController();
    mockProject = createMockProject();

    await TestBed.configureTestingModule({
      imports: [ChooseNameDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseNameDialogComponent);
    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('project', mockProject);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should initialize name from project name', () => {
      expect(fixture.componentInstance.name).toBe(mockProject.name);
    });
  });

  describe('onCloseClick', () => {
    it('should close the dialog', () => {
      fixture.componentInstance.onCloseClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onSaveClick', () => {
    it('should call projectService.duplicate with correct parameters', () => {
      const newName = 'New Project Name';
      fixture.componentInstance.name = newName;

      fixture.componentInstance.onSaveClick();

      expect(mockProjectService.duplicate).toHaveBeenCalledWith(mockController, mockProject.project_id, newName);
    });

    it('should close the dialog when duplicate succeeds', async () => {
      fixture.componentInstance.onSaveClick();

      // Run fake timers to trigger the async callback
      await vi.runAllTimersAsync();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
