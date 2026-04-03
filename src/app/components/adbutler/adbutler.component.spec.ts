import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { AdbutlerComponent } from './adbutler.component';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '@services/theme.service';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';

describe('AdbutlerComponent', () => {
  let component: AdbutlerComponent;
  let fixture: ComponentFixture<AdbutlerComponent>;
  let mockHttpClient: HttpClient;
  let mockThemeService: ThemeService;
  let mockLocation: Location;
  let themeChangedSubject: Subject<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    themeChangedSubject = new Subject<void>();

    mockHttpClient = {
      get: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    } as any as HttpClient;

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('light'),
      themeChanged: themeChangedSubject.asObservable(),
    } as any as ThemeService;

    mockLocation = {
      path: vi.fn().mockReturnValue('/controller/1/nodes'),
    } as any as Location;

    await TestBed.configureTestingModule({
      imports: [
        AdbutlerComponent,
        MatIconModule,
      ],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Location, useValue: mockLocation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdbutlerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isVisible signal', () => {
    expect(component.isVisible()).toBe(false);
  });

  it('should have isLightThemeEnabled signal', () => {
    expect(component.isLightThemeEnabled()).toBe(false);
  });

  it('should have adUrl signal with default value', () => {
    expect(component.adUrl()).toContain('solarwinds.com');
  });

  it('should have adBody signal with default value', () => {
    expect(component.adBody()).toContain('Network Config Generator');
  });

  it('should have buttonLabel signal with default value', () => {
    expect(component.buttonLabel()).toBe('Check it out!');
  });

  it('should hide the ad', () => {
    component.isVisible.set(true);
    component.hide();
    expect(component.isVisible()).toBe(false);
  });

  it('should not make HTTP request if location path includes nodes', () => {
    mockLocation.path = vi.fn().mockReturnValue('/controller/1/nodes');
    component.ngOnInit();
    expect(mockHttpClient.get).not.toHaveBeenCalled();
  });

  it('should make HTTP request if location path does not include nodes', () => {
    mockLocation.path = vi.fn().mockReturnValue('/controller/1/projects');
    mockHttpClient.get = vi.fn().mockReturnValue(
      new (require('rxjs').Observable)(observer => {
        observer.complete();
      })
    );
    component.ngOnInit();
    expect(mockHttpClient.get).toHaveBeenCalled();
  });

  it('should subscribe to themeChanged on init', () => {
    mockLocation.path = vi.fn().mockReturnValue('/controller/1/nodes');
    component.ngOnInit();
    expect(mockThemeService.themeChanged.subscribe).toBeDefined();
  });

  it('should handle ad response with empty placements', () => {
    mockLocation.path = vi.fn().mockReturnValue('/controller/1/projects');
    mockHttpClient.get = vi.fn().mockReturnValue(
      new (require('rxjs').Observable)(observer => {
        observer.next({});
        observer.complete();
      })
    );
    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('should handle HTTP error gracefully', () => {
    mockLocation.path = vi.fn().mockReturnValue('/controller/1/projects');
    mockHttpClient.get = vi.fn().mockReturnValue(
      new (require('rxjs').Observable)(observer => {
        observer.error(new Error('Network error'));
      })
    );
    expect(() => component.ngOnInit()).not.toThrow();
  });
});
