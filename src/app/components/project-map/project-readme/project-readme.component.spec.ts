import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, importProvidersFrom } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectReadmeComponent } from './project-readme.component';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ProjectReadmeComponent', () => {
  let component: ProjectReadmeComponent;
  let fixture: ComponentFixture<ProjectReadmeComponent>;
  let mockDialogRef: any;
  let mockProjectService: any;
  let mockSanitizer: any;
  let mockController: Controller;
  let mockProject: Project;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockSanitizer = {
      bypassSecurityTrustHtml: vi.fn((html: string) => html as SafeHtml),
    };

    mockProjectService = {
      getReadmeFile: vi.fn(),
    };

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

    mockProject = {
      project_id: 'proj1',
      name: 'Test Project',
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
    } as Project;

    await TestBed.configureTestingModule({
      imports: [ProjectReadmeComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectReadmeComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.project = mockProject;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have initial empty readmeHtml', () => {
      expect(component.readmeHtml).toBe('');
    });
  });

  describe('onNoClick', () => {
    it('should close the dialog when called', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should fetch readme file and set readmeHtml when file exists', () => {
      const markdownContent = '# Test README\n\nThis is a test.';
      mockProjectService.getReadmeFile.mockReturnValue(of(markdownContent));

      component.ngAfterViewInit();
      fixture.detectChanges();

      expect(mockProjectService.getReadmeFile).toHaveBeenCalledWith(mockController, mockProject.project_id);
      expect(component.readmeHtml).toBeTruthy();
    });

    it('should not set readmeHtml when file is null', () => {
      mockProjectService.getReadmeFile.mockReturnValue(of(null));

      component.ngAfterViewInit();
      fixture.detectChanges();

      expect(component.readmeHtml).toBe('');
    });
  });
});
