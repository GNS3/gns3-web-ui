import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LinkStyleEditorDialogComponent } from './link-style-editor.component';
import { Link } from '@models/link';
import { LinkStyle } from '@models/link-style';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { LinkService } from '@services/link.service';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../../cartography/events/links-event-source';
import { LinkToMapLinkConverter } from '../../../../cartography/converters/map/link-to-map-link-converter';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { StyleTranslator } from '../../../../cartography/widgets/links/style-translator';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

describe('LinkStyleEditorDialogComponent', () => {
  let component: LinkStyleEditorDialogComponent;
  let fixture: ComponentFixture<LinkStyleEditorDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockToasterService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };
  let mockLinkService: { updateLinkStyle: ReturnType<typeof vi.fn> };
  let mockLinksDataSource: { update: ReturnType<typeof vi.fn> };
  let mockLinksEventSource: { edited: { next: ReturnType<typeof vi.fn> } };
  let mockLinkToMapLink: { convert: ReturnType<typeof vi.fn> };
  let mockChangeDetectorRef: { markForCheck: ReturnType<typeof vi.fn> };

  const mockController: Controller = {
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

  const mockProject: Project = {
    project_id: 'proj-1',
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

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      link_id: 'link-1',
      project_id: 'proj-1',
      link_type: 'ethernet',
      link_style: { color: '#000000', width: 2, type: 1 } as LinkStyle,
      ...overrides,
    } as Link);

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDialogRef = { close: vi.fn() };
    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };
    mockLinkService = { updateLinkStyle: vi.fn() };
    mockLinksDataSource = { update: vi.fn() };
    mockLinksEventSource = { edited: { next: vi.fn() } };
    mockLinkToMapLink = { convert: vi.fn() };
    mockChangeDetectorRef = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        LinkStyleEditorDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: LinkService, useValue: mockLinkService },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: LinksEventSource, useValue: mockLinksEventSource },
        { provide: LinkToMapLinkConverter, useValue: mockLinkToMapLink },
        { provide: NonNegativeValidator, useValue: new NonNegativeValidator() },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        UntypedFormBuilder,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkStyleEditorDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.project = mockProject;
    component.link = createMockLink();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with required controls', () => {
      expect(component.formGroup.contains('color')).toBe(true);
      expect(component.formGroup.contains('width')).toBe(true);
      expect(component.formGroup.contains('type')).toBe(true);
      expect(component.formGroup.contains('linkType')).toBe(true);
      expect(component.formGroup.contains('bezierCurviness')).toBe(true);
      expect(component.formGroup.contains('flowchartRoundness')).toBe(true);
    });

    it('should set color control as required', () => {
      const colorControl = component.formGroup.get('color');
      colorControl?.setValue('');
      expect(colorControl?.hasError('required')).toBe(true);
    });

    it('should set width control as required and non-negative', () => {
      const widthControl = component.formGroup.get('width');
      widthControl?.setValue('');
      expect(widthControl?.hasError('required')).toBe(true);
    });

    it('should set type control as required', () => {
      const typeControl = component.formGroup.get('type');
      typeControl?.setValue('');
      expect(typeControl?.hasError('required')).toBe(true);
    });

    it('should set linkType control as required', () => {
      const linkTypeControl = component.formGroup.get('linkType');
      linkTypeControl?.setValue('');
      expect(linkTypeControl?.hasError('required')).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should set default color #000000 for ethernet link when no color exists', () => {
      component.link = createMockLink({ link_type: 'ethernet', link_style: {} as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('color')?.value).toBe('#000000');
    });

    it('should set default color #800000 for serial link when no color exists', () => {
      component.link = createMockLink({ link_type: 'serial', link_style: {} as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('color')?.value).toBe('#800000');
    });

    it('should preserve existing link color when set', () => {
      component.link = createMockLink({ link_style: { color: '#ff0000', width: 3 } as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('color')?.value).toBe('#ff0000');
    });

    it('should set default width of 2 when not specified', () => {
      component.link = createMockLink({ link_style: {} as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('width')?.value).toBe(2);
    });

    it('should preserve existing link width when set', () => {
      component.link = createMockLink({ link_style: { width: 5 } as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('width')?.value).toBe(5);
    });

    it('should set default border type when not specified', () => {
      component.link = createMockLink({ link_style: {} as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('type')?.value).toBe('Solid');
    });

    it('should map valid border type index to label', () => {
      component.link = createMockLink({ link_style: { type: 0 } as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('type')?.value).toBe('Invisible');
    });

    it('should use default border type for invalid type index', () => {
      component.link = createMockLink({ link_style: { type: 99 } as LinkStyle });
      component.ngOnInit();
      expect(component.formGroup.get('type')?.value).toBe('Solid');
    });
  });

  describe('isCurvinessSelected', () => {
    it('should return true for Bezier link type', () => {
      component.formGroup.get('linkType')?.setValue('Bezier');
      expect(component.isCurvinessSelected()).toBe(true);
    });

    it('should return true for StateMachine link type', () => {
      component.formGroup.get('linkType')?.setValue('StateMachine');
      expect(component.isCurvinessSelected()).toBe(true);
    });

    it('should return false for Straight link type', () => {
      component.formGroup.get('linkType')?.setValue('Straight');
      expect(component.isCurvinessSelected()).toBe(false);
    });

    it('should return false for Flowchart link type', () => {
      component.formGroup.get('linkType')?.setValue('Flowchart');
      expect(component.isCurvinessSelected()).toBe(false);
    });

    it('should return false for Freeform link type', () => {
      component.formGroup.get('linkType')?.setValue('Freeform');
      expect(component.isCurvinessSelected()).toBe(false);
    });
  });

  describe('isFlowchartSelected', () => {
    it('should return true for Flowchart link type', () => {
      component.formGroup.get('linkType')?.setValue('Flowchart');
      expect(component.isFlowchartSelected()).toBe(true);
    });

    it('should return false for Bezier link type', () => {
      component.formGroup.get('linkType')?.setValue('Bezier');
      expect(component.isFlowchartSelected()).toBe(false);
    });

    it('should return false for Straight link type', () => {
      component.formGroup.get('linkType')?.setValue('Straight');
      expect(component.isFlowchartSelected()).toBe(false);
    });
  });

  describe('curvinessMin getter', () => {
    it('should return bezier curviness min for Bezier link type', () => {
      component.formGroup.get('linkType')?.setValue('Bezier');
      expect(component.curvinessMin).toBe(StyleTranslator.BEZIER_CURVINESS_MIN);
    });

    it('should return state machine curviness min for StateMachine link type', () => {
      component.formGroup.get('linkType')?.setValue('StateMachine');
      expect(component.curvinessMin).toBe(StyleTranslator.STATE_MACHINE_CURVINESS_MIN);
    });
  });

  describe('curvinessMax getter', () => {
    it('should return bezier curviness max for Bezier link type', () => {
      component.formGroup.get('linkType')?.setValue('Bezier');
      expect(component.curvinessMax).toBe(StyleTranslator.BEZIER_CURVINESS_MAX);
    });

    it('should return state machine curviness max for StateMachine link type', () => {
      component.formGroup.get('linkType')?.setValue('StateMachine');
      expect(component.curvinessMax).toBe(StyleTranslator.STATE_MACHINE_CURVINESS_MAX);
    });
  });

  describe('curvinessStep getter', () => {
    it('should return bezier curviness step for Bezier link type', () => {
      component.formGroup.get('linkType')?.setValue('Bezier');
      expect(component.curvinessStep).toBe(StyleTranslator.BEZIER_CURVINESS_STEP);
    });

    it('should return state machine curviness step for StateMachine link type', () => {
      component.formGroup.get('linkType')?.setValue('StateMachine');
      expect(component.curvinessStep).toBe(StyleTranslator.STATE_MACHINE_CURVINESS_STEP);
    });
  });

  describe('onNoClick', () => {
    it('should close dialog without changes', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onYesClick', () => {
    const createUpdatedLink = (link: Link): Link =>
      ({
        ...link,
        link_style: {
          ...link.link_style,
          link_type: 'bezier',
          bezier_curviness: StyleTranslator.BEZIER_CURVINESS_DEFAULT,
          flowchart_roundness: StyleTranslator.FLOWCHART_ROUNDNESS_DEFAULT,
        },
      } as Link);

    beforeEach(() => {
      component.link = createMockLink();
      component.ngOnInit();
    });

    it('should not call updateLinkStyle when form is invalid', () => {
      component.formGroup.get('color')?.setValue('');
      component.onYesClick();
      expect(mockLinkService.updateLinkStyle).not.toHaveBeenCalled();
    });

    it('should show error toast when form is invalid', () => {
      component.formGroup.get('color')?.setValue('');
      component.onYesClick();
      expect(mockToasterService.error).toHaveBeenCalledWith('Entered data is incorrect');
    });

    it('should call updateLinkStyle when form is valid', () => {
      mockLinkService.updateLinkStyle.mockReturnValue(of(createUpdatedLink(component.link)));
      component.onYesClick();
      expect(mockLinkService.updateLinkStyle).toHaveBeenCalled();
    });

    it('should update link style with form values', () => {
      const updatedLink = createUpdatedLink(component.link);
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.formGroup.get('color')?.setValue('#ff0000');
      component.formGroup.get('width')?.setValue(4);
      component.onYesClick();
      expect(component.link.link_style?.color).toBe('#ff0000');
      expect(component.link.link_style?.width).toBe(4);
    });

    it('should close dialog on successful update', () => {
      const updatedLink = createUpdatedLink(component.link);
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.onYesClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast on successful update', () => {
      const updatedLink = createUpdatedLink(component.link);
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.onYesClick();
      expect(mockToasterService.success).toHaveBeenCalledWith('Link updated');
    });

    it('should update linksDataSource on successful update', () => {
      const updatedLink = createUpdatedLink(component.link);
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.onYesClick();
      expect(mockLinksDataSource.update).toHaveBeenCalledWith(updatedLink);
    });

    it('should emit edited event on linksEventSource on successful update', () => {
      const updatedLink = createUpdatedLink(component.link);
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.onYesClick();
      expect(mockLinksEventSource.edited.next).toHaveBeenCalled();
    });

    it('should show error toast when update fails', () => {
      mockLinkService.updateLinkStyle.mockReturnValue(throwError(() => new Error('API Error')));
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.onYesClick();
      expect(mockToasterService.error).toHaveBeenCalledWith('API Error');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should not close dialog when update fails', () => {
      mockLinkService.updateLinkStyle.mockReturnValue(throwError(() => new Error('API Error')));
      component.onYesClick();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should clear control_offset for non-freeform link types', () => {
      component.formGroup.get('linkType')?.setValue('Straight');
      const updatedLink = createUpdatedLink(component.link);
      updatedLink.link_style!.link_type = 'straight';
      updatedLink.link_style!.control_offset = undefined;
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.onYesClick();
      expect(component.link.link_style?.control_offset).toBeUndefined();
    });

    it('should preserve control_offset for freeform link types', () => {
      component.formGroup.get('linkType')?.setValue('Freeform');
      const existingOffset: [number, number] = [10, 20];
      component.link.link_style!.control_offset = existingOffset;
      const updatedLink = createUpdatedLink(component.link);
      updatedLink.link_style!.link_type = 'freeform';
      updatedLink.link_style!.control_offset = undefined;
      mockLinkService.updateLinkStyle.mockReturnValue(of(updatedLink));
      component.onYesClick();
      expect(component.link.link_style?.control_offset).toEqual(existingOffset);
    });
  });

  describe('borderTypes', () => {
    it('should contain expected border types', () => {
      expect(component.borderTypes).toEqual(['Invisible', 'Solid', 'Dash', 'Dot', 'Dash Dot', 'Dash Dot Dot']);
    });
  });

  describe('linkTypes', () => {
    it('should contain expected link types', () => {
      expect(component.linkTypes).toEqual(['Straight', 'Bezier', 'Flowchart', 'StateMachine', 'Freeform']);
    });
  });
});
