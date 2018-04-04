import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from "@angular/material";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.css'
  ]
})
export class AppComponent implements OnInit {
    constructor(iconReg: MatIconRegistry, sanitizer: DomSanitizer) {
      iconReg.addSvgIcon('gns3', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
  }

  ngOnInit(): void {
  }
}
