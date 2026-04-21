import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { of, throwError } from 'rxjs';
import { DeleteActionComponent } from './delete-action.component';
import { ConfirmationBottomSheetComponent } from 'app/components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Link } from '../../../../../models/link';
import { Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { DrawingService } from '../../../../../services/drawing.service';
import { LinkService } from '../../../../../services/link.service';
import { LinkTypeCache } from '../../../../../services/link-type-cache';
import { ToasterService } from '../../../../../services/toaster.service';

describe('DeleteActionComponent', () => {
  let component: DeleteActionComponent;
  let fixture: ComponentFixture<DeleteActionComponent>;
  let mockBottomSheet: any;
  let mockNodesDataSource: any;
  let mockLinksDataSource: any;
  let mockDrawingsDataSource: any;
  let mockNodeService: any;
  let mockDrawingService: any;
  let mockLinkService: any;
  let mockToasterService: any;
  let bottomSheetRef: any;

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

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      locked: false,
      ...overrides,
    } as Node);

  const createMockDrawing = (overrides: Partial<Drawing> = {}): Drawing =>
    ({
      drawing_id: 'drawing-1',
      locked: false,
      ...overrides,
    } as Drawing);

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      link_id: 'link-1',
      project_id: 'proj-1',
      ...overrides,
    } as Link);

  beforeEach(async () => {
    vi.clearAllMocks();

    bottomSheetRef = {
      afterDismissed: vi.fn().mockReturnValue(of(false)),
    };

    mockBottomSheet = {
      open: vi.fn().mockReturnValue(bottomSheetRef),
    } as any;

    mockNodesDataSource = {
      remove: vi.fn(),
    } as any;

    mockLinksDataSource = {
      remove: vi.fn(),
    } as any;

    mockDrawingsDataSource = {
      remove: vi.fn(),
    } as any;

    mockNodeService = {
      delete: vi.fn().mockReturnValue(of({})),
    } as any;

    mockDrawingService = {
      delete: vi.fn().mockReturnValue(of({})),
    } as any;

    mockLinkService = {
      deleteLink: vi.fn().mockReturnValue(of({})),
    } as any;

    mockToasterService = {
      error: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DeleteActionComponent, MatButtonModule, MatIconModule, MatMenuModule, MatBottomSheetModule],
      providers: [
        { provide: MatBottomSheet, useValue: mockBottomSheet },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: NodeService, useValue: mockNodeService },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: LinkService, useValue: mockLinkService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('confirmDelete()', () => {
    it('should open confirmation bottom sheet', () => {
      component.confirmDelete();

      expect(mockBottomSheet.open).toHaveBeenCalledWith(ConfirmationBottomSheetComponent, {
        data: { message: 'Do you want to delete all selected objects?' },
        panelClass: 'confirmation-bottom-sheet',
      });
    });

    it('should call delete() when user confirms', () => {
      bottomSheetRef.afterDismissed.mockReturnValue(of(true));
      const deleteSpy = vi.spyOn(component, 'delete');

      component.confirmDelete();

      expect(deleteSpy).toHaveBeenCalled();
    });

    it('should not call delete() when user cancels', () => {
      bottomSheetRef.afterDismissed.mockReturnValue(of(false));
      const deleteSpy = vi.spyOn(component, 'delete');

      component.confirmDelete();

      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe('delete() - nodes', () => {
    it('should remove non-locked nodes from nodesDataSource', () => {
      const node = createMockNode({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockNodesDataSource.remove).toHaveBeenCalledWith(node);
    });

    it('should call nodeService.delete() for non-locked nodes', () => {
      const node = createMockNode({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockNodeService.delete).toHaveBeenCalledWith(mockController, node);
    });

    it('should show error and skip locked nodes', () => {
      const lockedNode = createMockNode({ locked: true, name: 'Locked Node' });
      fixture.componentRef.setInput('nodes', [lockedNode]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot delete locked node: Locked Node');
      expect(mockNodesDataSource.remove).not.toHaveBeenCalled();
      expect(mockNodeService.delete).not.toHaveBeenCalled();
    });

    it('should only process nodes when drawings and links are empty', () => {
      const node = createMockNode({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);

      component.delete();

      expect(mockNodesDataSource.remove).toHaveBeenCalled();
    });
  });

  describe('delete() - drawings', () => {
    it('should remove non-locked drawings from drawingsDataSource', () => {
      const drawing = createMockDrawing({ locked: false });
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [drawing]);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockDrawingsDataSource.remove).toHaveBeenCalledWith(drawing);
    });

    it('should call drawingService.delete() for non-locked drawings', () => {
      const drawing = createMockDrawing({ locked: false });
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [drawing]);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockDrawingService.delete).toHaveBeenCalledWith(mockController, drawing);
    });

    it('should show error and skip locked drawings', () => {
      const lockedDrawing = createMockDrawing({ locked: true });
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [lockedDrawing]);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot delete locked drawing');
      expect(mockDrawingsDataSource.remove).not.toHaveBeenCalled();
      expect(mockDrawingService.delete).not.toHaveBeenCalled();
    });
  });

  describe('delete() - links', () => {
    it('should only delete links when no nodes and no drawings exist', () => {
      const link = createMockLink();
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', [link]);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockLinksDataSource.remove).toHaveBeenCalledWith(link);
      expect(mockLinkService.deleteLink).toHaveBeenCalledWith(mockController, link);
    });

    it('should not delete links when nodes exist', () => {
      const node = createMockNode({ locked: false });
      const link = createMockLink();
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', [link]);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockLinksDataSource.remove).not.toHaveBeenCalled();
      expect(mockLinkService.deleteLink).not.toHaveBeenCalled();
    });

    it('should not delete links when drawings exist', () => {
      const drawing = createMockDrawing({ locked: false });
      const link = createMockLink();
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [drawing]);
      fixture.componentRef.setInput('links', [link]);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockLinksDataSource.remove).not.toHaveBeenCalled();
      expect(mockLinkService.deleteLink).not.toHaveBeenCalled();
    });

    it('should remove link from LinkTypeCache after deletion', () => {
      const link = createMockLink({ project_id: 'proj-1', link_id: 'link-1' });
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', [link]);
      fixture.componentRef.setInput('controller', mockController);
      const removeSpy = vi.spyOn(LinkTypeCache, 'remove');

      component.delete();

      expect(removeSpy).toHaveBeenCalledWith('proj-1', 'link-1');
    });
  });

  describe('delete() - mixed scenarios', () => {
    it('should delete both nodes and drawings when provided', () => {
      const node = createMockNode({ locked: false });
      const drawing = createMockDrawing({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', [drawing]);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockNodesDataSource.remove).toHaveBeenCalledWith(node);
      expect(mockDrawingsDataSource.remove).toHaveBeenCalledWith(drawing);
      expect(mockLinksDataSource.remove).not.toHaveBeenCalled();
    });

    it('should skip locked items but continue deleting unlocked ones', () => {
      const lockedNode = createMockNode({ locked: true, name: 'Locked' });
      const unlockedNode = createMockNode({ locked: false, name: 'Unlocked' });
      fixture.componentRef.setInput('nodes', [lockedNode, unlockedNode]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot delete locked node: Locked');
      expect(mockNodesDataSource.remove).toHaveBeenCalledWith(unlockedNode);
      expect(mockNodeService.delete).toHaveBeenCalledWith(mockController, unlockedNode);
    });
  });

  describe('error handling', () => {
    it('should display toaster error when nodeService.delete() fails', async () => {
      const mockError = {
        error: { message: 'Node not found' },
      };
      mockNodeService.delete.mockReturnValue(throwError(() => mockError));

      const node = createMockNode({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Node not found');
    });

    it('should display generic error message when nodeService.delete() fails without specific message', async () => {
      mockNodeService.delete.mockReturnValue(throwError(() => new Error()));

      const node = createMockNode({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to delete node');
    });

    it('should display toaster error when drawingService.delete() fails', async () => {
      const mockError = {
        error: { message: 'Drawing not found' },
      };
      mockDrawingService.delete.mockReturnValue(throwError(() => mockError));

      const drawing = createMockDrawing({ locked: false });
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [drawing]);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Drawing not found');
    });

    it('should display generic error message when drawingService.delete() fails without specific message', async () => {
      mockDrawingService.delete.mockReturnValue(throwError(() => new Error()));

      const drawing = createMockDrawing({ locked: false });
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [drawing]);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to delete drawing');
    });

    it('should display toaster error when linkService.deleteLink() fails', async () => {
      const mockError = {
        error: { message: 'Link not found' },
      };
      mockLinkService.deleteLink.mockReturnValue(throwError(() => mockError));

      const link = createMockLink();
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', [link]);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Link not found');
    });

    it('should display generic error message when linkService.deleteLink() fails without specific message', async () => {
      mockLinkService.deleteLink.mockReturnValue(throwError(() => new Error()));

      const link = createMockLink();
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', [link]);
      fixture.componentRef.setInput('controller', mockController);

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to delete link');
    });

    it('should call markForCheck after node deletion error', async () => {
      mockNodeService.delete.mockReturnValue(throwError(() => new Error('Test error')));

      const node = createMockNode({ locked: false });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('links', []);
      fixture.componentRef.setInput('controller', mockController);

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.delete();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
