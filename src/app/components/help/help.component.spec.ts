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
    TestBed.resetTestingModule(); // 先重置，防止与全局 afterEach 冲突
    vi.clearAllMocks();

    mockHttpClient = {
      get: vi.fn().mockReturnValue(of('')),
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
  });

  // 为需要完整组件初始化的测试创建 fixture
  function createComponent() {
    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should initialize with empty signals', () => {
    createComponent();
    expect(component.thirdpartylicenses()).toBe('');
    expect(component.releasenotes()).toBe('');
  });

  it('should fetch thirdpartylicenses on init', () => {
    const mockHtml = '<b>License content</b>';
    mockHttpClient.get = vi.fn().mockReturnValue(of(mockHtml));

    createComponent();
    component.ngOnInit();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      window.location.href + '/3rdpartylicenses.txt',
      { responseType: 'text' }
    );
  });

  it('should fetch release notes on init', () => {
    const mockHtml = '<b>Release notes</b>';
    mockHttpClient.get = vi.fn().mockReturnValue(of(mockHtml));

    createComponent();
    component.ngOnInit();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      'ReleaseNotes.txt',
      { responseType: 'text' }
    );
  });

  it('should set thirdpartylicenses signal with sanitized HTML', async () => {
    const mockHtml = 'line1\nline2';
    const customMockHttpClient = {
      get: vi.fn()
        .mockReturnValueOnce(of(mockHtml))
        .mockReturnValueOnce(of('')),
    } as any as HttpClient;

    // 完整重建 TestBed
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        HelpComponent,
        MatButtonModule,
        MatExpansionModule,
        MatListModule,
      ],
      providers: [
        { provide: HttpClient, useValue: customMockHttpClient },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;

    // 手动推进 fake timers 以完成 Observable 订阅
    vi.runAllTimers();

    const result = component.thirdpartylicenses();
    expect(result).toBeTruthy();
  });

  it('should handle 404 error for thirdpartylicenses', async () => {
    const error = { status: 404 };
    const customMockHttpClient = {
      get: vi.fn()
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of('')),
    } as any as HttpClient;

    // 完整重建 TestBed
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        HelpComponent,
        MatButtonModule,
        MatExpansionModule,
        MatListModule,
      ],
      providers: [
        { provide: HttpClient, useValue: customMockHttpClient },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;

    // 手动推进 fake timers 以完成 Observable 订阅
    vi.runAllTimers();

    expect(component.thirdpartylicenses()).toBe('Download Solar-PuTTY');
  });

  it('should have goToDocumentation method', () => {
    createComponent();
    // Just verify the method exists and is callable
    expect(typeof component.goToDocumentation).toBe('function');
  });
});
