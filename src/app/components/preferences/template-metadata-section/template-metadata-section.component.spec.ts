import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateMetadataSectionComponent } from './template-metadata-section.component';
import { ApplianceMetadata } from '@models/appliance-metadata';

/** Host binding [(metadata)] to a parent signal, like the details dialogs do. */
@Component({
  standalone: true,
  imports: [TemplateMetadataSectionComponent],
  template: '<app-template-metadata-section [(metadata)]="metadata" />',
})
class HostComponent {
  readonly metadata = signal<ApplianceMetadata | null>(null);
}

describe('TemplateMetadataSectionComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: TemplateMetadataSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: MatSnackBar, useValue: { open: vi.fn() } }],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    comp = fixture.debugElement.query((e) => e.componentInstance instanceof TemplateMetadataSectionComponent)
      .componentInstance as TemplateMetadataSectionComponent;
    fixture.detectChanges();
  });

  it('renders the edit form fields when mounted (hosted in the Metadata tab)', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('Description');
    expect(text).toContain('Vendor name');
    expect(text).toContain('Remove metadata');
  });

  it('syncs the form when the parent loads a template (external metadata set)', () => {
    host.metadata.set({ vendor_name: 'Vendor', default_username: 'vyos' });
    fixture.detectChanges();

    expect(comp.formValues()['vendor_name']).toBe('Vendor');
    expect(comp.formValues()['description']).toBe('');
    // credentials are edited in the General settings section, not this form
    expect(comp.formValues()['default_username']).toBeUndefined();
  });

  it('treats null materialized keys like missing ones', () => {
    // the server response materializes every known key as null
    host.metadata.set({ vendor_name: 'Vendor', description: null, maintainer: null });
    fixture.detectChanges();

    expect(comp.text('vendor_name')).toBe('Vendor');
    expect(comp.text('description')).toBe('');
    expect(comp.text('maintainer')).toBe('');
  });

  it('rebuilds the object on input: non-empty known fields only', () => {
    host.metadata.set({ vendor_name: 'Vendor' });
    fixture.detectChanges();

    comp.setField('vendor_name', 'Vendor2');
    comp.setField('description', '   ');

    const result = host.metadata()! as { [key: string]: unknown };
    expect(result['vendor_name']).toBe('Vendor2');
    // whitespace-only fields are dropped (whole-object replace semantics)
    expect(result['description']).toBeUndefined();
  });

  it('preserves credentials edited in the General settings section (not owned by this form)', () => {
    host.metadata.set({ vendor_name: 'Vendor', default_username: 'root', default_password: 's3cret' });
    fixture.detectChanges();

    comp.setField('vendor_name', 'Vendor2');

    const result = host.metadata()! as { [key: string]: unknown };
    expect(result['vendor_name']).toBe('Vendor2');
    expect(result['default_username']).toBe('root'); // not wiped by the rebuild
    expect(result['default_password']).toBe('s3cret');
  });

  it('preserves unknown keys passed through by the server', () => {
    host.metadata.set({ vendor_name: 'Vendor', future_key: { nested: true } } as ApplianceMetadata);
    fixture.detectChanges();

    comp.setField('vendor_name', 'Vendor2');

    const result = host.metadata()! as { [key: string]: unknown };
    expect(result['vendor_name']).toBe('Vendor2');
    expect(result['future_key']).toEqual({ nested: true }); // preserved untouched
  });

  it('keeps appliance_id on rebuild', () => {
    host.metadata.set({ appliance_id: 'abc', vendor_name: 'Vendor' });
    fixture.detectChanges();

    comp.setField('vendor_name', 'Vendor2');

    expect((host.metadata()! as { [key: string]: unknown })['appliance_id']).toBe('abc');
  });

  it('clearing every field yields null (PUT null semantics)', () => {
    host.metadata.set({ vendor_name: 'Vendor' });
    fixture.detectChanges();

    comp.setField('vendor_name', '');

    expect(host.metadata()).toBeNull();
  });

  it('remove clears the whole metadata and the form', () => {
    host.metadata.set({ vendor_name: 'Vendor', default_username: 'vyos' });
    fixture.detectChanges();

    comp.remove();

    expect(host.metadata()).toBeNull();
    expect(comp.formValues()['vendor_name']).toBe('');
  });

  it('external reload after edits resyncs the form', () => {
    comp.setField('vendor_name', 'Typed');

    host.metadata.set({ vendor_name: 'Reloaded' });
    fixture.detectChanges();

    expect(comp.formValues()['vendor_name']).toBe('Reloaded');
  });
});
