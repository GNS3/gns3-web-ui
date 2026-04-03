import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { EditConfigActionComponent } from './edit-config-action.component';
import { ConfigEditorDialogComponent } from '../../../node-editors/config-editor/config-editor.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Node } from '../../../../../cartography/models/node';

describe('EditConfigActionComponent', () => {
  let fixture: ComponentFixture<EditConfigActionComponent>;
  let component: EditConfigActionComponent;
  let mockDialog: MatDialog;
  let mockDialogRef: MatDialogRef<ConfigEditorDialogComponent>;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    authToken: 'token',
    location: 'local',
    host: 'localhost',
    port: 8080,
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
    status: 'stopped',
  };

  const createMockProject = (): Project =>
    ({
      project_id: 'test-project-id',
      name: 'Test Project',
      path: '/path/to/project',
    }) as Project;

  const createMockNode = (nodeType: string): Node =>
    ({
      node_id: 'test-node-id',
      name: 'Test Node',
      node_type: nodeType,
    }) as Node;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
      componentInstance: {},
    } as any;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        EditConfigActionComponent,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDialogModule,
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(EditConfigActionComponent);
    component = fixture.componentInstance;
  });

  describe('button visibility', () => {
    it('should show button when node type is vpcs', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', createMockNode('vpcs'));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Edit config');
    });

    it('should show button when node type is iou', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', createMockNode('iou'));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
    });

    it('should show button when node type is dynamips', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', createMockNode('dynamips'));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
    });

    it('should hide button when node type is not vpcs, iou, or dynamips', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', createMockNode('qemu'));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });

    it('should hide button when node is undefined', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', undefined);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });
  });

  describe('editConfig()', () => {
    it('should open ConfigEditorDialog when editConfig is called', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', createMockNode('vpcs'));
      fixture.detectChanges();

      component.editConfig();

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfigEditorDialogComponent,
        expect.objectContaining({
          panelClass: ['base-dialog-panel', 'edit-config-action-dialog-panel'],
          autoFocus: false,
          disableClose: false,
        }),
      );
    });

    it('should pass controller to dialog component instance', () => {
      const controller = mockController;
      fixture.componentRef.setInput('controller', controller);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', createMockNode('vpcs'));
      fixture.detectChanges();

      component.editConfig();

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfigEditorDialogComponent,
        expect.objectContaining({
          panelClass: ['base-dialog-panel', 'edit-config-action-dialog-panel'],
          autoFocus: false,
          disableClose: false,
        }),
      );
      expect(mockDialogRef.componentInstance.controller).toBe(controller);
    });

    it('should pass project to dialog component instance', () => {
      const project = createMockProject();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', project);
      fixture.componentRef.setInput('node', createMockNode('vpcs'));
      fixture.detectChanges();

      component.editConfig();

      expect(mockDialogRef.componentInstance.project).toBe(project);
    });

    it('should pass node to dialog component instance', () => {
      const node = createMockNode('vpcs');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', createMockProject());
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      component.editConfig();

      expect(mockDialogRef.componentInstance.node).toBe(node);
    });
  });
});
