import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { HelpComponent } from './help.component';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;
  let mockHttpClient: { get: ReturnType<typeof vi.fn> };
  let mockSanitizer: { bypassSecurityTrustHtml: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of('')),
    };

    mockSanitizer = {
      bypassSecurityTrustHtml: vi.fn().mockImplementation((html: string) => html as SafeHtml),
    };

    await TestBed.configureTestingModule({
      imports: [HelpComponent, MatButtonModule, MatExpansionModule, MatListModule],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty signals', () => {
      expect(component.thirdpartylicenses()).toBe('');
      expect(component.releasenotes()).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should fetch thirdpartylicenses from correct URL', () => {
      const mockHtml = '<b>License content</b>';
      mockHttpClient.get.mockReturnValueOnce(of(mockHtml)).mockReturnValueOnce(of(''));

      component.ngOnInit();
      fixture.detectChanges();

      expect(mockHttpClient.get).toHaveBeenCalledWith(window.location.href + '/3rdpartylicenses.txt', {
        responseType: 'text',
      });
    });

    it('should fetch release notes from ReleaseNotes.txt', () => {
      const mockHtml = '<b>Release notes</b>';
      mockHttpClient.get.mockReturnValueOnce(of('')).mockReturnValueOnce(of(mockHtml));

      component.ngOnInit();
      fixture.detectChanges();

      expect(mockHttpClient.get).toHaveBeenCalledWith('ReleaseNotes.txt', { responseType: 'text' });
    });

    it('should sanitize and set thirdpartylicenses HTML', () => {
      const mockHtml = 'line1\nline2';
      const expectedHtml = 'line1<br />line2';
      mockHttpClient.get.mockReturnValueOnce(of(mockHtml)).mockReturnValueOnce(of(''));

      component.ngOnInit();

      expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(expectedHtml);
      expect(component.thirdpartylicenses()).toBe(expectedHtml);
    });

    it('should set releasenotes signal with sanitized HTML', () => {
      const mockHtml = 'note1\nnote2';
      const expectedHtml = 'note1<br />note2';
      mockHttpClient.get.mockReturnValueOnce(of('')).mockReturnValueOnce(of(mockHtml));

      component.ngOnInit();

      expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(expectedHtml);
      expect(component.releasenotes()).toBe(expectedHtml);
    });

    it('should set fallback text when thirdpartylicenses returns 404', () => {
      const error = { status: 404 };
      mockHttpClient.get.mockReturnValueOnce(throwError(() => error)).mockReturnValueOnce(of(''));

      component.ngOnInit();
      // No detectChanges - throwError is synchronous

      expect(component.thirdpartylicenses()).toBe('Download Solar-PuTTY');
    });
  });

  describe('goToDocumentation', () => {
    it('should navigate to GNS3 documentation URL', () => {
      const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        href: 'http://localhost:4200/project/1/topology',
      } as Location);

      component.goToDocumentation();

      expect(window.location.href).toBe('https://docs.gns3.com/docs/');

      locationSpy.mockRestore();
    });
  });
});
