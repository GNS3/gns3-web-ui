import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { ToggleShowFiltersIconActionComponent } from './toggle-show-filters-icon-action.component';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { ToasterService } from '@services/toaster.service';
import { MapLinksDataSource } from '../../../../../cartography/datasources/map-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ToggleShowFiltersIconActionComponent', () => {
  let component: ToggleShowFiltersIconActionComponent;
  let fixture: ComponentFixture<ToggleShowFiltersIconActionComponent>;
  let mockLinkService: { updateLink: ReturnType<typeof vi.fn> };
  let mockLinksDataSource: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let mockMapLinksDataSource: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };

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

  const createMockLink = (show_filters_icon: boolean = true): Link => ({
    link_id: 'link-1',
    project_id: 'proj1',
    nodes: [],
    suspend: false,
    link_style: undefined,
    show_filters_icon,
    wireshark: false,
    distance: 100,
    capturing: false,
    capture_file_name: '',
    capture_file_path: '',
    link_type: 'ethernet',
    length: 100,
    source: null as any,
    target: null as any,
    x: 0,
    y: 0,
    filters: { bpf: [], corrupt: [], delay: [], frequency_drop: [], packet_loss: [] },
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockLinkService = { updateLink: vi.fn().mockReturnValue(of({})) };
    mockLinksDataSource = {
      get: vi.fn(),
      update: vi.fn(),
    };
    mockMapLinksDataSource = {
      get: vi.fn(),
      update: vi.fn(),
    };
    mockToasterService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatIconModule, MatMenuModule],
      providers: [
        { provide: LinkService, useValue: mockLinkService },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: MapLinksDataSource, useValue: mockMapLinksDataSource },
        { provide: ToasterService, useValue: mockToasterService },
        ChangeDetectorRef,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleShowFiltersIconActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    vi.useRealTimers();
  });

  describe('showFiltersIcon getter', () => {
    it('should return true when link is undefined', () => {
      mockLinksDataSource.get.mockReturnValue(undefined);

      fixture.componentRef.setInput('link', undefined);
      fixture.detectChanges();

      expect(component.showFiltersIcon).toBe(true);
    });

    it('should return true when link has show_filters_icon undefined', () => {
      const link = createMockLink();
      link.show_filters_icon = undefined as any;
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      expect(component.showFiltersIcon).toBe(true);
    });

    it('should return false when link has show_filters_icon false', () => {
      const link = createMockLink(false);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      expect(component.showFiltersIcon).toBe(false);
    });

    it('should return true when link has show_filters_icon true', () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      expect(component.showFiltersIcon).toBe(true);
    });

    it('should read from LinksDataSource to get latest state', () => {
      const inputLink = createMockLink(true);
      const dataSourceLink = createMockLink(false);
      mockLinksDataSource.get.mockReturnValue(dataSourceLink);

      fixture.componentRef.setInput('link', inputLink);
      fixture.detectChanges();

      expect(component.showFiltersIcon).toBe(false);
      expect(mockLinksDataSource.get).toHaveBeenCalledWith('link-1');
    });
  });

  describe('toggleShowFiltersIcon', () => {
    it('should not call updateLink when link is undefined', () => {
      fixture.componentRef.setInput('link', undefined);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();

      expect(mockLinkService.updateLink).not.toHaveBeenCalled();
    });

    it('should toggle show_filters_icon from true to false', async () => {
      const link = createMockLink(true);
      const updatedLink = { ...link, show_filters_icon: false };
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(of(updatedLink));
      mockMapLinksDataSource.get.mockReturnValue({});

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockLinkService.updateLink).toHaveBeenCalledWith(mockController, {
        ...link,
        show_filters_icon: false,
      });
    });

    it('should toggle show_filters_icon from false to true', async () => {
      const link = createMockLink(false);
      const updatedLink = { ...link, show_filters_icon: true };
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(of(updatedLink));
      mockMapLinksDataSource.get.mockReturnValue({});

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockLinkService.updateLink).toHaveBeenCalledWith(mockController, {
        ...link,
        show_filters_icon: true,
      });
    });

    it('should update LinksDataSource with updated link', async () => {
      const link = createMockLink(true);
      const updatedLink = { ...link, show_filters_icon: false };
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(of(updatedLink));
      mockMapLinksDataSource.get.mockReturnValue({});

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockLinksDataSource.update).toHaveBeenCalledWith(updatedLink);
    });

    it('should update MapLinksDataSource show_filters_icon field', async () => {
      const link = createMockLink(true);
      const updatedLink = { ...link, show_filters_icon: false };
      const mapLink = { id: 'link-1', show_filters_icon: true };
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(of(updatedLink));
      mockMapLinksDataSource.get.mockReturnValue(mapLink);

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockMapLinksDataSource.get).toHaveBeenCalledWith('link-1');
      expect(mapLink.show_filters_icon).toBe(false);
      expect(mockMapLinksDataSource.update).toHaveBeenCalledWith(mapLink);
    });

    it('should not update MapLinksDataSource when mapLink is not found', async () => {
      const link = createMockLink(true);
      const updatedLink = { ...link, show_filters_icon: false };
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(of(updatedLink));
      mockMapLinksDataSource.get.mockReturnValue(undefined);

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockMapLinksDataSource.update).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should show error toast with error.message when updateLink fails', async () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
    });

    it('should show error toast with err.message when error has no error.message', async () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(
        throwError(() => ({ message: 'Update failed' }))
      );

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Update failed');
    });

    it('should use fallback message when error has no message properties', async () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(
        throwError(() => ({}))
      );

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to toggle filter icon visibility');
    });

    it('should not update data sources when updateLink fails', async () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);
      mockLinkService.updateLink.mockReturnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      fixture.componentRef.setInput('link', link);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.toggleShowFiltersIcon();
      await vi.runAllTimersAsync();

      expect(mockLinksDataSource.update).not.toHaveBeenCalled();
      expect(mockMapLinksDataSource.update).not.toHaveBeenCalled();
    });
  });

  describe('button display', () => {
    it('should display "visibility_off" icon when show_filters_icon is false', () => {
      const link = createMockLink(false);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('visibility_off');
    });

    it('should display "visibility" icon when show_filters_icon is true', () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('visibility');
    });

    it('should display "Show filter icons" text when show_filters_icon is false', () => {
      const link = createMockLink(false);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span');
      expect(span.textContent.trim()).toBe('Show filter icons');
    });

    it('should display "Hide filter icons" text when show_filters_icon is true', () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span');
      expect(span.textContent.trim()).toBe('Hide filter icons');
    });

    it('should call toggleShowFiltersIcon when button is clicked', () => {
      const link = createMockLink(true);
      mockLinksDataSource.get.mockReturnValue(link);

      fixture.componentRef.setInput('link', link);
      fixture.detectChanges();

      const toggleSpy = vi.spyOn(component, 'toggleShowFiltersIcon');
      const button = fixture.nativeElement.querySelector('button');

      button.click();

      expect(toggleSpy).toHaveBeenCalled();
    });
  });
});
