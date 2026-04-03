import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { SnapshotDialogComponent } from './snapshot-dialog.component';
import { SnapshotService } from '@services/snapshot.service';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { ToasterService } from '@services/toaster.service';
import { Snapshot } from '@models/snapshot';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SnapshotDialogComponent', () => {
  let component: SnapshotDialogComponent;
  let fixture: ComponentFixture<SnapshotDialogComponent>;
  let mockSnapshotService: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockProject: Project;

  const createMockSnapshot = (id: string, name: string): Snapshot =>
    ({
      snapshot_id: id,
      name,
      created_at: Date.now(),
      project_id: 'proj-1',
    }) as Snapshot;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockSnapshotService = {
      list: vi.fn().mockReturnValue(of([])),
      create: vi.fn().mockReturnValue(of({})),
      restore: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialogRef = {
      afterClosed: () => of(null),
      close: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      protocol: 'http:',
      status: 'running',
      authToken: '',
      path: '',
      ubridge_path: '',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockProject = {
      project_id: 'proj-1',
      name: 'Test Project',
      status: 'opened',
      filename: 'test.gns3',
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
      imports: [SnapshotDialogComponent, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController, project: mockProject } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: SnapshotService, useValue: mockSnapshotService },
        { provide: ProgressDialogService, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(null), close: vi.fn() }) } },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with dialog data', () => {
      expect(component.controller).toEqual(mockController);
      expect(component.project).toEqual(mockProject);
    });

    it('should load snapshots on init', () => {
      expect(mockSnapshotService.list).toHaveBeenCalledWith(mockController, mockProject.project_id);
    });

    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual(['name', 'created_at', 'actions']);
    });
  });

  describe('filteredSnapshots computed', () => {
    it('should return all snapshots when searchText is empty', () => {
      const snapshots = [
        createMockSnapshot('1', 'Snapshot A'),
        createMockSnapshot('2', 'Snapshot B'),
      ];
      component.snapshots.set(snapshots);
      component.searchText.set('');

      expect(component.filteredSnapshots()).toHaveLength(2);
    });

    it('should filter snapshots by name case-insensitively', () => {
      const snapshots = [
        createMockSnapshot('1', 'Snapshot A'),
        createMockSnapshot('2', 'Snapshot B'),
        createMockSnapshot('3', 'snapshot a'),
      ];
      component.snapshots.set(snapshots);
      component.searchText.set('snapshot a');

      const result = component.filteredSnapshots();
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.snapshot_id)).toContain('1');
      expect(result.map((s) => s.snapshot_id)).toContain('3');
    });

    it('should return empty array when no snapshots match', () => {
      component.snapshots.set([createMockSnapshot('1', 'Snapshot A')]);
      component.searchText.set('nonexistent');

      expect(component.filteredSnapshots()).toHaveLength(0);
    });

    it('should return empty array when snapshots is empty', () => {
      component.snapshots.set([]);
      component.searchText.set('');

      expect(component.filteredSnapshots()).toHaveLength(0);
    });
  });

  describe('prototype methods', () => {
    it('should have openCreateDialog method', () => {
      expect(typeof (SnapshotDialogComponent.prototype as any).openCreateDialog).toBe('function');
    });

    it('should have restoreSnapshot method', () => {
      expect(typeof (SnapshotDialogComponent.prototype as any).restoreSnapshot).toBe('function');
    });

    it('should have deleteSnapshot method', () => {
      expect(typeof (SnapshotDialogComponent.prototype as any).deleteSnapshot).toBe('function');
    });
  });
});
