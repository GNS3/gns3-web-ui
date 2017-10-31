import { Component, OnInit } from '@angular/core';
import {Http} from "@angular/http";
import {MatIconRegistry} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    constructor(http: Http, iconReg: MatIconRegistry, sanitizer: DomSanitizer) {
    iconReg.addSvgIcon('gns3', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
  }

  ngOnInit(): void {
  }
}
