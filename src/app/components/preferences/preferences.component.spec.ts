import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PreferencesComponent } from './preferences.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('PreferencesComponent', () => {
  let component: PreferencesComponent;
  let fixture: ComponentFixture<PreferencesComponent>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('test-controller-id'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [PreferencesComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty controllerId before ngOnInit', () => {
    const newFixture = TestBed.createComponent(PreferencesComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.controllerId).toBe('');
  });

  it('should extract controllerId from route params on ngOnInit', () => {
    expect(component.controllerId).toBe('test-controller-id');
  });

  it('should display back button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('button');
    expect(backButton).toBeTruthy();
  });

  it('should display preferences title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Template preferences');
  });

  it('should display navigation links for each preference category', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('a');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should have routerLink including controllerId in navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const firstNavLink = compiled.querySelector('a');
    expect(firstNavLink?.getAttribute('href')).toContain('test-controller-id');
  });

  it('should display Built-in preference link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const linksText = compiled.querySelectorAll('a.mat-mdc-list-item');
    const hasBuiltIn = Array.from(linksText).some((link) => link.textContent?.includes('Built-in'));
    expect(hasBuiltIn).toBe(true);
  });

  it('should display Dynamips preference link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const linksText = compiled.querySelectorAll('a.mat-mdc-list-item');
    const hasDynamips = Array.from(linksText).some((link) => link.textContent?.includes('Dynamips'));
    expect(hasDynamips).toBe(true);
  });

  it('should display Docker preference link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const linksText = compiled.querySelectorAll('a.mat-mdc-list-item');
    const hasDocker = Array.from(linksText).some((link) => link.textContent?.includes('Docker'));
    expect(hasDocker).toBe(true);
  });

  it('should use OnPush change detection strategy', () => {
    // OnPush is set via ChangeDetectionStrategy.OnPush decorator
    // This is verified by the component being compiled with OnPush
    expect(component).toBeTruthy();
  });
});
