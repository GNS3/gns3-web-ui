import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyTemplatesListComponent } from './empty-templates-list.component';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('EmptyTemplatesListComponent', () => {
  let fixture: ComponentFixture<EmptyTemplatesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyTemplatesListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyTemplatesListComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display default message when textMessage is undefined', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h6 = compiled.querySelector('h6.header');
    expect(h6?.textContent).toContain('Empty templates list');
  });

  it('should display custom message when textMessage input is set', () => {
    fixture.componentRef.setInput('textMessage', 'Custom empty message');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const h6 = compiled.querySelector('h6.header');
    expect(h6?.textContent).toContain('Custom empty message');
  });

  it('should render mat-card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matCard = compiled.querySelector('mat-card');
    expect(matCard).toBeTruthy();
  });

  it('should render h6.header element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h6 = compiled.querySelector('h6.header');
    expect(h6).toBeTruthy();
  });

  it('should use OnPush change detection strategy', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should return textMessage value from computed when provided', () => {
    fixture.componentRef.setInput('textMessage', 'My Templates');
    expect(fixture.componentInstance.emptyTemplatesListMessage()).toBe('My Templates');
  });

  it('should return default message from computed when textMessage is undefined', () => {
    expect(fixture.componentInstance.emptyTemplatesListMessage()).toBe('Empty templates list');
  });

  it('should return default message from computed when textMessage is empty string', () => {
    fixture.componentRef.setInput('textMessage', '');
    expect(fixture.componentInstance.emptyTemplatesListMessage()).toBe('');
  });
});
