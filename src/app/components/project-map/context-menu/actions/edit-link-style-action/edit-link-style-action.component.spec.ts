import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { EditLinkStyleActionComponent } from './edit-link-style-action.component';
import { LinkStyleEditorDialogComponent } from '../../../drawings-editors/link-style-editor/link-style-editor.component';
import { DialogConfigService } from '@services/dialog-config.service';
import { ToasterService } from '@services/toaster.service';
import { LinkService } from '@services/link.service';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../../../cartography/events/links-event-source';
import { LinkToMapLinkConverter } from '../../../../../cartography/converters/map/link-to-map-link-converter';
import { NonNegativeValidator } from '../../../../../validators/non-negative-validator';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Link } from '@models/link';
import { LinkStyle } from '@models/link-style';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditLinkStyleActionComponent', () => {
  let fixture: ComponentFixture<EditLinkStyleActionComponent>;
  let mockDialogOpen: any;
  let mockDialogConfig: any;
  let mockDialogRef: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    authToken: 'token',
    status: 'running',
    tokenExpired: false,
  };

  const mockProject: Project = {
    auto_close: false,
    auto_open: false,
    auto_start: false,
    drawing_grid_size: 25,
    filename: '/path/to/project.gns3',
    grid_size: 25,
    name: 'Test Project',
    path: '/path/to',
    project_id: 'project-1',
    scene_height: 1000,
    scene_width: 1000,
    status: 'opened',
    readonly: false,
    show_interface_labels: false,
    show_layers: true,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
  };

  const createMockLink = (linkId: string): Link => ({
    link_id: linkId,
    project_id: 'project-1',
    link_type: 'ethernet',
    nodes: [],
    capture_file_name: '',
    capture_file_path: '',
    capturing: false,
    suspend: false,
    distance: 100,
    length: 100,
    source: null as any,
    target: null as any,
    x: 0,
    y: 0,
    link_style: {
      color: '#000000',
      width: 2,
      type: 1,
      link_type: 'straight',
    } as LinkStyle,
  });

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: {},
      close: vi.fn(),
      afterClosed: vi.fn(),
    };

    mockDialogOpen = vi.fn().mockReturnValue(mockDialogRef);

    mockDialogConfig = {
      openConfig: vi.fn().mockReturnValue({
        autoFocus: false,
        disableClose: false,
        panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      }),
    };

    const mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    const mockLinkService = {
      updateLinkStyle: vi.fn(),
    };

    const mockLinksDataSource = {
      update: vi.fn(),
    };

    const mockLinksEventSource = {
      edited: { next: vi.fn() },
    };

    const mockLinkToMapLink = {
      convert: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditLinkStyleActionComponent, MatIconModule, MatMenuModule],
    })
      .overrideProvider(MatDialog, { useValue: { open: mockDialogOpen } })
      .overrideProvider(DialogConfigService, { useValue: mockDialogConfig })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .overrideProvider(LinkService, { useValue: mockLinkService })
      .overrideProvider(LinksDataSource, { useValue: mockLinksDataSource })
      .overrideProvider(LinksEventSource, { useValue: mockLinksEventSource })
      .overrideProvider(LinkToMapLinkConverter, { useValue: mockLinkToMapLink })
      .overrideProvider(NonNegativeValidator, { useValue: new NonNegativeValidator() })
      .compileComponents();

    fixture = TestBed.createComponent(EditLinkStyleActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('button rendering', () => {
    it('should render Edit style button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Edit style');
    });

    it('should render style icon', () => {
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toContain('style');
    });
  });

  describe('editStyle', () => {
    it('should call dialogConfig.openConfig with linkStyleEditor and correct overrides', () => {
      const link = createMockLink('link-1');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      fixture.componentInstance.editStyle();

      expect(mockDialogConfig.openConfig).toHaveBeenCalledWith('linkStyleEditor', {
        autoFocus: false,
        disableClose: false,
      });
    });

    it('should open LinkStyleEditorDialogComponent dialog', () => {
      const link = createMockLink('link-1');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      fixture.componentInstance.editStyle();

      expect(mockDialogOpen).toHaveBeenCalledWith(
        LinkStyleEditorDialogComponent,
        expect.objectContaining({
          autoFocus: false,
          disableClose: false,
        })
      );
    });

    it('should pass controller to dialog', () => {
      const link = createMockLink('link-1');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      fixture.componentInstance.editStyle();

      expect(mockDialogRef.componentInstance.controller).toBe(mockController);
    });

    it('should pass project to dialog', () => {
      const link = createMockLink('link-1');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      fixture.componentInstance.editStyle();

      expect(mockDialogRef.componentInstance.project).toBe(mockProject);
    });

    it('should pass link to dialog', () => {
      const link = createMockLink('link-1');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      fixture.componentInstance.editStyle();

      expect(mockDialogRef.componentInstance.link).toBe(link);
    });

    it('should work when inputs are undefined', () => {
      fixture.componentRef.setInput('controller', undefined);
      fixture.componentRef.setInput('project', undefined);
      fixture.componentRef.setInput('link', undefined);
      fixture.detectChanges();

      expect(() => fixture.componentInstance.editStyle()).not.toThrow();
      expect(mockDialogOpen).toHaveBeenCalled();
    });
  });
});
