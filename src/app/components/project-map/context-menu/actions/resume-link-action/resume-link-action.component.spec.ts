import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResumeLinkActionComponent } from './resume-link-action.component';
import { LinkService } from '@services/link.service';
import { Controller } from '@models/controller';
import { Link } from '@models/link';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ResumeLinkActionComponent', () => {
  let fixture: ComponentFixture<ResumeLinkActionComponent>;
  let mockLinkService: { updateLink: ReturnType<typeof vi.fn> };

  const createMockLink = (overrides: Partial<Link> = {}): Link => {
    const defaults: Link = {
      link_id: 'link-1',
      project_id: 'proj-1',
      nodes: [],
      capture_file_name: '',
      capture_file_path: '',
      capturing: false,
      link_type: 'ethernet',
      suspend: false,
      wireshark: false,
      distance: 0,
      length: 0,
      source: null as any,
      target: null as any,
      x: 0,
      y: 0,
    };
    return Object.assign({}, defaults, overrides);
  };

  const createMockController = (): Controller => ({
    id: 1,
    authToken: '',
    name: 'Main Controller',
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
  });

  beforeEach(async () => {
    mockLinkService = { updateLink: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResumeLinkActionComponent],
      providers: [{ provide: LinkService, useValue: mockLinkService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeLinkActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('template visibility', () => {
    it('should show button when link is suspended', () => {
      const mockLink = createMockLink({ suspend: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
    });

    it('should hide button when link is not suspended', () => {
      const mockLink = createMockLink({ suspend: false });
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });

    it('should hide button when link is undefined', () => {
      fixture.componentRef.setInput('link', undefined);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });
  });

  describe('resumeLink', () => {
    it('should set link.suspend to false and call linkService.updateLink', () => {
      const mockLink = createMockLink({ suspend: true, link_id: 'link-1', project_id: 'proj-1' });
      const mockController = createMockController();
      const successResponse = of(mockLink);
      mockLinkService.updateLink.mockReturnValue(successResponse);

      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      const updatedLink = mockLinkService.updateLink.mock.calls[0][1] as Link;
      expect(updatedLink.suspend).toBe(false);
      expect(mockLinkService.updateLink).toHaveBeenCalledWith(mockController, updatedLink);
    });

    it('should call linkService.updateLink with correct controller and link', () => {
      const mockLink = createMockLink({ suspend: true, link_id: 'link-2', project_id: 'proj-2' });
      const mockController = createMockController();
      mockLinkService.updateLink.mockReturnValue(of(mockLink));

      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockLinkService.updateLink).toHaveBeenCalledWith(mockController, mockLink);
    });

    it('should call linkService.updateLink when link.suspend is true', () => {
      const mockLink = createMockLink({ suspend: true });
      const mockController = createMockController();
      mockLinkService.updateLink.mockReturnValue(of(mockLink));

      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockLinkService.updateLink).toHaveBeenCalled();
    });
  });
});
