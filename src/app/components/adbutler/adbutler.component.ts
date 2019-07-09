import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdButlerResponse } from '../../models/adbutler';

@Component({
  selector: 'app-adbutler',
  templateUrl: './adbutler.component.html',
  styleUrls: ['./adbutler.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdbutlerComponent implements OnInit {
  @ViewChild('ad') ad: ElementRef;
  @Input() theme: string;

  htmlCode: string;

  constructor(
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    this.httpClient.get('https://servedbyadbutler.com/adserve/;ID=165803;size=0x0;setID=371476;type=json;').subscribe((response: AdButlerResponse) => {
      this.htmlCode = response.placements.placement_1.body;
      this.ad.nativeElement.insertAdjacentHTML('beforeend', this.htmlCode);
    });
  }
}
