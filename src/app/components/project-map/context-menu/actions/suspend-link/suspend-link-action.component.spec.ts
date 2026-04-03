import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SuspendLinkActionComponent } from './suspend-link-action.component';
import { LinkService } from '@services/link.service';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SuspendLinkActionComponent', () => {
  let fixture: ComponentFixture<SuspendLinkActionComponent>;
  let mockLinkService: any;
  let mockController: Controller;
  let mockLink: Link;

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      suspend: false,
      link_id: 'link1',
      ...overrides,
    }) as Link;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      authToken: 'token',
      location: 'local',
      host: '127.0.0.1',
      port: 3080,
      path: '/',
      ubridge_path: '/usr/bin/ubridge',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
    }) as Controller;

  beforeEach(async () => {
    mockLinkService = {
      updateLink: vi.fn().mockReturnValue(of({})),
    };

    mockLink = createMockLink();
    mockController = createMockController();

    await TestBed.configureTestingModule({
      imports: [SuspendLinkActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: LinkService, useValue: mockLinkService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuspendLinkActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('button visibility', () => {
    it('should show suspend button when link is not suspended', () => {
      mockLink = createMockLink({ suspend: false });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Suspend');
    });

    it('should hide suspend button when link is already suspended', () => {
      mockLink = createMockLink({ suspend: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });
  });

  describe('suspendLink', () => {
    it('should set link suspend to true and call updateLink', () => {
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.componentInstance.suspendLink();

      expect(mockLink.suspend).toBe(true);
      expect(mockLinkService.updateLink).toHaveBeenCalledWith(mockController, mockLink);
    });

    it('should call updateLink with correct controller and link', () => {
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.componentInstance.suspendLink();

      expect(mockLinkService.updateLink).toHaveBeenCalledTimes(1);
      const [controller, link] = mockLinkService.updateLink.mock.calls[0];
      expect(controller).toBe(mockController);
      expect(link).toBe(mockLink);
    });

  });
});
