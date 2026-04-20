import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, Subject, Observable } from 'rxjs';
import { AdbutlerComponent } from './adbutler.component';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '@services/theme.service';
import { Location } from '@angular/common';

const mockAdBody =
  '<a href="https://example.com">Ad Title</a><br/>Ad description text<br/> <button><a >Click me</a>  </button>';
const mockParsedAdUrl = 'https://example.com';
const mockParsedAdBody = 'Ad description text';
const mockParsedButtonLabel = 'Click me';

describe('AdbutlerComponent', () => {
  let fixture: ComponentFixture<AdbutlerComponent>;
  let mockHttpClient: HttpClient;
  let mockThemeService: ThemeService;
  let mockLocation: Location;
  let themeChangedSubject: Subject<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    themeChangedSubject = new Subject<void>();

    mockHttpClient = {
      get: vi.fn(),
    } as any as HttpClient;

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('dark'),
      themeChanged: themeChangedSubject.asObservable(),
    } as any as ThemeService;

    mockLocation = {
      path: vi.fn().mockReturnValue('/controller/1/projects'),
    } as any as Location;

    await TestBed.configureTestingModule({
      imports: [AdbutlerComponent, MatIconModule],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Location, useValue: mockLocation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdbutlerComponent);
  });

  afterEach(() => {
    themeChangedSubject.complete();
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have isVisible signal defaulting to false', () => {
    expect(fixture.componentInstance.isVisible()).toBe(false);
  });

  it('should have isLightThemeEnabled signal defaulting to false for dark theme', () => {
    expect(fixture.componentInstance.isLightThemeEnabled()).toBe(false);
  });

  it('should have adUrl signal with default value', () => {
    expect(fixture.componentInstance.adUrl()).toContain('solarwinds.com');
  });

  it('should have adBody signal with default value', () => {
    expect(fixture.componentInstance.adBody()).toContain('Network Config Generator');
  });

  it('should have buttonLabel signal with default value', () => {
    expect(fixture.componentInstance.buttonLabel()).toBe('Check it out!');
  });

  it('should hide the ad when hide() is called', () => {
    fixture.componentInstance.isVisible.set(true);
    fixture.componentInstance.hide();
    expect(fixture.componentInstance.isVisible()).toBe(false);
  });

  describe('ngOnInit with nodes path', () => {
    it('should not make HTTP request if location path includes nodes', () => {
      mockLocation.path = vi.fn().mockReturnValue('/controller/1/nodes');
      const localFixture = TestBed.createComponent(AdbutlerComponent);
      localFixture.componentInstance.ngOnInit();
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      localFixture.destroy();
    });

    it('should not make HTTP request if location path is a nodes detail page', () => {
      mockLocation.path = vi.fn().mockReturnValue('/nodes/abc-123/edit');
      const localFixture = TestBed.createComponent(AdbutlerComponent);
      localFixture.componentInstance.ngOnInit();
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      localFixture.destroy();
    });
  });

  describe('ngOnInit with non-nodes path', () => {
    it('should make HTTP request if location path does not include nodes', () => {
      mockHttpClient.get = vi.fn().mockReturnValue(of({}));
      fixture.componentInstance.ngOnInit();
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://servedbyadbutler.com/adserve/;ID=165803;size=0x0;setID=371476;type=json;'
      );
    });

    it('should parse and set ad data from successful response', () => {
      const mockResponse = {
        placements: {
          placement_1: {
            body: mockAdBody,
          },
        },
      };
      mockHttpClient.get = vi.fn().mockReturnValue(of(mockResponse));
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.adUrl()).toBe(mockParsedAdUrl);
      expect(fixture.componentInstance.adBody()).toBe(mockParsedAdBody);
      expect(fixture.componentInstance.buttonLabel()).toBe(mockParsedButtonLabel);
    });

    it('should set isVisible true after successful ad response', () => {
      mockHttpClient.get = vi.fn().mockReturnValue(
        of({
          placements: {
            placement_1: { body: mockAdBody },
          },
        })
      );
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.isVisible()).toBe(true);
    });

    it('should set isVisible true even if placements is empty', () => {
      mockHttpClient.get = vi.fn().mockReturnValue(of({}));
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.isVisible()).toBe(true);
    });

    it('should keep default ad values if response body is missing', () => {
      mockHttpClient.get = vi.fn().mockReturnValue(
        of({
          placements: {
            placement_1: {},
          },
        })
      );
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.adUrl()).toContain('solarwinds.com');
      expect(fixture.componentInstance.adBody()).toContain('Network Config Generator');
      expect(fixture.componentInstance.buttonLabel()).toBe('Check it out!');
    });

    it('should handle HTTP error gracefully without throwing', () => {
      mockHttpClient.get = vi
        .fn()
        .mockReturnValue(new Observable((observer) => observer.error(new Error('Network error'))));
      expect(() => fixture.componentInstance.ngOnInit()).not.toThrow();
    });
  });

  describe('themeChanged subscription', () => {
    it('should update isLightThemeEnabled when theme changes to light', () => {
      // Simulate theme change by calling the themeChanged handler directly
      // The subscription is set up in ngOnInit, so we call ngOnInit first
      mockHttpClient.get = vi.fn().mockReturnValue(of({}));
      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.isLightThemeEnabled()).toBe(false);

      // Simulate theme change to light
      mockThemeService.getActualTheme = vi.fn().mockReturnValue('light');
      themeChangedSubject.next();
      fixture.detectChanges();

      expect(fixture.componentInstance.isLightThemeEnabled()).toBe(true);
    });

    it('should update isLightThemeEnabled when theme changes to dark', () => {
      // Start with light theme
      mockThemeService.getActualTheme = vi.fn().mockReturnValue('light');
      mockHttpClient.get = vi.fn().mockReturnValue(of({}));
      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.isLightThemeEnabled()).toBe(true);

      // Simulate theme change to dark
      mockThemeService.getActualTheme = vi.fn().mockReturnValue('dark');
      themeChangedSubject.next();
      fixture.detectChanges();

      expect(fixture.componentInstance.isLightThemeEnabled()).toBe(false);
    });
  });
});
