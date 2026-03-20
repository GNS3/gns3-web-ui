import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent implements OnInit {
  thirdpartylicenses: SafeHtml | string = '';
  releasenotes: SafeHtml | string = '';

  constructor(
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

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
