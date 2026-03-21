import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
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
})
export class HelpComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  thirdpartylicenses: SafeHtml | string = '';
  releasenotes: SafeHtml | string = '';

  ngOnInit() {
    this.httpClient.get(window.location.href + '/3rdpartylicenses.txt', { responseType: 'text' }).subscribe(
      (data) => {
        const html = data.replace(new RegExp('\n', 'g'), '<br />');
        this.thirdpartylicenses = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      (error) => {
        if (error.status === 404) {
          this.thirdpartylicenses = 'Download Solar-PuTTY';
        }
      }
    );

    this.httpClient.get('ReleaseNotes.txt', { responseType: 'text' }).subscribe((data) => {
      const html = data.replace(new RegExp('\n', 'g'), '<br />');
      this.releasenotes = this.sanitizer.bypassSecurityTrustHtml(html);
    });
  }

  goToDocumentation() {
    window.location.href = "https://docs.gns3.com/docs/";
  }
}
