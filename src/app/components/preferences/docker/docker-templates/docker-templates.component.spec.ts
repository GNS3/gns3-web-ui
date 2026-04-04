import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DockerTemplatesComponent } from './docker-templates.component';
import { ControllerService } from '@services/controller.service';
import { DockerService } from '@services/docker.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

describe('DockerTemplatesComponent', () => {
  let fixture: ComponentFixture<DockerTemplatesComponent>;
  let mockControllerService: any;
  let mockDockerService: any;
  let mockCdr: any;
  let mockActivatedRoute: any;
  let mockRouter: any;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    }) as Controller;

  const createMockDockerTemplate = (id: string, name: string, builtin = false): DockerTemplate =>
    ({
      template_id: id,
      name,
      template_type: 'docker',
      builtin,
      category: 'container',
      compute_id: 'local',
      console_type: 'telnet',
      symbol: 'computer',
      default_name_format: '{name}',
      console_auto_start: false,
      image: 'ubuntu:latest',
      console_resolution: '1024x768',
      adapters: 1,
      console_http_path: '/',
      console_http_port: 8080,
      aux_type: 'telnet',
      mac_address: '00:00:00:00:00:00',
      custom_adapters: [],
      environment: '',
      extra_hosts: '',
      start_command: '',
      usage: '',
      tags: [],
    }) as DockerTemplate;

  beforeEach(async () => {
    mockCdr = {
      markForCheck: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(createMockController()),
    };

    mockDockerService = {
      getTemplates: vi.fn().mockReturnValue(of([])),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        DockerTemplatesComponent,
        RouterModule,
        MatDialogModule,
        DeleteTemplateComponent,
        EmptyTemplatesListComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) }) } },
        { provide: TemplateService, useValue: { deleteTemplate: vi.fn().mockReturnValue(of({})) } },
        { provide: ToasterService, useValue: { success: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DockerTemplatesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should load controller from route params on init', () => {
      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should call getTemplates after controller is loaded', () => {
      expect(mockDockerService.getTemplates).toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('should fetch docker templates from service', () => {
      const templates = [
        createMockDockerTemplate('tmpl-1', 'Docker-1'),
        createMockDockerTemplate('tmpl-2', 'Docker-2'),
      ];
      mockDockerService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();

      expect(mockDockerService.getTemplates).toHaveBeenCalled();
    });

    it('should filter only docker templates with template_type "docker"', () => {
      const mixedTemplates = [
        createMockDockerTemplate('tmpl-1', 'Docker-1'),
        { ...createMockDockerTemplate('tmpl-2', 'Other'), template_type: 'vpcs' },
      ];
      mockDockerService.getTemplates.mockReturnValue(of(mixedTemplates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.dockerTemplates.length).toBe(1);
      expect(fixture.componentInstance.dockerTemplates[0].name).toBe('Docker-1');
    });

    it('should exclude builtin templates', () => {
      const templates = [
        createMockDockerTemplate('tmpl-1', 'Builtin-Docker', true),
        createMockDockerTemplate('tmpl-2', 'User-Docker', false),
      ];
      mockDockerService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.dockerTemplates.length).toBe(1);
      expect(fixture.componentInstance.dockerTemplates[0].name).toBe('User-Docker');
    });
  });

  describe('onDeleteEvent', () => {
    it('should call getTemplates when delete event is emitted', () => {
      const getTemplatesSpy = vi.spyOn(fixture.componentInstance, 'getTemplates');

      fixture.componentInstance.onDeleteEvent();

      expect(getTemplatesSpy).toHaveBeenCalled();
    });
  });

  describe('copyTemplate', () => {
    it('should navigate to copy template route', () => {
      fixture.componentInstance.controller = createMockController();

      const template = createMockDockerTemplate('tmpl-1', 'Docker-1');
      fixture.componentInstance.copyTemplate(template);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        1,
        'preferences',
        'docker',
        'templates',
        'tmpl-1',
        'copy',
      ]);
    });
  });

  describe('Template Rendering', () => {
    it('should show empty templates list when no templates exist', () => {
      mockDockerService.getTemplates.mockReturnValue(of([]));
      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const emptyListEl = fixture.nativeElement.querySelector('app-empty-templates-list');
      expect(emptyListEl).toBeTruthy();
    });

    it('should display docker templates in list when templates exist', () => {
      const templates = [createMockDockerTemplate('tmpl-1', 'Docker-1')];
      mockDockerService.getTemplates.mockReturnValue(of(templates));
      fixture.componentInstance.controller = createMockController();

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.docker-templates__list-item');
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toContain('Docker-1');
    });

    it('should display back button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector('.docker-templates__back-btn');
      expect(backBtn).toBeTruthy();
    });

    it('should display add button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const addBtn = fixture.nativeElement.querySelector('.docker-templates__add-btn');
      expect(addBtn).toBeTruthy();
    });
  });
});
