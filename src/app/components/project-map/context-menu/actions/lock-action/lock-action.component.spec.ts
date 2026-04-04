import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LockActionComponent, LockConfirmDialogComponent } from './lock-action.component';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { ProjectService } from '@services/project.service';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { of } from 'rxjs';

describe('LockActionComponent', () => {
  let component: LockActionComponent;
  let fixture: ComponentFixture<LockActionComponent>;
  let mockDialog: MatDialog;
  let mockDialogRef: MatDialogRef<LockConfirmDialogComponent>;
  let mockNodesDataSource: NodesDataSource;
  let mockDrawingsDataSource: DrawingsDataSource;
  let mockNodeService: NodeService;
  let mockDrawingService: DrawingService;
  let mockProjectService: ProjectService;

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

  const createMockNode = (locked: boolean): Node => ({ locked } as Node);
  const createMockDrawing = (locked: boolean): Drawing => ({ locked } as Drawing);

  beforeEach(async () => {
    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(true)),
    } as any;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    mockNodesDataSource = {
      update: vi.fn(),
    } as any;

    mockDrawingsDataSource = {
      update: vi.fn(),
    } as any;

    mockNodeService = {
      updateNode: vi.fn().mockReturnValue(of({})),
    } as any;

    mockDrawingService = {
      update: vi.fn().mockReturnValue(of({})),
    } as any;

    mockProjectService = {
      projectUpdateLockIcon: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LockActionComponent, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .overrideProvider(NodesDataSource, { useValue: mockNodesDataSource })
      .overrideProvider(DrawingsDataSource, { useValue: mockDrawingsDataSource })
      .overrideProvider(NodeService, { useValue: mockNodeService })
      .overrideProvider(DrawingService, { useValue: mockDrawingService })
      .overrideProvider(ProjectService, { useValue: mockProjectService })
      .compileComponents();

    fixture = TestBed.createComponent(LockActionComponent);
    component = fixture.componentInstance;
  });

  describe('command label', () => {
    it('should show "Lock item" when one unlocked node is selected', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);

      component.ngOnChanges();

      expect(component.command).toBe('Lock item');
    });

    it('should show "Unlock item" when one locked node is selected', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(true)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);

      component.ngOnChanges();

      expect(component.command).toBe('Unlock item');
    });

    it('should show "Lock item" when one unlocked drawing is selected', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [createMockDrawing(false)]);
      fixture.componentRef.setInput('controller', mockController);

      component.ngOnChanges();

      expect(component.command).toBe('Lock item');
    });

    it('should show "Unlock item" when one locked drawing is selected', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [createMockDrawing(true)]);
      fixture.componentRef.setInput('controller', mockController);

      component.ngOnChanges();

      expect(component.command).toBe('Unlock item');
    });

    it('should show "Lock/unlock items" when multiple nodes are selected', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false), createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);

      component.ngOnChanges();

      expect(component.command).toBe('Lock/unlock items');
    });

    it('should show "Lock/unlock items" when nodes and drawings are both selected', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false)]);
      fixture.componentRef.setInput('drawings', [createMockDrawing(false)]);
      fixture.componentRef.setInput('controller', mockController);

      component.ngOnChanges();

      expect(component.command).toBe('Lock/unlock items');
    });
  });

  describe('lock()', () => {
    it('should directly perform lock/unlock for single node without dialog', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      component.ngOnChanges();

      component.lock();

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog when multiple items are selected', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false), createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      component.ngOnChanges();

      component.lock();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should open dialog with correct data when locking multiple items', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false), createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      component.ngOnChanges();

      component.lock();

      expect(mockDialog.open).toHaveBeenCalledWith(
        LockConfirmDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Confirm Lock All',
            message: expect.stringContaining('2 items'),
            action: 'lock',
          }),
        })
      );
    });

    it('should perform lock/unlock after dialog confirmation', () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false), createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      component.ngOnChanges();

      component.lock();

      expect(mockDialogRef.afterClosed).toHaveBeenCalled();
    });
  });

  describe('performLockUnlock()', () => {
    it('should toggle lock state on all nodes', async () => {
      const mockNode = createMockNode(false);
      fixture.componentRef.setInput('nodes', [mockNode]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);

      await component.performLockUnlock();

      expect(mockNode.locked).toBe(true);
      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should toggle lock state on all drawings', async () => {
      const mockDrawing = createMockDrawing(false);
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [mockDrawing]);
      fixture.componentRef.setInput('controller', mockController);

      await component.performLockUnlock();

      expect(mockDrawing.locked).toBe(true);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, mockDrawing);
    });

    it('should update nodesDataSource after node update', async () => {
      const mockNode = createMockNode(false);
      fixture.componentRef.setInput('nodes', [mockNode]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);

      await component.performLockUnlock();

      expect(mockNodesDataSource.update).toHaveBeenCalled();
    });

    it('should update drawingsDataSource after drawing update', async () => {
      const mockDrawing = createMockDrawing(false);
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', [mockDrawing]);
      fixture.componentRef.setInput('controller', mockController);

      await component.performLockUnlock();

      expect(mockDrawingsDataSource.update).toHaveBeenCalled();
    });

    it('should update project lock icon', async () => {
      fixture.componentRef.setInput('nodes', [createMockNode(false)]);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);

      await component.performLockUnlock();

      expect(mockProjectService.projectUpdateLockIcon).toHaveBeenCalled();
    });
  });
});

describe('LockConfirmDialogComponent', () => {
  let dialogFixture: ComponentFixture<LockConfirmDialogComponent>;
  let mockDialogRef: MatDialogRef<LockConfirmDialogComponent>;

  const mockData = {
    title: 'Confirm Lock All',
    message: 'Are you sure you want to lock 2 items?',
    action: 'lock',
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LockConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    dialogFixture = TestBed.createComponent(LockConfirmDialogComponent);
    dialogFixture.detectChanges();
  });

  it('should display the title from data', () => {
    const title = dialogFixture.nativeElement.querySelector('h1');
    expect(title.textContent).toContain('Confirm Lock All');
  });

  it('should display the message from data', () => {
    const content = dialogFixture.nativeElement.querySelector('p');
    expect(content.textContent).toContain('Are you sure you want to lock 2 items?');
  });

  it('should display "Lock" button when action is lock', () => {
    const button = dialogFixture.nativeElement.querySelector('button[mat-raised-button]');
    expect(button.textContent).toContain('Lock');
  });

  it('should display "Unlock" button when action is unlock', () => {
    const unlockMockDialogRef = { close: vi.fn() } as any;
    const unlockData = { ...mockData, action: 'unlock' };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LockConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: unlockMockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: unlockData },
      ],
    }).compileComponents();

    const unlockFixture = TestBed.createComponent(LockConfirmDialogComponent);
    unlockFixture.detectChanges();

    const button = unlockFixture.nativeElement.querySelector('button[mat-raised-button]');
    expect(button.textContent).toContain('Unlock');

    unlockFixture.destroy();
  });

  it('should close dialog with false when Cancel is clicked', () => {
    const cancelButton = dialogFixture.nativeElement.querySelector('button[mat-button]');
    cancelButton.click();

    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when Lock/Unlock button is clicked', () => {
    const actionButton = dialogFixture.nativeElement.querySelector('button[mat-raised-button]');
    actionButton.click();

    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});
