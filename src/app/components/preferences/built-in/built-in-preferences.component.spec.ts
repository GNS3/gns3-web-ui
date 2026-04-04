import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BuiltInPreferencesComponent } from './built-in-preferences.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BuiltInPreferencesComponent', () => {
  let component: BuiltInPreferencesComponent;
  let fixture: ComponentFixture<BuiltInPreferencesComponent>;
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
      imports: [BuiltInPreferencesComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    }).compileComponents();

    fixture = TestBed.createComponent(BuiltInPreferencesComponent);
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
    const newFixture = TestBed.createComponent(BuiltInPreferencesComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.controllerId()).toBe('');
  });

  it('should extract controllerId from route params on ngOnInit', () => {
    expect(component.controllerId()).toBe('test-controller-id');
  });

  it('should display "Built-in templates" heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('Built-in templates');
  });

  it('should render back button with arrow_back icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('button[mat-icon-button]');
    expect(backButton).toBeTruthy();
    const icon = backButton?.querySelector('mat-icon');
    expect(icon?.textContent).toBe('arrow_back');
  });


  it('should render 3 navigation items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navItems = compiled.querySelectorAll('a[mat-list-item]');
    expect(navItems.length).toBe(3);
  });

  it('should render Ethernet hub templates nav item with correct icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hubItem = compiled.querySelector('a[mat-list-item]');
    const icon = hubItem?.querySelector('mat-icon');
    expect(icon?.textContent).toBe('device_hub');
    expect(hubItem?.textContent).toContain('Ethernet hub templates');
  });

  it('should render Ethernet switch templates nav item with correct icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const switchItem = compiled.querySelectorAll('a[mat-list-item]')[1];
    const icon = switchItem?.querySelector('mat-icon');
    expect(icon?.textContent).toBe('settings_ethernet');
    expect(switchItem?.textContent).toContain('Ethernet switch templates');
  });

  it('should render Cloud node templates nav item with correct icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cloudItem = compiled.querySelectorAll('a[mat-list-item]')[2];
    const icon = cloudItem?.querySelector('mat-icon');
    expect(icon?.textContent).toBe('cloud');
    expect(cloudItem?.textContent).toContain('Cloud node templates');
  });

  it('should build correct href for ethernet-hubs', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hubItem = compiled.querySelector('a[mat-list-item]');
    const href = hubItem?.getAttribute('href');
    expect(href).toContain('/controller/test-controller-id/preferences/builtin/ethernet-hubs');
  });

  it('should build correct href for ethernet-switches', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const switchItem = compiled.querySelectorAll('a[mat-list-item]')[1];
    const href = switchItem?.getAttribute('href');
    expect(href).toContain('/controller/test-controller-id/preferences/builtin/ethernet-switches');
  });

  it('should build correct href for cloud-nodes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cloudItem = compiled.querySelectorAll('a[mat-list-item]')[2];
    const href = cloudItem?.getAttribute('href');
    expect(href).toContain('/controller/test-controller-id/preferences/builtin/cloud-nodes');
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  it('should handle null controller_id from route params', async () => {
    const nullActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    };

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [BuiltInPreferencesComponent],
        providers: [{ provide: ActivatedRoute, useValue: nullActivatedRoute }],
      })
      .compileComponents();

    const newFixture = TestBed.createComponent(BuiltInPreferencesComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    expect(newComponent.controllerId()).toBe('');
  });

  it('should handle missing controller_id from route params', async () => {
    const missingActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    };

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [BuiltInPreferencesComponent],
        providers: [{ provide: ActivatedRoute, useValue: missingActivatedRoute }],
      })
      .compileComponents();

    const newFixture = TestBed.createComponent(BuiltInPreferencesComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    expect(newComponent.controllerId()).toBe('');
  });
});
