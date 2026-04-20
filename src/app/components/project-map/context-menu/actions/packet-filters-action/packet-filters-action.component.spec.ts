import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PacketFiltersActionComponent } from './packet-filters-action.component';
import { PacketFiltersDialogComponent } from '../../../packet-capturing/packet-filters/packet-filters.component';
import { DialogConfigService } from '@services/dialog-config.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Link } from '@models/link';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('PacketFiltersActionComponent', () => {
  let fixture: ComponentFixture<PacketFiltersActionComponent>;
  let mockDialog: any;
  let mockDialogConfig: any;
  let mockDialogRef: any;

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

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      link_id: 'link-1',
      project_id: 'project-1',
      ...overrides,
    } as Link);

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: {},
      afterClosed: vi.fn().mockReturnValue(of(undefined)),
    };

    mockDialogConfig = {
      openConfig: vi.fn().mockReturnValue({
        autoFocus: false,
        disableClose: false,
        panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      }),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    await TestBed.configureTestingModule({
      imports: [PacketFiltersActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: DialogConfigService, useValue: mockDialogConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PacketFiltersActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('rendering', () => {
    it('should display "Packet filters" text in button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.textContent).toContain('Packet filters');
    });

    it('should display filter icon in button', () => {
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('filter_list');
    });
  });

  describe('openPacketFilters', () => {
    it('should call dialogConfig.openConfig with packetFilters and correct overrides', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.componentInstance.openPacketFilters();

      expect(mockDialogConfig.openConfig).toHaveBeenCalledWith('packetFilters', {
        autoFocus: false,
        disableClose: false,
      });
    });

    it('should open PacketFiltersDialogComponent dialog', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.componentInstance.openPacketFilters();

      expect(mockDialog.open).toHaveBeenCalledWith(
        PacketFiltersDialogComponent,
        expect.objectContaining({
          autoFocus: false,
          disableClose: false,
        })
      );
    });

    it('should pass controller to dialog instance', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.componentInstance.openPacketFilters();

      expect(mockDialogRef.componentInstance.controller).toBe(mockController);
    });

    it('should pass project to dialog instance', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.componentInstance.openPacketFilters();

      expect(mockDialogRef.componentInstance.project).toBe(mockProject);
    });

    it('should pass link to dialog instance', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.componentInstance.openPacketFilters();

      expect(mockDialogRef.componentInstance.link).toBe(mockLink);
    });
  });

  describe('button click', () => {
    it('should open packet filters dialog when button is clicked', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });
});
