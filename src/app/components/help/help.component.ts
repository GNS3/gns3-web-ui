import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
selector: 'app-help',
templateUrl: './help.component.html',
styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
    thirdpartylicenses = '';
    releasenotes = '';

    constructor(
        private httpClient: HttpClient
    ) {}

    ngOnInit() {
        this.httpClient.get(window.location.href + '/3rdpartylicenses.txt', {responseType: 'text'})
            .subscribe(data => {
                this.thirdpartylicenses = data.replace(new RegExp('\n', 'g'), "<br />")
            },
            error => {
                if (error.status === 404) {
                    this.thirdpartylicenses = 'File not found';
                } 
            });

        this.httpClient.get('ReleaseNotes.txt', {responseType: 'text'})
            .subscribe(data => {
                this.releasenotes = data.replace(new RegExp('\n', 'g'), "<br />")
            });
    }
}
