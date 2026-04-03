import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EditTextActionComponent } from './edit-text-action.component';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Label } from '../../../../../cartography/models/label';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditTextActionComponent', () => {
  let fixture: ComponentFixture<EditTextActionComponent>;

  const mockController: Controller = {
    id: 1,
    authToken: 'token',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  };

  const mockProject: Project = {
    project_id: 'project-1',
    name: 'Test Project',
    status: 'opened',
    path: '/path/to/project',
  } as Project;

  const createMockDrawing = (): Drawing =>
    ({
      drawing_id: 'drawing-1',
      project_id: 'project-1',
      rotation: 0,
      svg: '<svg></svg>',
      locked: false,
      x: 100,
      y: 200,
      z: 1,
      element: { type: 'rect' } as any,
    }) as unknown as Drawing;

  const createMockNode = (): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'vpcs',
      project_id: 'project-1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 50,
      x: 100,
      y: 200,
      z: 0,
      label: { text: '', x: 0, y: 0, style: '', rotation: 0 },
      locked: false,
      first_port_name: '',
      port_name_format: '',
      port_segment_size: 1,
      ports: [],
      properties: {} as any,
      symbol: '',
      symbol_url: '',
      console: 0,
      console_auto_start: false,
      console_type: '',
      node_directory: '',
    }) as unknown as Node;

  const createMockLabel = (): Label =>
    ({
      rotation: 0,
      style: '{}',
      text: 'Test Label',
      x: 100,
      y: 200,
    }) as unknown as Label;

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      link_id: 'link-1',
      project_id: 'project-1',
      ...overrides,
    }) as Link;

  const createMockLinkNode = (overrides: Partial<LinkNode> = {}): LinkNode =>
    ({
      id: 'link-node-1',
      link_id: 'link-1',
      node_id: 'node-1',
      adapter_number: 0,
      port_number: 0,
      ...overrides,
    }) as LinkNode;

  let mockDialogRef: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: {},
      afterClosed: vi.fn().mockReturnValue(of(undefined)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    await TestBed.configureTestingModule({
      imports: [EditTextActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(EditTextActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('rendering', () => {
    it('should display "Edit text" text in button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.textContent).toContain('Edit text');
    });

    it('should display text_format icon in button', () => {
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('text_format');
    });
  });

  describe('editText', () => {
    it('should exist as a method on the component', () => {
      expect(typeof fixture.componentInstance.editText).toBe('function');
    });

    it('should open TextEditorDialogComponent when called', () => {
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should pass controller to dialog instance', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.controller).toBe(mockController);
    });

    it('should pass project to dialog instance', () => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.project).toBe(mockProject);
    });

    it('should pass drawing to dialog instance', () => {
      const drawing = createMockDrawing();
      fixture.componentRef.setInput('drawing', drawing);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.drawing).toBe(drawing);
    });

    it('should pass node to dialog instance', () => {
      const node = createMockNode();
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.node).toBe(node);
    });

    it('should pass label to dialog instance', () => {
      const label = createMockLabel();
      fixture.componentRef.setInput('label', label);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.label).toBe(label);
    });

    it('should pass link to dialog instance', () => {
      const link = createMockLink();
      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.link).toBe(link);
    });

    it('should pass linkNode to dialog instance', () => {
      const linkNode = createMockLinkNode();
      fixture.componentRef.setInput('linkNode', linkNode);
      fixture.detectChanges();

      fixture.componentInstance.editText();

      expect(mockDialogRef.componentInstance.linkNode).toBe(linkNode);
    });

    it('should be called when button is clicked', () => {
      fixture.detectChanges();

      const editTextSpy = vi.spyOn(fixture.componentInstance, 'editText');
      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(editTextSpy).toHaveBeenCalled();
    });
  });
});
