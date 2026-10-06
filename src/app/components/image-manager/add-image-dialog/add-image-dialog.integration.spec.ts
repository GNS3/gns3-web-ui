import { of } from 'rxjs';
import { ImageChecksumService } from '@services/image-checksum.service';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { BackgroundUploadService } from '@services/background-upload.service';
import { HttpController } from '@services/http-controller.service';
import { ImageManagerService } from '@services/image-manager.service';
import { ToasterService } from '@services/toaster.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddImageDialogComponent } from './add-image-dialog.component';

describe('Add Image dialog upload integration', () => {
  let fixture: ComponentFixture<AddImageDialogComponent>;
  let http: HttpTestingController;
  const checksum = '900150983cd24fb0d6963f7d28e17f72';
  const controller = {
    id: 1,
    protocol: 'http:',
    host: 'localhost',
    port: 3080,
    authToken: 'test-token',
    tokenExpired: false,
  } as Controller;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddImageDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BackgroundUploadService,
        ImageManagerService,
        {
          provide: HttpController,
          useValue: {
            get: (_controller, path) => TestBed.inject(HttpClient).get('/v3' + path),
            post: (_controller, path, body) => TestBed.inject(HttpClient).post('/v3' + path, body),
          },
        },
        {
          provide: ImageChecksumService,
          useValue: { calculate: () => of({ progress: 100, checksum }) },
        },
        { provide: MAT_DIALOG_DATA, useValue: controller },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: ToasterService, useValue: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AddImageDialogComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    fixture.destroy();
  });

  it.each([false, true])(
    'preserves files and TACACS through the wizard and sends install_appliances=%s',
    async (install) => {
      const folder: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
      folder.value = 'TACACS';
      folder.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();

      const file = new File([new Uint8Array([81, 70, 73, 251, 0, 0, 0])], 'tacacs.qcow2');
      const picker: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
      Object.defineProperty(picker, 'files', { configurable: true, value: [file] });
      picker.dispatchEvent(new Event('change', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.subdirectory).toBe('TACACS');

      const button = (label: string) =>
        Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
          (element) => element.textContent.trim() === label
        );
      const completeCompatibilityCheck = () => {
        http.expectOne('/v3/images/compatibility/catalog').flush({ image_sizes: [], has_unknown_sizes: true });
        const check = http.expectOne('/v3/images/compatibility');
        expect(check.request.body).toEqual({ checksums: [checksum] });
        expect(button('Upload').disabled).toBe(true);
        check.flush([{ checksum, matches: [] }]);
        fixture.detectChanges();
      };
      http.expectNone((request) => request.method === 'POST');
      button('Next').click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-radio-group')).not.toBeNull();
      http.expectNone((request) => request.method === 'POST');
      if (install) {
        const yes: HTMLInputElement = fixture.nativeElement.querySelector('mat-radio-button input[type="radio"]');
        yes.click();
        fixture.detectChanges();
        completeCompatibilityCheck();
      }
      button('Back').click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('input[matInput]').value).toBe('TACACS');
      expect(fixture.nativeElement.textContent).toContain(file.name);
      button('Next').click();
      fixture.detectChanges();
      await fixture.whenStable();
      if (install) {
        completeCompatibilityCheck();
        expect(fixture.nativeElement.textContent).toContain('No matching appliance definition was found');
      }
      const upload = button('Upload');
      expect(upload.disabled).toBe(false);
      upload.click();

      const request = http.expectOne(
        `http://localhost:3080/v3/images/upload/tacacs.qcow2?install_appliances=${install}&subdirectory=TACACS`
      );
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toBe(file);
      request.flush({ filename: file.name, path: '/images/QEMU/TACACS/tacacs.qcow2' });
    }
  );
});
