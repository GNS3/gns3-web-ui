import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';
import { ResetLinkActionComponent } from './reset-link-action.component';
import { LinkService } from '@services/link.service';
import { Controller } from '@models/controller';
import { Link } from '@models/link';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ResetLinkActionComponent', () => {
  let fixture: ComponentFixture<ResetLinkActionComponent>;
  let mockLinkService: any;

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

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      link_id: 'link-1',
      project_id: 'project-1',
      ...overrides,
    } as Link);

  beforeEach(async () => {
    mockLinkService = {
      resetLink: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [ResetLinkActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [{ provide: LinkService, useValue: mockLinkService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetLinkActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('rendering', () => {
    it('should display reset link button with correct text', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Reset link');
    });

    it('should display settings_backup_restore icon', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('settings_backup_restore');
    });
  });

  describe('resetLink', () => {
    it('should call linkService.resetLink with controller and link when button is clicked', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockLinkService.resetLink).toHaveBeenCalledWith(mockController, mockLink);
    });
  });
});
