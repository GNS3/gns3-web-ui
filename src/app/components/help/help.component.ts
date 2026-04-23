import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
  imports: [MatButtonModule, MatExpansionModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  readonly thirdpartylicenses = signal<SafeHtml | string>('');
  readonly releasenotes = signal<SafeHtml | string>('');

  ngOnInit() {
    this.httpClient.get(window.location.href + '/3rdpartylicenses.txt', { responseType: 'text' }).subscribe({
      next: (data) => {
        const html = data.replace(new RegExp('\n', 'g'), '<br />');
        this.thirdpartylicenses.set(this.sanitizer.bypassSecurityTrustHtml(html));
      },
      error: (err) => {
        if (err.status === 404) {
          this.thirdpartylicenses.set('Download Solar-PuTTY');
        } else {
          const message = err.error?.message || err.message || 'Failed to load third party licenses';
          this.toasterService.error(message);
        }
        this.cd.markForCheck();
      },
    });

    this.httpClient.get('ReleaseNotes.txt', { responseType: 'text' }).subscribe({
      next: (data) => {
        const html = data.replace(new RegExp('\n', 'g'), '<br />');
        this.releasenotes.set(this.sanitizer.bypassSecurityTrustHtml(html));
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load release notes';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  goToDocumentation() {
    window.location.href = 'https://docs.gns3.com/docs/';
  }
}
