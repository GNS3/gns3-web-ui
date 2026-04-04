import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthImageFilter } from './authImageFilter';
import { HttpController } from '@services/http-controller.service';
import { Controller } from '@models/controller';
import { DomSanitizer } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

describe('AuthImageFilter', () => {
  let filter: AuthImageFilter;
  let mockHttpController: HttpController;
  let mockDomSanitizer: DomSanitizer;
  let mockController: Controller;
  let mockFileReader: any;

  const mockBlob = new Blob(['image data'], { type: 'image/png' });
  const expectedDataUrl = 'data:image/png;base64,aW1hZ2UgZGF0YQ==';
  const elements: HTMLElement[] = [];

  beforeEach(() => {
    vi.clearAllMocks();

    mockHttpController = {
      getBlob: vi.fn(),
    } as any as HttpController;

    mockDomSanitizer = {
      sanitize: vi.fn((context: any, value: string) => value) as any,
      bypassSecurityTrustUrl: vi.fn((url: string) => url as any),
      bypassSecurityTrustHtml: vi.fn((value: string) => value as any),
      bypassSecurityTrustStyle: vi.fn((value: string) => value as any),
      bypassSecurityTrustScript: vi.fn((value: string) => value as any),
      bypassSecurityTrustResourceUrl: vi.fn((value: string) => value as any),
    };

    mockController = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as any,
      authToken: 'test-token',
      tokenExpired: false,
    } as Controller;

    class MockFileReader {
      result: string | ArrayBuffer | null = expectedDataUrl;
      onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL(_blob: Blob) {
        const self: any = this;
        setTimeout(() => self.onloadend && self.onloadend({ target: self }), 0);
      }
    }
    mockFileReader = MockFileReader;
  });

  afterEach(() => {
    elements.forEach((el) => el.remove());
    elements.length = 0;
  });

  describe('transform', () => {
    it('should extract URL by removing current_version and fetch blob', async () => {
      vi.stubGlobal('FileReader', mockFileReader);

      const { AuthImageFilter } = await import('./authImageFilter');
      TestBed.configureTestingModule({
        providers: [
          AuthImageFilter,
          { provide: HttpController, useValue: mockHttpController },
          { provide: DomSanitizer, useValue: mockDomSanitizer },
        ],
      });
      filter = TestBed.inject(AuthImageFilter);

      const src = `${environment.current_version}/images/test.png`;
      (mockHttpController.getBlob as any).mockReturnValue(of(mockBlob));

      const resultPromise = filter.transform(src, mockController);

      expect(mockHttpController.getBlob).toHaveBeenCalledWith(mockController, '/images/test.png');

      await vi.runAllTimersAsync();
      const result = await resultPromise;
      expect(result).toBe(expectedDataUrl);
    });

    it('should sanitize the URL with DomSanitizer', async () => {
      vi.stubGlobal('FileReader', mockFileReader);

      const { AuthImageFilter } = await import('./authImageFilter');
      TestBed.configureTestingModule({
        providers: [
          AuthImageFilter,
          { provide: HttpController, useValue: mockHttpController },
          { provide: DomSanitizer, useValue: mockDomSanitizer },
        ],
      });
      filter = TestBed.inject(AuthImageFilter);

      const src = `${environment.current_version}/images/logo.png`;
      (mockHttpController.getBlob as any).mockReturnValue(of(mockBlob));

      const resultPromise = filter.transform(src, mockController);

      await vi.runAllTimersAsync();
      await resultPromise;
      expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(expectedDataUrl);
    });

    it('should return sanitized URL as trusted URL', async () => {
      const trustedUrl = 'trusted-url' as any;
      (mockDomSanitizer.bypassSecurityTrustUrl as any).mockReturnValue(trustedUrl);
      vi.stubGlobal('FileReader', mockFileReader);

      const { AuthImageFilter } = await import('./authImageFilter');
      TestBed.configureTestingModule({
        providers: [
          AuthImageFilter,
          { provide: HttpController, useValue: mockHttpController },
          { provide: DomSanitizer, useValue: mockDomSanitizer },
        ],
      });
      filter = TestBed.inject(AuthImageFilter);

      const src = `${environment.current_version}/images/icon.png`;
      (mockHttpController.getBlob as any).mockReturnValue(of(mockBlob));

      const resultPromise = filter.transform(src, mockController);

      await vi.runAllTimersAsync();
      const result = await resultPromise;
      expect(result).toBe(trustedUrl);
    });

    it('should handle URL when current_version is not in src', async () => {
      vi.stubGlobal('FileReader', mockFileReader);

      const { AuthImageFilter } = await import('./authImageFilter');
      TestBed.configureTestingModule({
        providers: [
          AuthImageFilter,
          { provide: HttpController, useValue: mockHttpController },
          { provide: DomSanitizer, useValue: mockDomSanitizer },
        ],
      });
      filter = TestBed.inject(AuthImageFilter);

      // When src doesn't contain current_version, split returns single element and [1] is undefined
      const src = '/images/test.png';
      (mockHttpController.getBlob as any).mockReturnValue(of(mockBlob));

      const resultPromise = filter.transform(src, mockController);

      await vi.runAllTimersAsync();
      await resultPromise;
      // The filter splits by current_version, gets [1] which is undefined when no split occurs
      expect(mockHttpController.getBlob).toHaveBeenCalledWith(mockController, undefined);
    });

    it('should handle getBlob error', async () => {
      vi.stubGlobal('FileReader', mockFileReader);

      const { AuthImageFilter } = await import('./authImageFilter');
      TestBed.configureTestingModule({
        providers: [
          AuthImageFilter,
          { provide: HttpController, useValue: mockHttpController },
          { provide: DomSanitizer, useValue: mockDomSanitizer },
        ],
      });
      filter = TestBed.inject(AuthImageFilter);

      const src = `${environment.current_version}/images/error.png`;
      const error = new Error('Blob fetch error');
      (mockHttpController.getBlob as any).mockReturnValue(throwError(() => error));

      await expect(filter.transform(src, mockController)).rejects.toThrow('Blob fetch error');
    });
  });
});
