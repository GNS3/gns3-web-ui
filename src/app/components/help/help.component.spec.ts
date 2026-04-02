import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HelpComponent } from './help.component';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { of, throwError } from 'rxjs';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;
  let mockHttpClient: HttpClient;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockHttpClient = {
      get: vi.fn(),
    } as any as HttpClient;

    await TestBed.configureTestingModule({
      imports: [
        HelpComponent,
        MatButtonModule,
        MatExpansionModule,
        MatListModule,
      ],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty signals', () => {
    expect(component.thirdpartylicenses()).toBe('');
    expect(component.releasenotes()).toBe('');
  });

  it('should fetch thirdpartylicenses on init', () => {
    const mockHtml = '<b>License content</b>';
    mockHttpClient.get = vi.fn().mockReturnValue(of(mockHtml));

    component.ngOnInit();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      window.location.href + '/3rdpartylicenses.txt',
      { responseType: 'text' }
    );
  });

  it('should fetch release notes on init', () => {
    const mockHtml = '<b>Release notes</b>';
    mockHttpClient.get = vi.fn().mockReturnValue(of(mockHtml));

    component.ngOnInit();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      'ReleaseNotes.txt',
      { responseType: 'text' }
    );
  });

  it('should set thirdpartylicenses signal with sanitized HTML', () => {
    const mockHtml = 'line1\nline2';
    mockHttpClient.get = vi.fn()
      .mockReturnValueOnce(of(mockHtml))
      .mockReturnValueOnce(of(''));

    component.ngOnInit();

    const result = component.thirdpartylicenses();
    expect(result).toBeTruthy();
  });

  it('should handle 404 error for thirdpartylicenses', () => {
    const error = { status: 404 };
    mockHttpClient.get = vi.fn()
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of(''));

    component.ngOnInit();

    expect(component.thirdpartylicenses()).toBe('Download Solar-PuTTY');
  });

  it('should have goToDocumentation method', () => {
    // Just verify the method exists and is callable
    expect(typeof component.goToDocumentation).toBe('function');
  });
});
