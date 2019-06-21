import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
    thirdpartylicenses = '';
    
    constructor(
        private httpClient: HttpClient
    ) {}

    ngOnInit() {
        this.httpClient.get('/3rdpartylicenses.txt', {responseType: 'text'})
            .subscribe(data => {
                this.thirdpartylicenses = data.replace(new RegExp('\n', 'g'), "<br />")
            },
            error => {
                if (error.status === 404) {
                    this.thirdpartylicenses = 'File not found';
                } 
            });
    }
}
