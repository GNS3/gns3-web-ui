import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  imports: [MatTabsModule, MatButtonModule, MatExpansionModule, MatListModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class HelpComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  readonly thirdpartylicenses = signal<SafeHtml | string>('');
  readonly releasenotes = signal<SafeHtml | string>('');

  ngOnInit() {
    this.httpClient.get(window.location.href + '/3rdpartylicenses.txt', { responseType: 'text' }).subscribe(
      (data) => {
        const html = data.replace(new RegExp('\n', 'g'), '<br />');
        this.thirdpartylicenses.set(this.sanitizer.bypassSecurityTrustHtml(html));
      },
      (error) => {
        if (error.status === 404) {
          this.thirdpartylicenses.set('Download Solar-PuTTY');
        }
      }
    );

    this.httpClient.get('ReleaseNotes.txt', { responseType: 'text' }).subscribe((data) => {
      const html = data.replace(new RegExp('\n', 'g'), '<br />');
      this.releasenotes.set(this.sanitizer.bypassSecurityTrustHtml(html));
    });
  }

  goToDocumentation() {
    window.location.href = "https://docs.gns3.com/docs/";
  }
}
