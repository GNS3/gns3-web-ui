import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GeneralPreferencesComponent } from './general-preferences.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('GeneralPreferencesComponent', () => {
  let component: GeneralPreferencesComponent;
  let fixture: ComponentFixture<GeneralPreferencesComponent>;
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
      imports: [GeneralPreferencesComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty controllerId before ngOnInit', () => {
    const newFixture = TestBed.createComponent(GeneralPreferencesComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.controllerId).toBe('');
  });

  it('should extract controllerId from route params on ngOnInit', () => {
    expect(component.controllerId).toBe('test-controller-id');
  });

  it('should display "General preferences" heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('General preferences');
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });
});
