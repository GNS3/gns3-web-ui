import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplianceInfoDialogComponent } from './appliance-info-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Appliance } from '@models/appliance';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('ApplianceInfoDialogComponent', () => {
  let component: ApplianceInfoDialogComponent;
  let fixture: ComponentFixture<ApplianceInfoDialogComponent>;
  let mockDialogRef: MatDialogRef<ApplianceInfoDialogComponent>;

  const mockAppliance: Appliance = {
    availability: 'available',
    builtin: false,
    category: 'router',
    description: 'Test appliance',
    documentation_url: 'https://example.com/docs',
    first_port_name: 'eth0',
    images: [],
    maintainer: 'Test Maintainer',
    maintainer_email: 'test@example.com',
    name: 'Test Router',
    port_name_format: 'eth{0}',
    port_segment_size: 4,
    product_name: 'Test Product',
    product_url: 'https://example.com/product',
    registry_version: 1,
    status: 'stable',
    symbol: 'router',
    default_name_format: 'router{0}',
    usage: 'For testing',
    vendor_name: 'Test Vendor',
    vendor_url: 'https://example.com/vendor',
    versions: [],
    tags: [],
    docker: { adapters: 1, console_type: 'vnc', image: 'test:latest' },
    dynamips: {
      chassis: 'c3725',
      nvram: 128,
      platform: 'c3700',
      ram: 128,
      slot0: 'NM-1FE-TX',
      slot1: 'NM-1FE-TX',
      slot2: '',
      slot3: '',
      slot4: '',
      slot5: '',
      slot6: '',
      slot7: '',
      startup_config: 'startup.conf',
    },
    iou: { ethernet_adapters: 2, nvram: 128, ram: 256, serial_adapters: 0, startup_config: 'iou.cfg' },
    qemu: {
      adapter_type: 'virtio',
      adapters: 4,
      arch: 'x86_64',
      boot_priority: 'c',
      console_type: 'vnc',
      hda_disk_interface: 'virtio',
      hdb_disk_interface: 'virtio',
      hdc_disk_interface: 'virtio',
      hdd_disk_interface: 'virtio',
      kvm: 'required',
      ram: 2048,
    },
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    } as any as MatDialogRef<ApplianceInfoDialogComponent>;

    await TestBed.configureTestingModule({
      imports: [ApplianceInfoDialogComponent, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { appliance: mockAppliance } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplianceInfoDialogComponent);
    component = fixture.componentInstance;
    component.appliance = mockAppliance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dialogRef from inject', () => {
    expect(component.dialogRef).toBeDefined();
  });

  it('should have appliance set from data', () => {
    expect(component.appliance).toBeDefined();
    expect(component.appliance.name).toBe('Test Router');
  });

  it('should display appliance name in title', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
    expect(title.textContent).toContain('Test Router');
  });

  it('should display vendor name', () => {
    const content = fixture.nativeElement.querySelector('[mat-dialog-content]');
    expect(content.textContent).toContain('Vendor: Test Vendor');
  });

  it('should display appliance status', () => {
    const content = fixture.nativeElement.querySelector('[mat-dialog-content]');
    expect(content.textContent).toContain('Status: stable');
  });

  it('should display maintainer', () => {
    const content = fixture.nativeElement.querySelector('[mat-dialog-content]');
    expect(content.textContent).toContain('Maintainer: Test Maintainer');
  });

  it('should display qemu adapters and console type when qemu exists', () => {
    const content = fixture.nativeElement.querySelector('[mat-dialog-content]');
    expect(content.textContent).toContain('Adapters: 4');
    expect(content.textContent).toContain('Console type: vnc');
  });

  it('should have onNoClick method', () => {
    expect(typeof component.onNoClick).toBe('function');
  });

  it('should close dialog when onNoClick is called', () => {
    component.onNoClick();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should have Close button that triggers onNoClick', () => {
    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-button]');
    expect(closeButton).toBeDefined();
    closeButton.click();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
